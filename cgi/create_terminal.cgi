#!/usr/bin/perl
# 説明   : terminal を新規作成する。
# 作成者 : 江野高広
# 作成日 : 2015/06/02

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
my $x                = $cgi -> param('x');
my $y                = $cgi -> param('y');
my $title            = $cgi -> param('title');



#
# work id を作る。
#
my $select_column = 'iTerminalNumber';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $terminal_number = $access2db -> select_col1;

my $terminal_id = 'terminal_' . ($terminal_number + 1);



#
# work の個数を1 増やす。
#
my @set = ('iTerminalNumber = iTerminalNumber + 1');
$access2db -> set_update(\@set);
$access2db -> update_exe;



#
# DB に登録。
#
my $insert_column = 'vcFlowId,vcTerminalId,vcTerminalTitle,vcTerminalDescription,iActive,iX,iY,iCreateAt,iUpdateTime';
my @values = ("('" . $flow_id . "','" . $terminal_id . "','" . $title . "','',1," . $x . "," . $y . "," . $time . "," . $time . ")");
$table = 'T_Terminal';
$access2db -> set_insert($insert_column, \@values, $table);
$access2db -> insert_exe;


$access2db -> close;



#
# 結果をまとめる。
#
my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'terminal_id' => $terminal_id
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
