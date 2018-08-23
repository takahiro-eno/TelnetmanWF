#!/usr/bin/perl
# 説明   : 実行履歴を取得。
# 作成者 : 江野高広
# 作成日 : 2018/08/17

use strict;
use warnings;

use CGI;
use JSON;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
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



$access2db -> close;



#
# 実行履歴を読み込む。
#
my $history_log = '';
my $file_history_log = &Common_system::file_history_log($flow_id, $task_id);

&CORE::open(my $fh, '<', $file_history_log);
while(my $line = <$fh>){
 $history_log .= $line;
}
&CORE::close($fh);


print "Content-type: text/plain; charset=UTF-8\n\n";
print $history_log
