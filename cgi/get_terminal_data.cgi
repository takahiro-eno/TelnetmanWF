#!/usr/bin/perl
# 説明   : terminal のデータを取得する。
# 作成者 : 江野高広
# 作成日 : 2015/06/02
# 更新   : 2018/07/02 vcAutoExecBoxId を追加。

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



my $terminal_id = $cgi -> param('terminal_id');



#
# terminal data を取り出す。
#
my $select_column = 'vcTerminalTitle,vcTerminalDescription,vcAutoExecBoxId,iUpdateTime';
my $table         = 'T_Terminal';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTerminalId = '" . $terminal_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_terminal = $access2db -> select_cols;



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



my $title                = $ref_terminal -> [0];
my $description          = $ref_terminal -> [1];
my $auto_exec_box_id     = $ref_terminal -> [2];
my $update_time          = $ref_terminal -> [3];

$update_time += 0;



#
# 結果をまとめる。
#
my %results = (
 'result'           => 1,
 'flow_id'          => $flow_id,
 'terminal_id'      => $terminal_id,
 'title'            => $title,
 'description'      => $description,
 'auto_exec_box_id' => $auto_exec_box_id,
 'update_time'      => $update_time
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
