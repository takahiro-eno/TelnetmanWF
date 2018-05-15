#!/usr/bin/perl
# 説明   : 共通で使えそうなサブルーチン集
# 作成日 : 2015/05/05
# 作成者 : 江野高広


use strict;
use warnings;

package Common_sub;

use Digest::MD5 qw(md5_hex);
use URI::Escape::JavaScript;#CPAN /usr/local/share/perl5/URI/Escape/JavaScript.pm

# unixtime を指定したフォーマットの日付に変換
sub YYYYMMDDhhmmss {
 my ($unixtime, @format_list) = @_;
 
 unless(defined($unixtime) && (length($unixtime) > 0)){
  $unixtime = time;
 }
 
 unless(defined($format_list[0]) && (length($format_list[0]) > 0)){
  $format_list[0] = 'YYYY/MM/DD hh:mm:ss';
 }
 
 my ($sec, $min, $hour, $mday, $mon, $year) = (localtime($unixtime))[0,1,2,3,4,5];
 
 $year += 1900;
 $mon  += 1;
 
 $mon  = sprintf('%02d', $mon);
 $mday = sprintf('%02d', $mday);
 $hour = sprintf('%02d', $hour);
 $min  = sprintf('%02d', $min);
 $sec  = sprintf('%02d', $sec);
 
 foreach my $format (@format_list){
  $format =~ s/YYYY/$year/g;
  $format =~ s/MM/$mon/g;
  $format =~ s/DD/$mday/g;
  $format =~ s/hh/$hour/g;
  $format =~ s/mm/$min/g;
  $format =~ s/ss/$sec/g;
 }
 
 return(@format_list);
}

# 文字列のメタ文字をエスケープ
sub escape_reg {
 my $string = $_[0];
 
 $string =~ s/\^/\\\^/g;
 $string =~ s/\$/\\\$/g;
 $string =~ s/\+/\\\+/g;
 $string =~ s/\*/\\\*/g;
 $string =~ s/\?/\\\?/g;
 $string =~ s/\./\\\./g;
 $string =~ s/\(/\\\(/g;
 $string =~ s/\)/\\\)/g;
 $string =~ s/\[/\\\[/g;
 $string =~ s/\]/\\\]/g;
 $string =~ s/\{/\\\{/g;
 $string =~ s/\}/\\\}/g;
 $string =~ s/\//\\\//g;
 $string =~ s/\|/\\\|/g;
 
 return($string);
}

# 文字列の中のファイル名に使えない文字を「-」に変換
sub escape_filename {
 my $filename = $_[0];
 
 $filename =~ s/\s/-/g;
 $filename =~ s/\\/-/g;
 $filename =~ s/\//-/g;
 $filename =~ s/:/-/g;
 $filename =~ s/\*/-/g;
 $filename =~ s/\?/-/g;
 $filename =~ s/"/-/g;
 $filename =~ s/</-/g;
 $filename =~ s/>/-/g;
 $filename =~ s/\|/-/g;
 
 return($filename);
}

# 文字列の中のHTML に使う文字をエスケープ
sub escape_HTML {
 my $string = $_[0];
 
 $string =~ s/&/&amp;/g;
 $string =~ s/"/&quot;/g;
 $string =~ s/</&lt;/g;
 $string =~ s/>/&gt;/g;
 
 return($string);
}

# エスケープされたHTML の文字を元に戻す。
sub escape_HTML_reverse {
 my $string = $_[0];
 
 $string =~ s/&gt;/>/g;
 $string =~ s/&lt;/</g;
 $string =~ s/&quot;/"/g;
 $string =~ s/&amp;/&/g;
 
 return($string);
}

# 文字列の中の、sql 文の構文エラーになる「\」や「'」をエスケープする。
# ついでに前後の空白も除去する。
sub escape_sql {
 my $string = $_[0];
 
 $string =~ s/\r//g;
 $string =~ s/\\/\\\\/g;
 $string =~ s/'/\\'/g;
 
 return($string);
}

# 改行コードを\n に統一。空の行除去。
sub trim_lines {
 my $lines = $_[0];
 
 unless(defined($lines)){
  return('');
 }
 
 $lines =~ s/\r//g;
 $lines =~ s/\n+/\n/g;
 $lines =~ s/^\n//;
 $lines =~ s/\n$//;
 
 return($lines);
}


# 全角文字を含んでいたら0 無かったら1
sub check_fullsize_character {
 my $string = $_[0];
 my $escaped_string = &URI::Escape::JavaScript::js_escape($string);
 my @split_escaped_string = split(//, $escaped_string);
 my $length_split_escaped_string = scalar(@split_escaped_string);
 
 for(my $i = 0; $i < $length_split_escaped_string; $i ++){
  if($split_escaped_string[$i] eq '%'){
   $i ++;
   if($split_escaped_string[$i] eq 'u'){
    return(0);
   }
   else{
    $i ++;
   }
  }
 }
 
 return(1);
}


# 任意の長さのランダムな文字列を作成する。
sub make_random_string {
 my $length = $_[0];
 
 unless(defined($length)){
  $length = 32;
 }
 
 my @small = ('a'..'z');
 my @large = ('A'..'Z');
 my $random_string = '';
 
 for(my $i = 0; $i < $length; $i++){
  my $nsl = int(rand(3));
  if($nsl == 0){
   $random_string .= int(rand(10));
  }
  elsif($nsl == 1){
   $random_string .= $small[int(rand(24))];
  }
  elsif($nsl == 2){
   $random_string .= $large[int(rand(24))];
  }
 }
 
 return($random_string);
}

# 入力されたパスワードをDigest::MD5 (hex) で暗号化する。
sub encode_password {
 my $password = $_[0];

 my $salt = &Common_sub::make_random_string(8);
 my $encoded_password = $salt . &Digest::MD5::md5_hex($salt . $password);

 return($encoded_password);
}

# 入力されたパスワードが登録済みのものと同じか確認する。
sub check_password {
 my $password = $_[0];
 my $registerd_password = $_[1];

 my $salt = substr($registerd_password, 0, 8);
 my $encoded_password = $salt . &Digest::MD5::md5_hex($salt . $password);

 if($encoded_password eq $registerd_password){
  return(1);
 }
 else{
  return(0);
 }
}

# フルパスからファイル名を取り出す。
sub get_file_name {
 my $path = $_[0];
 my $file_name = '';
 
 my $length_path = length($path);
 my $pos = rindex($path, '/');
 
 if($pos < $length_path - 1){
  $file_name = substr($path, $pos + 1);
 }
 
 return($file_name);
}

1;
