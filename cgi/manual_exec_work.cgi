#!/usr/bin/perl
# 説明   : 手動OK, NG 分岐を実行する。
# 作成者 : 江野高広
# 作成日 : 2015/06/24
# 更新   : 2018/08/13  自動実行に対応。
# 更新   : 2018/10/01 作成するディレクトリのパーミッションを775 に。

use strict;
use warnings;

use CGI;
use JSON;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use TelnetmanWF_common;
use Exec_box;

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



my $work_id = $cgi -> param('work_id');
my $json_ok_node_list      = $cgi -> param('json_ok_node_list');
my $json_ng_node_list      = $cgi -> param('json_ng_node_list');
my $json_through_node_list = $cgi -> param('json_through_node_list');

my $ref_ok_node_list      = &JSON::from_json($json_ok_node_list);
my $ref_ng_node_list      = &JSON::from_json($json_ng_node_list);
my $ref_through_node_list = &JSON::from_json($json_through_node_list);



#
# 次の行き先を取り出す。
#
my $select_column = 'vcOkLinkTarget,vcNgLinkTarget';
my $table         = 'T_Work';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_work = $access2db -> select_cols;

my $json_ok_link_target = $ref_work -> [0];
my $json_ng_link_target = $ref_work -> [1];

my $ref_ok_link_target = &JSON::from_json($json_ok_link_target);
my $ref_ng_link_target = &JSON::from_json($json_ng_link_target);



#
# パラメーターシートを読み取る。
#
my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $work_id);
unless(-f $file_parameter_sheet){
 my ($ref_empty_box_id_list, $ref_fill_box_id_list) = &TelnetmanWF_common::make_box_id_list($access2db, $flow_id, $task_id);
 
 my %results = (
  'result' => 1,
  'flow_id' => $flow_id,
  'task_id' => $task_id,
  'work_id' => $work_id,
  'box_id'  => $work_id,
  'status'  => 2,
  'error_message'     => '',
  'auto_exec_box_id'  => $work_id,
  'empty_box_id_list' => $ref_empty_box_id_list,
  'fill_box_id_list'  => $ref_fill_box_id_list,
  'exists_parameter_sheet' => 0
 );
 
 my $json_results = &JSON::to_json(\%results);

 print "Content-type: text/plain; charset=UTF-8\n\n";
 print $json_results;
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}

open(PSHEET, '<', $file_parameter_sheet);
my $json_parameter_sheet = <PSHEET>;
close(PSHEET);



#
# パラメーターシートをOK, NG, 何もしないに分割する。 
#
my @divided_parameter_sheet_list = &TelnetmanWF_common::extract_parameter_sheet($json_parameter_sheet, $ref_ok_node_list, $ref_ng_node_list, $ref_through_node_list);
my $json_remaining_parameter_sheet = pop(@divided_parameter_sheet_list);



#
# パラメーターシートを分岐先に振り分ける。
#
my @target_id_list = ();
foreach my $ref_target ($ref_ok_link_target, $ref_ng_link_target){
 my $json_divided_parameter_sheet = shift(@divided_parameter_sheet_list);
 
 if(exists($ref_target -> {'id'}) && ($ref_target -> {'id'} !~ /^start_/)){
  my $target_id = $ref_target -> {'id'};
  
  if(length($json_divided_parameter_sheet) > 0){
   my $dir_log = &Common_system::dir_log($flow_id, $task_id, $target_id);
   
   unless(-d $dir_log){
    umask(0002);
    mkdir($dir_log, 0775);
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
my $exists_parameter_sheet = 0;

if(length($json_remaining_parameter_sheet) > 0){
 open(PSHEET, '>', $file_parameter_sheet);
 print PSHEET $json_remaining_parameter_sheet;
 close(PSHEET);
 
 $exists_parameter_sheet = 1;
}



#
# ステータスを記録。
#
my $time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $work_id, 2, '', '', '');



#
# 次のBox の自動実行。
#
my $auto_exec_box_id = '';
my $status = 2;
my $error_message = '';

foreach my $target_id (@target_id_list){
 ($auto_exec_box_id, $status, $error_message) = &Exec_box::auto_exec($access2db, $flow_id, $task_id, $target_id);

 if($status == -1){
  last;
 }
}

my ($ref_empty_box_id_list, $ref_fill_box_id_list) = &TelnetmanWF_common::make_box_id_list($access2db, $flow_id, $task_id);



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'task_id' => $task_id,
 'work_id' => $work_id,
 'box_id'  => $work_id,
 'status'  => $status,
 'error_message'     => $error_message,
 'auto_exec_box_id'  => $auto_exec_box_id,
 'empty_box_id_list' => $ref_empty_box_id_list,
 'fill_box_id_list'  => $ref_fill_box_id_list,
 'exists_parameter_sheet' => $exists_parameter_sheet
);



my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
