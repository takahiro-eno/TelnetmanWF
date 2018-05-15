#!/usr/bin/perl
# 説明   : work の進捗を確認する。
# 作成者 : 江野高広
# 作成日 : 2015/05/22
# 更新 2015/12/08 : 個別パラメーターシートを使えるように。

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



my $work_id = $cgi -> param('work_id');



my ($status, $update_time, $ref_target_id_list) = &TelnetmanWF_common::check_status($access2db, $flow_id, $task_id, $work_id);

# 個別パラメーターシートを使ったかどうか。
my $use_parameter_sheet = &TelnetmanWF_common::check_individual_parameter_sheet($access2db, $flow_id, $work_id);

$access2db -> close;



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'status' => $status,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'work_id' => $work_id,
 'update_time' => $update_time,
 'target_list' => $ref_target_id_list,
 'use_parameter_sheet' => $use_parameter_sheet
);



if($status == 2){
 #
 # 最後のログ一覧の情報を取得する。
 #
 my ($log_time, $ok, $ng, $error, $diff, $optional, $individual_parameter_sheet) = &TelnetmanWF_common::last_log_list($flow_id, $task_id, $work_id);
 $results{'last_log_time'}     = $log_time;
 $results{'last_log_ok'}       = $ok;
 $results{'last_log_ng'}       = $ng;
 $results{'last_log_error'}    = $error;
 $results{'last_log_diff'}     = $diff;
 $results{'last_log_optional'} = $optional;
 $results{'individual_parameter_sheet'} = $individual_parameter_sheet;
 
 #
 # パラメーターシートがあればノードリストを返す。
 #
 my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $work_id);
 if(-f $file_parameter_sheet){
  $results{'exists_parameter_sheet'} = 1;
  
  open(PSHEET, '<', $file_parameter_sheet);
  my $json_parameter_sheet = <PSHEET>;
  close(PSHEET);
  
  my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message) = &TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet);
  $results{'node_list'} = $ref_node_list;
 }
 else{
  $results{'exists_parameter_sheet'} = 0;
 }
}



my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
