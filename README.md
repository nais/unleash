# NAV Unleash
![Workflow status](https://github.com/navikt/unleash/workflows/build/badge.svg)

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

### Info om redirectUri

Appen bruker Azure AD Proxy for å bli nådd fra innrullert maskin. Da bruker vi azure-`preauth`, som returnerer tilbake
til root (unleash.nais.adeo.no). Derfor har vi to callback-uri-er. Der den ene er definert i env-variabler.

## Miljøer

### Dev
* fss
* gcp

### prod
* fss
* gcp

### Fasit-ressurser

Vi har legacy avhengighet i Fasit. https://fasit.adeo.no/applications/unleash og https://fasit.adeo.no/resources?application=unleash. Gjør vi endringer på ingress, må disse også oppdateres.

## Henvendelser

Henvendelser og spørsmål kan gjøres via issues på repoet. For direkte kontakt kan man også høre med Tjenesteplattform (NADA og NAIS). For NAV-ansatte kan dette enklest gjøres via slack-kanalen #unleash. Der vil man også kunne komme i kontakt med enkelte av utviklerne av Unleash (upstream).
For eksterne er det mulig å sende mail til Audun F. Strand (audun.fauchald.strand@nav.no).
