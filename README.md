# NAV-IKT Unleash

Unleash-server som brukes av NAV-IKT. Er satt opp med azure-AD autentisering. (WIP)

## Oppsett for utvikling lokalt

For å teste kjøre opp en test-instans lokalt kan man bruke `docker-compose up`.
Denne vil sette opp en lokal postgres database i en docker-container og
eksponere unleash på url `http://localhost:8080`. Autentisering vil være
skrudd av.

For å bygge koden kjører du `npm run build`. Dette vil kompilere typescript-filene til ES2017
som legges i `./dist/`. Unleash kan da kjøres med `npm start`.

### Database setup
```
$ psql

> CREATE USER unleash PASSWORD '...';
> CREATE DATABASE unleash;
> GRANT ALL ON SCHEMA public TO unleash;
> GRANT ALL ON ALL TABLES IN SCHEMA public TO unleash;
```