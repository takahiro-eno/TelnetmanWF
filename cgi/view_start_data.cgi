#!/usr/bin/perl
# 説明   : task のタイトル、説明を取得する。
# 作成者 : 江野高広
# 作成日 : 2015/05/12
# 更新   : 2018/07/20 更新日時確認テーブルをT_StartList に変更。

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
# task のタイトルを取り出す。
#
my $select_column = 'vcTaskTitle';
my $table         = 'T_Task';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $title  = $access2db -> select_col1;



#
# 更新時刻を確認
#
my $status = 2;
$select_column = 'iUpdateTime';
$table         = 'T_StartList';
$condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $update_time = $access2db -> select_col1;



$access2db -> close;



if(defined($update_time) && (length($update_time) > 0)){
 $update_time += 0;
}
else{
 $update_time = 0;
}



#
# 結果をまとめる。
#
my %results = (
 'result'      => 1,
 'flow_id'     => $flow_id,
 'task_id'     => $task_id,
 'box_id'      => $box_id,
 'title'       => $title,
 'status'      => $status,
 'update_time' => $update_time
);



#
# デフォルトのログイン情報からログインID を取り出す。
#
my $file_default_login_info = &Common_system::file_default_login_info($flow_id);
my $login_user = &TelnetmanWF_common::login_user($file_default_login_info);
if(defined($login_user) && (length($login_user) > 0)){
 $results{'login_user'} = $login_user;  
}



my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
