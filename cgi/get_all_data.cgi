#!/usr/bin/perl
# 説明   : flow の全データのZIP を作る。
# 作成者 : 江野高広
# 作成日 : 2015/07/28

use strict;
use warnings;

use CGI;
use JSON;
use Archive::Zip;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use TelnetmanWF_common;

my $cgi = new CGI;
my $flow_id = $cgi -> param('flow_id');

unless(defined($flow_id) && (length($flow_id) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"flow_id の指定がありません。"}';
 exit(0);
}



#
# DB アクセスのためのオブジェクトを作成する。
#
my ($DB_name, $DB_host, $DB_user, $DB_password) = &Common_system::DB_connect_parameter();
my @DB_connect_parameter_list                   = ('dbi:mysql:' . $DB_name . ':' . $DB_host, $DB_user, $DB_password);
my $access2db                                   = Access2DB -> open(@DB_connect_parameter_list);



#
# flow title からダウンロードファイル名を作る。
#
my $select_column = 'vcFlowTitle';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $flow_title = $access2db -> select_col1;



$access2db -> close;



unless(defined($flow_title) && (length($flow_title) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"flow がありません。"}';
 exit(0);
}



#
# zip ファイルをバイナリモードで開く。
#
my $file_all_data_zip = &Common_system::file_all_data_zip($flow_id);

unless(-f $file_all_data_zip){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"ZIP ファイルが見つかりません。"}';
 exit(0);
}

my $size = -s $file_all_data_zip;
my $buf;
open(ZALLDATA, '<', $file_all_data_zip);
binmode(ZALLDATA);
read(ZALLDATA, $buf, $size);
close(ZALLDATA);

unlink($file_all_data_zip);



#
# ファイル名を作ってダウンロードさせる。
#
my $download_file_name = 'TelnetmanWF_' . &Common_sub::escape_filename($flow_title) . '.zip';

$download_file_name =~ s/,//g;

print "Content-type: application/octet-stream\n";
print 'Content-Disposition: attachment; filename=' . $download_file_name . "\n\n";
print $buf;
