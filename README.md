

### Database setup
```
psql
postgres=# CREATE SCHEMA unleash;
postgres=# CREATE USER unleash PASSWORD '...';
postgres=# CREATE DATABASE unleash;
postgres=# GRANT ALL ON SCHEMA unleash TO unleash;
postgres=# GRANT ALL ON TABLES IN SCHEMA unleash TO unleash
```