#!/usr/bin/perl
# 説明   : case を実行する。
# 作成者 : 江野高広
# 作成日 : 2015/06/17

use strict;
use warnings;

use CGI;
use JSON;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use TelnetmanWF_common;
use TelnetmanWF_divide_case;

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
# 次の行き先と分岐条件を取り出す。
#
my $select_column = 'txLinkTargetList,txParameterConditions';
my $table         = 'T_Case';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcCaseId = '" . $case_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_case = $access2db -> select_cols;

my $json_target_list          = $ref_case -> [0];
my $json_parameter_conditions = $ref_case -> [1];
my $ref_target_list           = &JSON::from_json($json_target_list);
my $ref_parameter_conditions  = &JSON::from_json($json_parameter_conditions);



#
# パラメーターシートを読み取る。
#
my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $case_id);
unless(-f $file_parameter_sheet){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"パラメーターシートがありません。"}';
 
 $access2db -> close;
 exit(0);
}

open(PSHEET, '<', $file_parameter_sheet);
my $json_parameter_sheet = <PSHEET>;
close(PSHEET);

my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message_parameter_sheet) = &TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet);



#
# 条件分岐のオブジェクトを作ってノード情報などを入れる。
#
my $divide_case = TelnetmanWF_divide_case -> new();
$divide_case -> set_node_list($ref_node_list);
$divide_case -> set_parameters({'interface_list' => $ref_interface_list, 'node_info' => $ref_node_info, 'interface_info' => $ref_interface_info});



#
# 条件分岐を実行する。
#
my ($ref_divided_node_list_list, $ref_unmatched_node_list) = $divide_case -> divide($ref_parameter_conditions);
my $error_message = $divide_case -> get_error_message();

if(length($error_message) > 0){
 my %results = (
  'result' => 0,
  'reason' => $error_message
 );
 
 my $json_results = &JSON::to_json(\%results);
 
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print $json_results;
 
 $access2db -> close;
 exit(0);
}



#
# パラメーターシートを分割する。 
#
my @divided_parameter_sheet_list = &TelnetmanWF_common::extract_parameter_sheet($json_parameter_sheet, @$ref_divided_node_list_list, $ref_unmatched_node_list);
my $json_remaining_parameter_sheet = pop(@divided_parameter_sheet_list);



#
# パラメーターシートを分岐先に振り分ける。
#
my @target_id_list = ();
foreach my $ref_target (@$ref_target_list){
 my $json_divided_parameter_sheet = shift(@divided_parameter_sheet_list);
 
 if(exists($ref_target -> {'id'}) && ($ref_target -> {'id'} !~ /^start_/)){
  my $target_id = $ref_target -> {'id'};
  
  if(length($json_divided_parameter_sheet) > 0){
   my $dir_log = &Common_system::dir_log($flow_id, $task_id, $target_id);
   
   unless(-d $dir_log){
    mkdir($dir_log, 0755)
   }
   
   my $file_target_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $target_id);
   &TelnetmanWF_common::push_parameter_sheet($file_target_parameter_sheet, $json_divided_parameter_sheet);
   
   push(@target_id_list, $target_id);
  }
 }
}



#
# 既存のパラメーターシートを削除。残すノードがあれば作成。
#
unlink($file_parameter_sheet);

if(length($json_remaining_parameter_sheet) > 0){
 open(PSHEET, '>', $file_parameter_sheet);
 print PSHEET $json_remaining_parameter_sheet;
 close(PSHEET);
}




#
# ステータスを記録。
#
my $status = 2;
my $time = &TelnetmanWF_common::update_status($access2db, $flow_id, $task_id, $case_id, $status, '', '', \@target_id_list);
$access2db -> close;



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'status' => $status,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'case_id' => $case_id,
 'update_time' => $time,
 'target_list' => \@target_id_list
);



#
# 元のbox にパラメーターシートがあるかどうか確認。
#
if(-f $file_parameter_sheet){
 $results{'exists_parameter_sheet'} = 1;
}
else{
 $results{'exists_parameter_sheet'} = 0;
}



my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
