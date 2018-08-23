#!/usr/bin/perl
# 説明   : work と配置を更新する。
# 作成者 : 江野高広
# 作成日 : 2015/05/14
# 更新   : 2015/12/24 syslog 確認のJSON を取り込めるように。
# 更新   : 2016/01/28 enable password をログイン情報ファイルから外す。
# 更新   : 2018/06/27 user, password を追加。
# 更新   : 2018/06/29 iExecOnlyOne, vcAutoExecBoxId を追加。
# 更新   : 2018/08/15 個別パラメーターシートを廃止。

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



#
# 配置データを受け取る。
#
my $json_flow_data = $cgi -> param('flow_data');
my $ref_flow_data = &JSON::from_json($json_flow_data);

my $start_data    = $ref_flow_data -> {"start_data"};
my $goal_data     = $ref_flow_data -> {"goal_data"};
my $paper_height  = $ref_flow_data -> {"paper_height"};
my $work_list     = $ref_flow_data -> {"work_list"};
my $case_list     = $ref_flow_data -> {"case_list"};
my $terminal_list = $ref_flow_data -> {"terminal_list"};

my $start_x             = $start_data -> {"x"};
my $start_y             = $start_data -> {"y"};
my $start_link_target   = $start_data -> {"start_link_target"};
my $start_link_vertices = $start_data -> {"start_link_vertices"};

my $goal_x = $goal_data -> {"x"}; 
my $goal_y = $goal_data -> {"y"}; 

my $json_start_link_target   = &JSON::to_json($start_link_target);
my $json_start_link_vertices = &JSON::to_json($start_link_vertices);



#
# work データを受け取る。
#
my $work_id                       = $cgi -> param('work_id');
my $work_title                    = $cgi -> param('work_title');
my $work_description              = $cgi -> param('work_description');
my $exec_only_one                 = $cgi -> param('exec_only_one');
my $auto_exec_box_id              = $cgi -> param('auto_exec_box_id');
my $bond_parameter_sheet          = $cgi -> param('bond_parameter_sheet');
my $flowchart_before_file_name    = $cgi -> param('flowchart_before_file_name');
my $flowchart_middle_file_name    = $cgi -> param('flowchart_middle_file_name');
my $flowchart_after_file_name     = $cgi -> param('flowchart_after_file_name');
my $flowchart_before_data         = $cgi -> param('flowchart_before_data');
my $flowchart_middle_data         = $cgi -> param('flowchart_middle_data');
my $flowchart_after_data          = $cgi -> param('flowchart_after_data');
my $login_info_file_name          = $cgi -> param('login_info_file_name');
my $login_info_data               = $cgi -> param('login_info_data');
my $syslog_values_file_name       = $cgi -> param('syslog_value_file_name');
my $syslog_values_data            = $cgi -> param('syslog_value_data');
my $diff_values_file_name         = $cgi -> param('diff_values_file_name');
my $diff_values_data              = $cgi -> param('diff_values_data');
my $optional_log_values_file_name = $cgi -> param('optional_log_values_file_name');
my $optional_log_values_data      = $cgi -> param('optional_log_values_data');
my $user                          = $cgi -> param('user');
my $password                      = $cgi -> param('password');
my $enable_password               = $cgi -> param('enable_password');

unless(defined($work_title)){
 $work_title = '';
}

unless(defined($work_description)){
 $work_description = '';
}

unless(defined($user)){
 $user = '';
}

unless(defined($password)){
 $password = '';
}

unless(defined($enable_password)){
 $enable_password = '';
}

unless(defined($auto_exec_box_id)){
 $auto_exec_box_id = '';
}

my $encoded_password        = &TelnetmanWF_common::encode_password($password);
my $encoded_enable_password = &TelnetmanWF_common::encode_password($enable_password);



#
# T_Flow の更新
#
my @set = (
 'iX = ' . $start_x,
 'iY = ' . $start_y,
 "vcStartLinkTarget = '" . $json_start_link_target . "'",
 "txStartLinkVertices = '" . $json_start_link_vertices . "'",
 'iGoalX = ' . $goal_x,
 'iGoalY = ' . $goal_y,
 'iPaperHieght = ' . $paper_height
);
my $table     = 'T_Flow';
my $condition = "where vcFlowId = '" . $flow_id . "'";
$access2db -> set_update(\@set, $table, $condition);
my $count = $access2db -> update_exe;



#
# T_Work の更新
#
while(my ($_work_id, $ref_work_data) = each(%$work_list)){
 my $work_x           = $ref_work_data -> {'x'};
 my $work_y           = $ref_work_data -> {'y'};
 my $ok_link_target        = $ref_work_data -> {'ok_link_target'};
 my $ng_link_target        = $ref_work_data -> {'ng_link_target'};
 my $through_link_target   = $ref_work_data -> {'through_link_target'};
 my $ok_link_vertices      = $ref_work_data -> {'ok_link_vertices'};
 my $ng_link_vertices      = $ref_work_data -> {'ng_link_vertices'};
 my $through_link_vertices = $ref_work_data -> {'through_link_vertices'};
 
 my $json_ok_link_target        = &JSON::to_json($ok_link_target);
 my $json_ng_link_target        = &JSON::to_json($ng_link_target);
 my $json_through_link_target   = &JSON::to_json($through_link_target);
 my $json_ok_link_vertices      = &JSON::to_json($ok_link_vertices);
 my $json_ng_link_vertices      = &JSON::to_json($ng_link_vertices);
 my $json_through_link_vertices = &JSON::to_json($through_link_vertices);
 
 my @set = (
  'iX = ' . $work_x,
  'iY = ' . $work_y,
  "vcOkLinkTarget = '" . $json_ok_link_target . "'",
  "vcNgLinkTarget = '" . $json_ng_link_target . "'",
  "vcThroughTarget = '" . $json_through_link_target . "'",
  "txOkLinkVertices = '" . $json_ok_link_vertices . "'",
  "txNgLinkVertices = '" . $json_ng_link_vertices . "'",
  "txThroughVertices = '" . $json_through_link_vertices . "'"
 );
 
 if($_work_id eq $work_id){
  push(@set, "vcWorkTitle = '" . &Common_sub::escape_sql($work_title) . "'");
  push(@set, "vcWorkDescription = '" . &Common_sub::escape_sql($work_description) . "'");
  push(@set, 'iExecOnlyOne = ' . $exec_only_one);
  push(@set, "vcAutoExecBoxId = '" . $auto_exec_box_id . "'");
  push(@set, 'iBondParameterSheet = ' . $bond_parameter_sheet);
  push(@set, 'iUpdateTime = ' . $time);
  push(@set, "vcUser = '" . &Common_sub::escape_sql($user) . "'");
  push(@set, "vcPassword = '" . &Common_sub::escape_sql($encoded_password) . "'");
  push(@set, "vcEnablePassword = '" . &Common_sub::escape_sql($encoded_enable_password) . "'");
 }
 
 my $table     = 'T_Work';
 my $condition = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $_work_id . "'";
 $access2db -> set_update(\@set, $table, $condition);
 my $count = $access2db -> update_exe;
}



#
# T_Case の更新
#
while(my ($case_id, $ref_case_data) = each(%$case_list)){
 my $case_x             = $ref_case_data -> {'x'};
 my $case_y             = $ref_case_data -> {'y'};
 my $link_target_list   = $ref_case_data -> {'link_target_list'};
 my $link_vertices_list = $ref_case_data -> {'link_vertices_list'};
 
 my $json_link_target_list   = &JSON::to_json($link_target_list);
 my $json_link_vertices_list = &JSON::to_json($link_vertices_list);
 
 my @set = (
  'iX = ' . $case_x,
  'iY = ' . $case_y,
  "txLinkTargetList = '" . $json_link_target_list . "'",
  "txLinkVerticesList = '" . $json_link_vertices_list . "'"
 );
 
 my $table     = 'T_Case';
 my $condition = "where vcFlowId = '" . $flow_id . "' and vcCaseId = '" . $case_id . "'";
 $access2db -> set_update(\@set, $table, $condition);
 my $count = $access2db -> update_exe;
}



#
# T_Terminal の更新
#
while(my ($terminal_id, $ref_terminal_data) = each(%$terminal_list)){
 my $terminal_x = $ref_terminal_data -> {'x'};
 my $terminal_y = $ref_terminal_data -> {'y'};
 
 my @set = (
  'iX = ' . $terminal_x,
  'iY = ' . $terminal_y
 );
 
 my $table     = 'T_Terminal';
 my $condition = "where vcFlowId = '" . $flow_id . "' and vcTerminalId = '" . $terminal_id . "'";
 $access2db -> set_update(\@set, $table, $condition);
 my $count = $access2db -> update_exe;
}



#
# T_File の更新
#
@set = (
 "vcFlowchartBefore = '" . &Common_sub::escape_sql($flowchart_before_file_name) . "'",
 "vcFlowchartMiddle = '" . &Common_sub::escape_sql($flowchart_middle_file_name) . "'",
 "vcFlowchartAfter  = '" . &Common_sub::escape_sql($flowchart_after_file_name) . "'",
 "vcLoginInfo = '" . &Common_sub::escape_sql($login_info_file_name) . "'",
 "vcSyslogValues = '" . &Common_sub::escape_sql($syslog_values_file_name) . "'",
 "vcDiffValues = '" . &Common_sub::escape_sql($diff_values_file_name) . "'",
 "vcOptionalLogValues = '" . &Common_sub::escape_sql($optional_log_values_file_name) . "'",
 'iUpdateTime = ' . $time
);
$table     = 'T_File';
$condition = "where vcFlowId = '" . $flow_id . "' and vcWorkId = '" . $work_id . "'";
$access2db -> set_update(\@set, $table, $condition);
$count = $access2db -> update_exe;

$access2db -> close;

#
# flowchart, loginInfo, diffValues, optionalLog の更新
#
my $file_flowchart_before    = &Common_system::file_flowchart_before($flow_id, $work_id);
my $file_flowchart_middle    = &Common_system::file_flowchart_middle($flow_id, $work_id);
my $file_flowchart_after     = &Common_system::file_flowchart_after($flow_id, $work_id);
my $file_login_info          = &Common_system::file_login_info($flow_id, $work_id);
my $file_syslog_values       = &Common_system::file_syslog_values($flow_id, $work_id);
my $file_diff_values         = &Common_system::file_diff_values($flow_id, $work_id);
my $file_optional_log_values = &Common_system::file_optional_log_values($flow_id, $work_id);

if((length($flowchart_before_file_name) == 0) && (-f $file_flowchart_before)){
 unlink($file_flowchart_before);
}
elsif((length($flowchart_before_file_name) > 0) && (length($flowchart_before_data) > 0)){
 open(FDATAB, '>', $file_flowchart_before);
 print FDATAB $flowchart_before_data;
 close(FDATAB);
}

if((length($flowchart_middle_file_name) == 0) && (-f $file_flowchart_middle)){
 unlink($file_flowchart_middle);
}
elsif((length($flowchart_middle_file_name) > 0) && (length($flowchart_middle_data) > 0)){
 open(FDATAM, '>', $file_flowchart_middle);
 print FDATAM $flowchart_middle_data;
 close(FDATAM);
}

if((length($flowchart_after_file_name) == 0) && (-f $file_flowchart_after)){
 unlink($file_flowchart_after);
}
elsif((length($flowchart_after_file_name) > 0) && (length($flowchart_after_data) > 0)){
 open(FDATAA, '>', $file_flowchart_after);
 print FDATAA $flowchart_after_data;
 close(FDATAA);
}

if((length($login_info_file_name) == 0) && (-f $file_login_info)){
 unlink($file_login_info);
}
elsif((length($login_info_file_name) > 0) && (length($login_info_data) > 0)){
 open(LINFO, '>', $file_login_info);
 print LINFO $login_info_data;
 close(LINFO);
}

if((length($syslog_values_file_name) == 0) && (-f $file_syslog_values)){
 unlink($file_syslog_values);
}
elsif((length($syslog_values_file_name) > 0) && (length($syslog_values_data) > 0)){
 open(SVALUES, '>', $file_syslog_values);
 print SVALUES $syslog_values_data;
 close(SVALUES);
}

if((length($diff_values_file_name) == 0) && (-f $file_diff_values)){
 unlink($file_diff_values);
}
elsif((length($diff_values_file_name) > 0) && (length($diff_values_data) > 0)){
 open(DVALUES, '>', $file_diff_values);
 print DVALUES $diff_values_data;
 close(DVALUES);
}

if((length($optional_log_values_file_name) == 0) && (-f $file_optional_log_values)){
 unlink($file_optional_log_values);
}
elsif((length($optional_log_values_file_name) > 0) && (length($optional_log_values_data) > 0)){
 open(OVALUES, '>', $file_optional_log_values);
 print OVALUES $optional_log_values_data;
 close(OVALUES);
}


my %results = (
 'result' => 1,
 'flow_id' => $flow_id,
 'work_id' => $work_id,
 'work_title' => $work_title,
 'update_time' => $time
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
