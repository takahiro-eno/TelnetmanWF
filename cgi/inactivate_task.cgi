#!/usr/bin/perl
# 説明   : task を非アクティブにする。
# 作成者 : 江野高広
# 作成日 : 2015/08/31
# 更新   : 2018/08/21 実行中のタスクがあるかの確認を追加。

use strict;
use warnings;

use CGI;
use JSON;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use TelnetmanWF_common;

my $time = time;
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



#
# 実行中のタスクであれば非アクティブにさせない。
#
my $exist_running_work = &TelnetmanWF_common::exist_running_work($access2db, $flow_id, $task_id);

if($exist_running_work == 1){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"実行中のタスクです。"}';
 
 $access2db -> close;
 exit(0);
}



#
# 該当タスクを非アクティブにする。
#
my @set = ('iActive = 0', 'iUpdateTime = ' . $time);
my $table = 'T_Task';
my $condition = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "'";
$access2db -> set_update(\@set, $table, $condition);
my $count = $access2db -> update_exe;



my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'update_time' => $time
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
