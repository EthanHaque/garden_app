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

export const createServer = () => {
    const app = express();
    const httpServer = createHttpServer(app);

    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    app.set("io", io);

    connectDB();

    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    app.use(loggerMiddleware);

    app.use("/api", apiRouter);

    io.on("connection", (socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        // Join a room based on the user ID after authentication.
        // This is more secure and efficient.
        // For now, we'll just log the connection.

        socket.on("disconnect", () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    // Initialize the queue event listeners and pass the io & app instances
    initializeQueueEvents(io, app);

    return httpServer;
};
