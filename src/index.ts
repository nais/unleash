import unleash, { IUnleashConfig, IUnleashServices } from "unleash-server";
import {
  IAuthOption,
  IServerOption,
  IVersionOption,
  IUnleashOptions,
} from "unleash-server/dist/lib/types/option";
import createIapAuthHandler from "./google-iap";
import { createConfig } from "unleash-server/dist/lib/create-config";
import {
  parseEnvVarBoolean,
  parseEnvVarNumber,
} from "unleash-server/dist/lib/util";
import { IAuthType, LogLevel } from "unleash-server";

createIapAuthHandler()
  .then(
    (
      iapAuthHandler: (
        app: any,
        config: IUnleashConfig,
        services: IUnleashServices
      ) => void
    ) => {
      const unleashOptions: IUnleashOptions = {
        authentication: {
          type: IAuthType.CUSTOM,
          customAuthHandler: iapAuthHandler,
          createAdminUser: false,
          enableApiToken: parseEnvVarBoolean(
            process.env.AUTH_ENABLE_API_TOKEN,
            true
          ),
          initApiTokens: [],
        } as IAuthOption,
        server: {
          enableRequestLogger: true,
          baseUriPath: "",
          port: parseEnvVarNumber(process.env.SERVER_PORT, 4242),
        } as IServerOption,
        versionCheck: {
          enable: false,
        } as IVersionOption,
        logLevel: LogLevel.info,
      };

      const config = createConfig(unleashOptions);
      const logger = config.getLogger("nais/index.js");

      logger.info("Google IAP auth handler created successfully");
      logger.info("Starting Unleash server with options: ", unleashOptions);

      unleash
        .start(unleashOptions)
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
    console.error("Failed to create Google IAP auth handler: ", error);
  });
