#!/usr/bin/perl
# 説明   : Work, Case 実行に関する共通サブルーチン。
# 作成者 : 江野高広
# 作成日 : 2018/07/20
# 更新   : 2018/10/01 作成するディレクトリのパーミッションを775 に。

use strict;
use warnings;

package Exec_box;

use JSON;
use File::Copy;
use Archive::Zip;

use lib '/usr/local/TelnetmanWF/lib';
use Common_sub;
use Common_system;
use TelnetmanWF_common;
use TelnetmanWF_telnet;
use TelnetmanWF_divide_case;



#
# Work, Case を自動実行する。
# Work の場合はT_Queue に入れる。
#
sub auto_exec {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 my $box_id    = $_[3];
 my $status    = 2;
 
 my $auto_exec_box_id = &Exec_box::get_auto_exec_box_id($access2db, $flow_id, $box_id);
 
 if($auto_exec_box_id =~ /^work_/){
  my $exist_running_work = &TelnetmanWF_common::exist_running_work($access2db, $flow_id, $task_id);
  
  if($exist_running_work == 0){# 実行中のWork が無ければ新規で実行。
   my ($_status, $error_message) = &Exec_box::exec_work($access2db, $flow_id, $task_id, $auto_exec_box_id);
   $status = $_status;
   
   if($status == -1){
    return($auto_exec_box_id, $status, $error_message);
   }
  }
  else{# 実行中のノードがあれば実行待ちとしてT_WorkList に登録し、T_Queue にも登録。
   $status = 0;
   my $update_time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $auto_exec_box_id, $status, '');
   &Exec_box::push_queue($access2db, $flow_id, $task_id, $auto_exec_box_id);
  }
 }
 elsif($auto_exec_box_id =~ /^case_/){
  my ($time, $ref_target_id_list, $_status, $error_message) = &Exec_box::exec_case($access2db, $flow_id, $task_id, $auto_exec_box_id);
  $status = $_status;
  
  if($status == -1){
   return($auto_exec_box_id, $status, $error_message);
  }
  
  foreach my $target_id (@$ref_target_id_list){
   my ($_auto_exec_box_id, $_status, $error_message) = &Exec_box::auto_exec($access2db, $flow_id, $task_id, $target_id);
   $status = $_status;
   
   if($status == -1){
    return($_auto_exec_box_id, $status, $error_message);
   }
  }
 }
 
 return($auto_exec_box_id, $status, '');
}



#
# Work を実行してTelnetman のqueue にpush
#
sub exec_work {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 my $work_id   = $_[3];
 my $user      = $_[4];
 my $password  = $_[5];
 my $ref_exec_node_list    = $_[6];
 my $ref_through_node_list = $_[7];
 
 unless(defined($work_id) && (length($work_id) > 0)){
  return(2, '');
 }
 
 my $telentman = TelnetmanWF_telnet -> new;
 
 $telentman -> set_flow_id($flow_id);
 $telentman -> set_task_id($task_id);
 $telentman -> set_work_id($work_id);
 
 # 機器へのログインID, Password の指定があればそれを使う。
 if(defined($user) && (length($user) > 0) && defined($password) && (length($password) > 0)){
  $telentman -> set_node_login($user, $password);
 }
 
 
 # Work data の読み取り。
 my $error_message = $telentman -> load_work_data($access2db);
 
 if(length($error_message) > 0){
  my $update_time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $work_id, -1, $error_message);
  &TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, $work_id, $ref_exec_node_list, $update_time, -1, $error_message);
  return(-1, $error_message);
 }
 
 
 # exec 対象ノードの指定が無ければ全ノード、または、1台のみを対象にする。
 unless(defined($ref_exec_node_list) && defined($ref_through_node_list)){
  ($ref_exec_node_list, $ref_through_node_list, $error_message) = $telentman -> make_node_list;
  
  if(length($error_message) > 0){
   my $update_time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $work_id, -1, $error_message);
   &TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, $work_id, $ref_exec_node_list, $update_time, -1, $error_message);
   return(-1, $error_message);
  }
 }
 
 
 # パラメーターシート をexec とthrough に分ける。
 my $exist_exec_node = $telentman -> make_parameter_sheet($ref_exec_node_list, $ref_through_node_list);
 
 if($exist_exec_node == 0){
  return(2, '');
 }
 
 
 # Telnetman にアクセス。
 my $login_id   = $telentman -> get_telnetman_login_id;
 my $session_id = $telentman -> get_telnetman_session_id;
 
 if((length($login_id) == 0) || (length($session_id) == 0)){
  $error_message = $telentman -> login_telnetman;
  
  if(length($error_message) > 0){
   my $update_time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $work_id, -1, $error_message);
   &TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, $work_id, $ref_exec_node_list, $update_time, -1, $error_message);
   return(-1, $error_message);
  }
  
  $error_message = $telentman -> create_session;
  
  if(length($error_message) > 0){
   my $update_time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $work_id, -1, $error_message);
   &TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, $work_id, $ref_exec_node_list, $update_time, -1, $error_message);
   return(-1, $error_message);
  }
  
  $login_id   = $telentman -> get_telnetman_login_id;
  $session_id = $telentman -> get_telnetman_session_id;
 }

 $error_message = $telentman -> push_queue;
 
 if(length($error_message) > 0){
  my $update_time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $work_id, -1, $error_message);
  &TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, $work_id, $ref_exec_node_list, $update_time, -1, $error_message);
  return(-1, $error_message);
 }
 
 
 # ステータス管理テーブルの更新。
 my $time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $work_id, 1, '', $login_id, $session_id);
 
 return(1, '');
}



#
# vcAutoExecBoxId の値を取得
#
sub get_auto_exec_box_id {
 my $access2db     = $_[0];
 my $flow_id       = $_[1];
 my $target_box_id = $_[2];
 
 unless(defined($target_box_id) && (length($target_box_id) > 0)){
  return('');
 }
 
 my $select_column = 'vcAutoExecBoxId';
 my $table = '';
 my $condition = "where vcFlowId = '" . $flow_id . "'";
 
 if($target_box_id =~ /^work_/){
  $table      = 'T_Work';
  $condition .= " and vcWorkId = '" . $target_box_id . "'";
 }
 elsif($target_box_id =~ /^case_/){
  $table      = 'T_Case';
  $condition .= " and vcCaseId = '" . $target_box_id . "'";
 }
 elsif($target_box_id =~ /^terminal_/){
  $table      = 'T_Terminal';
  $condition .= " and vcTerminalId = '" . $target_box_id . "'";
 }
 elsif($target_box_id =~ /^goal_/){
  $table     = 'T_Flow';
 }
 else{
  return('');
 }
 
 $access2db -> set_select($select_column, $table, $condition);
 my $auto_exec_box_id = $access2db -> select_col1;
 
 if($auto_exec_box_id =~ /^work_/){
  my $exists_flowchart_data = &TelnetmanWF_common::exists_flowchart_data($access2db, $flow_id, $auto_exec_box_id);
  
  if($exists_flowchart_data == 0){
   $auto_exec_box_id = '';
  }
 }
 
 return($auto_exec_box_id);
}



#
# T_Queue に自動実行するWork を登録する。
#
sub push_queue {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 my $work_id   = $_[3];
 my $queue_index = 0;
 
 my $select_column = 'count(*)';
 my $table         = 'T_Queue';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcWorkId = '" . $work_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $count_work = $access2db -> select_col1;
 $count_work += 0;
 
 if($count_work == 0){
  $select_column = 'count(*)';
  $table         = 'T_Queue';
  $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "'";
  $access2db -> set_select($select_column, $table, $condition);
  my $count_task = $access2db -> select_col1;
  $count_task += 0;
  
  if($count_task > 0){
   $select_column = 'max(iQueueIndex)';
   $access2db -> set_select($select_column, $table, $condition);
   $queue_index = $access2db -> select_col1;
  }
  
  $queue_index += 1;
  
  my $insert_column = 'vcFlowId,vcTaskId,vcWorkId,iQueueIndex';
  my @values = ("('" . $flow_id . "','" . $task_id . "','" . $work_id . "'," . $queue_index . ")");
  $access2db -> set_insert($insert_column, \@values, $table);
  $access2db -> insert_exe;
 }
}



#
# T_Queue から実行するWork を取り出す。
#
sub shift_queue {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 
 my $exist_running_work = &TelnetmanWF_common::exist_running_work($access2db, $flow_id, $task_id, 1);
 
 if($exist_running_work == 1){
  return('');
 }
 
 my $select_column = 'vcWorkId,iQueueIndex';
 my $table         = 'T_Queue';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' order by iQueueIndex limit 1";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_Queue = $access2db -> select_cols;
 
 if(scalar(@$ref_Queue) == 0){
  return('');
 }
 
 my $work_id     = $ref_Queue -> [0];
 my $queue_index = $ref_Queue -> [1];
 
 $access2db -> set_delete('T_Queue', "where vcFlowId = '" . $flow_id . "' and vcTaskId = '" . $task_id . "' and vcWorkId = '" . $work_id . "' and iQueueIndex = " . $queue_index);
 $access2db -> delete_exe;
 
 return($work_id);
}



#
# queue から削除する。
#
sub delete_queue {
 my $access2db = $_[0];
 my $flow_id   = $_[1];
 my $task_id   = $_[2];
 
 my $extra_condition = '';
 if(defined($task_id) && (length($task_id) > 0)){
  $extra_condition = " and vcTaskId = '" . $task_id . "'";
 }
 
 $access2db -> set_delete('T_Queue', "where vcFlowId = '" . $flow_id . "'" . $extra_condition);
 $access2db -> delete_exe;
 $access2db -> set_delete('T_WorkList', "where vcFlowId = '" . $flow_id . "'" . $extra_condition . " and iStatus = 0");
 $access2db -> delete_exe;
}



#
# exec のパラメーターシートを過去ログ置き場に移動。
#
sub move_exec_parameter_sheet {
 my $flow_id = $_[0];
 my $task_id = $_[1];
 my $work_id = $_[2];
 my $time    = $_[3];
 
 unless(defined($time)){
  $time = time;
 }
 
 my $dir_old_log = &Common_system::dir_old_log($flow_id, $task_id, $work_id, $time);

 unless(-d $dir_old_log){
  umask(0002);
  mkdir($dir_old_log, 0775);
  
  if($< == 0){
   chown(48, 48, $dir_old_log);
  }
 }
 
 my $file_parameter_sheet_exec = &Common_system::file_parameter_sheet_exec($flow_id, $task_id, $work_id);
 my $file_old_parameter_sheet  = &Common_system::file_old_parameter_sheet($flow_id, $task_id, $work_id, $time);
 &File::Copy::move($file_parameter_sheet_exec, $file_old_parameter_sheet);

 return($time);
}



#
# telnet 終了後の処理
#
sub end_of_telnet {
 my $access2db       = $_[0];
 my $flow_id         = $_[1];
 my $task_id         = $_[2];
 my $work_id         = $_[3];
 my $login_id        = $_[4];
 my $session_id      = $_[5];
 my $ref_node_status = $_[6];
 
 my $this_process_ok_target_id = '';
 my $this_process_ng_target_id = '';
 my @node_list = ();
 
 # exec のパラメーターシートを過去ログ置き場に移動。
 my $time = &Exec_box::move_exec_parameter_sheet($flow_id, $task_id, $work_id);
 
 my $dir_old_log = &Common_system::dir_old_log($flow_id, $task_id, $work_id, $time);
 my $file_old_parameter_sheet = &Common_system::file_old_parameter_sheet($flow_id, $task_id, $work_id, $time);
 
 # exec だったパラメーターシートを読み取る。
 open(PSHEET, '<', $file_old_parameter_sheet);
 my $json_parameter_sheet_exec = <PSHEET>;
 close(PSHEET);
 
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
   umask(0002);
   mkdir($dir_log_ok, 0775);
  }
  
  if($< == 0){
   chown(48, 48, $dir_log_ok);
  }
 }
 if(exists($ref_ng_target -> {'id'}) && ($ref_ng_target -> {'id'} !~ /^start_/)){
  $ng_target_id = $ref_ng_target -> {'id'};
  
  my $dir_log_ng = &Common_system::dir_log($flow_id, $task_id, $ng_target_id);
  
  unless(-d $dir_log_ng){
   umask(0002);
   mkdir($dir_log_ng, 0775);
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
    $json_parameter_sheet_exec = &TelnetmanWF_common::bond_parameter_sheet($json_parameter_sheet_exec, $json_additional_parameter_sheet);
   }
  }
  
  push(@node_list, $node);
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
 &Exec_box::make_zip_log($flow_id, $task_id, $work_id, $time);
 
 # 次の行き先にパラメーターシートを渡す。
 if($flag_all_ng == 1){
  if(length($ng_target_id) > 0){
   $this_process_ng_target_id = $ng_target_id;
   my $file_parameter_sheet_ng = &Common_system::file_parameter_sheet($flow_id, $task_id, $ng_target_id);
   &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet_ng, $json_parameter_sheet_exec);
  }
 }
 elsif($flag_all_ok == 1){
  if(length($ok_target_id) > 0){
   $this_process_ok_target_id = $ok_target_id;
   my $file_parameter_sheet_ok = &Common_system::file_parameter_sheet($flow_id, $task_id, $ok_target_id);
   &TelnetmanWF_common::push_parameter_sheet($file_parameter_sheet_ok, $json_parameter_sheet_exec);
  }
 }
 else{
  # パラメーターシートをOK, NG に分割する。
  my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message) = &TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet_exec);
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
  
  my ($json_parameter_sheet_ok, $json_parameter_sheet_ng) = &TelnetmanWF_common::extract_parameter_sheet($json_parameter_sheet_exec, \@node_list_ok, \@node_list_ng);
  
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
 
 # T_WorkList を更新
 my $update_time = &TelnetmanWF_common::update_work_status($access2db, $flow_id, $task_id, $work_id, 2, '', $login_id, $session_id);
 &TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, $work_id, \@node_list, $update_time, 2);
 
 return($this_process_ok_target_id, $this_process_ng_target_id);
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
# Case を実行する。
#
sub exec_case {
 my $access2db   = $_[0];
 my $flow_id     = $_[1];
 my $task_id     = $_[2];
 my $case_id     = $_[3];
 
 # パラメーターシートを読み取る。
 my $file_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $case_id);
 unless(-f $file_parameter_sheet){
  return(0, [], 2, '');
 }
 
 my $divide_case = TelnetmanWF_divide_case -> new;
 
 # 次の行き先と分岐条件を取り出す。
 my $select_column = 'txLinkTargetList,txParameterConditions';
 my $table         = 'T_Case';
 my $condition     = "where vcFlowId = '" . $flow_id . "' and vcCaseId = '" . $case_id . "'";
 $access2db -> set_select($select_column, $table, $condition);
 my $ref_case = $access2db -> select_cols;
 
 my $json_target_list          = $ref_case -> [0];
 my $json_parameter_conditions = $ref_case -> [1];
 my $ref_target_list           = &JSON::from_json($json_target_list);
 my $ref_parameter_conditions  = &JSON::from_json($json_parameter_conditions);
 
 open(PSHEET, '<', $file_parameter_sheet);
 my $json_parameter_sheet = <PSHEET>;
 close(PSHEET);
 
 my ($ref_node_list, $ref_interface_list, $ref_node_info, $ref_interface_info, $error_message_parameter_sheet) = &TelnetmanWF_common::parse_parameter_sheet($json_parameter_sheet);
 
 
 # 条件分岐のオブジェクトにノード情報などを入れる。
 $divide_case -> set_node_list($ref_node_list);
 $divide_case -> set_parameters({'interface_list' => $ref_interface_list, 'node_info' => $ref_node_info, 'interface_info' => $ref_interface_info});
 
 
 # 条件分岐を実行する。
 my ($ref_divided_node_list_list, $ref_unmatched_node_list) = $divide_case -> divide($ref_parameter_conditions);
 my $error_message = $divide_case -> get_error_message();
 
 if(length($error_message) > 0){
  my $update_time = &TelnetmanWF_common::update_case_status($access2db, $flow_id, $task_id, $case_id, -1, $error_message);
  &TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, $case_id, $ref_node_list, $update_time, -1, $error_message);
  return(0, [], -1, $error_message);
 }
 
 
 # パラメーターシートを分割する。 
 my @divided_parameter_sheet_list = &TelnetmanWF_common::extract_parameter_sheet($json_parameter_sheet, @$ref_divided_node_list_list, $ref_unmatched_node_list);
 my $json_remaining_parameter_sheet = pop(@divided_parameter_sheet_list);
 
 
 # パラメーターシートを分岐先に振り分ける。
 my @target_id_list = ();
 foreach my $ref_target (@$ref_target_list){
  my $json_divided_parameter_sheet = shift(@divided_parameter_sheet_list);
  
  if(exists($ref_target -> {'id'}) && ($ref_target -> {'id'} !~ /^start_/)){
   my $target_id = $ref_target -> {'id'};
   
   if(length($json_divided_parameter_sheet) > 0){
    my $dir_log = &Common_system::dir_log($flow_id, $task_id, $target_id);
    
    unless(-d $dir_log){
     umask(0002);
     mkdir($dir_log, 0775);
    }
    
    my $file_target_parameter_sheet = &Common_system::file_parameter_sheet($flow_id, $task_id, $target_id);
    &TelnetmanWF_common::push_parameter_sheet($file_target_parameter_sheet, $json_divided_parameter_sheet);
    
    push(@target_id_list, $target_id);
   }
  }
 }
 
 
 # 既存のパラメーターシートを削除。残すノードがあれば新たに作成。
 unlink($file_parameter_sheet);
 
 if(length($json_remaining_parameter_sheet) > 0){
  open(PSHEET, '>', $file_parameter_sheet);
  print PSHEET $json_remaining_parameter_sheet;
  close(PSHEET);
 }
 
 
 # ステータスを記録。
 my $update_time = &TelnetmanWF_common::update_case_status($access2db, $flow_id, $task_id, $case_id, 2);
 &TelnetmanWF_common::write_history($access2db, $flow_id, $task_id, $case_id, $ref_node_list, $update_time, 2);
 
 
 return($update_time, \@target_id_list, 2, '');
}


1;
