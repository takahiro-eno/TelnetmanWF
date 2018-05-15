#!/usr/bin/perl
# 説明   : work を新規作成する。
# 作成者 : 江野高広
# 作成日 : 2015/05/12
# 更新   : 2015/12/24 syslog 確認のJSON を取り込めるように。
# 更新   : 2016/01/28 enable password をログイン情報ファイルから外す。

use strict;
use warnings;

use CGI;
use JSON;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use TelnetmanWF_common;

my $time = time;

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
# 値を受け取る。
#
my $x       = $cgi -> param('x');
my $y       = $cgi -> param('y');
my $title   = $cgi -> param('title');
my $json_ok_link_target      = $cgi -> param('json_ok_link_target');
my $json_ng_link_target      = $cgi -> param('json_ng_link_target');
my $json_through_link_target = $cgi -> param('json_through_link_target');
my $json_ok_link_vertices      = $cgi -> param('json_ok_link_vertices');
my $json_ng_link_vertices      = $cgi -> param('json_ng_link_vertices');
my $json_through_link_vertices = $cgi -> param('json_through_link_vertices');



#
# work id を作る。
#
my $select_column = 'iWorkNumber';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $work_number = $access2db -> select_col1;

my $work_id = 'work_' . ($work_number + 1);



#
# work の個数を1 増やす。
#
my @set = ('iWorkNumber = iWorkNumber + 1');
$access2db -> set_update(\@set);
$access2db -> update_exe;



#
# DB に登録。
#
my $insert_column = 'vcFlowId,vcWorkId,vcWorkTitle,vcWorkDescription,iActive,iX,iY,vcOkLinkTarget,vcNgLinkTarget,vcThroughTarget,txOkLinkVertices,txNgLinkVertices,txThroughVertices,iUseParameterSheet,iBondParameterSheet,vcEnablePassword,iCreateAt,iUpdateTime';
my @values = ("('" . $flow_id . "','" . $work_id . "','" . $title . "','',1," . $x . "," . $y . ",'" . $json_ok_link_target . "','" . $json_ng_link_target . "','" . $json_through_link_target . "','" . $json_ok_link_vertices . "','" . $json_ng_link_vertices . "','" . $json_through_link_vertices . "',0,0,''," . $time . "," . $time . ")");
$table = 'T_Work';
$access2db -> set_insert($insert_column, \@values, $table);
$access2db -> insert_exe;

$insert_column = 'vcFlowId,vcWorkId,vcFlowchartBefore,vcFlowchartMiddle,vcFlowchartAfter,vcLoginInfo,vcSyslogValues,vcDiffValues,vcOptionalLogValues,iCreateAt,iUpdateTime';
@values = ("('" . $flow_id . "','" . $work_id  . "','','','','','','',''," . $time . "," . $time . ")");
$table = 'T_File';
$access2db -> set_insert($insert_column, \@values, $table);
$access2db -> insert_exe;


$access2db -> close;



#
# ファイル置き場を作る。
#
my $dir_data = &Common_system::dir_data($flow_id, $work_id);
mkdir($dir_data, 0755);



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'work_id' => $work_id
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
