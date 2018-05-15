#!/usr/bin/perl
# 説明   : case のデータを取得する。
# 作成者 : 江野高広
# 作成日 : 2015/06/15

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



my $case_id = $cgi -> param('case_id');



#
# case data を取り出す。
#
my $select_column = 'vcCaseTitle,vcCaseDescription,txLinkTargetList,txLinkLabelList,txLinkVerticesList,txParameterConditions,iUpdateTime';
my $table         = 'T_Case';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcCaseId = '" . $case_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_case = $access2db -> select_cols;



$access2db -> close;



my $title                     = $ref_case -> [0];
my $description               = $ref_case -> [1];
my $json_link_target_list     = $ref_case -> [2];
my $json_link_label_list      = $ref_case -> [3];
my $json_link_vertices_list   = $ref_case -> [4]; 
my $json_parameter_conditions = $ref_case -> [5];
my $update_time               = $ref_case -> [6];

my $ref_link_target_list     = &JSON::from_json($json_link_target_list);
my $ref_link_label_list      = &JSON::from_json($json_link_label_list);
my $ref_link_vertices_list   = &JSON::from_json($json_link_vertices_list);
my $ref_parameter_conditions = &JSON::from_json($json_parameter_conditions);
$update_time += 0;



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'case_id' => $case_id,
 'title' => $title,
 'description' => $description,
 'link_target_list' => $ref_link_target_list,
 'link_label_list' => $ref_link_label_list,
 'link_vertices_list' => $ref_link_vertices_list,
 'parameter_conditions' => $ref_parameter_conditions,
 'update_time' => $update_time
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
