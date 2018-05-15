#!/usr/bin/perl
# 説明   : task を開始する。
# 作成者 : 江野高広
# 作成日 : 2015/05/18

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



my $box_id = $cgi -> param('box_id');



#
# パラメーターシートを受け取る。
#
my $json_parameter_sheet = $cgi -> param('json_parameter_sheet');

unless(defined($json_parameter_sheet) && (length($json_parameter_sheet) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"パラメーターシートがありません。"}';
 
 $access2db -> close;
 exit(0);
}




#
# 行き先を確認する。
#
my $select_column = 'vcStartLinkTarget';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $json_target = $access2db -> select_col1;



#
# ステータスの更新
#
my $update_time = &TelnetmanWF_common::update_status($access2db, $flow_id, $task_id, $box_id, 2);



$access2db -> close;



my $ref_target = &JSON::from_json($json_target);
my $target_id = "";

if(exists($ref_target -> {'id'})){
 $target_id = $ref_target -> {'id'};
}
else{
 my %results = (
  'result' => 1,
  'status' => 2,
  'flow_id' => $flow_id,
  'task_id' => $task_id,
  'box_id'  => $box_id,
  'update_time' => $update_time,
  'target_list' => []
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

my $push_result = &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet, $json_parameter_sheet);



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'status' => 2,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'box_id'  => $box_id,
 'update_time' => $update_time,
 'target_list' => [$target_id]
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
