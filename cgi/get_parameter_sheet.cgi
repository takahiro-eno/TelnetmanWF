#!/usr/bin/perl
# 説明   : 各task の各work のパラメーターシートを取得する。
# 作成者 : 江野高広
# 作成日 : 2015/05/29
# 更新 2015/12/08 : 個別パラメーターシートを使えるように。
# 更新 2018/08/09 : 個別パラメーターシートを廃止。

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



my $flow_id = $cgi -> param('flow_id');
my $task_id = $cgi -> param('task_id');

my $box_id  = $cgi -> param('box_id');
my $time    = $cgi -> param('time');
my $node    = $cgi -> param('node');



#
# パラメーターシートのファイルを特定する。
#
my $file_parameter_sheet = '';
if(defined($time) && (length($time) > 0) && ($time ne '0')){
 $file_parameter_sheet = &Common_system::file_old_parameter_sheet($flow_id, $task_id, $box_id, $time);
}
else{
 $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $box_id);
}

unless(-f $file_parameter_sheet){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"パラメーターシートがありません。"}';
 
 $access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
 $access2db -> close;
 exit(0);
}



#
# 各title からダウンロードファイル名を作る。
#
my $select_column = 'vcFlowTitle';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $title_1 = $access2db -> select_col1;

my $title_2 = '';
if($box_id =~ /^work_/){
 my $select_column = 'vcWorkTitle';
 my $table         = 'T_Work';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $box_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 $title_2 = $access2db -> select_col1;
}
elsif($box_id =~ /^case_/){
 my $select_column = 'vcCaseTitle';
 my $table         = 'T_Case';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcCaseId = '" . $box_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 $title_2 = $access2db -> select_col1;
}
elsif($box_id =~ /^terminal_/){
 my $select_column = 'vcTerminalTitle';
 my $table         = 'T_Terminal';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTerminalId = '" . $box_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 $title_2 = $access2db -> select_col1;
}
elsif($box_id =~ /^goal_/){
 $title_2 = 'Goal';
}

my $download_file_name = 'Telnetman2_parameter_' . &Common_sub::escape_filename($title_1) . '_' . &Common_sub::escape_filename($title_2) ;
if(defined($time) && (length($time) > 0) && ($time ne '0')){
 $download_file_name .= '_' . (&Common_sub::YYYYMMDDhhmmss($time, 'YYYYMMDD-hhmmss'))[0];
}

$download_file_name .= '.csv';



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



#
# ノード指定があればパラメーターシートをそのノード分だけ取り出す。
#
open(OLDPSHEET, '<', $file_parameter_sheet);
my $json_parameter_sheet = <OLDPSHEET>;
close(OLDPSHEET);

if(defined($node) && (length($node) > 0)){
 ($json_parameter_sheet) = &TelnetmanWF_common::extract_parameter_sheet($json_parameter_sheet, [$node]);
}



#
# パラメーターシートの各行の要素数の最大値を求める。
#
my $ref_parameter_sheet = &JSON::from_json($json_parameter_sheet);

my $max_length = 0;
foreach my $ref_row (@$ref_parameter_sheet){
 my $length_row = length(scalar(@$ref_row));
 
 if($length_row > $max_length){
  $max_length = $length_row;
 }
}



#
# 各行の長さを最長のものに揃えつつ出力。
#
print "Content-type: text/csv; charset=UTF-8\n";
print 'Content-Disposition: attachment; filename=' . $download_file_name . "\n\n";
foreach my $ref_row (@$ref_parameter_sheet){
 my $length_row = length(scalar(@$ref_row));
 
 for(my $i = $length_row; $i < $max_length; $i ++){
  push(@$ref_row, "");
 }
 
 print join("\t", @$ref_row) . "\r\n";
}
