#!/usr/bin/perl
# 説明   : work のデータを取得する。
# 作成者 : 江野高広
# 作成日 : 2015/05/12
# 更新   : 2015/12/08個別パラメーターシートを使えるように。
# 更新   : 2018/06/27 user, password を追加。
# 更新   : 2018/07/06 iExecOnlyOne に対応。
# 更新   : 2018/08/09  自動実行に対応。

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



my $work_id = $cgi -> param('work_id');



#
# work data を取り出す。
#
my $select_column = 'vcWorkTitle,vcWorkDescription,iExecOnlyOne,vcUser,vcPassword';
my $table         = 'T_Work';
my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $ref_work = $access2db -> select_cols;



#
# ステータスを確認
#
my ($status, $error_message, $update_time) = &TelnetmanWF_common::check_work_status($access2db, $flow_id, $task_id, $work_id);



#
# アップロードされたログイン情報があるかどうか確認する。
#
$select_column = 'vcLoginInfo';
$table         = 'T_File';
$condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
$access2db -> set_select($select_column, $table, $condition);
my $login_info = $access2db -> select_col1;



#
# 流れ図があるかどうか確認する。
#
my $exists_flowchart_data = &TelnetmanWF_common::exists_flowchart_data($access2db, $flow_id, $work_id);


$access2db -> close;



my $title          = $ref_work -> [0];
my $description    = $ref_work -> [1];
my $exec_only_one  = $ref_work -> [2];
my $login_user     = $ref_work -> [3];
my $login_password = $ref_work -> [4];

$exec_only_one += 0;



#
# パラメーターシートが存在するかどうか確認する。
#
my ($exists_parameter_sheet, $file_parameter_sheet) = (&TelnetmanWF_common::exists_parameter_sheet($flow_id, $task_id, $work_id))[0,1];



#
# 結果をまとめる。
#
my %results = (
 'result'                 => 1,
 'flow_id'                => $flow_id,
 'task_id'                => $task_id,
 'work_id'                => $work_id,
 'box_id'                 => $work_id,
 'title'                  => $title,
 'description'            => $description,
 'exec_only_one'          => $exec_only_one,
 'exists_flowchart_data'  => $exists_flowchart_data,
 'exists_parameter_sheet' => $exists_parameter_sheet,
 'login_user'             => $login_user,
 'login_password'         => $login_password,
 'status'                 => $status,
 'error_message'          => $error_message,
 'update_time'            => $update_time
);



#
# ログイン情報がアップロードされていてログインID が指定されていたら結果に混ぜる。
#
if(length($login_info) > 0){
 my $file_login_info = &Common_system::file_login_info($flow_id, $work_id);
 my $login_info_login_user = &TelnetmanWF_common::login_user($file_login_info);
 
 if(defined($login_info_login_user) && (length($login_info_login_user) > 0)){
  $results{'login_info_login_user'} = $login_info_login_user;
 }
}



#
# パラメーターシートがある場合はノードリストを作る。
#
if($exists_parameter_sheet == 1){
 open(PSHEET, '<', $file_parameter_sheet);
 my $json_parameter_sheet = <PSHEET>;
 close(PSHEET);
 
 my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message) = &TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet);
 $results{'node_list'} = $ref_node_list;
}
else{
 $results{'node_list'} = [];
}



#
# 流れ図データがある場合は過去ログ一覧も返す。
#
if($exists_flowchart_data == 1){
 my $dir_log = &Common_system::dir_log($flow_id, $task_id, $work_id);
 opendir(DLOG, $dir_log);
 my @log_dir_list = readdir(DLOG);
 closedir(DLOG);
 
 my @log_time_list = ();
 my %log_type_list = ();
 foreach my $time (@log_dir_list){
  if($time =~ /^[0-9]/){
   $log_type_list{$time} = {
    'ok' => 0,
    'ng' => 0,
    'error' => 0,
    'diff' => 0,
    'optional' => 0
   };
  
   my $dir_old_log = &Common_system::dir_old_log($flow_id, $task_id, $work_id, $time);
   
   opendir(DOLOG, $dir_old_log);
   my @log_files = readdir(DOLOG);
   closedir(DOLOG);
   
   foreach my $log_name (@log_files){
    if($log_name =~ /^ok_/i){
     $log_type_list{$time} -> {'ok'} = 1;
    }
    elsif($log_name =~ /^ng_/i){
     $log_type_list{$time} -> {'ng'} = 1;
    }
    elsif($log_name =~ /^error_/i){
     $log_type_list{$time} -> {'error'} = 1;
    }
    elsif($log_name =~ /^diff_/i){
     $log_type_list{$time} -> {'diff'} = 1;
    }
    elsif($log_name =~ /^optional/i){
     $log_type_list{$time} -> {'optional'} = 1;
    }
   }
   
   $time += 0;
   push(@log_time_list, $time);
  }
 }
 
 @log_time_list = sort {$b <=> $a} @log_time_list;
 
 $results{'log_time_list'} = \@log_time_list;
 $results{'log_type_list'} = \%log_type_list;
}


my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
