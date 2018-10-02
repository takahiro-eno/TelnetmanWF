#!/usr/bin/sh

if [ -z "$(ls /var/lib/mysql/TelnetmanWF)" ]; then
 /usr/bin/mysqld_safe --skip-grant-tables &
 /bin/sleep 5
 /bin/mysql -u root < /root/TelnetmanWF.sql
 /bin/mysqladmin shutdown

 chmod -R g=u /var/lib/mysql/TelnetmanWF/*
fi

exec /usr/bin/mysqld_safe --skip-grant-tables
