import { Worker } from "bullmq";
import puppeteer from "puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CustomEmbeddingClient } from "./embeddingClient";
import { Job, HtmlResult, PdfResult } from "../../server/src/models/job";
import { connection, CRAWLER_QUEUE_NAME } from "./queue";
import connectDB from "../../server/src/config/database"; // Reuse db connection
import axios from "axios";
import fs from "fs/promises";
import path from "path";

/**
 * Retries an async function a specified number of times with a delay.
 * @param {Function} fn The async function to execute.
 * @param {string} operationName A descriptive name for the operation for logging.
 * @param {number} retries The maximum number of retries.
 * @param {number} delay The delay between retries in milliseconds.
 * @returns {Promise<any>} The result of the successful function execution.
 */
const retry = async (fn, operationName = "operation", retries = 3, delay = 100) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${i + 1} for ${operationName} failed: ${error.message}. Retrying in ${delay}ms...`);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
    console.error(`All ${retries} attempts for ${operationName} failed.`);
    throw lastError;
};

/**
 * Processes a single page of a PDF: saves the image, performs OCR, and generates embeddings.
 * @param {string} pageImage - The base64 encoded image of the page.
 * @param {number} pageNumber - The page number.
 * @param {object} sharedData - An object containing shared resources like upload directories and clients.
 * @returns {Promise<object>} The processed page data.
 */
async function processPage(pageImage, pageNumber, sharedData) {
    const { jobUploadDir, splitter, embeddings } = sharedData;

    const base64Data = pageImage.replace(/^data:image\/jpeg;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Save image
    const imagePath = path.join(jobUploadDir, `page-${pageNumber}.jpeg`);
    await fs.writeFile(imagePath, imageBuffer);
    const imageUrl = `/uploads/${sharedData.job.data.jobId}/page-${pageNumber}.jpeg`;

    // OCR with retry
    const ocrText = await retry(async () => {
        const response = await axios.post("http://localhost:4001/ocr", imageBuffer, {
            headers: { "Content-Type": "image/jpeg" },
        });
        if (!response.data || typeof response.data.text !== "string") {
            throw new Error("Invalid or empty OCR response from service.");
        }
        return response.data.text;
    }, `OCR for page ${pageNumber}`);

    // Chunk & Embed with retry
    const chunks = await splitter.splitText(ocrText);
    const chunkEmbeddings = await retry(() => embeddings.embedDocuments(chunks), `Embedding for page ${pageNumber}`);

    return {
        pageNumber,
        imageUrl,
        ocrText,
        chunks: chunks.map((chunk, j) => ({ text: chunk, embedding: chunkEmbeddings[j] })),
    };
}

/**
 * Processes a PDF document from a given URL.
 * It renders each page as an image, performs OCR, chunks the text, and generates embeddings.
 * @param {object} page - The Puppeteer page instance.
 * @param {object} job - The BullMQ job object.
 */
async function processPdf(page, job) {
    await job.updateProgress({ stage: "Processing PDF", percentage: 20, attempts: job.attemptsMade });

    // Re-purpose the page for PDF rendering with pdf.js
    await page.setContent(`
        <html><body></body><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js"></script></html>
    `);
    await page.evaluate(() => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
    });

    const pageImages = await page.evaluate(async (pdfUrl) => {
        const pdf = await (window as any).pdfjsLib.getDocument(pdfUrl).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const pdfPage = await pdf.getPage(i);
            const viewport = pdfPage.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await pdfPage.render({ canvasContext: context, viewport: viewport }).promise;
            pages.push(canvas.toDataURL("image/jpeg"));
        }
        return pages;
    }, job.data.url);

    const UPLOAD_DIR = path.resolve(__dirname, "../../server/public/uploads");
    const jobUploadDir = path.join(UPLOAD_DIR, job.data.jobId);
    await fs.mkdir(jobUploadDir, { recursive: true });

    const sharedData = {
        jobUploadDir,
        embeddings: new CustomEmbeddingClient(),
        splitter: new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 100 }),
        job,
    };

    const pageProcessingPromises = [];
    for (let i = 0; i < pageImages.length; i++) {
        const pageNumber = i + 1;
        await job.updateProgress({
            stage: `Processing Page ${pageNumber}/${pageImages.length}`,
            percentage: Math.round(20 + 60 * (pageNumber / pageImages.length)),
            attempts: job.attemptsMade,
        });
        pageProcessingPromises.push(processPage(pageImages[i], pageNumber, sharedData));
    }

    const allPagesData = await Promise.all(pageProcessingPromises);

    const result = new PdfResult({ pages: allPagesData });
    await result.save();
    await Job.updateOne({ _id: job.data.jobId }, { result: result._id, resultType: "PdfResult" });
}

/**
 * Processes an HTML document from a given URL.
 * It extracts text, chunks it, and generates embeddings.
 * @param {object} page - The Puppeteer page instance.
 * @param {object} job - The BullMQ job object.
 */
async function processHtml(page, job) {
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

/**
 * The main job processing function for the BullMQ worker.
 * It launches Puppeteer, determines the content type, and delegates to the appropriate processor.
 * @param {object} job - The BullMQ job object.
 */
const processJob = async (job) => {
    console.log(`Processing job ${job.id} for URL: ${job.data.url}. Attempt ${job.attemptsMade}`);
    let browser;
    try {
        await job.updateProgress({ stage: "Starting", percentage: 5, attempts: job.attemptsMade });

        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        const response = await page.goto(job.data.url, { waitUntil: "networkidle2" });
        const contentType = response.headers()["content-type"] || "";

        if (contentType.includes("application/pdf")) {
            await processPdf(page, job);
        } else {
            await processHtml(page, job);
        }

        await job.updateProgress({ stage: "Completed", percentage: 100, attempts: job.attemptsMade });
        console.log(`Job ${job.id} completed.`);
    } catch (error) {
        console.error(`Job ${job.id} failed on attempt ${job.attemptsMade} with error: ${error.message}`);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

export const startWorker = () => {
    console.log("Starting crawler worker...");
    connectDB();
    new Worker(CRAWLER_QUEUE_NAME, processJob, { connection });
};
