import { QueueEvents } from "bullmq";
import { Server as SocketIOServer } from "socket.io";
import { CRAWLER_QUEUE_NAME, connection } from "../../../crawler/src/queue";
import { Job } from "../models/job";
import type { Express } from "express";

export const initializeQueueEvents = (io: SocketIOServer, app: Express) => {
    const queueEvents = new QueueEvents(CRAWLER_QUEUE_NAME, { connection });
    const logger = (app as any).log; // Access the logger instance from the app

    // Listen for job progress events
    queueEvents.on("progress", async ({ jobId, data }) => {
        logger.info({ jobId, progress: data }, `Job progress event`);
        try {
            const job = await Job.findById(jobId).select("user");
            if (job) {
                // Emit a socket event specifically to the user who owns the job
                io.to(job.user.toString()).emit("job:update", {
                    jobId,
                    progress: data,
                });
            }
        } catch (error) {
            logger.error({ err: error, jobId }, "Error processing 'progress' event");
        }
    });

    // Listen for job completion events
    queueEvents.on("completed", async ({ jobId }) => {
        logger.info({ jobId }, `Job completed event`);
        try {
            const job = await Job.findByIdAndUpdate(
                jobId,
                { status: "completed", "progress.percentage": 100 },
                { new: true },
            ).select("user");
            if (job) {
                io.to(job.user.toString()).emit("job:update", {
                    jobId,
                    status: "completed",
                    progress: job.progress,
                });
            }
        } catch (error) {
            logger.error({ err: error, jobId }, "Error processing 'completed' event");
        }
    });

    // Listen for job failure events
    queueEvents.on("failed", async ({ jobId, failedReason }) => {
        logger.error({ jobId, reason: failedReason }, `Job failed event`);
        try {
            const job = await Job.findByIdAndUpdate(
                jobId,
                { status: "failed", error: failedReason },
                { new: true },
            ).select("user");
            if (job) {
                io.to(job.user.toString()).emit("job:update", {
                    jobId,
                    status: "failed",
                    error: failedReason,
                });
            }
        } catch (error) {
            logger.error({ err: error, jobId }, "Error processing 'failed' event");
        }
    });

    logger.info("BullMQ queue event listeners initialized.");
};
