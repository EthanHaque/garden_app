import config from "./config";
import { createServer } from "./server";

const httpServer = createServer();

httpServer.listen(config.port, () => {
    console.log(`[server]: Server is running at http://localhost:${config.port}`);
});
