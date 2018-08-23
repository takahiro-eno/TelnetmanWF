#!/usr/bin/perl
# 説明   : flow を削除する。
# 作成者 : 江野高広
# 作成日 : 2015/09/07
# 更新   : 2018/08/21 実行中のタスクがあるかの確認を追加。

use strict;
use warnings;

use CGI;
use JSON;
use File::Path;

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



#
# 実行中のタスクがあれば削除させない。
#
my $exist_running_work = &TelnetmanWF_common::exist_running_work($access2db, $flow_id);

if($exist_running_work == 1){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"実行中のタスクがあります。"}';
 
 $access2db -> close;
 exit(0);
}



#
# DB から削除。
#
$access2db -> set_delete('T_Flow', "where vcFlowId = '" . $flow_id . "'");
$access2db -> delete_exe;
$access2db -> set_delete('T_Task');
$access2db -> delete_exe;
$access2db -> set_delete('T_Queue');
$access2db -> delete_exe;
$access2db -> set_delete('T_StartList');
$access2db -> delete_exe;
$access2db -> set_delete('T_WorkList');
$access2db -> delete_exe;
$access2db -> set_delete('T_Work');
$access2db -> delete_exe;
$access2db -> set_delete('T_CaseList');
$access2db -> delete_exe;
$access2db -> set_delete('T_Case');
$access2db -> delete_exe;
$access2db -> set_delete('T_Terminal');
$access2db -> delete_exe;
$access2db -> set_delete('T_File');
$access2db -> delete_exe;



$access2db -> close;



#
# ファイル置き場を削除する。
#
my $dir_data_root = &Common_system::dir_data_root($flow_id);
my $dir_log_root  = &Common_system::dir_log_root($flow_id);
&File::Path::rmtree($dir_data_root);
&File::Path::rmtree($dir_log_root);



#
# 結果を返す。
#
my %results = (
 'result'  => 1,
 'flow_id' => $flow_id
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
