#!/usr/bin/perl
# 説明   : 実行中のタスクの進捗を確認する。
# 作成者 : 江野高広
# 作成日 : 2015/05/21
# 更新 2015/12/08 : 個別パラメーターシートを使えるように。
#      2016/07/05 : ステータス99 に変更するタイミングをTelnetman にアクセスする前に移動。
# 更新   : 2018/08/09  自動実行に対応。
# 更新   : 2018/10/05 memcached サーバーのアドレスを関数で指定。

use strict;
use warnings;

use JSON;
use Getopt::Long;
use Cache::Memcached;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use Exec_box;



#
# wait 時間を取得して待機。
#
my $wait_time = 0;

&Getopt::Long::GetOptions(
 'wait=i' => \$wait_time
);

if($wait_time > 0){
 sleep($wait_time);
}



#
# DB アクセスのためのオブジェクトを作成する。
#
my ($DB_name, $DB_host, $DB_user, $DB_password) = &Common_system::DB_connect_parameter();
my @DB_connect_parameter_list                   = ('dbi:mysql:' . $DB_name . ':' . $DB_host, $DB_user, $DB_password);
my $access2db                                   = Access2DB -> open(@DB_connect_parameter_list);
$access2db -> log_file(&Common_system::file_sql_log());



#
# 実行中のタスクを取り出す。
#
my $select_column = 'vcFlowId,vcTaskId,vcWorkId,vcLoginId,vcSessionId';
my $table         = 'T_WorkList';
my $condition     = 'where iStatus = 1';
$access2db -> set_select($select_column, $table, $condition);
my $ref_last_status = $access2db -> select_array_cols;

if(scalar(@$ref_last_status) == 0){
 $access2db -> close;
 exit(0);
}



# 終了処理中を表すステータスコード99 に変更。
my @set = ('iStatus = 99');
$access2db -> set_update(\@set, $table, $condition);
$access2db -> update_exe;



#
# 終了リスト
#
my @ok_list = ();



#
# Telnetman にアクセスして終了しているか確認。していなければstatus を1 に戻す。
#
foreach my $ref_row (@$ref_last_status){
 my ($flow_id, $task_id, $work_id, $login_id, $session_id) = @$ref_row;
 
 my $ref_check_status = &TelnetmanWF_common::access2Telnetman($login_id, $session_id, 'check_status.cgi', {'require_node_list' => 0});
 
 if(defined($ref_check_status)){
  my $login   = $ref_check_status -> {'login'};
  my $session = $ref_check_status -> {'session'};
  
  if(($login == 1) && ($session == 1)){
   my $session_status  = $ref_check_status -> {'session_status'};
   my $ref_node_status = $ref_check_status -> {'node_status'};
   
   if($session_status == 4){# 終了
    push(@ok_list, [$flow_id, $task_id, $work_id, $login_id, $session_id, $ref_node_status]);
   }
   else{# 実行中
    &main::update_status1($access2db, $flow_id, $task_id, $work_id);
   }
  }
  else{# Telnetman へログインできず。
   my $error_message = '実行後の終了確認でTelnetman2 にログインできませんでした。';
   my @node_list = ();
   
   my $file_parameter_sheet_exec = &Common_system::file_parameter_sheet_exec($flow_id, $task_id, $work_id);
   if(-f $file_parameter_sheet_exec){
    # exec のパラメーターシートからnodelist を作る。
    open(PSHEET, '<', $file_parameter_sheet_exec);
    my $json_parameter_sheet_exec = <PSHEET>;
    close(PSHEET);
    
    my $ref_node_list = (&TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet_exec))[0];
    @node_list = @$ref_node_list;
    
    # exec のパラメーターシートを過去ログ置き場に移動。
    my $time = &Exec_box::move_exec_parameter_sheet($flow_id, $task_id, $work_id);
   }
   
   my $update_time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $work_id, -1, $error_message);
   &TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, $work_id, \@node_list, $update_time, -1, $error_message);
   &Exec_box::delete_queue($access2db, $flow_id, $task_id);
  }
 }
 else{# Telnetman2 に疎通できなかった場合は後でやり直すためにstatus を戻す。
  &main::update_status1($access2db, $flow_id, $task_id, $work_id);
 }
}

$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



my $count = 0;
foreach my $ref_data (@ok_list){
 my $pid = fork;
 
 if($pid == 0){
  my $flow_id         = $ref_data -> [0];
  my $task_id         = $ref_data -> [1];
  my $work_id         = $ref_data -> [2];
  my $login_id        = $ref_data -> [3];
  my $session_id      = $ref_data -> [4];
  my $ref_node_status = $ref_data -> [5];
  
  # T_WorkList のiStatus 更新中にcheck_last_status.cgi による確認を防ぐためにフラグを立てる。
  my $memcached_server = &Common_system::memcached_server(); 
  my $memcached = Cache::Memcached -> new({servers => [$memcached_server], namespace => $flow_id . ':' . $task_id});
  my $set_memcached = $memcached -> set('check_status', 1);
  my $force_stop = $memcached -> get('force_stop');
  
  unless(defined($force_stop)){
   $force_stop = 0;
  }
  
  my $access2db = Access2DB -> open(@DB_connect_parameter_list);
  $access2db -> log_file(&Common_system::file_sql_log());
  
  my ($ok_target_id, $ng_target_id) = &Exec_box::end_of_telnet($access2db, $flow_id, $task_id, $work_id, $login_id, $session_id, $ref_node_status);
  my $status = 2;
  
  if($force_stop == 0){
   # OK, NG 分岐先の自動実行
   foreach my $target_id ($ok_target_id, $ng_target_id){
    my ($auto_exec_box_id, $_status, $error_message) = &Exec_box::auto_exec($access2db, $flow_id, $task_id, $target_id);
    $status = $_status;
    
    if($status == -1){
     last;
    }
   }
   
   # queue に入っているwork があれば実行する。
   if($status != -1){
    my $next_work_id = &Exec_box::shift_queue($access2db, $flow_id, $task_id);
    my ($next_status, $next_error_message) = &Exec_box::exec_work($access2db, $flow_id, $task_id, $next_work_id);
   }
   else{
    &Exec_box::delete_queue($access2db, $flow_id, $task_id);
   }
  }
  else{
   #強制終了
   &Exec_box::delete_queue($access2db, $flow_id, $task_id);
   $memcached -> delete('force_stop');
  }
  
  $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
  $access2db -> close;
  
  $memcached -> delete('check_status');
  
  exit(0);
 }
 
 $count ++;
}

for(my $i = 0; $i < $count; $i ++){
 wait;
}


sub update_status1 {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 my $work_id   = $_[3];
 
 my @set = ('iStatus = 1');
 my $table = 'T_WorkList';
 my $condition = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcWorkId = '" . $work_id . "'";
 $access2db -> set_update(\@set, $table, $condition);
 $access2db -> update_exe;
}
