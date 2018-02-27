# NAV-IKT Unleash

Unleash-server som brukes av NAV-IKT. Er satt opp med azure-AD autentisering. (WIP)

### Database setup
```
psql

CREATE USER unleash PASSWORD '...';
CREATE DATABASE unleash;
GRANT ALL ON SCHEMA public TO unleash;
GRANT ALL ON ALL TABLES IN SCHEMA public TO unleash;
```