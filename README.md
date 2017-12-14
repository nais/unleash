

###Database setup
```
psql
postgres=# CREATE SCHEMA unleash;
CREATE SCHEMA
postgres=# CREATE USER unleash PASSWORD '...';
CREATE ROLE
postgres=# GRANT ALL ON SCHEMA unleash TO unleash;
GRANT
postgres=# GRANT ALL ON TABLES IN SCHEMA unleash TO unleash
```