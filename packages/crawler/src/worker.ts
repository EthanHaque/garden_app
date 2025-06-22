import { Worker } from "bullmq";
import puppeteer from "puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CustomEmbeddingClient } from "./embeddingClient";
import { Job, HtmlResult, PdfResult } from "../../server/src/models/job";
import { connection, CRAWLER_QUEUE_NAME } from "./queue";
import connectDB from "../../server/src/config/database"; // Reuse db connection

const processJob = async (job) => {
    console.log(`Processing job ${job.id} for URL: ${job.data.url}. Attempt ${job.attemptsMade}`);
    try {
        await job.updateProgress({ stage: "Starting", percentage: 5, attempts: job.attemptsMade });

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const response = await page.goto(job.data.url, { waitUntil: "networkidle2" });
        const contentType = response.headers()["content-type"] || "";

        if (contentType.includes("application/pdf")) {
            // ... PDF processing logic (convert to images, OCR, chunk, embed)
            // For now, let's just mark as failed.
            await job.updateProgress({ stage: "Processing PDF", percentage: 20, attempts: job.attemptsMade });
            throw new Error("PDF processing not yet implemented.");
        } else {
            // HTML Processing
            await job.updateProgress({ stage: "Extracting HTML", percentage: 30, attempts: job.attemptsMade });
            const htmlContent = await page.content();
            const extractedText = await page.evaluate(() => document.body.innerText);

            await job.updateProgress({ stage: "Chunking Text", percentage: 60, attempts: job.attemptsMade });
            const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 100 });
            const chunks = await splitter.splitText(extractedText);

            await job.updateProgress({ stage: "Generating Embeddings", percentage: 80, attempts: job.attemptsMade });
            const embeddings = new CustomEmbeddingClient();
            const chunkEmbeddings = await embeddings.embedDocuments(chunks);

            const result = new HtmlResult({
                htmlContent,
                extractedText,
                chunks: chunks.map((chunk, i) => ({ text: chunk, embedding: chunkEmbeddings[i] })),
            });
            await result.save();

            await Job.updateOne({ _id: job.data.jobId }, { result: result._id, resultType: "HtmlResult" });
        }

        await browser.close();
        await job.updateProgress({ stage: "Completed", percentage: 100, attempts: job.attemptsMade });
        console.log(`Job ${job.id} completed.`);
    } catch (error) {
        console.error(`Job ${job.id} failed on attempt ${job.attemptsMade} with error: ${error.message}`);
        throw error;
    }
};

export const startWorker = () => {
    console.log("Starting crawler worker...");
    connectDB();
    new Worker(CRAWLER_QUEUE_NAME, processJob, { connection });
};
