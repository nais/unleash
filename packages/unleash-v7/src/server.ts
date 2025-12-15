import {
  start as unleashStart,
  create as unleashCreate,
  type IUnleash,
  type IAuthType as AuthType,
  type IAuthOption,
  type IServerOption,
  type IVersionOption,
  type IUnleashOptions,
  LogLevel,
  parseEnvVarBoolean,
  parseEnvVarNumber,
} from "unleash-server";
import { googleIapAuth, oauthForwardAuth, TeamsService } from "@nais/unleash-shared";

async function naisleash(
  shouldStart: boolean,
  teamsService: TeamsService,
  useJWTAuth: boolean = false,
): Promise<IUnleash> {
  let createFunc: ((teamsServer: TeamsService) => Promise<(app: any, config: any, services: any) => void>) | undefined = undefined;
  if (useJWTAuth) {
    createFunc = oauthForwardAuth
  } else {
    createFunc = googleIapAuth
  }

  const iapAuthHandler = await createFunc(teamsService);
  const unleashOptions: IUnleashOptions = {
    authentication: {
      type: "custom" as AuthType,
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

  console.log("nais/server.js: Auth handler created successfully");

  if (shouldStart) {
    console.log("nais/server.js: Starting Unleash server");
    return unleashStart(unleashOptions);
  } else {
    return unleashCreate(unleashOptions);
  }
}

export default naisleash;
