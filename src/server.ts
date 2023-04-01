import unleash from "unleash-server";
import { IUnleash } from "unleash-server/dist/lib/types/core";
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

async function naisleash(start: boolean): Promise<IUnleash> {
  const iapAuthHandler = await createIapAuthHandler();
  const unleashOptions: IUnleashOptions = {
    authentication: {
      type: IAuthType.CUSTOM,
      customAuthHandler: iapAuthHandler,
      createAdminUser: false,
      enableApiToken: parseEnvVarBoolean(
        process.env.AUTH_ENABLE_API_TOKEN || "true",
        true
      ),
      initApiTokens: [],
    } as IAuthOption,
    server: {
      enableRequestLogger: true,
      baseUriPath: "",
      port: parseEnvVarNumber(process.env.SERVER_PORT || "4242", 4242),
    } as IServerOption,
    versionCheck: {
      enable: false,
    } as IVersionOption,
    logLevel: LogLevel.info,
  };
  const config = createConfig(unleashOptions);
  const logger = config.getLogger("nais/server.js");

  logger.info("Google IAP auth handler created successfully");

  if (start) {
    logger.info("Starting Unleash server with options: ", unleashOptions);
    return unleash.start(unleashOptions);
  } else {
    return unleash.create(unleashOptions);
  }
}

export default naisleash;
