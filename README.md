

### Database setup
```
psql

CREATE SCHEMA unleash;
CREATE USER unleash PASSWORD '...';
CREATE DATABASE unleash;
GRANT ALL ON SCHEMA unleash TO unleash;
GRANT ALL ON ALL TABLES IN SCHEMA unleash TO unleash;
```