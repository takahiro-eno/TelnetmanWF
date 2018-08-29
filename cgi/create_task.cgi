#!/usr/bin/perl
# 説明   : task を新規作成する。
# 作成者 : 江野高広
# 作成日 : 2015/05/17
# 更新   : 2018/08/22 iStatus カラムを廃止。task_id をランダムな文字列から通し番号に変更。

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
my $create = 1;


my $cgi = new CGI;
my $title    = $cgi -> param('title');
my $flow_id  = $cgi -> param('flow_id');

unless(defined($title) && (length($title) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"create":0,"reason":"タイトルがありません。"}';
 
 exit(0);
}

unless(defined($flow_id) && (length($flow_id) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"create":0,"reason":"Flow ID がありません。"}';
 
 exit(0);
}



#
# DB アクセスのためのオブジェクトを作成する。
#
my ($DB_name, $DB_host, $DB_user, $DB_password) = &Common_system::DB_connect_parameter();
my @DB_connect_parameter_list                   = ('dbi:mysql:' . $DB_name . ':' . $DB_host, $DB_user, $DB_password);
my $access2db                                   = Access2DB -> open(@DB_connect_parameter_list);
$access2db -> log_file(&Common_system::file_sql_log());



#
# flow が存在するか確認。
#
my $select_column = 'count(*)';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $count_flow = $access2db -> select_col1;

if($count_flow == 0){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"create":0,"reason":"Flow が存在しません。"}';
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}



my $serial_number = &main::get_serial_number($access2db, $flow_id);
my $task_id = 'task_' . $serial_number;



my $insert_column = 'vcFlowId,vcTaskId,vcTaskTitle,iActive,iSerialNumber,iCreateTime,iUpdateTime';
my @values = ("('" . $flow_id . "','" . $task_id . "','" . &Common_sub::escape_sql($title) . "',1," . $serial_number . "," . $time . "," . $time . ")");
$table = 'T_Task';
$access2db -> set_insert($insert_column, \@values, $table);
my $count_new_task = $access2db -> insert_exe;

$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;

if($count_new_task == 0){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"create":0,"reason":"作成に失敗しました。"}';
 
 exit(0);
}



#
# 結果をまとめる。
#
my %results = (
 'create'  => $create,
 'title'   => $title,
 'flow_id' => $flow_id,
 'task_id' => $task_id
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;



#
# 通算何個目のtask か確認する。
#
sub get_serial_number {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 
 my $select_column = 'count(*)';
 my $table         = 'T_Task';
 my $condition     = "where vcFlowId = '" . $flow_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $count_task = $access2db -> select_col1;
 
 if($count_task == 0){
  return(1);
 }
 
 $select_column = 'max(iSerialNumber)';
 $access2db -> set_select($select_column, $table, $condition);
 my $serial_number = $access2db -> select_col1;
 
 $serial_number += 1;
 
 return($serial_number);
}
