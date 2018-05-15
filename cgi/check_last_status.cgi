#!/usr/bin/perl
# 説明   : 該当task の全work, case の進捗を確認する。
# 作成者 : 江野高広
# 作成日 : 2015/05/22

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



#
# 該当flow の全work, case のid を取得する。
#
my $select_column = 'vcWorkId';
my $table         = 'T_Work';
my $condition     = "where vcFlowId = '" . $flow_id . "' and iActive = 1";
$access2db -> set_select($select_column, $table, $condition);
my $ref_work = $access2db -> select_array_col1;

$select_column = 'vcCaseId';
$table         = 'T_Case';
$condition     = "where vcFlowId = '" . $flow_id . "' and iActive = 1";
$access2db -> set_select($select_column, $table, $condition);
my $ref_case = $access2db -> select_array_col1;

$select_column = 'vcTerminalId';
$table         = 'T_Terminal';
$condition     = "where vcFlowId = '" . $flow_id . "' and iActive = 1";
$access2db -> set_select($select_column, $table, $condition);
my $ref_terminal = $access2db -> select_array_col1;


#
# 該当タスクの実行済work またはcase のステータスを取得する。
#
$select_column = 'vcBoxId,iStatus,iUpdateTime';
$table         = 'T_LastStatus';
$condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' order by iUpdateTime";
$access2db -> set_select($select_column, $table, $condition);
my $ref_last_status = $access2db -> select_array_cols;



$access2db -> close;



#
# パラメーターシートがあるbox をリスト化する。
#
my @target_list = ();
foreach my $box_id (@$ref_work, @$ref_case, @$ref_terminal, 'goal_circle'){
 my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $box_id);
 
 if(-f $file_parameter_sheet){
  push(@target_list, $box_id);
 }
}



#
# 該当タスクの最後に実行されたwork またはcase のステータスを取得する。
#
my $last_status = 0;
my $last_box_id = '';
my $update_time = 0;
if(scalar(@$ref_last_status) > 0){
 my $ref_last_row = pop(@$ref_last_status);
 $last_box_id = $ref_last_row -> [0];
 $last_status = $ref_last_row -> [1];
 $update_time = $ref_last_row -> [2];
 
 $last_status += 0;
 $update_time += 0;
}



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'status' => $last_status,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'box_id'  => $last_box_id,
 'update_time' => $update_time,
 'target_list' => \@target_list
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
