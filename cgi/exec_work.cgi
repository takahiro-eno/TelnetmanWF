#!/usr/bin/perl
# 説明   : work を実行する。
# 作成者 : 江野高広
# 作成日 : 2015/05/20
# 更新 2015/12/01 : リハーサルモードを使えるように。
# 更新 2015/12/08 : 個別パラメーターシートを使えるように。
# 更新   : 2015/12/24 syslog 確認のJSON を取り込めるように。
# 更新   : 2016/01/28 enable password をログイン情報ファイルから外す。
# 更新   : 2018/03/18 queue.cgi からのエラーメッセージに改行があることへの考慮漏れの修正。
#                     &main::empty_flowchart のjson にroutine_loop_type が抜けていたので修正。

use strict;
use warnings;

use CGI;
use JSON;

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



#
# パスワードが正しいか確認。
#
my $ref_auth = &TelnetmanWF_common::authorize($cgi, $access2db);

if($ref_auth -> {'result'} == 0){
 my $json_results = &JSON::to_json($ref_auth);
 
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print $json_results;
 
 $access2db -> close;
 
 exit(0);
}

my $flow_id = $ref_auth -> {'flow_id'};
my $task_id = $ref_auth -> {'task_id'};

my $work_id                  = $cgi -> param('work_id');
my $user                     = $cgi -> param('user');
my $password                 = $cgi -> param('password');
my $telnetman_login_user     = $cgi -> param('telnetman_login_user');
my $telnetman_login_password = $cgi -> param('telnetman_login_password');
my $json_exec_node_list      = $cgi -> param('json_exec_node_list');
my $json_through_node_list   = $cgi -> param('json_through_node_list');



unless(defined($work_id) && (length($work_id) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Work ID がありません。"}';
 
 $access2db -> close;
 exit(0);
}

unless(defined($user) && (length($user) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"ログインID がありません。"}';
 
 $access2db -> close;
 exit(0);
}

unless(defined($password) && (length($password) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"ログインPassword がありません。"}';
 
 $access2db -> close;
 exit(0);
}

unless(defined($telnetman_login_user) && (length($telnetman_login_user) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Telnetman ログインID がありません。"}';
 
 $access2db -> close;
 exit(0);
}

unless(defined($telnetman_login_password) && (length($telnetman_login_password) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Telnetman ログインPassword がありません。"}';
 
 $access2db -> close;
 exit(0);
}



#
# パラメーターシートをexec とthrough に分ける。
#
my $json_parameter_sheet = '';
my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $work_id);

if(-f $file_parameter_sheet){
 open(PSHEET, '<', $file_parameter_sheet);
 $json_parameter_sheet = <PSHEET>;
 close(PSHEET);
 
 my $ref_exec_node_list    = &JSON::from_json($json_exec_node_list);
 my $ref_through_node_list = &JSON::from_json($json_through_node_list);
 
 # exec のノードが無ければ終了。
 if(scalar(@$ref_exec_node_list) == 0){
  my %results = (
   'result' => 1,
   'status' => 0,
   'flow_id' => $flow_id,
   'task_id' => $task_id,
   'work_id' => $work_id
  );
  
  my $json_results = &JSON::to_json(\%results);
  
  print "Content-type: text/plain; charset=UTF-8\n\n";
  print $json_results;
  
  $access2db -> close;
  exit(0);
 }
 
 # through のノードが有ればexec のノードの分だけにする。
 if(scalar(@$ref_through_node_list) > 0){
  my ($json_parameter_sheet_exec, $json_parameter_sheet_through) = &TelnetmanWF_common::extract_parameter_sheet($json_parameter_sheet, $ref_exec_node_list, $ref_through_node_list);
  
  open(PSHEET, '>', $file_parameter_sheet);
  print PSHEET $json_parameter_sheet_exec;
  close(PSHEET);
  
  $json_parameter_sheet = $json_parameter_sheet_exec;
  
  my $file_parameter_sheet_through = &Common_system::file_parameter_sheet_through($flow_id, $task_id, $work_id);
  open(PSHEET, '>', $file_parameter_sheet_through);
  print PSHEET $json_parameter_sheet_through;
  close(PSHEET);
 }
}



#
# 個別パラメーターシートが必要かどうかとタイトルと個別enable password を確認する。
#
my $select_column = 'vcWorkTitle,iUseParameterSheet,vcEnablePassword';
my $table         = 'T_Work';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_work = $access2db -> select_cols;

my ($work_title, $use_parameter_sheet, $enable_password) = @$ref_work;
$use_parameter_sheet += 0;

if($use_parameter_sheet == 1){
 $json_parameter_sheet = $cgi -> param('json_parameter_sheet');
}



#
# パラメーターシートが無ければ終了。
#
unless(defined($json_parameter_sheet) && (length($json_parameter_sheet) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"パラメーターシートがありません。"}';
 
 $access2db -> close;
 exit(0);
}



#
# 個別パラメーターシートをファイルに保存。 
#
if($use_parameter_sheet == 1){
 my $file_parameter_sheet_individual = &Common_system::file_parameter_sheet_individual($flow_id, $task_id, $work_id);
 open(IPSHEET, '>', $file_parameter_sheet_individual);
 print IPSHEET $json_parameter_sheet;
 close(IPSHEET);
}



#
# ログイン情報、流れ図データの有無、次の行き先の取得
#
$select_column = 'vcLoginInfo,vcEnablePassword';
$table         = 'T_Flow';
$condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_Flow = $access2db -> select_cols;
my $file_name_default_login_info = $ref_Flow -> [0];
my $default_enable_password      = $ref_Flow -> [1];

$select_column = 'vcFlowchartBefore,vcFlowchartMiddle,vcFlowchartAfter,vcLoginInfo,vcSyslogValues,vcDiffValues,vcOptionalLogValues';
$table         = 'T_File';
$condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_file_names = $access2db -> select_cols;

my $file_name_flowchart_before    = $ref_file_names -> [0];
my $file_name_flowchart_middle    = $ref_file_names -> [1];
my $file_name_flowchart_after     = $ref_file_names -> [2];
my $file_name_login_info          = $ref_file_names -> [3];
my $file_name_syslog_values       = $ref_file_names -> [4];
my $file_name_diff_values         = $ref_file_names -> [5];
my $file_name_optional_log_values = $ref_file_names -> [6];

$access2db -> close;



#
# 個別ログイン情報が未定義ならデフォルトのenable password を採用する。
#
unless(defined($file_name_login_info) && (length($file_name_login_info) > 0)){
 $enable_password = $default_enable_password;
}



#
# 対象機器へのログイン情報を組み立てる。
#
my $json_login_info = '';
if(length($file_name_login_info) > 0){
 my $file_login_info = &Common_system::file_login_info($flow_id, $work_id);
 open(LINFO, '<', $file_login_info);
 $json_login_info = <LINFO>;
 close(LINFO);
}
elsif(length($file_name_default_login_info) > 0){
 my $file_login_info = &Common_system::file_default_login_info($flow_id);
 open(LINFO, '<', $file_login_info);
 $json_login_info = <LINFO>;
 close(LINFO);
}

unless(length($json_login_info) > 0){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"ログイン情報がありません。"}';
 
 exit(0);
}

my $ref_login_info = &JSON::from_json($json_login_info);
$ref_login_info -> {'user'}            = $user;
$ref_login_info -> {'password'}        = $password;
$ref_login_info -> {'enable_password'} = $enable_password;
$json_login_info = &JSON::to_json($ref_login_info);



#
# 流れ図データを取得する。
#
my $json_flowchart_before = '';
if(length($file_name_flowchart_before) > 0){
 my $file_flowchart = &Common_system::file_flowchart_before($flow_id, $work_id);
 open(FDATAB, '<', $file_flowchart);
 $json_flowchart_before = <FDATAB>;
 close(FDATAB);
}
else{
 $json_flowchart_before = &main::empty_flowchart();
}

my $json_flowchart_middle = '';
if(length($file_name_flowchart_middle) > 0){
 my $file_flowchart = &Common_system::file_flowchart_middle($flow_id, $work_id);
 open(FDATAM, '<', $file_flowchart);
 $json_flowchart_middle = <FDATAM>;
 close(FDATAM);
}
else{
 $json_flowchart_middle = &main::empty_flowchart();
}

my $json_flowchart_after = '';
if(length($file_name_flowchart_after) > 0){
 my $file_flowchart = &Common_system::file_flowchart_after($flow_id, $work_id);
 open(FDATAA, '<', $file_flowchart);
 $json_flowchart_after = <FDATAA>;
 close(FDATAA);
}
else{
 $json_flowchart_after = &main::empty_flowchart();
}



#
# Syslog 設定を読み取る。
#
my $json_syslog_values = '';
if(length($file_name_syslog_values) > 0){
 my $file_syslog_values = &Common_system::file_syslog_values($flow_id, $work_id);
 open(SVALUES, '<', $file_syslog_values);
 $json_syslog_values = <SVALUES>;
 close(SVALUES);
}



#
# Diff 設定を読み取る。
#
my $json_diff_values = '';
if(length($file_name_diff_values) > 0){
 my $file_diff_values = &Common_system::file_diff_values($flow_id, $work_id);
 open(DVALUES, '<', $file_diff_values);
 $json_diff_values = <DVALUES>;
 close(DVALUES);
}



#
# 任意ログ設定を読み取る。
#
my $json_optional_log_values = '';
if(length($file_name_optional_log_values) > 0){
 my $file_optional_log_values = &Common_system::file_optional_log_values($flow_id, $work_id);
 open(OVALUES, '<', $file_optional_log_values);
 $json_optional_log_values = <OVALUES>;
 close(OVALUES);
}



#
# Telnetman へログイン
#
my $ref_login_result = &TelnetmanWF_common::access2Telnetman($telnetman_login_user, $telnetman_login_password, 'login.cgi');

unless(defined($ref_login_result)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Telnetman にアクセスできませんでした。(1)"}';
 
 exit(0);
}

my $login                  = $ref_login_result -> {'login'};
my $session                = $ref_login_result -> {'session'};
my $max_session_number     = $ref_login_result -> {'max_session_number'};
my $ref_session_sort       = $ref_login_result -> {'session_sort'};
my $ref_session_title_list = $ref_login_result -> {'session_title_list'};
my $login_id               = $ref_login_result -> {'login_id'};
my $user_id                = $ref_login_result -> {'user_id'};

unless($login == 1){
 my $reason = '';
 
 if($login == 0){
  $reason = 'Telnetman にログインできませんでした。';
 }
 elsif($login == -1){
  $reason = 'Telnetman のログインID かパスワードが違います。';
 }
 elsif($login == -2){
  $reason = 'Telneman のアカウントがロックされています。';
 }
 
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"' . $reason . '"}';
 
 exit(0);
}



#
# セッション削除
#
if(scalar(@$ref_session_sort) == $max_session_number){
 foreach my $_session_id (@$ref_session_sort){
  my $ref_delete_session_result = &TelnetmanWF_common::access2Telnetman($login_id, '', 'delete_session.cgi', {'session_id' => $_session_id});
  
  unless(defined($ref_delete_session_result)){
   next;
  }
  
  $login                    = $ref_delete_session_result -> {'login'};
  my $delete                = $ref_delete_session_result -> {'delete'};
  my $delete_session_status = $ref_delete_session_result -> {'session_status'};
  my $delete_session_id     = $ref_delete_session_result -> {'session_id'};
  
  if($delete == 1){
   last;
  }
 }
}



#
# セッション作成
#
my $ref_create_session_result = &TelnetmanWF_common::access2Telnetman($login_id, '', 'create_session.cgi', {'session_title' => $work_title});

unless(defined($ref_create_session_result)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Telnetman にアクセスできませんでした。(3)"}';
 
 exit(0);
}

$login              = $ref_create_session_result -> {'login'};
my $create          = $ref_create_session_result -> {'create'};
$max_session_number = $ref_create_session_result -> {'max_session_number'};
my $session_id      = $ref_create_session_result -> {'session_id'};

unless($create == 1){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Telnetman のセッション数が上限に達しています。"}';
 
 exit(0);
}



#
# telnet 実行
#
my %for_queue = (
 'auto_pause' => 0,
 'parameter_json' => $json_parameter_sheet,
 'login_info_json' => $json_login_info,
 'before_flowchart_json' => $json_flowchart_before,
 'middle_flowchart_json' => $json_flowchart_middle,
 'after_flowchart_json' => $json_flowchart_after,
 'terminal_monitor_values_json' => $json_syslog_values,
 'diff_values_json' => $json_diff_values,
 'optional_log_values_json' => $json_optional_log_values
);
my $ref_queue_result = &TelnetmanWF_common::access2Telnetman($login_id, $session_id, 'queue.cgi', \%for_queue);

my $result = $ref_queue_result -> {'result'};
unless($result == 1){
 my $reason = $ref_queue_result -> {'reason'};
 
 my %result = (
  'result' => 0,
  'reason' => $reason
 );
 
 my $json_result = &JSON::to_json(\%result);
 
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print $json_result;
 
 exit(0);
}

$login = $ref_queue_result -> {'login'};
$session = $ref_queue_result -> {'session'};
$session_id = $ref_queue_result -> {'session_id'};
my $session_status = $ref_queue_result -> {'session_status'};
my $ref_nodelist = $ref_queue_result -> {'node_list'};
my $ref_node_status = $ref_queue_result -> {'node_status'};

my $status = 1;
my $time = 0;
my $ok_target_id = '';
my $ng_target_id = '';

$access2db = Access2DB -> open(@DB_connect_parameter_list);
if($session_status == 2){
 $time = &TelnetmanWF_common::update_status($access2db, $flow_id, $task_id, $work_id, 1, $login_id, $session_id);
}
elsif($session_status == 4){
 ($time, $ok_target_id, $ng_target_id) = &TelnetmanWF_common::end_of_telnet($access2db, $flow_id, $task_id, $work_id, $login_id, $session_id, $ref_node_status, $use_parameter_sheet);
 $status = 2;
}
$access2db -> close;



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'status' => $status,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'work_id' => $work_id,
 'update_time' => $time,
 'target_list' => [$ok_target_id, $ng_target_id],
 'use_parameter_sheet' => $use_parameter_sheet
);




if($status == 2){
 #
 # 最後のログ一覧の情報を取得する。
 #
 my ($log_time, $ok, $ng, $error, $diff, $optional, $individual_parameter_sheet) = &TelnetmanWF_common::last_log_list($flow_id, $task_id, $work_id);
 $results{'last_log_time'}  = $log_time;
 $results{'last_log_ok'}    = $ok;
 $results{'last_log_ng'}    = $ng;
 $results{'last_log_error'} = $error;
 $results{'last_log_diff'}  = $diff;
 $results{'last_log_optional'} =$optional;
 $results{'last_log_individual_parameter_sheet'} =$individual_parameter_sheet;
 
 #
 # through ノードのパラメーターシートがあれば本線用のパラメーターシートに戻してノードリストを返す。
 #
 my $exists_parameter_sheet = &TelnetmanWF_common::return_through_parameter_sheet($flow_id, $task_id, $work_id);
 if($exists_parameter_sheet == 1){
  $results{'exists_parameter_sheet'} = 1;
  
  my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $work_id);
  
  open(PSHEET, '<', $file_parameter_sheet);
  my $json_parameter_sheet = <PSHEET>;
  close(PSHEET);
  
  my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message) = &TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet);
  $results{'node_list'} = $ref_node_list;
 }
 else{
  $results{'exists_parameter_sheet'} = 0;
 }
}



my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;



sub empty_flowchart {
 return('{"flowchart":{"0":[["","",""],["","",""],["","",""]]},"routine_repeat_type":{"0":1},"routine_title":{"0":"名無し"},"routine_loop_type":{"0":0}}');
}
