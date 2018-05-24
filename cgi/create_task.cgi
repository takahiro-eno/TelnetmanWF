#!/usr/bin/perl
# 説明   : task を新規作成する。
# 作成者 : 江野高広
# 作成日 : 2015/05/17

use strict;
use warnings;

use CGI;
use JSON;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;


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



#
# flow が存在するか確認。
#
my $select_column = 'count(*)';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $count = $access2db -> select_col1;

if($count == 0){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"create":0,"reason":"Flow が存在しません。"}';
 
 $access2db -> close;
 exit(0);
}



my $task_id = &main::make_task_id($access2db);



my $insert_column = 'vcFlowId,vcTaskId,vcTaskTitle,vcTaskDescription,iActive,iStatus,iCreateTime,iUpdateTime';
my @values = ("('" . $flow_id . "','" . $task_id . "','" . $title . "','',1,0," . $time . "," . $time . ")");
$table = 'T_Task';
$access2db -> set_insert($insert_column, \@values, $table);
$access2db -> insert_exe;



$access2db -> close;



#
# 結果をまとめる。
#
my %results = (
 'create' => $create,
 'title' => $title,
 'flow_id' => $flow_id,
 'task_id' => $task_id
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;





#
# task id を作る。
#
sub make_task_id {
 my $access2db = $_[0];
 
 my $task_id = 'task_' . &Common_sub::make_random_string(20);
 
 while(1){
  my $select_column = 'count(*)';
  my $table         = 'T_Task';
  my $condition     = "where vcTaskId = '" . $task_id . "'";
  $access2db -> set_select($select_column, $table, $condition);
  my $count = $access2db -> select_col1;
  
  if($count == 0){
   last;
  }
  else{
   $task_id = 'task_' . &Common_sub::make_random_string(20);
  }
 }
 
 return($task_id);
}
