import naisleash from "./server";
import { NaisTeams } from "./nais-teams";

const TEAMS_URL: string = process.env.TEAMS_URL || "";
const TEAMS_TOKEN: string = process.env.TEAMS_TOKEN || "";
const TEAMS_ALLOWED_TEAMS: string[] = (
  process.env.TEAMS_ALLOWED_TEAMS || ""
).split(",");

const teamsService = new NaisTeams(TEAMS_URL, TEAMS_TOKEN, TEAMS_ALLOWED_TEAMS);

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
