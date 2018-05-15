#!/usr/bin/perl
# 説明   : workflow 一覧を取得する。
# 作成者 : 江野高広
# 作成日 : 2015/05/07
# 更新   : 2016/05/16 ページング機能を追加。
#          2016/07/05 検索機能の追加。

use strict;
use warnings;

use CGI;
use JSON;

use lib '/usr/local/TelnetmanWF/lib';
use Common_system;
use Common_sub;
use Access2DB;

my $cgi = new CGI;



#
# 1ページにのせる件数。
#
my $N = 10;



#
# ページの定義。
#
my $page = $cgi -> param('page');

unless(defined($page) && (length($page) > 0)){
 $page = 1;
}
elsif($page !~ /^[0-9]+$/){
 $page = 1;
}
elsif($page =~ /^0+$/){
 $page = 1;
}

$page += 0;



#
# 検索キーワード。
#
my $title_condition = "";
my $search_word = $cgi -> param('search_word');

unless(defined($search_word) && (length($search_word) > 0)){
 $search_word = '';
}

if(length($search_word) > 0){
 $title_condition = "where vcFlowTitle like '\%" . &Common_sub::escape_sql($search_word) . "\%' ";
}



#
# DB アクセスのためのオブジェクトを作成する。
#
my ($DB_name, $DB_host, $DB_user, $DB_password) = &Common_system::DB_connect_parameter();
my @DB_connect_parameter_list                   = ('dbi:mysql:' . $DB_name . ':' . $DB_host, $DB_user, $DB_password);
my $access2db                                   = Access2DB -> open(@DB_connect_parameter_list);



#
# flow の件数を取得。
#
my $select_column = 'count(*)';
my $table         = 'T_Flow';
my $condition     = $title_condition;
$access2db -> set_select($select_column, $table, $condition);
my $number_of_flow = $access2db -> select_col1;
$number_of_flow += 0;



#
# オフセットと取り出す個数を定義。
#
my $offset = $number_of_flow - $N * $page;
my $limit  = $N;

if($offset < 0){
 $offset = 0;
 $limit  = $number_of_flow - $N * ($page - 1);
}



#
# flow 一覧の取得。
#
$select_column = 'vcFlowId,vcFlowTitle';
$table         = 'T_Flow';
$condition     = $title_condition . 'order by iCreateAt limit ' . $offset . ',' . $limit;
$access2db -> set_select($select_column, $table, $condition);
my $ref_flow = $access2db -> select_array_cols;



#
# flow 一覧のまとめ。
#
my @flow_id_list = ();
my %flow_title_list = ();

foreach my $ref_row (@$ref_flow){
 my ($flow_id, $flow_title) = @$ref_row;
 
 unshift(@flow_id_list, $flow_id);
 $flow_title_list{$flow_id} = $flow_title;
}



#
# task 一覧の取得。
#
$select_column = 'vcFlowId,vcTaskId,vcTaskTitle';
$table         = 'T_Task';
$condition     = "where vcFlowId in ('" . join("','", @flow_id_list) . "') and iActive = 1 order by iCreateAt";
$access2db -> set_select($select_column, $table, $condition);
my $ref_task = $access2db -> select_array_cols;



$access2db -> close;



#
# task 一覧のまとめ。
#
my %task_id_list = ();
my %task_title_list = ();

foreach my $ref_row (@$ref_task){
 my ($flow_id, $task_id, $task_title) = @$ref_row;
 
 unless(exists($task_id_list{$flow_id})){
  $task_id_list{$flow_id} = [];
 }
 
 unshift(@{$task_id_list{$flow_id}}, $task_id);
 $task_title_list{$task_id} = $task_title;
}



#
# 最後のページを求める。
#
my $last_page = int($number_of_flow / $N);

if($number_of_flow % $N > 0){
 $last_page ++;
}



my %results = (
 'page'      => $page,
 'last_page' => $last_page,
 'flow_id_list'    => \@flow_id_list,
 'flow_title_list' => \%flow_title_list,
 'task_id_list'    => \%task_id_list,
 'task_title_list' => \%task_title_list
);

my $json_results = &JSON::to_json(\%results);

print "Content-type: text/plain; charset=UTF-8\n\n";
print $json_results;
