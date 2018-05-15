#!/usr/bin/perl
# 説明   : flow のタイトル、説明、デフォルトのloginInfo の名前を取得する。
# 作成者 : 江野高広
# 作成日 : 2015/05/12
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



my $box_id = $cgi -> param('box_id');



#
# flow のタイトル、説明、デフォルトのloginInfo の名前を取り出す。
#
my $select_column = 'vcFlowTitle,vcFlowDescription,vcLoginInfo,vcEnablePassword,iUpdateTime';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_flow = $access2db -> select_cols;



$access2db -> close;



my $title           = $ref_flow -> [0];
my $description     = $ref_flow -> [1];
my $login_info      = $ref_flow -> [2]; 
my $enable_password = $ref_flow -> [3]; 
my $update_time     = $ref_flow -> [4];

$update_time += 0;



#
# 結果をまとめる。
#
my %results = (
 'result'          => 1,
 'flow_id'         => $flow_id,
 'box_id'          => $box_id,
 'title'           => $title,
 'description'     => $description,
 'login_info'      => $login_info,
 'enable_password' => $enable_password,
 'update_time'     => $update_time
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
