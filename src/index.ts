import unleash from "unleash-server";
import createIapAuthHandler from "./google-iap";
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
          port: 4242, // @TODO make en env var or something?
        },
        versionCheck: {
          enable: false,
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
