#!/usr/bin/perl
# 説明   : 全フローデータを受け取ってtmp ディレクトリに保存する。    
# 作成者 : 江野高広
# 作成日 : 2015/08/21
# 更新   : 2018/10/01 作成するディレクトリのパーミッションを775 に。
# 更新   : 2018/10/05 作成するファイルのパーミッションを664 に。

use strict;
use warnings;

use CGI;
use JSON;
use MIME::Base64;
use Archive::Zip;
use File::Path;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use TelnetmanWF_common;



#
# zip をbase64 にエンコードした文字列を受け取る。
#
my $cgi = new CGI;
my $flow_all_data_base64 = $cgi -> param('flow_all_data_base64');

unless(defined($flow_all_data_base64) && (length($flow_all_data_base64) > 0)){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"データがありません。"}';
 exit(0);
}



#
# zip を解凍するディレクトリを作成する。
#
my $tmp_id = &main::make_tmp_id();
my $dir_tmp_root = &Common_system::dir_tmp_root($tmp_id);
umask(0002);
mkdir($dir_tmp_root, 0775);



#
# base64 をデコードしてzip ファイルを作成する。
#
my $flow_all_data_binary = &MIME::Base64::decode_base64($flow_all_data_base64);
my $file_zip = $dir_tmp_root . '/TelnetmanWF_flow_all_data.zip';

open(ZIP, '>', $file_zip);
binmode(ZIP);
print ZIP $flow_all_data_binary;
close(ZIP);

umask(0002);
chmod(0664, $file_zip);



#
# zip を解凍する。
#
my $zip = Archive::Zip -> new();
$zip -> read($file_zip);
my @members = $zip -> memberNames();
foreach my $member (@members){
 $zip -> extractMember($member, $dir_tmp_root . '/' . $member);
}



#
# データの中身が正しいか確認。
#
my $file_all_data_tmp = &Common_system::file_all_data_tmp($tmp_id);

unless(-f $file_all_data_tmp){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"データファイルがありません。"}';
 exit(0);
}

open(JSON, '<', $file_all_data_tmp);
my $json_db_data = <JSON>;
close(JSON);

my $ref_db_data = undef;
eval{$ref_db_data = &JSON::from_json($json_db_data);};

unless(length($@) == 0){
 &File::Path::rmtree($dir_tmp_root);
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"データファイルが不正です。"}';
 exit(0);
}

unless(exists($ref_db_data -> {'T_Flow'})){
 &File::Path::rmtree($dir_tmp_root);
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"データが不足しています。"}';
 exit(0);
}

unless(exists($ref_db_data -> {'T_Flow'} -> {'vcFlowId'})){
 &File::Path::rmtree($dir_tmp_root);
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"データに欠落があります。"}';
 exit(0);
}

unlink($file_zip);



#
# 同じflow id が登録されているか確認。
#
my $flow_id = $ref_db_data -> {'T_Flow'} -> {'vcFlowId'};

my ($DB_name, $DB_host, $DB_user, $DB_password) = &Common_system::DB_connect_parameter();
my @DB_connect_parameter_list                   = ('dbi:mysql:' . $DB_name . ':' . $DB_host, $DB_user, $DB_password);
my $access2db                                   = Access2DB -> open(@DB_connect_parameter_list);

my $select_column = 'count(*)';
my $table         = 'T_Flow';
my $condition     = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $count = $access2db -> select_col1;

$access2db -> close;

my $exists = 0;
if($count > 0){
 $exists = 1;
}



#
# 結果を返す。
#
my $flow_title = $ref_db_data -> {'T_Flow'} -> {'vcFlowTitle'};

my %results = (
 'result' => 1,
 'exists' => $exists,
 'flow_id' => $flow_id,
 'tmp_id' => $tmp_id,
 'flow_title' => $flow_title
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;



#
# tmp id を作る。
#
sub make_tmp_id {
 my $tmp_id = 'tmp_' . &Common_sub::make_random_string(20);
 
 while(1){
  my $dir_tmp_root = &Common_system::dir_tmp_root($tmp_id);
  
  unless(-d $dir_tmp_root){
   last;
  }
  else{
   $tmp_id = 'tmp_' . &Common_sub::make_random_string(20);
  }
 }
 
 return($tmp_id);
}
