import pino from "pino";
import { randomBytes } from "crypto";
import type { NextFunction, Request, Response } from "express";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
        log: (object) => {
            const logObject = object as any;
            if (logObject.req) {
                logObject.http = {
                    method: logObject.req.method,
                    url: logObject.req.url,
                };
                delete logObject.req;
            }
            if (logObject.res) {
                logObject.http = {
                    ...logObject.http,
                    statusCode: logObject.res.statusCode,
                };
                delete logObject.res;
            }
            return object;
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const correlationId = req.headers["x-correlation-id"] || randomBytes(16).toString("hex");
    req.headers["x-correlation-id"] = correlationId;

    const childLogger = logger.child({ correlationId });
    (req as any).log = childLogger;

    childLogger.info({ req }, `Request for ${req.method} ${req.url}`);

    res.on("finish", () => {
        childLogger.info({ res }, `Request for ${req.method} ${req.url} finished`);
    });

    next();
};

export default logger;
