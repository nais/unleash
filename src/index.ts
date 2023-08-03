import naisleash from "./server";
import { NaisTeams } from "./nais-teams";

const TEAMS_API_URL: string = process.env.TEAMS_API_URL || "";
const TEAMS_API_TOKEN: string = process.env.TEAMS_API_TOKEN || "";
const TEAMS_ALLOWED_TEAMS: string[] = (
  process.env.TEAMS_ALLOWED_TEAMS || ""
).split(",");

const teamsService = new NaisTeams(
  TEAMS_API_URL,
  TEAMS_API_TOKEN,
  TEAMS_ALLOWED_TEAMS,
);

naisleash(true, teamsService)
  .then((server) => {
    const port: number = server.app.get("port");
    const logger = server.config.getLogger("nais/index.js");
    logger.info(
      `Unleash server started successfully and listening on port ${port}`,
    );
  })
  .catch((error: Error) => {
    console.error("Unleash server failed to start: ", error);
  });
