#!/usr/bin/perl
# 説明   : 各task の各work のログを取得する。
# 作成者 : 江野高広
# 作成日 : 2015/05/29

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


my $flow_id = $cgi -> param('flow_id');
my $task_id = $cgi -> param('task_id');


my $work_id = $cgi -> param('work_id');
my $time    = $cgi -> param('time');
my $type    = $cgi -> param('type');

$type =~ tr/a-z/A-Z/;



#
# work title からダウンロードファイル名を作る。
#
my $select_column = 'vcFlowTitle';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $flow_title = $access2db -> select_col1;

$select_column = 'vcWorkTitle';
$table         = 'T_Work';
$condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $work_title = $access2db -> select_col1;

my $download_file_name = 'Telnetman_'. &Common_sub::escape_filename($flow_title) . '_' . &Common_sub::escape_filename($work_title) . '_' . $type . '_' . (&Common_sub::YYYYMMDDhhmmss($time, 'YYYYMMDD-hhmmss'))[0] . '.zip';

$access2db -> close;



my $file_zip = &Common_system::file_zip_log($flow_id, $task_id, $work_id, $time, $type);

unless(-f $file_zip){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"ログファイルが見つかりません。"}';
 
 $access2db -> close;
 exit(0);
}



#
# zip ファイルをバイナリモードで開く。
#
my $size = -s $file_zip;
my $buf;
open(ZLOG, '<', $file_zip);
binmode(ZLOG);
read(ZLOG, $buf, $size);
close(ZLOG);

$download_file_name =~ s/,//g;

print "Content-type: application/octet-stream\n";
print 'Content-Disposition: attachment; filename=' . $download_file_name . "\n\n";
print $buf;
