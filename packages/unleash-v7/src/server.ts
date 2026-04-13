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
import { RoleName } from "unleash-server";
import { googleIapAuth, oauthForwardAuth, TeamsService } from "@nais/unleash-shared";

const LOG_LEVELS: Record<string, number> = {
  debug: 0, info: 1, warn: 2, error: 3, fatal: 4,
};

function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL;
  if (envLevel && envLevel in LogLevel) {
    return (LogLevel as any)[envLevel];
  }
  return LogLevel.warn;
}

function shouldLog(level: string, currentLevel: string): boolean {
  return (LOG_LEVELS[level] ?? 0) >= (LOG_LEVELS[currentLevel] ?? 0);
}

async function naisleash(
  shouldStart: boolean,
  teamsService: TeamsService,
  useJWTAuth: boolean = false,
): Promise<IUnleash> {
  const logLevel = getLogLevel();

  let createFunc: ((teamsServer: TeamsService, adminRoleName: string) => Promise<(app: any, config: any, services: any) => void>);
  if (useJWTAuth) {
    createFunc = oauthForwardAuth
  } else {
    createFunc = googleIapAuth
  }

  const iapAuthHandler = await createFunc(teamsService, RoleName.ADMIN);
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
    logLevel,
  };

  if (shouldLog("info", logLevel)) {
    console.log("nais/server.js: Auth handler created successfully");
  }

  if (shouldStart) {
    if (shouldLog("info", logLevel)) {
      console.log("nais/server.js: Starting Unleash server");
    }
    return unleashStart(unleashOptions);
  } else {
    return unleashCreate(unleashOptions);
  }
}

export default naisleash;
