#!/usr/bin/perl
# 説明   : flow の全データのZIP を作る。
# 作成者 : 江野高広
# 作成日 : 2015/07/28
# 更新   : 2018/08/20 version 情報を追加。

use strict;
use warnings;

use CGI;
use JSON;
use Archive::Zip;

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
# テーブル名、カラム名一覧を作る。
#
my $table_name_flow     = 'T_Flow';
my $table_name_work     = 'T_Work';
my $table_name_case     = 'T_Case';
my $table_name_terminal = 'T_Terminal';
my $table_name_file     = 'T_File';
my @column_name_list_flow     = &Common_system::column_name_list($table_name_flow);
my @column_name_list_work     = &Common_system::column_name_list($table_name_work);
my @column_name_list_case     = &Common_system::column_name_list($table_name_case);
my @column_name_list_terminal = &Common_system::column_name_list($table_name_terminal);
my @column_name_list_file     = &Common_system::column_name_list($table_name_file);



#
# flow data 全てを取り出す。
#
my $select_column_flow     = join(',', @column_name_list_flow);
my $select_column_work     = join(',', @column_name_list_work);
my $select_column_case     = join(',', @column_name_list_case);
my $select_column_terminal = join(',', @column_name_list_terminal);
my $select_column_file     = join(',', @column_name_list_file);
my $condition = "where vcFlowId = '" . $flow_id . "'";

$access2db -> set_select($select_column_flow, $table_name_flow, $condition);
my $ref_flow = $access2db -> select_cols;

$access2db -> set_select($select_column_work, $table_name_work, $condition);
my $ref_work_list = $access2db -> select_array_cols;

$access2db -> set_select($select_column_case, $table_name_case, $condition);
my $ref_case_list = $access2db -> select_array_cols;

$access2db -> set_select($select_column_terminal, $table_name_terminal, $condition);
my $ref_terminal_list = $access2db -> select_array_cols;

$access2db -> set_select($select_column_file, $table_name_file, $condition);
my $ref_file_list = $access2db -> select_array_cols;

$access2db -> close;



#
# 全flow data をJSON のテキストファイルにする。
#
my $ref_flow_data = &main::make_value_list(\@column_name_list_flow, $ref_flow);

my @work_data_list = ();
foreach my $ref_work (@$ref_work_list){
 my $ref_work_data = &main::make_value_list(\@column_name_list_work, $ref_work);
 push(@work_data_list, $ref_work_data);
}

my @case_data_list = ();
foreach my $ref_case (@$ref_case_list){
 my $ref_case_data = &main::make_value_list(\@column_name_list_case, $ref_case);
 push(@case_data_list, $ref_case_data);
}

my @terminal_data_list = ();
foreach my $ref_terminal (@$ref_terminal_list){
 my $ref_terminal_data = &main::make_value_list(\@column_name_list_terminal, $ref_terminal);
 push(@terminal_data_list, $ref_terminal_data);
}

my @file_data_list = ();
foreach my $ref_file (@$ref_file_list){
 my $ref_file_data = &main::make_value_list(\@column_name_list_file, $ref_file);
 push(@file_data_list, $ref_file_data);
}

my %flow_data_all = (
 'version' => '2.1.0',
 $table_name_flow     => $ref_flow_data,
 $table_name_work     => \@work_data_list,
 $table_name_case     => \@case_data_list,
 $table_name_terminal => \@terminal_data_list,
 $table_name_file     => \@file_data_list
); 

my $json_flow_data_all = &JSON::to_json(\%flow_data_all);
my $file_all_data = &Common_system::file_all_data($flow_id);

open(ALLDATA, '>', $file_all_data);
print ALLDATA $json_flow_data_all;
close(ALLDATA);



#
# 全flow data とアップロードされたファイルをZIP にする。
#
my $zip = Archive::Zip -> new();

my $all_data_file_name = &Common_sub::get_file_name($file_all_data);
$zip -> addFile($file_all_data, $all_data_file_name);

my $file_default_login_info = &Common_system::file_default_login_info($flow_id);
if(-f $file_default_login_info){
 my $default_login_info_file_name = &Common_sub::get_file_name($file_default_login_info);
 $zip -> addFile($file_default_login_info, $default_login_info_file_name);
}

foreach my $ref_work_data (@work_data_list){
 my $work_id = $ref_work_data -> {'vcWorkId'};
 
 my $dir_work = &Common_system::dir_data($flow_id, $work_id);
 $zip -> addTree($dir_work, $work_id);
}

my $file_all_data_zip = &Common_system::file_all_data_zip($flow_id);
$zip -> writeToFileNamed($file_all_data_zip);

unlink($file_all_data);




#
# 結果をまとめる。
#
my %results = (
 'result'  => 1,
 'flow_id' => $flow_id
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;



sub make_value_list {
 my $ref_column_name_list = $_[0];
 my $ref_values = $_[1];
 my %data_list = ();
 
 my $n = scalar(@$ref_column_name_list);
 
 for(my $i = 0; $i < $n; $i ++){
  my $column_name = $ref_column_name_list -> [$i];
  my $value       = $ref_values -> [$i];
  
  if($column_name =~ /^i/){
   $value += 0;
  }
  
  $data_list{$column_name} = $value;
 }
 
 return(\%data_list);
}
