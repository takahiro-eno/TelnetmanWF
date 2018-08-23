#!/usr/bin/sh

# Start Cron
/usr/sbin/crond

# Start memcached
/usr/bin/memcached -d -u root

# Start MariaDB
/usr/bin/mysqld_safe --skip-grant-tables &
/bin/sleep 5
/bin/mysql -u root < /root/TelnetmanWF_Docker.sql

# Start Apache
/usr/sbin/httpd -D FOREGROUND
