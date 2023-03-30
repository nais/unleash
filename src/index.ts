import unleash from "unleash-server";
import enableIapAuth from "./googleIAP-auth-hook";
import { IAuthType, LogLevel } from "unleash-server";

console.log("starting", enableIapAuth);
unleash
  .start({
    authentication: {
      type: IAuthType.CUSTOM,
      customAuthHandler: enableIapAuth,
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
