import express from "express";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/database";
import { apiRouter } from "./routes/api";
import cookieParser from "cookie-parser";
import { loggerMiddleware } from "./config/logger";
import { initializeQueueEvents } from "./services/queue";
import logger from "./config/logger";
import config from "./config";
import path from "path";
import { fileURLToPath } from "url";

export const createServer = () => {
    const app = express();
    const httpServer = createHttpServer(app);

    // Environment-aware CORS for Socket.IO
    const io = new Server(httpServer, {
        cors: {
            origin: config.nodeEnv === "production" ? "*" : "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    app.set("io", io);

    connectDB();

    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    app.use(loggerMiddleware);

    app.use("/api", apiRouter);

    // In production, serve the built client and a catch-all for client-side routing
    if (config.nodeEnv === "production") {
        const clientBuildPath = path.join(__dirname, "../../client/dist");
        app.use(express.static(clientBuildPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(clientBuildPath, "index.html"));
        });
    }

    io.on("connection", (socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        // Join a room based on the user ID after authentication.
        socket.on("join", (userId) => {
            if (userId) {
                logger.info(`Socket ${socket.id} joining room for user ${userId}`);
                socket.join(userId);
            }
        });

        socket.on("disconnect", () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    // Initialize the queue event listeners and pass the io instance
    initializeQueueEvents(io);

    return httpServer;
};
