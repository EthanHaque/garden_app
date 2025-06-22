import { QueueEvents } from "bullmq";
import { Server as SocketIOServer } from "socket.io";
import { CRAWLER_QUEUE_NAME, connection, crawlerQueue } from "../../../crawler/src/queue";
import { Job } from "../models/job";
import logger from "../config/logger";

export const initializeQueueEvents = (io: SocketIOServer) => {
    const queueEvents = new QueueEvents(CRAWLER_QUEUE_NAME, { connection });

    /**
     * Helper to safely retrieve the MongoDB job ID from the job stored in the queue.
     * @param bullJobId The job ID from the BullMQ event.
     * @returns The MongoDB document _id, or null if not found.
     */
    const getMongoJobId = async (bullJobId: string): Promise<string | null> => {
        try {
            const job = await crawlerQueue.getJob(bullJobId);
            if (job && job.data.jobId) {
                return job.data.jobId;
            }
            logger.error({ bullJobId }, "Could not retrieve job from queue or find mongoJobId in data");
            return null;
        } catch (error) {
            logger.error({ err: error, bullJobId }, "Error fetching job from queue");
            return null;
        }
    };

    // Listen for job progress events
    queueEvents.on("progress", async ({ jobId, data }) => {
        logger.info({ jobId, progress: data }, `Job progress event`);
        const mongoJobId = await getMongoJobId(jobId);
        if (!mongoJobId) return;

        try {
            // Use the correct mongoJobId to find the job and its associated user
            const job = await Job.findById(mongoJobId).select("user");
            if (job) {
                io.to(job.user.toString()).emit("job:update", {
                    jobId: mongoJobId, // Send the correct ID to the client
                    progress: data,
                });
            }
        } catch (error) {
            logger.error({ err: error, jobId: mongoJobId }, "Error processing 'progress' event");
        }
    });

    // Listen for job completion events
    queueEvents.on("completed", async ({ jobId }) => {
        logger.info({ jobId }, `Job completed event`);
        const mongoJobId = await getMongoJobId(jobId);
        if (!mongoJobId) return;

        try {
            const job = await Job.findByIdAndUpdate(
                mongoJobId, // Use the correct ID
                { status: "completed", "progress.percentage": 100 },
                { new: true },
            ).select("user");

            if (job) {
                io.to(job.user.toString()).emit("job:update", {
                    jobId: mongoJobId, // Use the correct ID
                    status: "completed",
                    progress: job.progress,
                });
            }
        } catch (error) {
            logger.error({ err: error, jobId: mongoJobId }, "Error processing 'completed' event");
        }
    });

    // Listen for job failure events
    queueEvents.on("failed", async ({ jobId, failedReason }) => {
        logger.error({ jobId, reason: failedReason }, `Job failed event`);
        const mongoJobId = await getMongoJobId(jobId);
        if (!mongoJobId) return;

        try {
            const job = await Job.findByIdAndUpdate(
                mongoJobId, // Use the correct ID
                { status: "failed", error: failedReason },
                { new: true },
            ).select("user");

            if (job) {
                io.to(job.user.toString()).emit("job:update", {
                    jobId: mongoJobId, // Use the correct ID
                    status: "failed",
                    error: failedReason,
                });
            }
        } catch (error) {
            logger.error({ err: error, jobId: mongoJobId }, "Error processing 'failed' event");
        }
    });

    logger.info("BullMQ queue event listeners initialized.");
};
