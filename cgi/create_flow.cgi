#!/usr/bin/perl
# 説明   : workflow を新規作成する。
# 作成者 : 江野高広
# 作成日 : 2015/05/06
# 更新   : 2016/01/28 enable password をログイン情報ファイルから外す。
# 更新   : 2018/07/02 vcAutoExecBoxId を追加。
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


my $time = time;
my $create = 1;


my $cgi = new CGI;
my $title    = $cgi -> param('title');
my $flow_password = $cgi -> param('flow_password');
my $task_password = $cgi -> param('task_password');

unless(defined($title) && (length($title) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"create":0,"reason":"タイトルがありません。"}';
 
 exit(0);
}

unless(defined($flow_password) && (length($flow_password) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"create":0,"reason":"編集パスワードがありません。"}';
 
 exit(0);
}

unless(defined($task_password) && (length($flow_password) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"create":0,"reason":"編集パスワードがありません。"}';
 
 exit(0);
}


#
# パスワードをエンコード
#
my $encoded_flow_password = &Common_sub::encode_password($flow_password);
my $encoded_task_password = &Common_sub::encode_password($task_password);



#
# DB アクセスのためのオブジェクトを作成する。
#
my ($DB_name, $DB_host, $DB_user, $DB_password) = &Common_system::DB_connect_parameter();
my @DB_connect_parameter_list                   = ('dbi:mysql:' . $DB_name . ':' . $DB_host, $DB_user, $DB_password);
my $access2db                                   = Access2DB -> open(@DB_connect_parameter_list);
$access2db -> log_file(&Common_system::file_sql_log());


my $flow_id = &TelnetmanWF_common::make_flow_id($access2db);

my $x = 90;
my $y = 20;
my $goal_x = 90;
my $goal_y = 520;
my %start_link_target = ('x' => 120, 'y' => 160);
my @start_link_vertices = ();
my $paper_height = 600;
my $json_start_link_target   = &JSON::to_json(\%start_link_target);
my $json_start_link_vertices = &JSON::to_json(\@start_link_vertices);



my $insert_column = 'vcFlowId,vcFlowTitle,vcFlowDescription,vcFlowPassword,vcTaskPassword,iWorkNumber,iCaseNumber,iTerminalNumber,iX,iY,vcStartLinkTarget,txStartLinkVertices,iGoalX,iGoalY,vcAutoExecBoxId,iPaperHieght,vcLoginInfo,vcUser,vcPassword,vcEnablePassword,iCreateTime,iUpdateTime';
my @values = ("('" . $flow_id . "','" . &Common_sub::escape_sql($title) . "','','" . $encoded_flow_password  . "','" . $encoded_task_password . "',0,0,0," . $x . "," . $y . ",'" . $json_start_link_target . "','" . $json_start_link_vertices . "'," . $goal_x . "," . $goal_y . ",''," . $paper_height . ",'','','',''," . $time . "," . $time . ")");
my $table = 'T_Flow';
$access2db -> set_insert($insert_column, \@values, $table);
$access2db -> insert_exe;



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



#
# ファイル置き場を作る。
#
my $dir_data_root = &Common_system::dir_data_root($flow_id);
my $dir_log_root  = &Common_system::dir_log_root($flow_id);
umask(0002);
mkdir($dir_data_root, 0775);
mkdir($dir_log_root,  0775);



#
# 結果をまとめる。
#
my %results = (
 'create'  => $create,
 'title'   => $title,
 'flow_id' => $flow_id
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
