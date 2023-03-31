import unleash from "unleash-server";
import createIapAuthHandler from "./googleIAP-auth-hook";
import { IAuthType, LogLevel } from "unleash-server";

createIapAuthHandler()
  .then((iapAuthHandler) => {
    console.log("starting unleash server with IAP auth");
    unleash
      .start({
        authentication: {
          type: IAuthType.CUSTOM,
          customAuthHandler: iapAuthHandler,
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
  })
  .catch((error) => {
    console.error(error);
  });
