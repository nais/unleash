# NAV Unleash
[Workflow status](https://github.com/navikt/unleash/workflows/build/badge.svg)
En enkel [unleash-server](https://github.com/Unleash/unleash) med AzureAD-pålogging. 

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

## Miljøer

### Dev
* fss
* gcp

### prod
* fss
* gcp

## Henvendelser

Henvendelser og spørsmål kan gjøres via issues på repoet. For direkte kontakt
kan man også høre med Team Dataplattform (NADA). For NAV-ansatte kan dette enklest gjøres via slack-kanalen #dataplattform.
For eksterne er det mulig å sende mail til Christopher Kolstad (christopher.kolstad@nav.no) eller Audun F. Strand (audun.fauchald.strand@nav.no)
