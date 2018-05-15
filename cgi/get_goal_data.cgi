#!/usr/bin/perl
# 説明   : goal のデータを取得する。
# 作成者 : 江野高広
# 作成日 : 2015/05/30

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

$access2db -> close;

my $box_id = $cgi -> param('box_id');



#
# パラメーターシートが存在するかどうか確認する。
#
my $update_time = 0;
my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $box_id);
my $exists_parameter_sheet = 0;
if(-f $file_parameter_sheet){
 $exists_parameter_sheet = 1;
 $update_time = (stat($file_parameter_sheet))[9];
}



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'box_id' => $box_id,
 'exists_parameter_sheet' => $exists_parameter_sheet,
 'update_time' => $update_time
);



#
# パラメーターシートがある場合はノードリストも返す。
#
if($exists_parameter_sheet == 1){
 open(PSHEET, '<', $file_parameter_sheet);
 my $json_parameter_sheet = <PSHEET>;
 close(PSHEET);
 
 my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message) = &TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet);
 $results{'node_list'} = $ref_node_list;
}



my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
