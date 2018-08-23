#!/usr/bin/perl
# 説明   : Telnetman にアクセスする。
# 作成日 : 2018/07/12
# 作成者 : 江野高広

use strict;
use warnings;

use JSON;
use File::Copy;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use TelnetmanWF_common;


package TelnetmanWF_telnet;

sub new {
 my $self = $_[0];
 
 my %parameter_list = (
  'flow_id'                   => '',
  'task_id'                   => '',
  'work_id'                   => '',
  'telnetman_user'            => '',
  'telnetman_password'        => '',
  'telnetman_login_id'        => '',
  'telnetman_session_id'      => '',
  'user'                      => '',
  'password'                  => '',
  'work_title'                => '',
  'exec_only_one'             => 0,
  'json_login_info'           => '',
  'json_flowchart_before'     => '',
  'json_flowchart_middle'     => '',
  'json_flowchart_after'      => '',
  'json_diff_values'          => '',
  'json_parameter_sheet'      => '',
  'json_parameter_sheet_exec' => ''
 );
 
 bless(\%parameter_list, $self);
}


sub set_flow_id {
 my $self    = $_[0];
 my $flow_id = $_[1];
 
 $self -> {'flow_id'}= $flow_id;
}

sub set_task_id {
 my $self    = $_[0];
 my $task_id = $_[1];
 
 $self -> {'task_id'}= $task_id;
}

sub set_work_id {
 my $self    = $_[0];
 my $work_id = $_[1];
 
 $self -> {'work_id'}= $work_id;
}

sub set_telnetman_login {
 my $self               = $_[0];
 my $telnetman_user     = $_[1];
 my $telnetman_password = $_[2];
 
 $self -> {'telnetman_user'}     = $telnetman_user;
 $self -> {'telnetman_password'} = $telnetman_password;
}

sub set_node_login {
 my $self     = $_[0];
 my $user     = $_[1];
 my $password = $_[2];
 
 $self -> {'user'}     = $user;
 $self -> {'password'} = $password;
}

sub set_telnetman_login_id {
 my $self     = $_[0];
 my $login_id = $_[1];
 $self -> {'telnetman_login_id'} = $login_id;
}

sub set_telnetman_session_id {
 my $self       = $_[0];
 my $session_id = $_[1];
 $self -> {'telnetman_session_id'} = $session_id;
}

sub get_telnetman_login_id {
 my $self = $_[0];
 my $login_id = $self -> {'telnetman_login_id'};
 
 return($login_id);
}

sub get_telnetman_session_id {
 my $self = $_[0];
 my $session_id = $self -> {'telnetman_session_id'};
 
 return($session_id);
}



#
# Telnetman へログイン
#
sub login_telnetman {
 my $self = $_[0];
 my $telnetman_user     = $self -> {'telnetman_user'};
 my $telnetman_password = $self -> {'telnetman_password'};
 
 my $ref_login_result = &TelnetmanWF_common::access2Telnetman($telnetman_user, $telnetman_password, 'login.cgi');
 
 unless(defined($ref_login_result)){
  $self -> fall_back_parameter_sheet;
  return('Telnetman にアクセスできませんでした。');
 }
 
 my $login              = $ref_login_result -> {'login'};
 my $max_session_number = $ref_login_result -> {'max_session_number'};
 my $ref_session_sort   = $ref_login_result -> {'session_sort'};
 my $login_id           = $ref_login_result -> {'login_id'};

 if($login == 1){
  $self -> {'telnetman_login_id'} = $login_id;
  
  # セッション削除
  if(scalar(@$ref_session_sort) == $max_session_number){
   foreach my $_session_id (@$ref_session_sort){
    my $delete = $self -> delete_session($_session_id);
    
    if($delete == 1){
     last;
    }
   }
  }
 }
 else{
  my $reason = '';
  
  if($login == 0){
   $reason = 'Telnetman にログインできませんでした。';
  }
  elsif($login == -1){
   $reason = 'Telnetman のログインID かパスワードが違います。';
  }
  elsif($login == -2){
   $reason = 'Telneman のアカウントがロックされています。';
  }
  
  $self -> fall_back_parameter_sheet;
  return($reason);
 }
 
 return('');
}



#
# セッション削除
#
sub delete_session {
 my $self       = $_[0];
 my $session_id = $_[1];
 my $login_id = $self -> {'telnetman_login_id'};
 
 unless(defined($session_id) && (length($session_id) > 0)){
  return(0);
 }
 
 my $ref_delete_session_result = &TelnetmanWF_common::access2Telnetman($login_id, '', 'delete_session.cgi', {'session_id' => $session_id});
 
 unless(defined($ref_delete_session_result)){
  return(0);
 }
 
 my $delete = $ref_delete_session_result -> {'delete'};
 
 if(defined($delete) && ($delete == 1)){
  return(1);
 }
 else{
  return(0);
 }
}



#
# セッション作成
#
sub create_session {
 my $self       = $_[0];
 my $login_id   = $self -> {'telnetman_login_id'};
 my $work_title = $self -> {'work_title'};
 
 my $ref_create_session_result = &TelnetmanWF_common::access2Telnetman($login_id, '', 'create_session.cgi', {'session_title' => $work_title});
 
 unless(defined($ref_create_session_result)){
  $self -> fall_back_parameter_sheet;
  return('Telnetman にアクセスできませんでした。');
 }
 
 my $create     = $ref_create_session_result -> {'create'};
 my $session_id = $ref_create_session_result -> {'session_id'};

 if($create == 1){
  $self -> {'telnetman_session_id'} = $session_id;
 }
 else{
  $self -> fall_back_parameter_sheet;
  return('Telnetman のセッション数が上限に達しています。');
 }
 
 return('');
}



#
# Telnetman に渡すデータを初期化する。
#
sub initialize_work_data {
 my $self = $_[0];
 
 $self -> {'work_title'} = '';
 $self -> {'exec_only_one'} = 0;
 $self -> {'json_login_info'} = '';
 $self -> {'json_flowchart_before'} = '';
 $self -> {'json_flowchart_middle'} = '';
 $self -> {'json_flowchart_after'} = '';
 $self -> {'json_diff_values'} = '';
 $self -> {'json_parameter_sheet'} = '';
 $self -> {'json_parameter_sheet_exec'} = '';
}



#
# Telnetman に渡すデータを取り出す。
#
sub load_work_data {
 my $self      = $_[0];
 my $access2db = $_[1];
 
 $self -> initialize_work_data;
 
 my $flow_id = $self -> {'flow_id'};
 my $task_id = $self -> {'task_id'};
 my $work_id = $self -> {'work_id'};
 
 # Telnetman のログインID, Password
 if((length($self -> {'telnetman_user'}) == 0) || (length($self -> {'telnetman_password'} ) == 0)){
  my ($telnetman_user, $telnetman_password) = &TelnetmanWF_common::get_telnetman_login($access2db, $flow_id, $task_id);
  
  if((length($telnetman_user) > 0) && (length($telnetman_password) > 0)){
   $self -> set_telnetman_login($telnetman_user, $telnetman_password);
  }
 }
 
 
 # work 名、1台のみ実行かどうか、enable password を取得。
 my $select_column = 'vcWorkTitle,iExecOnlyOne,vcUser,vcPassword,vcEnablePassword';
 my $table         = 'T_Work';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_work = $access2db -> select_cols;
 
 my ($work_title, $exec_only_one, $user, $encoded_password, $encoded_enable_password) = @$ref_work;
 my $password        = &TelnetmanWF_common::decode_password($encoded_password);
 my $enable_password = &TelnetmanWF_common::decode_password($encoded_enable_password);
 
 $exec_only_one += 0;
 $self -> {'work_title'} = $work_title;
 $self -> {'exec_only_one'} = $exec_only_one;
 
 
 # デフォルトのログイン情報ファイル名、デフォルトのuser, password,enable password を取得。
 $select_column = 'vcLoginInfo,vcUser,vcPassword,vcEnablePassword';
 $table         = 'T_Flow';
 $condition     = "where vcFlowId = '" . $flow_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_Flow = $access2db -> select_cols;
 my $file_name_default_login_info    = $ref_Flow -> [0];
 my $default_user                    = $ref_Flow -> [1];
 my $default_encoded_password        = $ref_Flow -> [2];
 my $default_encoded_enable_password = $ref_Flow -> [3];
 
 my $default_password        = &TelnetmanWF_common::decode_password($default_encoded_password);
 my $default_enable_password = &TelnetmanWF_common::decode_password($default_encoded_enable_password);
 
 
 # 流れ図データファイル名、個別ログイン情報ファイル名、syslog 確認設定ファイル名、Diff 設定ファイル名、任意ログ設定ファイル名を取得。
 $select_column = 'vcFlowchartBefore,vcFlowchartMiddle,vcFlowchartAfter,vcLoginInfo,vcSyslogValues,vcDiffValues,vcOptionalLogValues';
 $table         = 'T_File';
 $condition     = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_file_names = $access2db -> select_cols;
 
 my $file_name_flowchart_before    = $ref_file_names -> [0];
 my $file_name_flowchart_middle    = $ref_file_names -> [1];
 my $file_name_flowchart_after     = $ref_file_names -> [2];
 my $file_name_login_info          = $ref_file_names -> [3];
 my $file_name_syslog_values       = $ref_file_names -> [4];
 my $file_name_diff_values         = $ref_file_names -> [5];
 my $file_name_optional_log_values = $ref_file_names -> [6];
 
 
 # 個別ログイン情報が未定義ならデフォルトのuser, password, enable password を採用する。
 unless(defined($file_name_login_info) && (length($file_name_login_info) > 0)){
  $user            = $default_user;
  $password        = $default_password;
  $enable_password = $default_enable_password;
 }
 
 
 # user, password が指定されていれば上書きする。
 if(length($self -> {'user'}) > 0){
  $user = $self -> {'user'};
  $self -> {'user'} = '';
 }
 
 if(length($self -> {'password'}) > 0){
  $password = $self -> {'password'};
  $self -> {'password'} = '';
 }
 
 unless(length($user) > 0){
  $self -> fall_back_parameter_sheet;
  return('ログインID がありません。');
 }
 
 unless(length($password) > 0){
  $self -> fall_back_parameter_sheet;
  return('ログインPassword がありません。');
 }
 
 
 # ログイン情報を組み立てる。
 my $json_login_info = '';
 if(length($file_name_login_info) > 0){
  my $file_login_info = &Common_system::file_login_info($flow_id, $work_id);
  open(LINFO, '<', $file_login_info);
  $json_login_info = <LINFO>;
  close(LINFO);
 }
 elsif(length($file_name_default_login_info) > 0){
  my $file_login_info = &Common_system::file_default_login_info($flow_id);
  open(LINFO, '<', $file_login_info);
  $json_login_info = <LINFO>;
  close(LINFO);
 }
 
 unless(length($json_login_info) > 0){
  $self -> fall_back_parameter_sheet;
  return('ログイン情報がありません。');
 }
 
 my $ref_login_info = &JSON::from_json($json_login_info);
 $ref_login_info -> {'user'}            = $user;
 $ref_login_info -> {'password'}        = $password;
 $ref_login_info -> {'enable_password'} = $enable_password;
 $json_login_info = &JSON::to_json($ref_login_info);
 $self -> {'json_login_info'} = $json_login_info;
 
 
 # 流れ図データを取り出す。
 my $json_flowchart_before = '';
 if(length($file_name_flowchart_before) > 0){
  my $file_flowchart = &Common_system::file_flowchart_before($flow_id, $work_id);
  open(FDATAB, '<', $file_flowchart);
  $json_flowchart_before = <FDATAB>;
  close(FDATAB);
 }
 else{
  $json_flowchart_before = &TelnetmanWF_telnet::empty_flowchart();
 }
 $self -> {'json_flowchart_before'} = $json_flowchart_before;
 
 my $json_flowchart_middle = '';
 if(length($file_name_flowchart_middle) > 0){
  my $file_flowchart = &Common_system::file_flowchart_middle($flow_id, $work_id);
  open(FDATAM, '<', $file_flowchart);
  $json_flowchart_middle = <FDATAM>;
  close(FDATAM);
 }
 else{
  $json_flowchart_middle = &TelnetmanWF_telnet::empty_flowchart();
 }
 $self -> {'json_flowchart_middle'} = $json_flowchart_middle;
 
 my $json_flowchart_after = '';
 if(length($file_name_flowchart_after) > 0){
  my $file_flowchart = &Common_system::file_flowchart_after($flow_id, $work_id);
  open(FDATAA, '<', $file_flowchart);
  $json_flowchart_after = <FDATAA>;
  close(FDATAA);
 }
 else{
  $json_flowchart_after = &TelnetmanWF_telnet::empty_flowchart();
 }
 $self -> {'json_flowchart_after'} = $json_flowchart_after;
 
 
 # Syslog 設定を読み取る。
 my $json_syslog_values = '';
 if(length($file_name_syslog_values) > 0){
  my $file_syslog_values = &Common_system::file_syslog_values($flow_id, $work_id);
  open(SVALUES, '<', $file_syslog_values);
  $json_syslog_values = <SVALUES>;
  close(SVALUES);
 }
 $self -> {'json_syslog_values'} = $json_syslog_values;
 
 
 # Diff 設定を読み取る。
 my $json_diff_values = '';
 if(length($file_name_diff_values) > 0){
  my $file_diff_values = &Common_system::file_diff_values($flow_id, $work_id);
  open(DVALUES, '<', $file_diff_values);
  $json_diff_values = <DVALUES>;
  close(DVALUES);
 }
 $self -> {'json_diff_values'} = $json_diff_values;
 
 
 # 任意ログ設定を読み取る。
 my $json_optional_log_values = '';
 if(length($file_name_optional_log_values) > 0){
  my $file_optional_log_values = &Common_system::file_optional_log_values($flow_id, $work_id);
  open(OVALUES, '<', $file_optional_log_values);
  $json_optional_log_values = <OVALUES>;
  close(OVALUES);
 }
 $self -> {'json_optional_log_values'} = $json_optional_log_values;
 
 
 # パラメーターシートを読み取る。
 my $json_parameter_sheet = '';
 my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $work_id);
 
 if(-f $file_parameter_sheet){
  open(PSHEET, '<', $file_parameter_sheet);
  $json_parameter_sheet = <PSHEET>;
  close(PSHEET);
 }
 
 $self -> {'json_parameter_sheet'} = $json_parameter_sheet;
 
 return('');
}



#
# 自動実行用のnode_list を作成する。
#
sub make_node_list {
 my $self = $_[0];
 my $json_parameter_sheet = $self -> {'json_parameter_sheet'};
 my $exec_only_one        = $self -> {'exec_only_one'};
 
 my @exec_node_list    = ();
 my @through_node_list = ();
 
 if(length($json_parameter_sheet) == 0){
  return(\@exec_node_list, \@through_node_list, '');
 }
 
 my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message) = &TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet);
 
 if(length($error_message) > 0){
  $self -> fall_back_parameter_sheet;
  return(undef, undef, $error_message);
 }
 
 if($exec_only_one == 1){
  my $node = shift(@$ref_node_list);
  push(@exec_node_list, $node);
  
  push(@through_node_list, @$ref_node_list);
 }
 else{
  push(@exec_node_list, @$ref_node_list);
 }
 
 return(\@exec_node_list, \@through_node_list, '');
}



#
# exec とthrough に分けたパラメーターシートを作成する。
#
sub make_parameter_sheet {
 my $self = $_[0];
 my $ref_exec_node_list    = $_[1];
 my $ref_through_node_list = $_[2];
 
 my $flow_id = $self -> {'flow_id'};
 my $task_id = $self -> {'task_id'};
 my $work_id = $self -> {'work_id'};
 
 # exec のノードが無ければ終了。
 if(scalar(@$ref_exec_node_list) == 0){
  return(0);
 }
 
 
 # パラメーターシートが無ければ終了。
 my $json_parameter_sheet = $self -> {'json_parameter_sheet'};
 if(length($json_parameter_sheet) == 0){
  return(0);
 }
 
 
 # exec とthrough にパラメーターシートを分割する。
 my $file_parameter_sheet         = &Common_system::file_parameter_sheet($flow_id, $task_id, $work_id);
 my $file_parameter_sheet_exec    = &Common_system::file_parameter_sheet_exec($flow_id, $task_id, $work_id);
 my $json_parameter_sheet_exec = '';
 my $json_parameter_sheet_through = '';
 
 if(scalar(@$ref_through_node_list) > 0){
  ($json_parameter_sheet_exec, $json_parameter_sheet_through) = &TelnetmanWF_common::extract_parameter_sheet($json_parameter_sheet, $ref_exec_node_list, $ref_through_node_list);
  
  open(PSHEET, '>', $file_parameter_sheet_exec);
  print PSHEET $json_parameter_sheet_exec;
  close(PSHEET);
  
  open(PSHEET, '>', $file_parameter_sheet);
  print PSHEET $json_parameter_sheet_through;
  close(PSHEET);
 }
 else{
  $json_parameter_sheet_exec = $json_parameter_sheet;
  &File::Copy::move($file_parameter_sheet, $file_parameter_sheet_exec);
 }
 
 $self -> {'json_parameter_sheet_exec'} = $json_parameter_sheet_exec;
 
 return(1);
}



#
# 実行用パラメーターシートを通常のパラメーターシートに戻す。
#
sub fall_back_parameter_sheet {
 my $self = $_[0];
 
 my $flow_id = $self -> {'flow_id'};
 my $task_id = $self -> {'task_id'};
 my $work_id = $self -> {'work_id'};
 
 my $file_parameter_sheet      = &Common_system::file_parameter_sheet($flow_id, $task_id, $work_id);
 my $file_parameter_sheet_exec = &Common_system::file_parameter_sheet_exec($flow_id, $task_id, $work_id);
 
 if(-f $file_parameter_sheet_exec){
  if(-f $file_parameter_sheet){
   open(PSHEET, '<', $file_parameter_sheet_exec);
   my $json_parameter_sheet_exec = <PSHEET>;
   close(PSHEET);
   
   &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet, $json_parameter_sheet_exec);
   
   unlink($file_parameter_sheet_exec);
  }
  else{
   &File::Copy::move($file_parameter_sheet_exec, $file_parameter_sheet);
  }
 }
}



#
# telnet 実行
#
sub push_queue {
 my $self    = $_[0];
 
 my $login_id                  = $self -> {'telnetman_login_id'};
 my $session_id                = $self -> {'telnetman_session_id'};
 my $work_title                = $self -> {'work_title'};
 my $json_parameter_sheet_exec = $self -> {'json_parameter_sheet_exec'};
 my $json_login_info           = $self -> {'json_login_info'};
 my $json_flowchart_before     = $self -> {'json_flowchart_before'};
 my $json_flowchart_middle     = $self -> {'json_flowchart_middle'};
 my $json_flowchart_after      = $self -> {'json_flowchart_after'};
 my $json_syslog_values        = $self -> {'json_syslog_values'};
 my $json_diff_values          = $self -> {'json_diff_values'};
 my $json_optional_log_values  = $self -> {'json_optional_log_values'};

 my %queue_data = (
  'session_title'                => $work_title,
  'auto_pause'                   => 0,
  'parameter_json'               => $json_parameter_sheet_exec,
  'login_info_json'              => $json_login_info,
  'before_flowchart_json'        => $json_flowchart_before,
  'middle_flowchart_json'        => $json_flowchart_middle,
  'after_flowchart_json'         => $json_flowchart_after,
  'terminal_monitor_values_json' => $json_syslog_values,
  'diff_values_json'             => $json_diff_values,
  'optional_log_values_json'     => $json_optional_log_values
 );
 
 my $ref_queue_result = &TelnetmanWF_common::access2Telnetman($login_id, $session_id, 'queue.cgi', \%queue_data);
 
 my $result = $ref_queue_result -> {'result'};
 unless($result == 1){
  my $reason = $ref_queue_result -> {'reason'};
  
  $self -> fall_back_parameter_sheet;
  return($reason);
 }
 
 return('');
}



sub empty_flowchart {
 return('{"flowchart":{"0":[["","",""],["","",""],["","",""]]},"routine_repeat_type":{"0":1},"routine_title":{"0":"名無し"},"routine_loop_type":{"0":0}}');
}


1;
