#!/usr/bin/perl
# 説明   : user, password を一括変更する。
# 作成者 : 江野高広
# 作成日 : 2018/08/15

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



#
# user, password を受け取る。
#
my $user     = $cgi -> param('user');
my $password = $cgi -> param('password');

unless(defined($user)){
 $user = '';
}

unless(defined($password)){
 $password = '';
}

my $encoded_password = &TelnetmanWF_common::encode_password($password);



#
# user, password が設定されているwork を特定する。
#
my $select_column = 'vcWorkId';
my $table         = 'T_Work';
my $condition     = "where vcFlowId = '" . $flow_id . "' and (vcEnablePassword != '' or vcUser != '')";
$access2db -> set_select($select_column, $table, $condition);
my $ref_box_id_list = $access2db -> select_array_col1;



#
# デフォルトのenable password の更新。
#
my @set = ("vcUser = '" . $user . "'", "vcPassword = '" . $encoded_password . "'");
$table     = 'T_Flow';
$condition = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_update(\@set, $table, $condition);
$access2db -> update_exe;



#
# work のuser, password の更新。
#
if(scalar(@$ref_box_id_list) > 0){
 $table     = 'T_Work';
 $condition = "where vcFlowId = '" . $flow_id . "' and vcWorkId in ('" . join("','", @$ref_box_id_list) . "')";
 $access2db -> set_update(\@set, $table, $condition);
 $access2db -> update_exe;
}



$access2db -> write_log(&TelnetmanWF_common::prefix_log('root'));
$access2db -> close;



my %results = (
 'result'      => 1,
 'flow_id'     => $flow_id,
 'user'        => $user,
 'password'    => $password,
 'box_id_list' => $ref_box_id_list
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
