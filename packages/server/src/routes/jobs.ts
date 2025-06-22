import { Router } from "express";
import { protect } from "../middleware/auth";
import { Job } from "../models/job";
import { crawlerQueue } from "../../../crawler/src/queue";

export const jobRouter: Router = Router();

jobRouter.post("/", protect, async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ message: "URL is required" });
    }

    const job = new Job({ url, user: req.user._id });
    await job.save();

    await crawlerQueue.add("process-url", { url, jobId: job._id });

    res.status(201).json(job);
});

jobRouter.get("/", protect, async (req, res) => {
    const jobs = await Job.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
});

// We also need an endpoint to get the detailed result
jobRouter.get("/:id", protect, async (req, res) => {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id }).populate("result");
    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
});
