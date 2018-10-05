#!/usr/bin/sh

if [ -z "$(ls /var/TelnetmanWF)" ]; then
 mkdir /var/TelnetmanWF/data
 mkdir /var/TelnetmanWF/log
 mkdir /var/TelnetmanWF/tmp

 touch /var/TelnetmanWF/log/sql_log
 touch /var/TelnetmanWF/log/logrotate.status

 chmod -R g=u /var/TelnetmanWF/*
fi

exec /usr/sbin/httpd -D FOREGROUND
