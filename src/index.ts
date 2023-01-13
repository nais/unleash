import unleash from "unleash-server";
import { IAuthType, LogLevel } from "unleash-server";
import azureAuthHook from "./azure-auth-hook";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://unleash_user:passord@localhost:5432/unleash?ssl=false";

console.log("this, starting");
unleash
  .start({
    //databaseUrl: databaseUrl,
    //db: {
    //  user: "unleash",
    //  password: "unleash",
    //  host: "postgres",
    //  port: 5432,
    //  database: "unleash",
    //  ssl: false,
    //},
    authentication: {
      type: IAuthType.CUSTOM,
      customAuthHandler: azureAuthHook,
    },
    server: {
      enableRequestLogger: true,
      baseUriPath: "",
      port: 8080,
    },
    logLevel: LogLevel.info,
  })
  .then((server) => {
    console.log("there, start");
    console.log("Unleash started");
  })
  .catch((error) => {
    console.log("here, err");
    console.error(error);
  });
