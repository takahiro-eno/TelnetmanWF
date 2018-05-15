#!/usr/bin/perl
# 説明   : 共通サブルーチン。
# 作成者 : 江野高広
# 作成日 : 2015/04/09
# 更新 2015/12/08 : 個別パラメーターシートを使えるように。
# 更新 2018/03/15 : SJIS, UTF8 両方のログをダウンロードする。

use strict;
use warnings;

package TelnetmanWF_common;

use LWP::UserAgent;
use HTTP::Request::Common;
use JSON;
use File::Copy;
use Archive::Zip;# sudo yum install perl-Archive-Zip

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
# 最終実行時刻とステータスを更新する。
#
sub update_status {
 my $access2db = $_[0];
 my $flow_id = $_[1];
 my $task_id = $_[2];
 my $box_id  = $_[3];
 my $status  = $_[4];
 my $login_id   = $_[5];
 my $session_id = $_[6];
 my $ref_target_id_list = $_[7];
 my $time = time;
 
 my $select_column = 'count(*)';
 my $table         = 'T_LastStatus';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcBoxId = '" . $box_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $count = $access2db -> select_col1;
 
 if($count == 1){
  my @set = (
   'iStatus = ' . $status,
   'iUpdateTime = ' . $time
  );
  
  if(defined($login_id)){
   push(@set, "vcLoginId = '" . $login_id . "'");
  }
  
  if(defined($session_id)){
   push(@set, "vcSessionId = '" . $session_id . "'");
  }
  
  if(defined($ref_target_id_list)){
   my $json_target_id_list = &JSON::to_json($ref_target_id_list);
   push(@set, "vcTargetIdList = '" . $json_target_id_list . "'");
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
  
  my $json_target_id_list = '[]';
  if(defined($ref_target_id_list)){
   $json_target_id_list = &JSON::to_json($ref_target_id_list);
  }
  
  my $insert_column = 'vcFlowId,vcTaskId,vcBoxId,iStatus,vcLoginId,vcSessionId,vcTargetIdList,iCreateAt,iUpdateTime';
  my @values = ("('" . $flow_id . "','" . $task_id . "','" . $box_id . "'," . $status . ",'" . $login_id . "','" . $session_id . "','" . $json_target_id_list . "'," . $time . "," . $time .")");
  $access2db -> set_insert($insert_column, \@values, $table);
  $access2db -> insert_exe;
 }
 
 $time += 0;
 
 return($time);
}



#
# 最終実行時刻とステータスを取得する。
#
sub check_status {
 my $access2db = $_[0];
 my $flow_id = $_[1];
 my $task_id = $_[2];
 my $box_id  = $_[3];
 
 my $select_column = 'iStatus,iUpdateTime,vcTargetIdList';
 my $table         = 'T_LastStatus';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcBoxId = '" . $box_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_status = $access2db -> select_cols;
 
 my $status = 0;
 my $update_time = 0;
 my $json_target_id_list = '[]';
 
 if(scalar(@$ref_status) > 0){
  $status      = $ref_status -> [0];
  $update_time = $ref_status -> [1];
  $json_target_id_list = $ref_status -> [2];
  
  $status += 0;
  $update_time += 0;
 }
 
 my $ref_target_id_list = &JSON::from_json($json_target_id_list);
 
 return($status, $update_time, $ref_target_id_list);
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
    
    #if(($value eq '_BLANK_') || ($value eq '_DUMMY_')){
    # $value = '';
    #}
    
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
# 既存のパラメーターシートに新しいパラメーターシートを結合したものを保存する。。
#
sub push_parameter_sheet {
 my $file_parameter_sheet = $_[0];
 my $json_new_parameter_sheet = $_[1];
 
 unless(-f $file_parameter_sheet){
  open(PSHEET, '>', $file_parameter_sheet);
  print PSHEET $json_new_parameter_sheet;
  close(PSHEET);
  
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
# telnet 終了後の処理
#
sub end_of_telnet {
 my $access2db           = $_[0];
 my $flow_id             = $_[1];
 my $task_id             = $_[2];
 my $work_id             = $_[3];
 my $login_id            = $_[4];
 my $session_id          = $_[5];
 my $ref_node_status     = $_[6];
 my $use_parameter_sheet = $_[7];# 個別パラメーターシートを使ったかどうか。
 my $time = time;
 my $this_process_ok_target_id = '';
 my $this_process_ng_target_id = '';
 
 # 過去ログ置き場の作成
 my $dir_old_log = &Common_system::dir_old_log($flow_id, $task_id, $work_id, $time);
 mkdir($dir_old_log, 0755);
 
 if($< == 0){
  chown(48, 48, $dir_old_log);
 }
 
 # 既存のパラメーターシートを読み取る。
 my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $work_id);
 open(PSHEET, '<', $file_parameter_sheet);
 my $json_existing_parameter_sheet = <PSHEET>;
 close(PSHEET);
 
 # 既存のパラメーターシートを過去ログ置き場に移動。
 my $file_old_parameter_sheet = &Common_system::file_old_parameter_sheet($flow_id, $task_id, $work_id, $time);
 &File::Copy::move($file_parameter_sheet, $file_old_parameter_sheet);
 
 # 個別パラメーターシートがあれば過去ログ置き場に移動。
 if($use_parameter_sheet == 1){
  my $file_parameter_sheet_individual = &Common_system::file_parameter_sheet_individual($flow_id, $task_id, $work_id);
  
  if(-f $file_parameter_sheet_individual){
   my $file_old_parameter_sheet_individual = &Common_system::file_old_parameter_sheet_individual($flow_id, $task_id, $work_id, $time);
   &File::Copy::move($file_parameter_sheet_individual, $file_old_parameter_sheet_individual);
  }
 }
 
 # 次の行き先とok log をパラメーターシートに加える必要があるかどうか確認する。 
 my $select_column = 'vcOkLinkTarget,vcNgLinkTarget,iBondParameterSheet';
 my $table         = 'T_Work';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_work = $access2db -> select_cols;
 
 my $json_ok_target = $ref_work -> [0];
 my $json_ng_target = $ref_work -> [1];
 my $bond = $ref_work -> [2];
 
 # 次の行き先のログ置き場を作る。
 my $ref_ok_target = &JSON::from_json($json_ok_target);
 my $ref_ng_target = &JSON::from_json($json_ng_target);
 my $ok_target_id = '';
 my $ng_target_id = '';
 if(exists($ref_ok_target -> {'id'}) && ($ref_ok_target -> {'id'} !~ /^start_/)){
  $ok_target_id = $ref_ok_target -> {'id'};
  
  my $dir_log_ok = &Common_system::dir_log($flow_id, $task_id, $ok_target_id);
  
  unless(-d $dir_log_ok){
   mkdir($dir_log_ok, 0755)
  }
  
  if($< == 0){
   chown(48, 48, $dir_log_ok);
  }
 }
 if(exists($ref_ng_target -> {'id'}) && ($ref_ng_target -> {'id'} !~ /^start_/)){
  $ng_target_id = $ref_ng_target -> {'id'};
  
  my $dir_log_ng = &Common_system::dir_log($flow_id, $task_id, $ng_target_id);
  
  unless(-d $dir_log_ng){
   mkdir($dir_log_ng, 0755)
  }
  
  if($< == 0){
   chown(48, 48, $dir_log_ng);
  }
 }
 
 # ログを取得する。
 my $flag_all_ng = 1;
 my $flag_all_ok = 1;
 while(my ($node, $node_status) = each(%$ref_node_status)){
  for(my $sjis = 0; $sjis <= 1; $sjis ++){
   my $sjis_file_name = '';
   if($sjis == 1){
    $sjis_file_name = '_sjis';
   }
   
   my $ref_log = &TelnetmanWF_common::access2TelnetmanText($login_id, $session_id, 'text_get_log.cgi', {'node' => $node, 'sjis' => $sjis});
   
   my $result = $ref_log -> {'result'};
   
   unless($result == 1){
    my $reason = $ref_log -> {'reason'};
    
    my $file_error_log = $dir_old_log . '/error_' . $node . $sjis_file_name . '.log';
    open(LOG, '>', $file_error_log);
    print LOG $reason;
    close(LOG);
    
    if($< == 0){
     chown(48, 48, $file_error_log);
    }
    
    next;
   }
   
   my $log = $ref_log -> {'log'};
   
   # 過去ログとして保存する。
   if($node_status == 4){
    $flag_all_ng = 0;
    
    my $file_ok_log = $dir_old_log . '/ok_' . $node . $sjis_file_name . '.log';
    open(LOG, '>', $file_ok_log);
    print LOG $log;
    close(LOG);
    
    if($< == 0){
     chown(48, 48, $file_ok_log);
    }
   }
   elsif($node_status == 5){
    $flag_all_ok = 0;
    
    my $file_ng_log = $dir_old_log . '/ng_' . $node . $sjis_file_name . '.log';
    open(LOG, '>', $file_ng_log);
    print LOG $log;
    close(LOG);
    
    if($< == 0){
     chown(48, 48, $file_ng_log);
    }
   }
   elsif($node_status == 6){
    $flag_all_ok = 0;
    
    my $file_ng_log = $dir_old_log . '/ng_force_continue_' . $node . $sjis_file_name . '.log';
    open(LOG, '>', $file_ng_log);
    print LOG $log;
    close(LOG);
    
    if($< == 0){
     chown(48, 48, $file_ng_log);
    }
   }
   elsif($node_status == 8){
    $flag_all_ok = 0;
    
    my $file_error_log = $dir_old_log . '/error_' . $node . $sjis_file_name . '.log';
    open(LOG, '>', $file_error_log);
    print LOG $log;
    close(LOG);
    
    if($< == 0){
     chown(48, 48, $file_error_log);
    }
   }
  
   # diff ログを取得する。
   my $ref_diff_log = &TelnetmanWF_common::access2TelnetmanText($login_id, $session_id, 'text_get_diff.cgi', {'node' => $node, 'sjis' => $sjis});
   
   if($ref_diff_log -> {'result'} == 1){
    my $diff_log = $ref_diff_log -> {'log'};
    
    my $file_diff_log = $dir_old_log . '/diff_' . $node . $sjis_file_name . '.log';
    open(LOG, '>', $file_diff_log);
    print LOG $diff_log;
    close(LOG);
    
    if($< == 0){
     chown(48, 48, $file_diff_log);
    }
   }
  }
  
  
  # パラメーターシートを結合する場合
  if($bond == 1){
   my $ref_additional_parameter_sheet = &TelnetmanWF_common::access2TelnetmanText($login_id, $session_id, 'text_get_additional_parameter_sheet.cgi', {'node' => $node});
   
   my $result = $ref_additional_parameter_sheet -> {'result'};
   
   if($result == 1){
    my $json_additional_parameter_sheet = $ref_additional_parameter_sheet -> {'json_additional_parameter_sheet'};
    $json_existing_parameter_sheet = &TelnetmanWF_common::bond_parameter_sheet($json_existing_parameter_sheet, $json_additional_parameter_sheet);
   }
  }
 }
 
 
 # 任意ログを取得する。
 for(my $sjis = 0; $sjis <= 1; $sjis ++){
  my $sjis_file_name = '';
  if($sjis == 1){
   $sjis_file_name = '_sjis';
  }
  
  my $ref_optional_log = &TelnetmanWF_common::access2TelnetmanText($login_id, $session_id, 'text_get_optional_log.cgi', {'sjis' => $sjis});
  
  if($ref_optional_log -> {'result'} == 1){
   my $optional_log = $ref_optional_log -> {'log'};
   
   my $file_optional_log = $dir_old_log . '/optional' . $sjis_file_name . '.log';
   open(LOG, '>', $file_optional_log);
   print LOG $optional_log;
   close(LOG);
   
   if($< == 0){
    chown(48, 48, $file_optional_log);
   }
  }
 }
 
 
 # ログをzip 圧縮する。
 &TelnetmanWF_common::make_zip_log($flow_id, $task_id, $work_id, $time);
 
 # 次の行き先にパラメーターシートを渡す。
 if(($flag_all_ng == 1) || (($use_parameter_sheet == 1) && ($flag_all_ok == 0))){
  if(length($ng_target_id) > 0){
   $this_process_ng_target_id = $ng_target_id;
   my $file_parameter_sheet_ng = &Common_system::file_parameter_sheet($flow_id, $task_id, $ng_target_id);
   &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet_ng, $json_existing_parameter_sheet);
  }
 }
 elsif($flag_all_ok == 1){
  if(length($ok_target_id) > 0){
   $this_process_ok_target_id = $ok_target_id;
   my $file_parameter_sheet_ok = &Common_system::file_parameter_sheet($flow_id, $task_id, $ok_target_id);
   &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet_ok, $json_existing_parameter_sheet);
  }
 }
 else{
  # パラメーターシートをOK, NG に分割する。
  my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message) = &TelnetmanWF_common::parse_parameter_sheet($json_existing_parameter_sheet);
  my @node_list_ok = ();
  my @node_list_ng = ();
  
  foreach my $node (@$ref_node_list){
   if(!exists($ref_node_status -> {$node}) || ($ref_node_status -> {$node} == 4)){
    push(@node_list_ok, $node);
   }
   elsif(($ref_node_status -> {$node} == 5) || ($ref_node_status -> {$node} == 6) || ($ref_node_status -> {$node} == 8)){
    push(@node_list_ng, $node);
   }
  }
  
  my ($json_parameter_sheet_ok, $json_parameter_sheet_ng) = &TelnetmanWF_common::extract_parameter_sheet($json_existing_parameter_sheet, \@node_list_ok, \@node_list_ng);
  
  if((length($ok_target_id) > 0) && (scalar(@node_list_ok) > 0)){
   $this_process_ok_target_id = $ok_target_id;
   my $file_parameter_sheet_ok = &Common_system::file_parameter_sheet($flow_id, $task_id, $ok_target_id);
   &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet_ok, $json_parameter_sheet_ok);
  }
  
  if((length($ng_target_id) > 0) && (scalar(@node_list_ng) > 0)){
   $this_process_ng_target_id = $ng_target_id;
   my $file_parameter_sheet_ng = &Common_system::file_parameter_sheet($flow_id, $task_id, $ng_target_id);
   &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet_ng, $json_parameter_sheet_ng);
  }
 }
 
 # Telnetman からログアウト
 my $ref_logout_result = &TelnetmanWF_common::access2Telnetman($login_id, $session_id, 'logout.cgi');
 
 # T_LastStatus を更新
 my $update_time = &TelnetmanWF_common::update_status($access2db, $flow_id, $task_id, $work_id, 2, $login_id, $session_id, [$this_process_ok_target_id, $this_process_ng_target_id]);
 
 return($update_time, $this_process_ok_target_id, $this_process_ng_target_id);
}



#
# ログをzip 圧縮する。
#
sub make_zip_log {
 my $flow_id = $_[0];
 my $task_id = $_[1];
 my $work_id = $_[2];
 my $time    = $_[3];
 
 my $dir_old_log = &Common_system::dir_old_log($flow_id, $task_id, $work_id, $time);
 
 opendir(DOLOG, $dir_old_log);
 my @log_files = readdir(DOLOG);
 closedir(DOLOG);
 
 my @ok_log_name_list = ();
 my @ng_log_name_list = ();
 my @error_log_name_list = ();
 my @diff_log_name_list = ();
 my @optional_log_name_list = ();
 foreach my $log_name (@log_files){
  if($log_name =~ /^ok_/){
   push(@ok_log_name_list, $log_name);
  }
  elsif($log_name =~ /^ng_/){
   push(@ng_log_name_list, $log_name);
  }
  elsif($log_name =~ /^error_/){
   push(@error_log_name_list, $log_name);
  }
  elsif($log_name =~ /^diff_/){
   push(@diff_log_name_list, $log_name);
  }
  elsif($log_name =~ /^optional/){
   push(@optional_log_name_list, $log_name);
  }
 }
 
 if(scalar(@ok_log_name_list) > 0){
  my $file_zip = &Common_system::file_zip_log($flow_id, $task_id, $work_id, $time, 'ok');
  
  my $zip = Archive::Zip -> new();
  
  foreach my $log_name (@ok_log_name_list){
   $zip -> addFile($dir_old_log . '/' . $log_name, $log_name);
  }
  
  $zip -> writeToFileNamed($file_zip);
  
  if($< == 0){
   chown(48, 48, $file_zip);
  }
  
  foreach my $log_name (@ok_log_name_list){
   unlink($dir_old_log . '/' . $log_name);
  }
 }
 
 if(scalar(@ng_log_name_list) > 0){
  my $file_zip = &Common_system::file_zip_log($flow_id, $task_id, $work_id, $time, 'ng');
  
  my $zip = Archive::Zip -> new();
  
  foreach my $log_name (@ng_log_name_list){
   $zip -> addFile($dir_old_log . '/' . $log_name, $log_name);
  }
  
  $zip -> writeToFileNamed($file_zip);
  
  if($< == 0){
   chown(48, 48, $file_zip);
  }
  
  foreach my $log_name (@ng_log_name_list){
   unlink($dir_old_log . '/' . $log_name);
  }
 }
 
 if(scalar(@error_log_name_list) > 0){
  my $file_zip = &Common_system::file_zip_log($flow_id, $task_id, $work_id, $time, 'error');
  
  my $zip = Archive::Zip -> new();
  
  foreach my $log_name (@error_log_name_list){
   $zip -> addFile($dir_old_log . '/' . $log_name, $log_name);
  }
  
  $zip -> writeToFileNamed($file_zip);
  
  if($< == 0){
   chown(48, 48, $file_zip);
  }
  
  foreach my $log_name (@error_log_name_list){
   unlink($dir_old_log . '/' . $log_name);
  }
 }
 
 if(scalar(@diff_log_name_list) > 0){
  my $file_zip = &Common_system::file_zip_log($flow_id, $task_id, $work_id, $time, 'diff');
  
  my $zip = Archive::Zip -> new();
  
  foreach my $log_name (@diff_log_name_list){
   $zip -> addFile($dir_old_log . '/' . $log_name, $log_name);
  }
  
  $zip -> writeToFileNamed($file_zip);
  
  if($< == 0){
   chown(48, 48, $file_zip);
  }
  
  foreach my $log_name (@diff_log_name_list){
   unlink($dir_old_log . '/' . $log_name);
  }
 }
 
 if(scalar(@optional_log_name_list) > 0){
  my $file_zip = &Common_system::file_zip_log($flow_id, $task_id, $work_id, $time, 'optional');
  
  my $zip = Archive::Zip -> new();
  
  foreach my $log_name (@optional_log_name_list){
   $zip -> addFile($dir_old_log . '/' . $log_name, $log_name);
  }
  
  $zip -> writeToFileNamed($file_zip);
  
  if($< == 0){
   chown(48, 48, $file_zip);
  }
  
  foreach my $log_name (@optional_log_name_list){
   unlink($dir_old_log . '/' . $log_name);
  }
 }
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
  my $individual_parameter_sheet = 0;
  
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
   elsif($log_name =~ /^Telnetman2_parameter_individual/){
    $individual_parameter_sheet = 1;
   }
  }
  
  return($last_time, $ok, $ng, $error, $diff, $optional, $individual_parameter_sheet);
 }
 else{
  return(0,0,0,0,0,0,0);
 }
}


#
# through 用パラメーターシートを本線に戻す。
#
sub return_through_parameter_sheet {
 my $flow_id = $_[0];
 my $task_id = $_[1];
 my $work_id = $_[2];
 
 my $file_parameter_sheet_through = &Common_system::file_parameter_sheet_through($flow_id, $task_id, $work_id);
 if(-f $file_parameter_sheet_through){
  my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $work_id);
  
  if(-f $file_parameter_sheet){
   open(PSHEET, '<', $file_parameter_sheet_through);
   my $json_parameter_sheet_through = <PSHEET>;
   close(PSHEET);
   
   &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet, $json_parameter_sheet_through);
   
   unlink($file_parameter_sheet_through);
  }
  else{
   &File::Copy::move($file_parameter_sheet_through, $file_parameter_sheet);
  }
  
  return(1);
 }
 else{
  return(0);
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
# 個別パラメーターシートを使ったかどうか。
#
sub check_individual_parameter_sheet {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $work_id   = $_[2];
 
 my $select_column = 'iUseParameterSheet';
 my $table         = 'T_Work';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $use_parameter_sheet = $access2db -> select_col1;

 $use_parameter_sheet += 0;

 return($use_parameter_sheet);
}


#
# 開発用
#
sub debug_log {
 my $flow_id = $_[0];
 my $task_id = $_[1];
 my $log = $_[2];
 
 my $dir_task_log = &Common_system::dir_task_log($flow_id, $task_id);
 my $file_log = $dir_task_log . '/debug.log';
 
 open(DLOG, '>>', $file_log);
 print DLOG $log . "\n";
 close(DLOG);
}

1;
