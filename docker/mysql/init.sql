CREATE DATABASE IF NOT EXISTS courtly_test;
CREATE DATABASE IF NOT EXISTS courtly_shadow;

GRANT ALL PRIVILEGES ON courtly_test.* TO 'courtly'@'%';
GRANT ALL PRIVILEGES ON courtly_shadow.* TO 'courtly'@'%';
FLUSH PRIVILEGES;
