import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/database";
import { apiRouter } from "./routes/api";
import cookieParser from "cookie-parser";
import { loggerMiddleware } from "./config/logger";

/**
 * Creates and configures the main Express application.
 * @returns {Express} The configured Express application instance.
 */
export const createServer = (): Express => {
    const app = express();

    connectDB();

    // Core Middleware
    app.use(helmet());
    app.use(cors()); // Enable all CORS requests
    app.use(express.json()); // Enable parsing of JSON request bodies
    app.use(cookieParser());
    app.use(loggerMiddleware);

    app.use("/api", apiRouter);

    return app;
};
