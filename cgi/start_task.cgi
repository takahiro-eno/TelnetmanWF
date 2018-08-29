#!/usr/bin/perl
# 説明   : task を開始する。
# 作成者 : 江野高広
# 作成日 : 2015/05/18
# 更新   : 2018/08/09  自動実行に対応。

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
use Exec_box;

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



#
# Telnetman ログインID, Password を受け取る。
#
my $telnetman_user     = $cgi -> param('telnetman_user');
my $telnetman_password = $cgi -> param('telnetman_password');

unless(defined($telnetman_user) && (length($telnetman_user) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Telnetman ログインID がありません。"}';
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}

unless(defined($telnetman_password) && (length($telnetman_password) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Telnetman ログインPassword がありません。"}';
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}



#
# パラメーターシートを受け取る。
#
my $json_parameter_sheet = $cgi -> param('json_parameter_sheet');

unless(defined($json_parameter_sheet) && (length($json_parameter_sheet) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"パラメーターシートがありません。"}';
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}



#
# 排他制御
#
my $exist_running_work = &TelnetmanWF_common::exist_running_work($access2db, $flow_id, $task_id); 
if(defined($exist_running_work) && ($exist_running_work == 1)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"現在実行中のタスクです。"}';
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}

my $memcached = Cache::Memcached -> new({servers => ['127.0.0.1:11211'], namespace => $flow_id . ':' . $task_id});
my $check_status = $memcached -> get('check_status');

if(defined($check_status) && ($check_status == 1)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"現在実行中のタスクです。"}';
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}



#
# Telnetman へのログインID, Password を記録する。ログを残す。
#
my $update_time = &TelnetmanWF_common::set_telnetman_login($access2db, $flow_id, $task_id, $telnetman_user, $telnetman_password);



#
# 行き先を確認する。
#
my $select_column = 'vcStartLinkTarget';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $json_target = $access2db -> select_col1;



my $ref_target = &JSON::from_json($json_target);
my $target_id = "";

if(exists($ref_target -> {'id'})){
 $target_id = $ref_target -> {'id'};
}
else{
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 
 my %results = (
  'result'  => 0,
  'flow_id' => $flow_id,
  'task_id' => $task_id,
  'box_id'  => $box_id,
  'reason'  => '次の行き先がありません。'
 );
 
 my $json_results = &JSON::to_json(\%results);
 
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print $json_results;
 
 exit(0);
}

my $dir_task_log = &Common_system::dir_task_log($flow_id, $task_id);
my $dir_log      = &Common_system::dir_log($flow_id, $task_id, $target_id);
my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $target_id);

unless(-d $dir_task_log){
 mkdir($dir_task_log, 0755);
}

unless(-d $dir_log){
 mkdir($dir_log, 0755);
}

# 実行履歴の書き込み。
my $ref_node_list = (&TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet))[0];
&TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, 'start_circle', $ref_node_list, $update_time, 2);

# 次の箱へのパラメーターシートの移動。
my $push_result = &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet, $json_parameter_sheet);

# 次のBox の自動実行。
my ($auto_exec_box_id, $status, $error_message) = &Exec_box::auto_exec($access2db, $flow_id, $task_id, $target_id);

my ($ref_empty_box_id_list, $ref_fill_box_id_list) = &TelnetmanWF_common::make_box_id_list($access2db, $flow_id, $task_id);

$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;

#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'box_id'  => $box_id,
 'status'  => $status,
 'error_message'     => $error_message,
 'auto_exec_box_id'  => $auto_exec_box_id,
 'empty_box_id_list' => $ref_empty_box_id_list,
 'fill_box_id_list'  => $ref_fill_box_id_list
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
