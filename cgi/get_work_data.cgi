#!/usr/bin/perl
# 説明   : work のデータを取得する。
# 作成者 : 江野高広
# 作成日 : 2015/05/12
# 更新   : 2015/12/24 syslog 確認のJSON を取り込めるように。
# 更新   : 2016/01/28 enable password をログイン情報ファイルから外す。
# 更新   : 2018/06/27 user, password を追加。iExecOnlyOne, vcAutoExecBoxId を追加。
# 更新   : 2018/08/15 個別パラメーターシートを廃止。

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



my $work_id = $cgi -> param('work_id');



#
# work data を取り出す。
#
my $select_column = 'vcWorkTitle,vcWorkDescription,iExecOnlyOne,vcAutoExecBoxId,iBondParameterSheet,vcUser,vcPassword,vcEnablePassword,iUpdateTime';
my $table         = 'T_Work';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_work = $access2db -> select_cols;




#
# アップロードされたファイル名を取り出す。
#
$select_column = 'vcFlowchartBefore,vcFlowchartMiddle,vcFlowchartAfter,vcLoginInfo,vcSyslogValues,vcDiffValues,vcOptionalLogValues';
$table         = 'T_File';
$access2db -> set_select($select_column, $table);
my $ref_file = $access2db -> select_cols;



$access2db -> close;



my $title                   = $ref_work -> [0];
my $description             = $ref_work -> [1];
my $exec_only_one           = $ref_work -> [2];
my $auto_exec_box_id        = $ref_work -> [3];
my $bond_parameter_sheet    = $ref_work -> [4];
my $user                    = $ref_work -> [5];
my $encoded_password        = $ref_work -> [6];
my $encoded_enable_password = $ref_work -> [7];
my $update_time             = $ref_work -> [8];
my $flowchart_before    = $ref_file -> [0]; 
my $flowchart_middle    = $ref_file -> [1]; 
my $flowchart_after     = $ref_file -> [2]; 
my $login_info          = $ref_file -> [3];
my $syslog_values       = $ref_file -> [4]; 
my $diff_values         = $ref_file -> [5]; 
my $optional_log_values = $ref_file -> [6]; 

my $password        = &TelnetmanWF_common::decode_password($encoded_password);
my $enable_password = &TelnetmanWF_common::decode_password($encoded_enable_password);

$bond_parameter_sheet += 0;
$update_time += 0;
$exec_only_one += 0;



#
# 結果をまとめる。
#
my %results = (
 'result'               => 1,
 'flow_id'              => $flow_id,
 'work_id'              => $work_id,
 'title'                => $title,
 'description'          => $description,
 'exec_only_one'        => $exec_only_one,
 'auto_exec_box_id'     => $auto_exec_box_id,
 'bond_parameter_sheet' => $bond_parameter_sheet,
 'user'                 => $user,
 'password'             => $password,
 'enable_password'      => $enable_password,
 'update_time'          => $update_time,
 'flowchart_before'     => $flowchart_before,
 'flowchart_middle'     => $flowchart_middle,
 'flowchart_after'      => $flowchart_after,
 'login_info'           => $login_info,
 'syslog_values'        => $syslog_values,
 'diff_values'          => $diff_values,
 'optional_log_values'  => $optional_log_values
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
