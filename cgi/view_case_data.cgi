#!/usr/bin/perl
# 説明   : case のデータを取得する。
# 作成者 : 江野高広
# 作成日 : 2015/06/17
# 更新   : 2018/08/09  自動実行に対応。

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
my $select_column = 'vcCaseTitle,vcCaseDescription';
my $table         = 'T_Case';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcCaseId = '" . $case_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_case = $access2db -> select_cols;



#
# ステータスを確認
#
my ($status, $error_message, $update_time) = &TelnetmanWF_common::check_case_status($access2db, $flow_id, $task_id, $case_id);



$access2db -> close;


my $title         = $ref_case -> [0];
my $description   = $ref_case -> [1];



#
# パラメーターシートが存在するかどうか確認する。
#
my $exists_parameter_sheet = (&TelnetmanWF_common::exists_parameter_sheet($flow_id, $task_id, $case_id))[0];



#
# 結果をまとめる。
#
my %results = (
 'result'                 => 1,
 'flow_id'                => $flow_id,
 'task_id'                => $task_id,
 'case_id'                => $case_id,
 'box_id'                 => $case_id,
 'title'                  => $title,
 'description'            => $description,
 'exists_parameter_sheet' => $exists_parameter_sheet,
 'status'                 => $status,
 'error_message'          => $error_message,
 'update_time'            => $update_time
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
