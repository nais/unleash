import unleash from "unleash-server";
import azureAuthHook from "./src/google-auth-hook";
import { IAuthType, LogLevel } from "unleash-server";

console.log("starting");
unleash
  .start({
    authentication: {
      type: IAuthType.CUSTOM,
      customAuthHandler: enableGoogleOauth,
    },
    server: {
      enableRequestLogger: true,
      baseUriPath: "",
      port: 8080,
    },
    logLevel: LogLevel.info,
  })
  .then((server) => {
    console.log("Unleash started");
  })
  .catch((error) => {
    console.error(error);
  });
