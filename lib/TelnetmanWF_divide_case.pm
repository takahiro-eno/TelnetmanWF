#!/usr/bin/perl
# 説明   : 条件分岐を実行する。
# 作成日 : 2015/06/17
# 作成者 : 江野高広
# 更新   : 2017/08/25 $node も条件分岐の変数として使えるように。

use strict;
use warnings;

package TelnetmanWF_divide_case;



sub new {
 my $self = $_[0];
 
 my %parameter_list = (
  'node' => '',
  'node_list' => undef,
  'interface_list' => undef,
  'node_info' => undef,
  'interface_info' => undef,
  'ERROR_message' => ''
 );
 
 bless(\%parameter_list, $self);
}



#
# ノードリストを記録する。
#
sub set_node_list {
 my $self = $_[0];
 my $ref_node_list = $_[1];
 my @nodelist = @$ref_node_list;
 $self -> {'node_list'} = \@nodelist;
}



#
# ノード情報、インターフェースリスト、インターフェース情報を記録する。
#
sub set_parameters {
 my $self = $_[0];
 my $ref_parameters = $_[1];
 
 my $ref_interface_list = $ref_parameters -> {'interface_list'};
 my $ref_node_info      = $ref_parameters -> {'node_info'};
 my $ref_interface_info = $ref_parameters -> {'interface_info'};
 
 my %interface_list = ();
 my %node_info = ();
 my %interface_info = ();
 
 foreach my $node (@{$self -> {'node_list'}}){
  my %node_info_per_node = %{$ref_node_info -> {$node}};
  $node_info{$node} = \%node_info_per_node;
  
  my @interface_list_per_node = ();
  my %interface_info_per_node = ();
  
  foreach my $interface (@{$ref_interface_list -> {$node}}){
   push(@interface_list_per_node, $interface);
   my %interface_info_per_node_per_interface = %{$ref_interface_info -> {$node} -> {$interface}};
   $interface_info_per_node{$interface} = \%interface_info_per_node_per_interface;
  }
  
  $interface_list{$node} = \@interface_list_per_node;
  $interface_info{$node} = \%interface_info_per_node;
 }
 
 $self -> {'interface_list'} = \%interface_list;
 $self -> {'node_info'} = \%node_info;
 $self -> {'interface_info'} = \%interface_info;
}



#
# ノードリストからノードを1つ取り出す。
#
sub shift_node {
 my $self = $_[0];
 
 if(scalar(@{$self -> {'node_list'}}) > 0){
  my $node = shift(@{$self -> {'node_list'}});
  $self -> {'node'} = $node;
  
  return(1);
 }
 else{
  return(0);
 }
}



#
# shift されたノードを返す。
#
sub get_node {
 my $self = $_[0];
 my $node = $self -> {'node'};
 return($node);
}



#
# 条件分岐を実行する。
#
sub divide {
 my $self = $_[0];
 my $ref_conditions = $_[1];
 my $N = scalar(@$ref_conditions);
 
 &TelnetmanWF_divide_case::crear_error_message($self);
 
 my @divided_node_list_list = ();
 for(my $n = 0; $n < $N; $n ++){
  my @divided_node_list = ();
  $divided_node_list_list[$n] = \@divided_node_list;
 }
 
 my @unmatched_node_list = ();
 
 if($N == 0){
  &TelnetmanWF_divide_case::write_error_message($self, '分岐条件が未定義です');
  return(\@divided_node_list_list, \@unmatched_node_list);
 }
 
 my $exists_condition = 0;
 if(scalar(@{$ref_conditions -> [0]}) > 0){
  if(scalar(@{$ref_conditions -> [0] -> [0]}) > 0){
   if(length($ref_conditions -> [0] -> [0] -> [0]) > 0){
    $exists_condition = 1;
   }
  }
 }
 
 if($exists_condition == 0){
  &TelnetmanWF_divide_case::write_error_message($self, '分岐条件が未定義です');
  return(\@divided_node_list_list, \@unmatched_node_list);
 }
 
 
 NODE : while(&TelnetmanWF_divide_case::shift_node($self)){
  my $node = &TelnetmanWF_divide_case::get_node($self);
  
  for(my $n = 0; $n < $N; $n ++){
   my $OK_NG = 1;
   my $ref_condition_list = $ref_conditions -> [$n];
   
   OR : foreach my $ref_condition_row (@$ref_condition_list){
    unless(defined($ref_condition_row)){
     next OR;
    }
    
    AND : foreach my $condition (@$ref_condition_row){
     unless(defined($condition) && (length($condition) > 0)){
      next AND;
     }
     
     my $complete_condition = &TelnetmanWF_divide_case::insert_skeleton_values($self, $condition);
     
     unless(defined($complete_condition)){
      return(\@divided_node_list_list, \@unmatched_node_list);
     }
     
     my $perl_code = 'if(' . $complete_condition . '){$OK_NG = 1;}else{$OK_NG = 0;}';
     eval($perl_code);
     
     if(length($@) > 0){
      &TelnetmanWF_divide_case::write_error_message($self, '分岐条件の書き方がおかしいようです。' . "\n" . '置換済み分岐条件 : ' . $complete_condition);
      $@ = '';
      
      return(\@divided_node_list_list, \@unmatched_node_list);
     }
     
     if($OK_NG == 0){
      next OR;
     }
    }
    
    last OR;
   }
   
   if($OK_NG == 1){
    push(@{$divided_node_list_list[$n]}, $node);
    next NODE;
   }
  }
  
  push(@unmatched_node_list, $node);
 }
 
 return(\@divided_node_list_list, \@unmatched_node_list);
}



#
# スケルトンを埋める。
#
sub insert_skeleton_values {
 my $self   = $_[0];
 my $string = $_[1];
 my $replaced_string = "";
 
 unless(defined($string) && (length($string) > 0)){
  return('');
 }
 
 my $node = &TelnetmanWF_divide_case::get_node($self);
 
 my @string_list = split(//, $string);
 my @stack = ();
 
 my $flag_escape = 0;
 STACK1 : foreach my $character (@string_list){
  if(($flag_escape == 0) && ($character eq "\\")){
   $flag_escape = 1;
   next;
  }
  
  if($flag_escape == 1){
   push(@stack, $character);
   $flag_escape = 0;
   next;
  }
  
  if($character eq '}'){
   my $variable_name = '';
   
   my $poped_character = '';
   my $joined_character = '';
   while($poped_character ne '{'){
    $joined_character = $poped_character . $joined_character;
    
    if(scalar(@stack) == 0){
     push(@stack, $joined_character);
     next STACK1;
    }
    
    $poped_character = pop(@stack);
    
    if($poped_character eq ':'){
     $variable_name = $joined_character;
    }
   }
   
   my $value = '';
   if($joined_character =~ /^\$/){
    if($joined_character eq '$node'){
     $value = $node;
    }
    else{
     $value = undef;
    }
   }
   elsif($joined_character =~ /.+:.+/){
    my @interface_and_variable_name = split(/:/, $joined_character);
    splice(@interface_and_variable_name, -1);
    my $interface = join(':', @interface_and_variable_name);
    
    if(defined($self -> {'interface_info'} -> {$node} -> {$interface}) && defined($self -> {'interface_info'} -> {$node} -> {$interface} -> {$variable_name})){
     $value = $self -> {'interface_info'} -> {$node} -> {$interface} -> {$variable_name};
    }
    else{
     $value = undef;
    }
   }
   else{
    my $variable_name = $joined_character;
    if(defined($self -> {'node_info'} -> {$node} -> {$variable_name})){
     $value = $self -> {'node_info'} -> {$node} -> {$variable_name};
    }
    else{
     $value = undef;
    }
   }
   
   if(defined($value)){
    push(@stack, $value);
   }
   else{
    &TelnetmanWF_divide_case::write_error_message($self, '{' . $joined_character . '} を埋める変数が未定義、または、使用不能です。');
    
    return(undef);
   }
   
   $variable_name = '';
  }
  else{
   push(@stack, $character);
  }
 }
 
 $replaced_string = join('', @stack);
 
 return($replaced_string);
}



# エラーメッセージを書き込む。
sub write_error_message {
 my $self = $_[0];
 my $error_message = $_[1];
 $self -> {'ERROR_message'} = $error_message;
}

# エラーメッセージを空にする。
sub crear_error_message {
 my $self = $_[0];
 $self -> {'ERROR_message'} = '';
}

# エラーメッセージを返す。
sub get_error_message {
 my $self = $_[0];
 return($self -> {'ERROR_message'});
}

1;
