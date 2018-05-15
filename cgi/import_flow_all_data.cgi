#!/usr/bin/perl
# 説明   : tmp ディレクトリにある全フローデータを正規の場所に移動させる。
# 作成者 : 江野高広
# 作成日 : 2015/08/21

use strict;
use warnings;

use CGI;
use JSON;
use File::Path;
use File::Copy;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;
use TelnetmanWF_common;



my $time = time;



#
# 変数を受け取る。
#
my $cgi = new CGI;
my $import_type = $cgi -> param('import_type');# 0:キャンセル 1:新規作成 2:上書保存
my $exists      = $cgi -> param('exists');     # 0:同じflow id 無し 1:有り
my $password    = $cgi -> param('password');   # 上書保存の場合、既存flow の編集パスワード
my $flow_id     = $cgi -> param('flow_id');
my $tmp_id      = $cgi -> param('tmp_id');

my $new_flow_id = $flow_id;
my $dir_tmp_root      = &Common_system::dir_tmp_root($tmp_id);
my $file_all_data_tmp = &Common_system::file_all_data_tmp($tmp_id);

$import_type += 0;


#
# アップロードしたファイルが無ければ終了。
#
unless(-f $file_all_data_tmp){
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":0,"reason":"データがありません。"}';
 
 exit(0);
}



#
# キャンセルの場合、削除して終了。
#
if($import_type == 0){
 &File::Path::rmtree($dir_tmp_root);
 print "Content-type: text/plain; charset=UTF-8\n\n";
 print '{"result":1,"import_type":' . $import_type . ',"message":"キャンセルしました。"}';
 exit(0);
}



#
# DB アクセスのためのオブジェクトを作成する。
#
my ($DB_name, $DB_host, $DB_user, $DB_password) = &Common_system::DB_connect_parameter();
my @DB_connect_parameter_list                   = ('dbi:mysql:' . $DB_name . ':' . $DB_host, $DB_user, $DB_password);
my $access2db                                   = Access2DB -> open(@DB_connect_parameter_list);



#
# 新規作成で同じflow id のflow が有る場合、新しくflow id を作り直す。
#
if(($import_type == 1) && ($exists == 1)){
 $new_flow_id = &TelnetmanWF_common::make_flow_id($access2db);
}



#
# 上書保存の場合は既存のデータを全て削除する。
#
if($import_type == 2){
 # パスワード確認
 unless(defined($password) && (length($password) > 0)){
  print "Content-type: text/plain; charset=UTF-8\n\n";
  print '{"result":0,"reason":"パスワードが未定義です。"}';
  
  $access2db -> close;
  exit(0);
 }
 
 my $select_column = 'vcFlowPassword';
 my $table         = 'T_Flow';
 my $condition     = "where vcFlowId = '" . $flow_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $encoded_password = $access2db -> select_col1;
 
 my $check = &TelnetmanWF_common::check_password($password, $encoded_password);
 
 unless($check == 1){
  print "Content-type: text/plain; charset=UTF-8\n\n";
  print '{"result":0,"reason":"パスワードが違います。"}';
  
  $access2db -> close;
  exit(0);
 }
 
 # データファイル削除
 my $dir_data_root = &Common_system::dir_data_root($flow_id);
 &File::Path::rmtree($dir_data_root);
 
 # データベース削除
 $access2db -> set_delete('T_Flow', $condition);
 $access2db -> delete_exe;
 $access2db -> set_delete('T_Work', $condition);
 $access2db -> delete_exe;
 $access2db -> set_delete('T_Case', $condition);
 $access2db -> delete_exe;
 $access2db -> set_delete('T_Terminal', $condition);
 $access2db -> delete_exe;
 $access2db -> set_delete('T_File', $condition);
 $access2db -> delete_exe;
}



#
# アップロードしたデータをデータベースに登録する。
#
open(JSON, '<', $file_all_data_tmp);
my $json_db_data = <JSON>;
close(JSON);

my $ref_db_data = &JSON::from_json($json_db_data);

foreach my $table ('T_Flow', 'T_Work', 'T_Case', 'T_Terminal', 'T_File'){
 my @column_name_list = &Common_system::column_name_list($table);
 my $insert_column = join(',', @column_name_list);
 my @values = ();
 
 if($table eq 'T_Flow'){
  my $text_values = &main::make_values($import_type, $time, $new_flow_id, \@column_name_list, $ref_db_data -> {$table});
  push(@values, $text_values);
 }
 else{
  foreach my $ref_rows (@{$ref_db_data -> {$table}}){
   my $text_values = &main::make_values($import_type, $time, $new_flow_id, \@column_name_list, $ref_rows);
   push(@values, $text_values);
  }
 }
 
 $access2db -> set_insert($insert_column, \@values, $table);
 $access2db -> insert_exe;
}


$access2db -> close;



#
# データファイルを正規の場所に移動する。
#
unlink($file_all_data_tmp);
my $dir_data_root = &Common_system::dir_data_root($new_flow_id);
&File::Copy::move($dir_tmp_root, $dir_data_root);



#
# ログ置き場を作成する。
#
my $dir_log_root = &Common_system::dir_log_root($new_flow_id);
unless(-d $dir_log_root){
 mkdir($dir_log_root, 0755);
}



#
# 結果を返す。
#
$import_type += 0;
my $flow_title = $ref_db_data -> {'T_Flow'} -> {'vcFlowTitle'};
my %results = (
 'result' => 1,
 'import_type' => $import_type,
 'flow_id' => $new_flow_id,
 'flow_title' => $flow_title
);

if($import_type == 1){
 $results{'message'} = '新規作成しました。';
}
elsif($import_type == 2){
 $results{'message'} = '上書保存しました。';
}

my $json_results = &JSON::to_json(\%results);
print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;



sub make_values {
 my $import_type = $_[0];
 my $time = $_[1];
 my $flow_id = $_[2];
 my $ref_column_name_list = $_[3];
 my $ref_value_list = $_[4];
 my @values = ();
 
 foreach my $column_name (@$ref_column_name_list){
  my $value = $ref_value_list -> {$column_name};
  
  if($column_name =~ /^i/){
   if(($import_type == 1) && (($column_name eq 'iCreateAt') || ($column_name eq 'iUpdateTime'))){
    push(@values, $time);
   }
   else{
    push(@values, $value);
   }
  }
  elsif($column_name eq 'vcFlowId'){
   push(@values, "'" . $flow_id . "'");
  }
  else{
   push(@values, "'". &Common_sub::escape_sql($value) . "'");
  }
 }
 
 my $text_values = '(' . join(',', @values) . ')';
 
 return($text_values);
}
