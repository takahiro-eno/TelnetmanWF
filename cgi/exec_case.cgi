#!/usr/bin/perl
# 説明   : case を実行する。
# 作成者 : 江野高広
# 作成日 : 2015/06/17
# 更新   : 2018/08/09  自動実行に対応。
# 更新   : 2018/10/05 memcached サーバーのアドレスを関数で指定。

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
my $case_id = $cgi -> param('case_id');



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

my $memcached_server = &Common_system::memcached_server();
my $memcached = Cache::Memcached -> new({servers => [$memcached_server], namespace => $flow_id . ':' . $task_id});
my $check_status = $memcached -> get('check_status');

if(defined($check_status) && ($check_status == 1)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"現在実行中のタスクです。"}';
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}



#
# 分岐条件を実行
#
my ($time, $ref_target_id_list, $status, $error_message) = &Exec_box::exec_case($access2db, $flow_id, $task_id, $case_id);
my $auto_exec_box_id = $case_id;

if($status == 2){
 
 foreach my $target_id (@$ref_target_id_list){
  ($auto_exec_box_id, $status, $error_message) = &Exec_box::auto_exec($access2db, $flow_id, $task_id, $target_id);
  
  if($status == -1){
   last;
  }
 }
}



#
# パラメーターシートの配置を取得
#
my ($ref_empty_box_id_list, $ref_fill_box_id_list) = &TelnetmanWF_common::make_box_id_list($access2db, $flow_id, $task_id);



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



#
# パラメーターシートが存在するかどうか確認する。
#
my $exists_parameter_sheet = (&TelnetmanWF_common::exists_parameter_sheet($flow_id, $task_id, $case_id))[0];



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'case_id' => $case_id,
 'box_id'  => $case_id,
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
