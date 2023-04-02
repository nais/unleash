import naisleash from "./server";

naisleash(true)
  .then((server) => {
    const port: number = server.app.get("port");
    const logger = server.config.getLogger("nais/index.js");
    logger.info(
      `Unleash server started successfully and listening on port ${port}`
    );
  })
  .catch((error: Error) => {
    console.error("Unleash server failed to start: ", error);
  });
