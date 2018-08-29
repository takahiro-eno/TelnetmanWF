#!/usr/bin/perl
# 説明   : 該当task の全work, case の進捗を確認する。
# 作成者 : 江野高広
# 作成日 : 2015/05/22
# 更新   : 2018/08/16 自動実行に対応。

use strict;
use warnings;

use CGI;
use JSON;
use Cache::Memcached;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use TelnetmanWF_common;

my $cgi = new CGI;

#
# DB アクセスのためのオブジェクトを作成する。
#
my ($DB_name, $DB_host, $DB_user, $DB_password) = &Common_system::DB_connect_parameter();
my @DB_connect_parameter_list                   = ('dbi:mysql:' . $DB_name . ':' . $DB_host, $DB_user, $DB_password);
my $access2db                                   = Access2DB -> open(@DB_connect_parameter_list);
$access2db -> log_file(&Common_system::file_sql_log());



#
# パスワードが正しいか確認。
#
my $ref_auth = &TelnetmanWF_common::authorize($cgi, $access2db);

if($ref_auth -> {'result'} == 0){
 my $json_results = &JSON::to_json($ref_auth);
 
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print $json_results;
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}

my $flow_id = $ref_auth -> {'flow_id'};
my $task_id = $ref_auth -> {'task_id'};
my $box_id  = $cgi -> param('box_id');
my $pos     = $cgi -> param('pos');

unless(defined($box_id)){
 $box_id = '';
}

if(defined($pos)){
 $pos += 0;
}
else{
 $pos = 0;
}



#
# check_status.pl がT_WorkList 更新中かどうか確認する。
#
my $memcached = Cache::Memcached -> new({servers => ['127.0.0.1:11211'], namespace => $flow_id . ':' . $task_id});
my $check_status = $memcached -> get('check_status');

if(defined($check_status) && ($check_status == 1)){
 sleep(3);
 $check_status = $memcached -> get('check_status');
}




#
# 強制終了フラグが立っているか確認する。
#
my $force_stop = $memcached -> get('force_stop');

unless(defined($force_stop)){
 $force_stop = 0;
}

$force_stop += 0;



#
# パラメーターシートがあるbox をリスト化する。
#
my ($ref_empty_box_id_list, $ref_fill_box_id_list) = &TelnetmanWF_common::make_box_id_list($access2db, $flow_id, $task_id);



#
# 該当タスクのstart の実行時刻を取得する。
#
my $select_column = 'iUpdateTime';
my $table         = 'T_StartList';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $last_start_time = $access2db -> select_col1;



#
# 該当タスクのwork のステータスを取得する。
#
$select_column = 'iStatus,vcWorkId,vcErrorMessage,iUpdateTime';
$table         = 'T_WorkList';
$condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' order by iUpdateTime desc";
$access2db -> set_select($select_column, $table, $condition);
my $ref_last_work_list = $access2db -> select_hash_array_cols;



#
# 該当タスクのcase のステータスを取得する。
#
$select_column = 'iStatus,vcCaseId,vcErrorMessage,iUpdateTime';
$table         = 'T_CaseList';
$condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' order by iUpdateTime desc";
$access2db -> set_select($select_column, $table, $condition);
my $ref_last_case_list = $access2db -> select_hash_array_cols;



#
# 該当タスクの最後に実行されたwork またはcase のステータスを取得する。
# 実行中のものがあればそちらを優先する。
# 優先順位1 : status = 0, 1, 99 の内iUpdateTime が大きいもの
# 優先順位2 : status = 2, -1    の内iUpdateTime が大きいもの
#
my $auto_exec_box_id = 'start_circle';
my $status = 2;
my $error_message = '';

$last_start_time += 0;
my $tmp_status        = 2;
my $tmp_id            = '';
my $tmp_error_message = '';
my $tmp_update_time   = 0;

foreach my $_status ('0', '1', '99', '2', '-1'){
 if(($_status eq '2') && ($tmp_update_time > 0)){
  last;
 }
 
 if(exists($ref_last_work_list -> {$_status})){
  my $_update_time = $ref_last_work_list -> {$_status} -> [0] -> [2];
  $_update_time += 0;
  
  if($_update_time > $tmp_update_time){
   $tmp_status        = $_status;
   $tmp_id            = $ref_last_work_list -> {$_status} -> [0] -> [0];
   $tmp_error_message = $ref_last_work_list -> {$_status} -> [0] -> [1];
   $tmp_update_time   = $_update_time;
   $tmp_status += 0;
  }
 }
 
 if(exists($ref_last_case_list -> {$_status})){
  my $_update_time = $ref_last_case_list -> {$_status} -> [0] -> [2];
  $_update_time += 0;
  
  if($_update_time > $tmp_update_time){
   $tmp_status        = $_status;
   $tmp_id            = $ref_last_case_list -> {$_status} -> [0] -> [0];
   $tmp_error_message = $ref_last_case_list -> {$_status} -> [0] -> [1];
   $tmp_update_time   = $_update_time;
   $tmp_status += 0;
  }
 }
}


if($tmp_status == 2){
 if($tmp_update_time > $last_start_time){
  $auto_exec_box_id = $tmp_id;
  $status           = $tmp_status;
  $error_message    = $tmp_error_message;
 }
}
else{
 $auto_exec_box_id = $tmp_id;
 $status           = $tmp_status;
 $error_message    = $tmp_error_message;
}


if(length($box_id) == 0){
 $box_id = $auto_exec_box_id;
}



#
# パラメーターシートが存在するかどうか確認する。
#
my $exists_parameter_sheet = 0;
if(($box_id =~ /^work_/) && ($box_id =~ /^case_/)){
 $exists_parameter_sheet = (&TelnetmanWF_common::exists_parameter_sheet($flow_id, $task_id, $box_id))[0];
}



#
# 流れ図データがあるか確認する。
#
my $exists_flowchart_data = 0;
if($box_id =~ /^work_/){
 $exists_flowchart_data = &TelnetmanWF_common::exists_flowchart_data($access2db, $flow_id, $box_id);
}



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



#
# 実行ログの未読部分を読み取る。
#
my $history_log = '';
my $file_history_log = &Common_system::file_history_log($flow_id, $task_id);
if(-f $file_history_log){
 &CORE::open(my $fh, '<', $file_history_log);
 if($pos > 0){
  seek($fh, $pos, 0);
  while(my $line = <$fh>){
   $history_log .= $line;
  }
  $pos = tell($fh);
 }
 else{
  seek($fh, 0, 2);
  $pos = tell($fh);
 }
 &CORE::close($fh);
 
 $pos += 0;
}
else{
 $pos = 0;
}



#
# check_status.pl がT_WorkList 更新中であった場合は強制的にstatus = 1 にする。
#
if(defined($check_status) && ($check_status == 1)){
 $status = 1;
}



#
# 結果をまとめる。
#
my %results = (
 'result'            => 1,
 'flow_id'           => $flow_id,
 'task_id'           => $task_id,
 'box_id'            => $box_id,
 'auto_exec_box_id'  => $auto_exec_box_id,
 'status'            => $status,
 'error_message'     => $error_message,
 'empty_box_id_list' => $ref_empty_box_id_list,
 'fill_box_id_list'  => $ref_fill_box_id_list,
 'exists_flowchart_data'  => $exists_flowchart_data,
 'exists_parameter_sheet' => $exists_parameter_sheet,
 'pos'         => $pos,
 'history_log' => $history_log,
 'force_stop'  => $force_stop
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
