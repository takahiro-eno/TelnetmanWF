#!/usr/bin/perl
# 説明   : アップロードされた流れ図データ、ログイン情報をダウンロードする。
# 作成者 : 江野高広
# 作成日 : 2015/06/20
# 更新   : 2015/12/24 syslog 確認のJSON を取り込めるように。

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
my $box_id  = $cgi -> param('box_id');
my $type    = $cgi -> param('type');



#
# box_id とtype 毎にダウンロードファイル名と内容を取得する。
#
my $file_name = '';
my $file_path = '';
if($box_id =~ /^work_/){
 my $select_column = 'vcFlowchartBefore,vcFlowchartMiddle,vcFlowchartAfter,vcLoginInfo,vcSyslogValues,vcDiffValues,vcOptionalLogValues';
 my $table         = 'T_File';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $box_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_file_name_list = $access2db -> select_cols;
 
 if($type eq 'before'){
  $file_name = $ref_file_name_list -> [0];
  $file_path = &Common_system::file_flowchart_before($flow_id, $box_id);
 }
 elsif($type eq 'middle'){
  $file_name = $ref_file_name_list -> [1];
  $file_path = &Common_system::file_flowchart_middle($flow_id, $box_id);
 }
 elsif($type eq 'after'){
  $file_name = $ref_file_name_list -> [2];
  $file_path = &Common_system::file_flowchart_after($flow_id, $box_id);
 }
 elsif($type eq 'loginInfo'){
  $file_name = $ref_file_name_list -> [3];
  $file_path = &Common_system::file_login_info($flow_id, $box_id);
 }
 elsif($type eq 'syslogValues'){
  $file_name = $ref_file_name_list -> [4];
  $file_path = &Common_system::file_syslog_values($flow_id, $box_id);
 }
 elsif($type eq 'diffValues'){
  $file_name = $ref_file_name_list -> [5];
  $file_path = &Common_system::file_diff_values($flow_id, $box_id);
 }
 elsif($type eq 'optionalLog'){
  $file_name = $ref_file_name_list -> [6];
  $file_path = &Common_system::file_optional_log_values($flow_id, $box_id);
 }
}
elsif($box_id =~ /^start_/){
 my $select_column = 'vcLoginInfo';
 my $table         = 'T_Flow';
 my $condition     = "where vcFlowId = '" . $flow_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 $file_name = $access2db -> select_col1;
 
 $file_path = &Common_system::file_default_login_info($flow_id);
}



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



unless((length($file_path) > 0) && (-f $file_path)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"ファイルがありません。"}';
 
 exit(0);
}


open(UPLOADFILE, '<', $file_path);
my $json_data = <UPLOADFILE>;
close(UPLOADFILE);

$file_name =~ s/,//g;

print "Content-type: application/json; charset=UTF-8\n";
print 'Content-Disposition: attachment; filename=' . $file_name . "\n\n";
print $json_data;
