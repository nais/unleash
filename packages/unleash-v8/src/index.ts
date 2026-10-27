import naisleash from "./server";
import { NaisTeamsGrpc } from "@nais/unleash-shared";

const NAIS_API_ADDRESS: string = process.env.NAIS_API_ADDRESS || "";
const OAUTH_JWT_AUTH: boolean = (process.env.OAUTH_JWT_AUTH ?? "false") == "true";
const TEAMS_ALLOWED_TEAMS: string[] = (
  process.env.TEAMS_ALLOWED_TEAMS || ""
).split(",");

const teamsService = new NaisTeamsGrpc(
  NAIS_API_ADDRESS,
  TEAMS_ALLOWED_TEAMS,
);

naisleash(true, teamsService, OAUTH_JWT_AUTH)
  .then((server) => {
    const port: number = server.app.get("port");
    const logger = server.config.getLogger("nais/index.js");
    console.log(`Unleash server successfully started on port '${port}'`);
    logger.debug("Unleash server config: ", server.config);
  })
  .catch((error: Error) => {
    console.error("Unleash server failed to start: ", error);
  });
