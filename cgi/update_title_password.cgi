#!/usr/bin/perl
# 説明   : flow, task のtitle, password を変更する。
# 作成者 : 江野高広
# 作成日 : 2015/09/03

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



#
# 変更内容を受け取る。
#
my $page_type = $cgi -> param('page_type');
my $title     = $cgi -> param('title');
my $flow_password  = $cgi -> param('flow_password');
my $task_password  = $cgi -> param('task_password');



#
# パスワードをエンコード
#
my $encoded_flow_password = '';
if(defined($flow_password) && (length($flow_password) > 0)){
 $encoded_flow_password = &Common_sub::encode_password($flow_password);
}

my $encoded_task_password = '';
if(defined($task_password) && (length($task_password) > 0)){
 $encoded_task_password = &Common_sub::encode_password($task_password);
}




#
# 更新。
#
my @set = ();
my $table = '';
my $condition = '';

if($page_type eq 'flow'){
 $table = 'T_Flow';
 $condition = "where vcFlowId = '" . $flow_id . "'";
 
 if(defined($title) && (length($title) > 0)){
  push(@set, "vcFlowTitle = '" . &Common_sub::escape_sql($title) . "'");
 }
 else{
  $title = '';
 }
 
 if(defined($encoded_flow_password) && (length($encoded_flow_password) > 0)){
  push(@set, "vcFlowPassword = '" . $encoded_flow_password . "'");
 }
 else{
  $flow_password = '';
 }
 
 if(defined($encoded_task_password) && (length($encoded_task_password) > 0)){
  push(@set, "vcTaskPassword = '" . $encoded_task_password . "'");
 }
 else{
  $task_password = '';
 }
}
elsif($page_type eq 'task'){
 $table = 'T_Task';
 $condition = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "'";
 
 if(defined($title) && (length($title) > 0)){
  push(@set, "vcTaskTitle = '" . &Common_sub::escape_sql($title) . "'");
 }
 else{
  $title = '';
 }
}

if(scalar(@set) > 0){
 push(@set, 'iUpdateTime = ' . $time);
 $access2db -> set_update(\@set, $table, $condition);
 my $count = $access2db -> update_exe;
}



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



#
# 結果を返す。
#
my %results = (
 'result'        => 1,
 'page_type'     => $page_type,
 'flow_id'       => $flow_id,
 'task_id'       => $task_id,
 'title'         => $title,
 'flow_password' => $flow_password,
 'task_password' => $task_password
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
