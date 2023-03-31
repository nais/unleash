import unleash, { IUnleashConfig, IUnleashServices } from "unleash-server";
import {
  IAuthOption,
  IServerOption,
  IVersionOption,
  IUnleashOptions,
} from "unleash-server/dist/lib/types/option";
import createIapAuthHandler from "./google-iap";
import { getLogger, Logger } from "log4js";
import { IAuthType, LogLevel } from "unleash-server";

const logger: Logger = getLogger("nais/index.js");

createIapAuthHandler()
  .then(
    (
      iapAuthHandler: (
        app: any,
        config: IUnleashConfig,
        services: IUnleashServices
      ) => void
    ) => {
      logger.info("Google IAP auth handler created successfully");
      logger.info("Starting Unleash server");

      const unleashConfig: IUnleashOptions = {
        authentication: {
          type: IAuthType.CUSTOM,
          customAuthHandler: iapAuthHandler,
          createAdminUser: false,
          enableApiToken: false,
          initApiTokens: [],
        } as IAuthOption,
        server: {
          enableRequestLogger: true,
          baseUriPath: "",
          port: parseInt(process.env.PORT || "4242"),
        } as IServerOption,
        versionCheck: {
          enable: false,
        } as IVersionOption,
        logLevel: LogLevel.info,
      };

      unleash
        .start(unleashConfig)
        .then((server) => {
          const port: number = server.app.get("port");
          logger.info(
            `Unleash server started successfully and listening on port ${port}`
          );
        })
        .catch((error: Error) => {
          logger.error("Unleash server failed to start: ", error);
        });
    }
  )
  .catch((error: Error) => {
    logger.error("Failed to create Google IAP auth handler: ", error);
  });
