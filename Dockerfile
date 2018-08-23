FROM centos:7

MAINTAINER telnetman

RUN yum -y update

RUN yum -y install telnet \
 mlocate \
 traceroute \
 tcpdump \
 wget \
 zip \
 unzip \
 gcc \
 epel-release \
 git \
 mariadb-server \
 httpd \
 mod_ssl \
 memcached


RUN yum -y install perl-CGI \
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


# CPAN
RUN echo q | /usr/bin/perl -MCPAN -e shell && \
    cpan -f URI::Escape::JavaScript && \
    cpan -f Crypt::Blowfish


# TimeZone
RUN \cp -f /usr/share/zoneinfo/Asia/Tokyo /etc/localtime


# PAM
RUN sed -i -e '/pam_loginuid.so/s/^/#/' /etc/pam.d/crond


# Copy startup script
ADD ./install/start.sh /sbin/start.sh
RUN chmod 744 /sbin/start.sh


# MariaDB
RUN sed -i -e 's/\[mysqld\]/\[mysqld\]\ncharacter-set-server = utf8\nskip-character-set-client-handshake\nmax_connect_errors=999999999\n\n\[client\]\ndefault-character-set=utf8/' /etc/my.cnf.d/server.cnf && \
    mkdir /var/lib/mysql/TelnetmanWF && \
    chmod 700 /var/lib/mysql/TelnetmanWF && \
    chown mysql:mysql /var/lib/mysql/TelnetmanWF
ADD ./install/TelnetmanWF_Docker.sql /root/TelnetmanWF_Docker.sql
VOLUME /var/lib/mysql/TelnetmanWF


# Apache
RUN sed -i -e 's/Options Indexes FollowSymLinks/Options MultiViews/' /etc/httpd/conf/httpd.conf && \
    sed -i -e 's/Options None/Options ExecCGI/' /etc/httpd/conf/httpd.conf && \
    sed -i -e 's/#AddHandler cgi-script \.cgi/AddHandler cgi-script \.cgi/' /etc/httpd/conf/httpd.conf && \
    sed -i -e 's/DirectoryIndex index\.html/DirectoryIndex index.html index\.cgi/' /etc/httpd/conf/httpd.conf && \
    sed -i -e '/ErrorDocument 403/s/^/#/' /etc/httpd/conf.d/welcome.conf && \
    sed -i -e 's/443/9443/' /etc/httpd/conf.d/ssl.conf


# SSL
RUN openssl genrsa 2048 > server.key && \
    echo -e "JP\n\n\n\n\nTelnetmanWF\n\n\n" | openssl req -new -key server.key > server.csr && \
    openssl x509 -days 3650 -req -signkey server.key < server.csr > server.crt && \
    mv server.crt /etc/httpd/conf/ssl.crt && \
    mv server.key /etc/httpd/conf/ssl.key


# Directories & Files
RUN mkdir /usr/local/TelnetmanWF && \
    mkdir /usr/local/TelnetmanWF/lib && \
    mkdir /usr/local/TelnetmanWF/pl && \
    mkdir /var/www/html/TelnetmanWF && \
    mkdir /var/www/html/TelnetmanWF/js && \
    mkdir /var/www/html/TelnetmanWF/css && \
    mkdir /var/www/html/TelnetmanWF/img && \
    mkdir /var/www/cgi-bin/TelnetmanWF && \
    mkdir /var/TelnetmanWF && \
    mkdir /var/TelnetmanWF/data && \
    mkdir /var/TelnetmanWF/log && \
    mkdir /var/TelnetmanWF/tmp
ADD ./html/* /var/www/html/TelnetmanWF/
ADD ./js/*   /var/www/html/TelnetmanWF/js/
ADD ./css/*  /var/www/html/TelnetmanWF/css/
ADD ./img/*  /var/www/html/TelnetmanWF/img/
ADD ./cgi/*  /var/www/cgi-bin/TelnetmanWF/
ADD ./lib/*  /usr/local/TelnetmanWF/lib/
ADD ./pl/*   /usr/local/TelnetmanWF/pl/
RUN chmod 755 /var/www/cgi-bin/TelnetmanWF/* && \
    chown -R apache:apache /var/TelnetmanWF/data && \
    chown -R apache:apache /var/TelnetmanWF/log && \
    chown -R apache:apache /var/TelnetmanWF/tmp
VOLUME /var/TelnetmanWF/data
VOLUME /var/TelnetmanWF/log


# Update Source Code
RUN sed -i -e "s/'telnetman', 'tcpport23'/'root', ''/" /usr/local/TelnetmanWF/lib/Common_system.pm && \
    sed -i -e "s/192\.168\.203\.96/telnetman2/" /usr/local/TelnetmanWF/lib/Common_system.pm && \
    sed -i -e "s/:443/:8443/" /usr/local/TelnetmanWF/lib/TelnetmanWF_common.pm


# Cron
ADD ./install/TelnetmanWF.cron /etc/cron.d/TelnetmanWF.cron
RUN chmod 644 /etc/cron.d/TelnetmanWF.cron


EXPOSE 9443


CMD ["/sbin/start.sh"]
