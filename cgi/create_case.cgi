#!/usr/bin/perl
# 説明   : case を新規作成する。
# 作成者 : 江野高広
# 作成日 : 2015/06/14

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
# 値を受け取る。
#
my $x       = $cgi -> param('x');
my $y       = $cgi -> param('y');
my $title   = $cgi -> param('title');
my $json_link_target_list   = $cgi -> param('json_link_target_list');
my $json_link_label_list    = $cgi -> param('json_link_label_list');
my $json_link_vertices_list = $cgi -> param('json_link_vertices_list');



#
# 条件分岐の個数分だけ条件の枠を作る。
#
my $ref_link_label_list = &JSON::from_json($json_link_label_list);
my $number_of_conditions = scalar(@$ref_link_label_list);
my @parameter_conditions = ();
for(my $i = 0; $i < $number_of_conditions; $i ++){
 my @conditions = ();
 my @condition_row = ();
 push(@condition_row, "");
 push(@conditions, \@condition_row);
 push(@parameter_conditions, \@conditions);
}
my $json_parameter_conditions = &JSON::to_json(\@parameter_conditions);



#
# case id を作る。
#
my $select_column = 'iCaseNumber';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $case_number = $access2db -> select_col1;

my $case_id = 'case_' . ($case_number + 1);



#
# case の個数を1 増やす。
#
my @set = ('iCaseNumber = iCaseNumber + 1');
$access2db -> set_update(\@set);
$access2db -> update_exe;



#
# DB に登録。
#
my $insert_column = 'vcFlowId,vcCaseId,vcCaseTitle,vcCaseDescription,iActive,iX,iY,txLinkTargetList,txLinkLabelList,txLinkVerticesList,txParameterConditions,iCreateTime,iUpdateTime';
my @values = ("('" . $flow_id . "','" . $case_id . "','" . $title . "','',1," . $x . "," . $y . ",'" . $json_link_target_list . "','" . $json_link_label_list . "','" . $json_link_vertices_list . "','" . $json_parameter_conditions . "'," . $time . "," . $time . ")");
$table = 'T_Case';
$access2db -> set_insert($insert_column, \@values, $table);
$access2db -> insert_exe;



$access2db -> close;



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'case_id' => $case_id
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
