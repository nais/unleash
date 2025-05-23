import unleash from "unleash-server";
import { IUnleash } from "unleash-server/dist/lib/types/core";
import {
  IAuthOption,
  IServerOption,
  IVersionOption,
  IUnleashOptions,
} from "unleash-server/dist/lib/types/option";
import createIapAuthHandler from "./google-iap";
import createJWTAuthHandler from "./oauth-fa";
import { createConfig } from "unleash-server/dist/lib/create-config";
import {
  parseEnvVarBoolean,
  parseEnvVarNumber,
} from "unleash-server/dist/lib/util";
import { IAuthType, LogLevel } from "unleash-server";
import { TeamsService } from "nais-teams";

async function naisleash(
  start: boolean,
  teamsService: TeamsService,
  useJWTAuth: boolean = false,
): Promise<IUnleash> {
	let createFunc : ((teamsServer: TeamsService) => Promise<(app: any, config: any, services: any) => void>) | undefined = undefined;
	if(useJWTAuth) {
		createFunc = createJWTAuthHandler
	} else {
		createFunc = createIapAuthHandler
	}
	
  const iapAuthHandler = await createFunc(teamsService);
  const unleashOptions: IUnleashOptions = {
    authentication: {
      type: IAuthType.CUSTOM,
      customAuthHandler: iapAuthHandler,
      createAdminUser: false,
      enableApiToken: parseEnvVarBoolean(
        process.env.AUTH_ENABLE_API_TOKEN || "true",
        true,
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
    logLevel: process.env.LOG_LEVEL
      ? (LogLevel as any)[process.env.LOG_LEVEL]
      : LogLevel.warn,
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
