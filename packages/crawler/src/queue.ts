import { Queue } from "bullmq";

export const connection = {
    host: "localhost",
    port: 6379,
};

export const CRAWLER_QUEUE_NAME = "crawler-queue";

export const crawlerQueue = new Queue(CRAWLER_QUEUE_NAME, { connection });
