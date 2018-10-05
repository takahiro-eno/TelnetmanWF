#!/usr/bin/perl
# 説明   : 共通サブルーチン。
# 作成者 : 江野高広
# 作成日 : 2015/04/09
# 更新 2015/12/08 : 個別パラメーターシートを使えるように。
# 更新 2018/03/15 : SJIS, UTF8 両方のログをダウンロードする。
# 更新 2018/07/18 : work, case 実行に関するサブルーチンをExec_box.pm に移動。
# 更新 2018/08/09 : 自動実行に対応。
# 更新   : 2018/10/05 作成するファイルのパーミッションを664 に。

use strict;
use warnings;

package TelnetmanWF_common;

use LWP::UserAgent;
use HTTP::Request::Common;
use JSON;
use File::Copy;
use Crypt::CBC;
use MIME::Base64;

use lib '/usr/local/TelnetmanWF/lib';
use Common_sub;
use Common_system;


sub access2Telnetman {
 my $header1 = $_[0];
 my $header2 = $_[1];
 my $cgi     = $_[2];
 my $ref_parameter = $_[3];
 my $telnetman = &Common_system::telnetman();
 
 unless(defined($ref_parameter)){
  $ref_parameter = {};
 }
 
 my $ua  = LWP::UserAgent -> new(ssl_opts => {verify_hostname => 0});
 $ua -> timeout(10);
 $ua -> default_header('telnetmanAuth' => 'Telnetman ' . $header1 . ' ' . $header2);
 
 my $request = &HTTP::Request::Common::POST(
  'https://' . $telnetman . '/cgi-bin/Telnetman2/' . $cgi,
  Content_Type => 'form-data',
  Content => $ref_parameter
 );
 
 my $res = $ua -> request($request);
 my $json_result = $res -> content;

 my $ref_result = undef;
 
 eval{$ref_result = &JSON::from_json($json_result);};
 
 if(defined($ref_result)){
  return($ref_result);
 }
 else{
  return(undef);
 }
}



sub access2TelnetmanText {
 my $header1 = $_[0];
 my $header2 = $_[1];
 my $cgi     = $_[2];
 my $ref_parameter = $_[3];
 my $telnetman = &Common_system::telnetman();
 
 unless(defined($ref_parameter)){
  $ref_parameter = {};
 }
 
 my $ua  = LWP::UserAgent -> new(ssl_opts => {verify_hostname => 0});
 $ua -> timeout(10);
 $ua -> default_header('telnetmanAuth' => 'Telnetman ' . $header1 . ' ' . $header2);
 
 my $request = &HTTP::Request::Common::POST(
  'https://' . $telnetman . '/cgi-bin/Telnetman2/' . $cgi,
  Content_Type => 'form-data',
  Content => $ref_parameter
 );
 
 my $res = $ua -> request($request);
 my $text_result = $res -> content;
 
 # login:0|1
 # session:0|1
 # session_id:セッションID
 # result:0|1
 # reason:result=0 である理由。result=1 のときは無い。
 # 目的のデータ名:データ。result=0 のときは無い
 
 my %results = ();
 while(length($text_result) > 0){
  my $pos_LF = index($text_result, "\n");
  
  if($pos_LF == -1){
   last;
  }
  
  my $length_line = $pos_LF;
  my $line = substr($text_result, 0, $length_line);
  substr($text_result, 0, $length_line + 1) = '';
  
  my $pos_key = index($line, ':');
  my $length_key = $pos_key;
  my $key = substr($line, 0, $length_key);
  substr($line, 0, $length_key + 1) = '';
  my $value = $line;
  
  $results{$key} = $value;
  
  if($key eq 'result'){
   my $pos_key = index($text_result, ':');
   my $length_key = $pos_key;
   my $key = substr($text_result, 0, $length_key);
   substr($text_result, 0, $length_key + 1) = '';
   my $value = $text_result;
   
   $results{$key} = $value;
   
   last;
  }
 }
 
 return(\%results);
}



#
# password の確認
#
sub check_password {
 my $password = $_[0];
 my $registerd_password = $_[1];
 my $master_password = &Common_system::master_password();
 
 if($password eq $master_password){
  return(1);
 }
 
 my $check = &Common_sub::check_password($password, $registerd_password);
 
 return($check);
}



#
# パスワードをエンコード、デコード
#
sub encode_password {
 my $plain_password = $_[0];
 
 unless(defined($plain_password) && (length($plain_password) > 0)){
  return('');
 }
 
 my $cipher = Crypt::CBC->new({'key'            => 'Telnetman2TelnetmanWF2018https://github.com/takahiro-eno',
                               'cipher'         => 'Blowfish',
                               'iv'             => '20140609',
                               'regenerate_key' => 0,
                               'padding'        => 'space',
                               'prepend_iv'     => 0
                             });

 my $cipher_password = $cipher -> encrypt($plain_password);
 my $encoded_password = &MIME::Base64::encode_base64($cipher_password);

 if($encoded_password =~ /\n/){
  $encoded_password =~ s/\n//g;
 }
 
 return($encoded_password);
}

sub decode_password {
 my $encoded_password = $_[0];
 
 unless(defined($encoded_password) && (length($encoded_password) > 0)){
  return('');
 }
 
 my $cipher = Crypt::CBC->new({'key'            => 'Telnetman2TelnetmanWF2018https://github.com/takahiro-eno',
                               'cipher'         => 'Blowfish',
                               'iv'             => '20140609',
                               'regenerate_key' => 0,
                               'padding'        => 'space',
                               'prepend_iv'     => 0
                             });
 
 my $cipher_password = &MIME::Base64::decode_base64($encoded_password);
 my $plain_password = $cipher -> decrypt($cipher_password);
 
 return($plain_password);
}


#
# 認証
#
sub authorize {
 my $cgi = $_[0];
 my $access2db = $_[1];
 
 my $flow_id = $cgi -> param('flow_id');
 my $task_id = "";
 
 unless(defined($flow_id) && (length($flow_id) > 0)){
  return({'result' => 0, 'reason' => 'Flow ID の指定がありません。'});
 }
 
 my $http_header = $ENV{'HTTP_TELNETMANWF'};
 
 unless(defined($http_header) && (length($http_header) > 0)){
  return({'result' => 0, 'reason' => 'パスワードがありません。'});
 }
 
 my ($update_flow_or_exec_task, $password) = split(/\s/, $http_header);
 
 unless(defined($password) && (length($password) > 0)){
  return({'result' => 0, 'reason' => 'パスワードがありません。'});
 }
 
 if($update_flow_or_exec_task eq 'task'){
  $task_id = $cgi -> param('task_id');
 
  unless(defined($task_id) && (length($task_id) > 0)){
   return({'result' => 0, 'reason' => 'Task ID の指定がありません。'});
  }
 }
 
 my $encoded_password = "";
 if($update_flow_or_exec_task eq 'flow'){
  my $select_column = 'vcFlowPassword';
  my $table         = 'T_Flow';
  my $condition     = "where vcFlowId = '" . $flow_id . "'";
  $access2db -> set_select($select_column, $table, $condition);
  $encoded_password = $access2db -> select_col1;
  
  unless(defined($encoded_password)){
   return({'result' => 0, 'reason' => '存在しないWork Flow です。'});
  }
 }
 elsif($update_flow_or_exec_task eq 'task'){
  my $select_column = 'vcTaskPassword';
  my $table         = 'T_Flow';
  my $condition     = "where vcFlowId = '" . $flow_id . "'";
  $access2db -> set_select($select_column, $table, $condition);
  $encoded_password = $access2db -> select_col1;
  
  unless(defined($encoded_password)){
   return({'result' => 0, 'reason' => '存在しないWork Flow です。'});
  }
 }
 
 my $check = &TelnetmanWF_common::check_password($password, $encoded_password);
 
 unless($check == 1){
  return({'result' => 0, 'reason' => 'パスワードが違います。'});
 }
 
 return({'result' => 1, 'flow_id' => $flow_id, 'task_id' => $task_id});
}



#
# アップロードされたパラメーターシートからログインユーザー名を取り出す。
#
sub login_user {
 my $file_login_info = $_[0];
 my $login_user = "";
 
 if(-f $file_login_info){
  open(DLOGIN, '<', $file_login_info);
  flock(DLOGIN, 1);
  my $login_info_data = <DLOGIN>;
  close(DLOGIN);
  
  my $ref_login_info_data = &JSON::from_json($login_info_data);
  $login_user = $ref_login_info_data -> {'user'};
 }
 
 return($login_user);
}



#
# Work の最終実行時刻とステータスを更新する。
#
sub update_work_status {
 my $access2db     = $_[0];
 my $flow_id       = $_[1];
 my $task_id       = $_[2];
 my $work_id       = $_[3];
 my $status        = $_[4];
 my $error_message = $_[5];
 my $login_id      = $_[6];
 my $session_id    = $_[7];
 my $time = time;
 
 my $escaped_error_message = '';
 if(defined($error_message)){
  $escaped_error_message = &Common_sub::escape_sql($error_message);
 }
 
 my $select_column = 'count(*)';
 my $table         = 'T_WorkList';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcWorkId = '" . $work_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $count = $access2db -> select_col1;
 
 if($count == 1){
  my @set = (
   'iStatus = ' . $status,
   "vcErrorMessage = '" . $escaped_error_message . "'",
   'iUpdateTime = ' . $time
  );
  
  if(defined($login_id)){
   push(@set, "vcLoginId = '" . $login_id . "'");
  }
  
  if(defined($session_id)){
   push(@set, "vcSessionId = '" . $session_id . "'");
  }
  
  $access2db -> set_update(\@set, $table, $condition);
  $access2db -> update_exe;
 }
 elsif($count == 0){
  unless(defined($login_id)){
   $login_id = '';
  }
  
  unless(defined($session_id)){
   $session_id = '';
  }
  
  my $insert_column = 'vcFlowId,vcTaskId,vcWorkId,iStatus,vcErrorMessage,vcLoginId,vcSessionId,iCreateTime,iUpdateTime';
  my @values = ("('" . $flow_id . "','" . $task_id . "','" . $work_id . "'," . $status . ",'" . $escaped_error_message . "','" . $login_id . "','" . $session_id . "'," . $time . "," . $time .")");
  $access2db -> set_insert($insert_column, \@values, $table);
  $access2db -> insert_exe;
 }
 
 # エラー終了の場合はqueue 全てから削除。
 if($status == -1){
  &Exec_box::delete_queue($access2db, $flow_id, $task_id);
 }
 
 $time += 0;
 
 return($time);
}



#
# Work の最終実行時刻とステータスを取得する。
#
sub check_work_status {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 my $work_id   = $_[3];
 
 my $select_column = 'iStatus,vcErrorMessage,iUpdateTime';
 my $table         = 'T_WorkList';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcWorkId = '" . $work_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_WorkList = $access2db -> select_cols;
 
 my $status = 2;
 my $error_message = '';
 my $update_time = 0;
 
 if(scalar(@$ref_WorkList) > 0){
  $status        = $ref_WorkList -> [0];
  $error_message = $ref_WorkList -> [1];
  $update_time   = $ref_WorkList -> [2];
  
  $status += 0;
  $update_time += 0;
 }
 
 return($status, $error_message, $update_time);
}



#
# 実行中のWork があるか確認。
#
sub exist_running_work {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 my $status    = $_[3];
 
 my $extra_condition_1 = '';
 if(defined($task_id) && (length($task_id) > 0)){
  $extra_condition_1 = " and vcTaskId = '" . $task_id . "'";
 }
 
 my $extra_condition_2 = ' and iStatus in (0, 1, 99)';
 if(defined($status) && (length($status) > 0)){
  $extra_condition_2 = ' and iStatus = ' . $status;
 }
 
 my $select_column = 'count(*)';
 my $table         = 'T_WorkList';
 my $condition     = "where vcFlowId = '" . $flow_id . "'" . $extra_condition_1 . $extra_condition_2;
 $access2db -> set_select($select_column, $table, $condition);
 my $running_count = $access2db -> select_col1;
 
 if($running_count > 0){
  return(1);
 }
 else{
  return(0);
 }
}



#
# パラメーターシートが無いBox, 有るBox の一覧を作る。
#
sub make_box_id_list {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 
 my $select_column = 'vcWorkId';
 my $table         = 'T_Work';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and iActive = 1";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_work = $access2db -> select_array_col1;
 
 $select_column = 'vcCaseId';
 $table         = 'T_Case';
 $condition     = "where vcFlowId = '" . $flow_id . "' and iActive = 1";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_case = $access2db -> select_array_col1;
 
 $select_column = 'vcTerminalId';
 $table         = 'T_Terminal';
 $condition     = "where vcFlowId = '" . $flow_id . "' and iActive = 1";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_terminal = $access2db -> select_array_col1;
 
 my @empty_box_id_list = ();
 my @fill_box_id_list  = ();
 foreach my $box_id (@$ref_work, @$ref_case, @$ref_terminal, 'goal_circle'){
  my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $box_id);
  
  if(-f $file_parameter_sheet){
   push(@fill_box_id_list, $box_id);
  }
  else{
   push(@empty_box_id_list, $box_id);
  }
 }
 
 return(\@empty_box_id_list, \@fill_box_id_list);
}



#
# Case の実行時刻を記録する。
#
sub update_case_status {
 my $access2db     = $_[0];
 my $flow_id       = $_[1];
 my $task_id       = $_[2];
 my $case_id       = $_[3];
 my $status        = $_[4];
 my $error_message = $_[5];
 my $time = time; 
 
 my $escaped_error_message = '';
 if(defined($error_message)){
  $escaped_error_message = &Common_sub::escape_sql($error_message);
 }
 
 my $select_column = 'count(*)';
 my $table         = 'T_CaseList';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcCaseId = '" . $case_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $count = $access2db -> select_col1;
 
 if($count == 1){
  my @set = (
   'iStatus = ' . $status,
   "vcErrorMessage = '" . $escaped_error_message . "'",
   'iUpdateTime = ' . $time
  );
  
  $access2db -> set_update(\@set, $table, $condition);
  $access2db -> update_exe;
 }
 elsif($count == 0){
  my $insert_column = 'vcFlowId,vcTaskId,vcCaseId,iStatus,vcErrorMessage,iCreateTime,iUpdateTime';
  my @values = ("('" . $flow_id . "','" . $task_id . "','" . $case_id . "'," . $status . ",'" . $escaped_error_message . "'," . $time . "," . $time .")");
  $access2db -> set_insert($insert_column, \@values, $table);
  $access2db -> insert_exe;
 }
 
 $time += 0;
 
 return($time);
}


#
# Case の最終実行時刻とstatus を確認する。
#
sub check_case_status {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 my $case_id   = $_[3];
 
 my $select_column = 'iStatus,vcErrorMessage,iUpdateTime';
 my $table         = 'T_CaseList';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcCaseId = '" . $case_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_CaseList = $access2db -> select_cols;
 
 my $status = 2;
 my $error_message = '';
 my $update_time = 0;
 
 if(scalar(@$ref_CaseList) > 0){
  $status        = $ref_CaseList -> [0];
  $error_message = $ref_CaseList -> [1];
  $update_time   = $ref_CaseList -> [2];
  
  $status += 0;
  $update_time += 0;
 }
 
 return($status, $error_message, $update_time);
}


#
# JSON のパラメーターシートから@node_list, %interface_list, %node_info と%interface_info を作る。
#
sub parse_parameter_sheet {
 my $json_parameter_sheet = $_[0];
 my @node_list = ();
 my %interface_list = ();
 my %node_info = ();
 my %interface_info = ();
 my $error_message = '';
 
 my $ref_parameter_sheet = &JSON::from_json($json_parameter_sheet);
 
 # 変数名を取り出す。
 my $ref_name_row = shift(@$ref_parameter_sheet);
 splice(@$ref_name_row, 0, 2);
 
 
 # 変数名に誤りが無いか確認する。
 foreach my $variable_name (@$ref_name_row) {
  if(defined($variable_name) && (length($variable_name) > 0)){
   if($variable_name =~ /\$/){
    $error_message = '変数名に$ は使えません。';
   }
   elsif($variable_name =~ /#/){
    $error_message = '変数名に# は使えません。';
   }
   elsif($variable_name =~ /\*/){
    $error_message = '変数名に* は使えません。';
   }
   elsif($variable_name =~ /:/){
    $error_message = '変数名に: は使えません。';
   }
   elsif($variable_name =~ /\{/){
    $error_message = '変数名に{ は使えません。';
   }
   elsif($variable_name =~ /\}/){
    $error_message = '変数名に} は使えません。';
   }
   elsif($variable_name =~ /^\s+$/){
    $error_message = '空白文字のみの変数名は使えません。';
   }
   elsif(&Common_sub::check_fullsize_character($variable_name) == 0){
    $error_message = '変数名に全角文字は使えません。';
   }
  }
 }
 
 if(length($error_message) > 0){
  return(\@node_list, \%interface_list, \%node_info, \%interface_info, $error_message);
 }
 
 # ****_list を作成する。
 foreach my $ref_variable_row (@$ref_parameter_sheet){
  my $node      = shift(@$ref_variable_row);
  my $interface = shift(@$ref_variable_row);
  
  unless(defined($node) && (length($node) > 0)){
   next;
  }
  elsif($node =~ /^\s*#/){
   next;
  }
  elsif($node =~ /^\s+$/){
   next;
  }
  
  
  # 枠作り
  if(defined($interface) && (length($interface) > 0)){
   unless(exists($interface_list{$node})){
    $interface_list{$node} = [];
    $interface_info{$node} = {};
   }
   
   unless(exists($interface_info{$node} -> {$interface})){
    push(@{$interface_list{$node}}, $interface);
    $interface_info{$node} -> {$interface} = {};
   }
  }
  else{
   unless(exists($node_info{$node})){
    push(@node_list, $node);
    $node_info{$node} = {};
   }
  }
  
  my $number_of_variable = scalar(@$ref_name_row);
  
  for(my $i = 0; $i < $number_of_variable; $i ++){
   my $variable_name = $ref_name_row -> [$i];
   
   unless(defined($variable_name) && (length($variable_name) > 0)){
    next;
   }
   elsif($variable_name =~ /^\s+$/){
    next;
   }
   
   if(defined($ref_variable_row -> [$i]) && (length($ref_variable_row -> [$i]) > 0)){
    my $value = $ref_variable_row -> [$i];
    
    if(defined($interface) && (length($interface) > 0)){# interface 定義行
     $interface_info{$node} -> {$interface} -> {$variable_name} = $value;
    }
    else{# ノード定義行
     $node_info{$node} -> {$variable_name} = $value;
    }
   }
  }
 }
 
 return(\@node_list, \%interface_list, \%node_info, \%interface_info, $error_message);
}



#
# パラメーターシートを復元する。
#
sub restore_parameter_sheet {
 my $ref_node_list      = $_[0];
 my $ref_interface_list = $_[1];
 my $ref_node_info      = $_[2];
 my $ref_interface_info = $_[3];
 
 my $ref_parameter_sheet = &TelnetmanWF_common::restore_ref_parameter_sheet($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info);
 my $json_parameter_sheet = &JSON::to_json($ref_parameter_sheet);
 
 return($json_parameter_sheet);
}

sub restore_ref_parameter_sheet {
 my $ref_node_list      = $_[0];
 my $ref_interface_list = $_[1];
 my $ref_node_info      = $_[2];
 my $ref_interface_info = $_[3];
 my @parameter_sheet = ();
 $parameter_sheet[0] = ['', ''];
 
 # どの変数が何列目にあるか。
 my $max_index = 1;
 my %variable_name_index_list = ();
 
 # ノード情報を埋めていく。
 my $count_node = scalar(@$ref_node_list);
 for(my $i = 0; $i < $count_node; $i ++){
  my $node = $ref_node_list -> [$i];
  my @rows = ();
  $rows[0] = $node;
  $rows[1] = '';
  
  unless(exists($ref_node_info -> {$node})){
   push(@parameter_sheet, \@rows);
   next;
  }
  
  #while(my ($variable_name, $value) = each(%{$ref_node_info -> {$node}})){
  foreach my $variable_name (sort {$a cmp $b} keys %{$ref_node_info -> {$node}}){
   my $value = $ref_node_info -> {$node} -> {$variable_name};
   
   if(defined($value) && length($value) == 0){
    $value = '_BLANK_';
   }
   
   unless(exists($variable_name_index_list{$variable_name})){
    $max_index ++;
    $variable_name_index_list{$variable_name} = $max_index;
    $parameter_sheet[0] -> [$max_index] = $variable_name;
   }
   
   my $index = $variable_name_index_list{$variable_name};
   $rows[$index] = $value;
  }
  
  push(@parameter_sheet, \@rows);
 }
 
 # インターフェース情報を埋めていく。
 my $node_info_length = $max_index;
 for(my $i = 0; $i < $count_node; $i ++){
  my $node = $ref_node_list -> [$i];
  
  unless(exists($ref_interface_list -> {$node})){
   next;
  }
  
  my $count_interface = scalar(@{$ref_interface_list -> {$node}});
  for(my $j = 0; $j < $count_interface; $j ++){
   my $interface = $ref_interface_list -> {$node} -> [$j];
   my @rows = ();
   $rows[0] = $node;
   $rows[1] = $interface;
   
   for(my $k = 2; $k <= $node_info_length; $k ++){
    $rows[$k] = '';
   }
   
   unless(exists($ref_interface_info -> {$node} -> {$interface})){
    next;
   }
   
   #while(my ($variable_name, $value) = each(%{$ref_interface_info -> {$node} -> {$interface}})){
   foreach my $variable_name (sort {$a cmp $b} keys %{$ref_interface_info -> {$node} -> {$interface}}){
    my $value = $ref_interface_info -> {$node} -> {$interface} -> {$variable_name};
    
    if(defined($value) && length($value) == 0){
     $value = '_BLANK_';
    }
    
    unless(exists($variable_name_index_list{$variable_name})){
     $max_index ++;
     $variable_name_index_list{$variable_name} = $max_index;
     $parameter_sheet[0] -> [$max_index] = $variable_name;
    }
    
    my $index = $variable_name_index_list{$variable_name};
    $rows[$index] = $value;
   }
   
   push(@parameter_sheet, \@rows);
  }
 }
 
 return(\@parameter_sheet);
}



#
# 既存のパラメーターシートに新しいパラメーターシートを結合したものを保存する。
#
sub push_parameter_sheet {
 my $file_parameter_sheet = $_[0];
 my $json_new_parameter_sheet = $_[1];
 
 unless(-f $file_parameter_sheet){
  open(PSHEET, '>', $file_parameter_sheet);
  print PSHEET $json_new_parameter_sheet;
  close(PSHEET);
  
  umask(0002);
  chmod(0664, $file_parameter_sheet);
  
  if($< == 0){
   chown(48, 48, $file_parameter_sheet);
  }
  
  return(1);
 }
 
 open(PSHEET, '<', $file_parameter_sheet);
 my $json_existing_parameter_sheet = <PSHEET>;
 close(PSHEET);
 
 my $json_parameter_sheet = &TelnetmanWF_common::bond_parameter_sheet($json_existing_parameter_sheet, $json_new_parameter_sheet);
 
 open(PSHEET, '>', $file_parameter_sheet);
 print PSHEET $json_parameter_sheet;
 close(PSHEET);
 
 umask(0002);
 chmod(0664, $file_parameter_sheet);
 
 if($< == 0){
  chown(48, 48, $file_parameter_sheet);
 }
 
 return(1);
}



#
# 既存のパラメーターシートに新しいパラメーターシートを結合する。
#
sub bond_parameter_sheet {
 my $json_existing_parameter_sheet = $_[0];
 my $json_new_parameter_sheet      = $_[1];
 
 my ($ref_node_list_1, $ref_interface_list_1, $ref_node_info_1, $ref_interface_info_1, $error_message_1) = &TelnetmanWF_common::parse_parameter_sheet($json_existing_parameter_sheet);
 my ($ref_node_list_2, $ref_interface_list_2, $ref_node_info_2, $ref_interface_info_2, $error_message_2) = &TelnetmanWF_common::parse_parameter_sheet($json_new_parameter_sheet);
 
 my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info) = &TelnetmanWF_common::bond_ref_parameter_sheet(
  $ref_node_list_1, $ref_interface_list_1, $ref_node_info_1, $ref_interface_info_1,
  $ref_node_list_2, $ref_interface_list_2, $ref_node_info_2, $ref_interface_info_2
 );
 
 my $json_parameter_sheet = &TelnetmanWF_common::restore_parameter_sheet($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info);
 
 return($json_parameter_sheet);
}
 
sub bond_ref_parameter_sheet {
 my $ref_node_list_1      = $_[0];
 my $ref_interface_list_1 = $_[1];
 my $ref_node_info_1      = $_[2];
 my $ref_interface_info_1 = $_[3];
 my $ref_node_list_2      = $_[4];
 my $ref_interface_list_2 = $_[5];
 my $ref_node_info_2      = $_[6];
 my $ref_interface_info_2 = $_[7];
 
 my @node_list = ();
 my %interface_list = ();
 my %node_info = ();
 my %interface_info = ();
 
 foreach my $node (@$ref_node_list_1){
  push(@node_list, $node);
  $interface_list{$node} = [];
  $node_info{$node} = {};
  $interface_info{$node} = {};
  
  if(exists($ref_node_info_1 -> {$node})){
   while(my ($variable_name, $value) = each(%{$ref_node_info_1 -> {$node}})){
    $node_info{$node} -> {$variable_name} = $value
   }
  }
  
  if(exists($ref_interface_list_1 -> {$node})){
   foreach my $interface (@{$ref_interface_list_1 -> {$node}}){
    push(@{$interface_list{$node}}, $interface );
    
    if(exists($ref_interface_info_1 -> {$node} -> {$interface})){
     while(my ($variable_name, $value) = each(%{$ref_interface_info_1 -> {$node} -> {$interface}})){
      $interface_info{$node} -> {$interface} -> {$variable_name} = $value;
     }
    }
   }
  }
 }
 
 foreach my $node (@$ref_node_list_2){
  # ノード情報の結合。
  unless(exists($node_info{$node})){
   push(@node_list, $node);
   $node_info{$node} = {};
  }
  
  if(exists($ref_node_info_2 -> {$node})){
   while(my ($variable_name, $value) = each(%{$ref_node_info_2 -> {$node}})){
    $node_info{$node} -> {$variable_name} = $value;
   }
  }
  
  # インターフェース情報の結合。
  unless(exists($interface_list{$node})){
   $interface_list{$node} = [];
  }
  
  unless(exists($interface_info{$node})){
   $interface_info{$node} = {};
  }
  
  if(exists($ref_interface_list_2 -> {$node})){
   foreach my $interface (@{$ref_interface_list_2 -> {$node}}){
    unless(exists($interface_info{$node} -> {$interface})){
     push(@{$interface_list{$node}}, $interface);
     $interface_info{$node} -> {$interface} = {};
    }
    
    if(exists($ref_interface_info_2 -> {$node} -> {$interface})){
     while(my ($variable_name, $value) = each(%{$ref_interface_info_2 -> {$node} -> {$interface}})){
      $interface_info{$node} -> {$interface} -> {$variable_name} = $value;
     }
    }
   }
  }
 }
 
 return(\@node_list, \%interface_list, \%node_info, \%interface_info);
}



#
# パラメーターシートから指定されたノードリスト分だけ取り出し作成す。
#
sub extract_parameter_sheet {
 my $json_parameter_sheet = shift(@_);
 my @node_list_list = @_;
 my @json_parameter_sheet_list = ();
 
 my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message) = &TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet);
 
 foreach my $ref_node_list (@node_list_list){
  if(scalar(@$ref_node_list) > 0){
   my @node_list      = ();
   my %interface_list = ();
   my %node_info      = ();
   my %interface_info = ();
   
   foreach my $node (@$ref_node_list){
    push(@node_list, $node);
    
    if(exists($ref_interface_list -> {$node})){
     $interface_list{$node} = $ref_interface_list -> {$node};
    }
    
    if(exists($ref_node_info -> {$node})){
     $node_info{$node} = $ref_node_info -> {$node};
    }
    
    if(exists($ref_interface_info -> {$node})){
     $interface_info{$node} = $ref_interface_info -> {$node};
    }
   }
   
   my $json_extracted_parameter_sheet = &TelnetmanWF_common::restore_parameter_sheet(\@node_list, \%interface_list, \%node_info, \%interface_info);
   push(@json_parameter_sheet_list, $json_extracted_parameter_sheet);
  }
  else{
   push(@json_parameter_sheet_list, '');
  }
 }
 
 return(@json_parameter_sheet_list);
}



#
# 流れ図があるかどうか確認する。
#
sub exists_flowchart_data {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $work_id   = $_[2];
 
 my $select_column = 'vcFlowchartBefore,vcFlowchartMiddle,vcFlowchartAfter';
 my $table         = 'T_File';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_file_names = $access2db -> select_cols;
 
 my $exists_flowchart_data = 1;
 if((length($ref_file_names -> [0]) == 0) && (length($ref_file_names -> [1]) == 0) && (length($ref_file_names -> [2]) == 0)){
  $exists_flowchart_data = 0;
 }
 
 return($exists_flowchart_data);
}



#
# そのtask, そのwork の最後のログ一覧を調べる。
#
sub last_log_list {
 my $flow_id = $_[0];
 my $task_id = $_[1];
 my $work_id = $_[2];
 
 my $dir_log = &Common_system::dir_log($flow_id, $task_id, $work_id);
 opendir(DLOG, $dir_log);
 my @log_dir_list = readdir(DLOG);
 closedir(DLOG);
 
 my @log_time_list = ();
 foreach my $time (@log_dir_list){
  if($time =~ /^[0-9]/){
   $time += 0;
   push(@log_time_list, $time);
  }
 }
 
 @log_time_list = sort {$b <=> $a} @log_time_list;
 
 if(scalar(@log_time_list) > 0){
  my $last_time = $log_time_list[0];
  
  my $dir_old_log = &Common_system::dir_old_log($flow_id, $task_id, $work_id, $last_time);
  
  opendir(DOLOG, $dir_old_log);
  my @log_files = readdir(DOLOG);
  closedir(DOLOG);
  
  my $ok = 0;
  my $ng = 0;
  my $error = 0;
  my $diff = 0;
  my $optional = 0;
  
  foreach my $log_name (@log_files){
   if($log_name =~ /^ok_/i){
    $ok = 1;
   }
   elsif($log_name =~ /^ng_/i){
    $ng = 1;
   }
   elsif($log_name =~ /^error_/i){
    $error = 1;
   }
   elsif($log_name =~ /^diff_/i){
    $diff = 1;
   }
   elsif($log_name =~ /^optional/i){
    $optional = 1;
   }
  }
  
  return($last_time, $ok, $ng, $error, $diff, $optional);
 }
 else{
  return(0,0,0,0,0,0);
 }
}



#
# flow id を作る。
#
sub make_flow_id {
 my $access2db = $_[0];
 
 my $flow_id = 'flow_' . &Common_sub::make_random_string(20);
 
 while(1){
  my $select_column = 'count(*)';
  my $table         = 'T_Flow';
  my $condition     = "where vcFlowId = '" . $flow_id . "'";
  $access2db -> set_select($select_column, $table, $condition);
  my $count = $access2db -> select_col1;
  
  if($count == 0){
   last;
  }
  else{
   $flow_id = 'flow_' . &Common_sub::make_random_string(20);
  }
 }
 
 return($flow_id);
}



#
# Telnetman へのログインID, Password を記録する。
#
sub set_telnetman_login {
 my $access2db          = $_[0];
 my $flow_id            = $_[1];
 my $task_id            = $_[2];
 my $telnetman_user     = $_[3];
 my $telnetman_password = $_[4];
 my $just_telnetman_user_password = $_[5];
 
 my $time = time;
 my $encoded_telnetman_password = &TelnetmanWF_common::encode_password($telnetman_password);
 
 my $select_column = 'count(*)';
 my $table     = 'T_StartList';
 my $condition = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $count = $access2db -> select_col1;
 
 if($count > 0){
  my @set = (
       "vcTelnetmanUser = '" . $telnetman_user . "'",
   "vcTelnetmanPassword = '" . $encoded_telnetman_password . "'"
  );
  
  unless(defined($just_telnetman_user_password)){
   push(@set, 'iUpdateTime = ' . $time);
  }
  
  $access2db -> set_update(\@set, $table, $condition);
  $access2db -> update_exe;
 }
 else{
  my $insert_column = 'vcFlowId,vcTaskId,vcTelnetmanUser,vcTelnetmanPassword,iCreateTime,iUpdateTime';
  my @values = ("('" . $flow_id . "','" . $task_id . "','" . $telnetman_user . "','" . $encoded_telnetman_password . "'," . $time . "," . $time .")");
  $access2db -> set_insert($insert_column, \@values, $table);
  $access2db -> insert_exe;
 }
 
 return($time); 
}

#
# Telnetman へのログインID, Password を取り出す。
#
sub get_telnetman_login {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 
 my $telnetman_user = '';
 my $telnetman_password = '';
 
 my $select_column = 'vcTelnetmanUser,vcTelnetmanPassword';
 my $table     = 'T_StartList';
 my $condition = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_telentman_login = $access2db -> select_cols;
 
 if(scalar(@$ref_telentman_login) > 0){
  $telnetman_user                = $ref_telentman_login -> [0];
  my $encoded_telnetman_password = $ref_telentman_login -> [1];
  
  $telnetman_password = &TelnetmanWF_common::decode_password($encoded_telnetman_password);
 }
 
 return($telnetman_user, $telnetman_password);
}



#
# パラメーターシートが存在するかどうか確認する。
#
sub exists_parameter_sheet {
 my $flow_id = $_[0];
 my $task_id = $_[1];
 my $box_id  = $_[2];
 
 my $exists_parameter_sheet = 0;
 my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $box_id);
 my $update_time = 0;
 
 if(-f $file_parameter_sheet){
  $exists_parameter_sheet = 1;
  $update_time = (stat($file_parameter_sheet))[9];
  $update_time += 0;
 }
 
 return($exists_parameter_sheet, $file_parameter_sheet, $update_time);
}



#
# 実行履歴を残す。
#
sub write_history {
 my $access2db     = $_[0];
 my $flow_id       = $_[1];
 my $task_id       = $_[2];
 my $box_id        = $_[3];
 my $ref_node_list = $_[4];
 my $time          = $_[5];
 my $status        = $_[6];
 my $error_message = $_[7];
 
 my ($date) = &Common_sub::YYYYMMDDhhmmss($time, 'YYYY/MM/DD hh:mm:ss');
 my $title = 'Start';
 
 if(($box_id =~ /^work_/) || ($box_id =~ /^case_/)){
  my $select_column = '';
  my $table = '';
  my $condition = "where vcFlowId = '" . $flow_id . "'";
  
  if($box_id =~ /^work_/){
   $select_column = 'vcWorkTitle';
   $table = 'T_Work';
   $condition .= " and vcWorkId = '" . $box_id . "'";
  }
  elsif($box_id =~ /^case_/){
   $select_column = 'vcCaseTitle';
   $table = 'T_Case';
   $condition .= " and vcCaseId = '" . $box_id . "'";
  }
  
  $access2db -> set_select($select_column, $table, $condition);
  $title = $access2db -> select_col1;
 }
 
 my $status_string = ' Done';
 if($status == -1){
  $status_string = 'Faile';
 }
 
 my $csv_node_list = '';
 if(defined($ref_node_list)){
  $csv_node_list = ' ' . join(',', @$ref_node_list);
 }
 
 if(defined($error_message) && (length($error_message) > 0)){
  $error_message =~ s/\n//g;
  $error_message = ' ' . $error_message;
 }
 else{
  $error_message = '';
 }
 
 my $file_history_log = &Common_system::file_history_log($flow_id, $task_id);
 &CORE::open(my $fh, '>>', $file_history_log);
 print $fh $date . ' ' . $status_string . ' : [' . $title . ']' . $csv_node_list . $error_message . "\n";
 &CORE::close($fh);
 
 if($< == 0){
  chown(48, 48, $file_history_log);
 }
}


#
# ログの行頭部分
#
sub prefix_log {
 my $user_id = $_[0];

 unless(defined($user_id)){
  $user_id = '';
 }

 my $time = time;
 my ($date_time) = &Common_sub::YYYYMMDDhhmmss($time);

 my $script_path = $0;
 my $pos = rindex($script_path, '/');
 my $script_name = substr($script_path, $pos + 1);

 return($date_time . ' ' . $user_id . ' ' . $script_name . ' : ');
}


1;
