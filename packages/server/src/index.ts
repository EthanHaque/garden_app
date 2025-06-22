import config from "./config";
import { createServer } from "./server";

const httpServer = createServer();

const host = config.nodeEnv === "production" ? "0.0.0.0" : "localhost";

httpServer.listen(parseInt(config.port, 10), host, () => {
    console.log(`[server]: Server is running in ${config.nodeEnv} mode at http://${host}:${config.port}`);
});
