#!/usr/bin/perl
# 説明   : 実行中のタスクの進捗を確認する。
# 作成者 : 江野高広
# 作成日 : 2015/05/21
# 更新 2015/12/08 : 個別パラメーターシートを使えるように。
#      2016/07/05 : ステータス99 に変更するタイミングをTelnetman にアクセスする前に移動。

use strict;
use warnings;

use JSON;
use Getopt::Long;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use TelnetmanWF_common;



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



#
# 実行中のタスクを取り出す。
#
my $select_column = 'vcFlowId,vcTaskId,vcBoxId,vcLoginId,vcSessionId';
my $table         = 'T_LastStatus';
my $condition     = 'where iStatus = 1';
$access2db -> set_select($select_column, $table, $condition);
my $ref_last_status = $access2db -> select_array_cols;



#
# 終了リスト
#
my @finished_list = ();



foreach my $ref_row (@$ref_last_status){
 my ($flow_id, $task_id, $box_id, $login_id, $session_id) = @$ref_row;
 
 if($box_id =~ /^work_/){
  # 終了処理中を表すステータスコード99 に変更。
  &main::change_status($access2db, 99, $flow_id, $task_id, $box_id);
  
  my $ref_check_status = &TelnetmanWF_common::access2Telnetman($login_id, $session_id, 'check_status.cgi', {'require_node_list' => 0});
  
  my $login           = $ref_check_status -> {'login'};
  my $session         = $ref_check_status -> {'session'};
  #my $session_id      = $ref_check_status -> {'session_id'};
  my $session_status  = $ref_check_status -> {'session_status'};
  #my $debug           = $ref_check_status -> {'debug'};
  #my $auto_pause      = $ref_check_status -> {'auto_pause'};
  my $ref_node_status = $ref_check_status -> {'node_status'};
  
  if(($login == 1) && ($session == 1)){
   if($session_status == 4){
    # 個別パラメーターシートを使ったかどうか。
    my $use_parameter_sheet = &TelnetmanWF_common::check_individual_parameter_sheet($access2db, $flow_id, $box_id);
    
    my @data = ($flow_id, $task_id, $box_id, $login_id, $session_id, $ref_node_status, $use_parameter_sheet);
    push(@finished_list, \@data);
   }
   else{
    &main::change_status($access2db, 1, $flow_id, $task_id, $box_id);
   }
  }
  else{
   &main::change_status($access2db, 1, $flow_id, $task_id, $box_id);
  }
 }
}

$access2db -> close;


my $count = 0;
foreach my $ref_data (@finished_list){
 my $pid = fork;
 
 if($pid == 0){
  my $flow_id             = $ref_data -> [0];
  my $task_id             = $ref_data -> [1];
  my $box_id              = $ref_data -> [2];
  my $login_id            = $ref_data -> [3];
  my $session_id          = $ref_data -> [4];
  my $ref_node_status     = $ref_data -> [5];
  my $use_parameter_sheet = $ref_data -> [6];
  
  my $access2db = Access2DB -> open(@DB_connect_parameter_list);  
  my ($time, $ok_target_id, $ng_target_id) = &TelnetmanWF_common::end_of_telnet($access2db, $flow_id, $task_id, $box_id, $login_id, $session_id, $ref_node_status, $use_parameter_sheet);
  $access2db -> close;
  
  #
  # through ノードのパラメーターシートがあれば本線用のパラメーターシートに戻す。
  #
  my $exists_parameter_sheet = &TelnetmanWF_common::return_through_parameter_sheet($flow_id, $task_id, $box_id);
   
  exit(0);
 }
 
 $count ++;
}

for(my $i = 0; $i < $count; $i ++){
 wait;
}


sub change_status {
 my $access2db = $_[0];
 my $status    = $_[1];
 my $flow_id   = $_[2];
 my $task_id   = $_[3];
 my $box_id    = $_[4];
 
 my @set = ('iStatus = ' . $status);
 my $table = 'T_LastStatus';
 my $condition = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcBoxId = '" . $box_id . "'";
 $access2db -> set_update(\@set, $table, $condition);
 $access2db -> update_exe;
}
