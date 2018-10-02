#!/usr/bin/sh

if [ -z "$(ls /var/TelnetmanWF)" ]; then
 mkdir /var/TelnetmanWF/data
 mkdir /var/TelnetmanWF/log
 mkdir /var/TelnetmanWF/tmp

 chmod -R g=u /var/TelnetmanWF/*
fi

/usr/bin/memcached -d

exec /usr/sbin/httpd -D FOREGROUND
