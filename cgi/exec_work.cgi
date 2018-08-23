#!/usr/bin/perl
# 説明   : work を実行する。
# 作成者 : 江野高広
# 作成日 : 2015/05/20
# 更新 2015/12/01 : リハーサルモードを使えるように。
# 更新 2015/12/08 : 個別パラメーターシートを使えるように。
# 更新   : 2015/12/24 syslog 確認のJSON を取り込めるように。
# 更新   : 2016/01/28 enable password をログイン情報ファイルから外す。
# 更新   : 2018/03/21 queue.cgi からのエラーメッセージに改行があることへの考慮漏れの修正。
#                     &main::empty_flowchart のjson にroutine_loop_type が抜けていたので修正。
# 更新   : 2018/07/06 iExecOnlyOne に対応。
# 更新   : 2018/07/17 Telnetman アクセス部分をTelnetmanWF_telnet.pm に外出し。
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

my $work_id                = $cgi -> param('work_id');
my $user                   = $cgi -> param('user');
my $password               = $cgi -> param('password');
my $telnetman_user         = $cgi -> param('telnetman_user');
my $telnetman_password     = $cgi -> param('telnetman_password');
my $json_exec_node_list    = $cgi -> param('json_exec_node_list');
my $json_through_node_list = $cgi -> param('json_through_node_list');



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



#
# Telentman ログインID, Password が指定されていなければT_StartList から取り出す。
#
if(defined($telnetman_user) && (length($telnetman_user) > 0) && defined($telnetman_password) && (length($telnetman_password) > 0)){
 my $time = &TelnetmanWF_common::set_telnetman_login($access2db, $flow_id, $task_id, $telnetman_user, $telnetman_password, 1);
}
else{
 ($telnetman_user, $telnetman_password) = &TelnetmanWF_common::get_telnetman_login($access2db, $flow_id, $task_id);
}

unless(defined($telnetman_user) && (length($telnetman_user) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Telnetman ログインID がありません。"}';
 
 $access2db -> close;
 exit(0);
}

unless(defined($telnetman_password) && (length($telnetman_password) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"Telnetman ログインPassword がありません。"}';
 
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
 
 $access2db -> close;
 exit(0);
}

my $memcached = Cache::Memcached -> new({servers => ['127.0.0.1:11211'], namespace => $flow_id . ':' . $task_id});
my $check_status = $memcached -> get('check_status');

if(defined($check_status) && ($check_status == 1)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"現在実行中のタスクです。"}';
 
 $access2db -> close;
 exit(0);
}



#
# Telnetman にアクセス。
#
my $ref_exec_node_list    = &JSON::from_json($json_exec_node_list);
my $ref_through_node_list = &JSON::from_json($json_through_node_list);

my ($status, $error_message) = &Exec_box::exec_work($access2db, $flow_id, $task_id, $work_id, $user, $password, $ref_exec_node_list, $ref_through_node_list);
my $auto_exec_box_id = $work_id;
my ($ref_empty_box_id_list, $ref_fill_box_id_list) = &TelnetmanWF_common::make_box_id_list($access2db, $flow_id, $task_id);


$access2db -> close;



#
# パラメーターシートが存在するかどうか確認する。
#
my $exists_parameter_sheet = (&TelnetmanWF_common::exists_parameter_sheet($flow_id, $task_id, $work_id))[0];



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'work_id' => $work_id,
 'box_id'  => $work_id,
 'status'  => $status,
 'error_message'     => $error_message,
 'auto_exec_box_id'  => $auto_exec_box_id,
 'empty_box_id_list' => $ref_empty_box_id_list,
 'fill_box_id_list'  => $ref_fill_box_id_list,
 'exists_parameter_sheet' => $exists_parameter_sheet
);


my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
