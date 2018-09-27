#!/usr/bin/sh

# Start memcached
/usr/bin/memcached -d

# Start MariaDB
/usr/bin/mysqld_safe --skip-grant-tables &
/bin/sleep 5

# Start Apache
/usr/sbin/httpd -D FOREGROUND
