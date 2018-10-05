#!/usr/bin/perl
# 説明   : 強制終了フラグを立てる。
# 作成者 : 江野高広
# 作成日 : 2018/08/20
# 更新   : 2018/10/05 memcached サーバーのアドレスを関数で指定。

use strict;
use warnings;

use CGI;
use JSON;
use Cache::Memcached;

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
my $task_id = $ref_auth -> {'task_id'};



#
# 強制終了フラグを立てる。
#
my $memcached_server = &Common_system::memcached_server();
my $memcached = Cache::Memcached -> new({servers => [$memcached_server], namespace => $flow_id . ':' . $task_id});
my $force_stop = $memcached -> set('force_stop', 1);



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



#
# 結果をまとめる。
#
my %results = (
 'result'  => 1,
 'flow_id' => $flow_id,
 'task_id' => $task_id
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results; 
