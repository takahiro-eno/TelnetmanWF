#!/usr/bin/sh

#
# CentOS 7
#

telnetman="";

while [ "${telnetman}" = "" ]
do
 read -p "system linkage Telnetman2's address or hostname : " telnetman
done


yum -y update

yum -y install telnet \
mlocate \
traceroute \
tcpdump \
wget \
zip \
unzip \
gcc \
epel-release \
mariadb-server \
httpd \
mod_ssl \
memcached


yum -y install perl-CGI \
perl-JSON \
perl-Archive-Zip \
perl-Test-Simple \
perl-Digest-MD5 \
perl-ExtUtils-MakeMaker \
perl-libwww-perl \
perl-LWP-Protocol-https \
perl-Crypt-SSLeay \
perl-Crypt-CBC \
perl-Cache-Memcached \
cpan

yum clean all

# CPAN
echo q | /usr/bin/perl -MCPAN -e shell
cpan -f URI::Escape::JavaScript
cpan -f Crypt::Blowfish


# MariaDB
sed -i -e 's/\[mysqld\]/\[mysqld\]\ncharacter-set-server = utf8\nskip-character-set-client-handshake\nmax_connect_errors=999999999\n\n\[client\]\ndefault-character-set=utf8/' /etc/my.cnf.d/server.cnf
systemctl start mariadb
mysql -u root < ./install/TelnetmanWF.sql


# Apache
sed -i -e 's/Options Indexes FollowSymLinks/Options MultiViews FollowSymLinks/' /etc/httpd/conf/httpd.conf
sed -i -e 's/Options None/Options ExecCGI/' /etc/httpd/conf/httpd.conf
sed -i -e 's/#AddHandler cgi-script \.cgi/AddHandler cgi-script \.cgi/' /etc/httpd/conf/httpd.conf
sed -i -e 's/DirectoryIndex index\.html/DirectoryIndex index\.html index\.cgi/' /etc/httpd/conf/httpd.conf
sed -i -e '/ErrorDocument 403/s/^/#/' /etc/httpd/conf.d/welcome.conf
sed -i -e 's/<Directory "\/var\/www\/html">/<Directory "\/var\/www\/html">\n    RewriteEngine on\n    RewriteBase \/\n    RewriteRule ^$ TelnetmanWF\/index.html [L]\n    RewriteCond %{REQUEST_FILENAME} !-f\n    RewriteCond %{REQUEST_FILENAME} !-d\n    RewriteRule ^(.+)$ TelnetmanWF\/$1 [L]\n/' /etc/httpd/conf/httpd.conf


# SSL
sed -i -e "\$a[SAN]\nsubjectAltName='DNS:telnetman" /etc/pki/tls/openssl.cnf
openssl req \
 -newkey rsa:2048 \
 -days 3650 \
 -nodes \
 -x509 \
 -subj "/C=JP/ST=/L=/O=/OU=/CN=telnetman" \
 -extensions SAN \
 -reqexts SAN \
 -config /etc/pki/tls/openssl.cnf \
 -keyout /etc/pki/tls/private/server.key \
 -out /etc/pki/tls/certs/server.crt
chmod 644 /etc/pki/tls/private/server.key
chmod 644 /etc/pki/tls/certs/server.crt
sed -i -e 's/localhost\.key/server.key/' /etc/httpd/conf.d/ssl.conf
sed -i -e 's/localhost\.crt/server.crt/' /etc/httpd/conf.d/ssl.conf


# Directories & Files
mkdir /usr/local/TelnetmanWF
mkdir /usr/local/TelnetmanWF/lib
mkdir /usr/local/TelnetmanWF/pl
mkdir /var/www/html/TelnetmanWF
mkdir /var/www/html/TelnetmanWF/js
mkdir /var/www/html/TelnetmanWF/css
mkdir /var/www/html/TelnetmanWF/img
mkdir /var/www/cgi-bin/TelnetmanWF
mkdir /var/TelnetmanWF
mkdir /var/TelnetmanWF/data
mkdir /var/TelnetmanWF/log
mkdir /var/TelnetmanWF/tmp
mv ./html/* /var/www/html/TelnetmanWF/
mv ./js/*   /var/www/html/TelnetmanWF/js/
mv ./css/*  /var/www/html/TelnetmanWF/css/
mv ./img/*  /var/www/html/TelnetmanWF/img/
mv ./cgi/*  /var/www/cgi-bin/TelnetmanWF/
mv ./lib/*  /usr/local/TelnetmanWF/lib/
mv ./pl/*   /usr/local/TelnetmanWF/pl/
chmod 755 /var/www/cgi-bin/TelnetmanWF/*
chown -R apache:apache /usr/local/TelnetmanWF
chown -R apache:apache /var/www/html/TelnetmanWF
chown -R apache:apache /var/www/cgi-bin/TelnetmanWF
chown -R apache:apache /var/TelnetmanWF


# Update Source Code
sed -i -e "s/192\.168\.203\.96/${telnetman}/" /usr/local/TelnetmanWF/lib/Common_system.pm


# Cron
mv ./install/TelnetmanWF.cron /etc/cron.d/
chmod 644 /etc/cron.d/TelnetmanWF.cron
chown root:root /etc/cron.d/TelnetmanWF.cron


# Logrotate 
mv ./install/TelnetmanWF.logrotate.txt /etc/logrotate.d/TelnetmanWF
chmod 644 /etc/logrotate.d/TelnetmanWF
chown root:root /etc/logrotate.d/TelnetmanWF


# Firewalld
firewall-cmd --add-service=https --permanent


# Disable SELinux
sed -i -e 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config


systemctl enable memcached
systemctl enable mariadb
systemctl enable httpd
