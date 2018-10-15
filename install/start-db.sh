#!/usr/bin/sh

if [ ! -e "/var/lib/mysql/TelnetmanWF" ]; then
 mkdir /var/lib/mysql/TelnetmanWF
 /usr/bin/mysqld_safe --skip-grant-tables &
 /bin/sleep 10
 /bin/mysql -u root < /root/TelnetmanWF.sql
 /bin/mysqladmin shutdown

 chmod -R g=u /var/lib/mysql/*
fi

exec /usr/bin/mysqld_safe --skip-grant-tables
