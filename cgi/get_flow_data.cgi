#!/usr/bin/perl
# 説明   : workflow のデータを取得する。
# 作成者 : 江野高広
# 作成日 : 2015/05/07

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
# flow data を取り出す。
#
my $select_column = 'vcFlowTitle,vcFlowDescription,iX,iY,vcStartLinkTarget,txStartLinkVertices,iGoalX,iGoalY,iPaperHieght';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_flow = $access2db -> select_cols;


$select_column = 'vcWorkId,vcWorkTitle,iX,iY,vcOkLinkTarget,vcNgLinkTarget,vcThroughTarget,txOkLinkVertices,txNgLinkVertices,txThroughVertices';
$table         = 'T_Work';
$condition     = "where vcFlowId = '" . $flow_id . "' and iActive = 1";
$access2db -> set_select($select_column, $table, $condition);
my $ref_work = $access2db -> select_array_cols;


$select_column = 'vcCaseId,vcCaseTitle,iX,iY,txLinkTargetList,txLinkLabelList,txLinkVerticesList';
$table         = 'T_Case';
$condition     = "where vcFlowId = '" . $flow_id . "' and iActive = 1";
$access2db -> set_select($select_column, $table, $condition);
my $ref_case = $access2db -> select_array_cols;


$select_column = 'vcTerminalId,vcTerminalTitle,iX,iY';
$table         = 'T_Terminal';
$condition     = "where vcFlowId = '" . $flow_id . "' and iActive = 1";
$access2db -> set_select($select_column, $table, $condition);
my $ref_terminal = $access2db -> select_array_cols;



#
# task title を取り出す。
#
my $task_title = '';
if(defined($task_id) && (length($task_id) > 0)){
 $select_column = 'vcTaskTitle';
 $table         = 'T_Task';
 $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 $task_title = $access2db -> select_col1;
}
else{
 $task_id = '';
}


$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



#
# flow data をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'task_id' => $task_id
);

my $flow_title               = $ref_flow -> [0];
my $flow_description         = $ref_flow -> [1];
my $start_x                  = $ref_flow -> [2];
my $start_y                  = $ref_flow -> [3];
my $json_start_link_target   = $ref_flow -> [4];
my $json_start_link_vertices = $ref_flow -> [5];
my $goal_x                   = $ref_flow -> [6];
my $goal_y                   = $ref_flow -> [7];
my $paper_height             = $ref_flow -> [8];

$start_x += 0;
$start_y += 0;
$goal_x += 0;
$goal_y += 0;
$paper_height += 0;
my $ref_start_link_target   = &JSON::from_json($json_start_link_target);
my $ref_start_link_vertices = &JSON::from_json($json_start_link_vertices);

$results{'flow_title'} = $flow_title;
$results{'flow_description'} = $flow_description;
$results{'paper_height'} = $paper_height;
$results{'task_title'} = $task_title;

$results{'start_data'} = {
 'x' => $start_x,
 'y' => $start_y,
 'start_link_target'   => $ref_start_link_target,
 'start_link_vertices' => $ref_start_link_vertices
};

$results{'goal_data'} = {
 'x' => $goal_x,
 'y' => $goal_y
};


$results{'work_list'} = {};
foreach my $ref_row (@$ref_work){
 my $work_id    = $ref_row -> [0];
 my $work_title = $ref_row -> [1];
 my $work_x     = $ref_row -> [2];
 my $work_y     = $ref_row -> [3];
 my $json_ok_link_target      = $ref_row -> [4];
 my $json_ng_link_target      = $ref_row -> [5];
 my $json_through_link_target = $ref_row -> [6];
 my $json_ok_link_vertices      = $ref_row -> [7];
 my $json_ng_link_vertices      = $ref_row -> [8];
 my $json_through_link_vertices = $ref_row -> [9];
 
 $work_x += 0;
 $work_y += 0;
 my $ref_ok_link_target      = &JSON::from_json($json_ok_link_target);
 my $ref_ng_link_target      = &JSON::from_json($json_ng_link_target);
 my $ref_through_link_target = &JSON::from_json($json_through_link_target);
 my $ref_ok_link_vertices       = &JSON::from_json($json_ok_link_vertices);
 my $ref_ng_link_vertices       = &JSON::from_json($json_ng_link_vertices);
 my $ref_through_link_vertices  = &JSON::from_json($json_through_link_vertices);
 
 $results{'work_list'} -> {$work_id} = {
  'title' => $work_title,
  'x' => $work_x,
  'y' => $work_y,
  'ok_link_target'      => $ref_ok_link_target,
  'ng_link_target'      => $ref_ng_link_target,
  'through_link_target' => $ref_through_link_target,
  'ok_link_vertices'      => $ref_ok_link_vertices,
  'ng_link_vertices'      => $ref_ng_link_vertices,
  'through_link_vertices' => $ref_through_link_vertices
 };
}



$results{'case_list'} = {};
foreach my $ref_row (@$ref_case){
 my $case_id                 = $ref_row -> [0];
 my $case_title              = $ref_row -> [1];
 my $case_x                  = $ref_row -> [2];
 my $case_y                  = $ref_row -> [3];
 my $json_link_target_list   = $ref_row -> [4];
 my $json_link_label_list    = $ref_row -> [5];
 my $json_link_vertices_list = $ref_row -> [6];
 
 $case_x += 0;
 $case_y += 0;
 my $ref_link_target_list   = &JSON::from_json($json_link_target_list);
 my $ref_link_label_list    = &JSON::from_json($json_link_label_list);
 my $ref_link_vertices_list = &JSON::from_json($json_link_vertices_list);
 
 $results{'case_list'} -> {$case_id} = {
  'title' => $case_title,
  'x' => $case_x,
  'y' => $case_y,
  'link_target_list'   => $ref_link_target_list,
  'link_label_list'    => $ref_link_label_list,
  'link_vertices_list' => $ref_link_vertices_list
 };
}



$results{'terminal_list'} = {};
foreach my $ref_row (@$ref_terminal){
 my $terminal_id    = $ref_row -> [0];
 my $terminal_title = $ref_row -> [1];
 my $terminal_x     = $ref_row -> [2];
 my $terminal_y     = $ref_row -> [3];
 
 $terminal_x += 0;
 $terminal_y += 0;
 
 $results{'terminal_list'} -> {$terminal_id} = {
  'title' => $terminal_title,
  'x' => $terminal_x,
  'y' => $terminal_y
 };
}


my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
