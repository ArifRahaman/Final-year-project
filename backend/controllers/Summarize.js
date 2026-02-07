// summarizeController.js (example)
import fs from "fs";
import path from "path";
import { extractAudio } from "../services/audioService.js";
import { transcribeAudio } from "../services/transcribeService.js";
import { summarizeText } from "../services/summarizeService.js";

const KEEP_UPLOADS = process.env.KEEP_UPLOADS === "true";

export const summarizeVideo = async (req, res) => {
  const videoPath = req.file.path;
  const audioPath = `${videoPath}.wav`; // ensure .wav

  try {
    console.log("Saved video:", videoPath);
    await extractAudio(videoPath, audioPath);

    console.log("Audio saved:", audioPath, "size:", fs.statSync(audioPath).size);
    const transcript = await transcribeAudio(audioPath);
    console.log("Transcript:", transcript);

    const summary = await summarizeText(transcript);
    res.json({ summary });

  } catch (err) {
    console.error("Processing error:", err);
    res.status(500).json({ error: "Processing failed", detail: err.message });
  } finally {
    if (!KEEP_UPLOADS) {
      try {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      } catch (e) {
        console.warn("Cleanup failed:", e);
      }
    } else {
      // keep files for debugging
      const keepDir = path.join("uploads", "keep");
      if (!fs.existsSync(keepDir)) fs.mkdirSync(keepDir, { recursive: true });
      try {
        if (fs.existsSync(videoPath)) fs.renameSync(videoPath, path.join(keepDir, path.basename(videoPath)));
        if (fs.existsSync(audioPath)) fs.renameSync(audioPath, path.join(keepDir, path.basename(audioPath)));
      } catch (e) {
        console.warn("Move to keep failed:", e);
      }
      console.log("Kept uploaded files in uploads/keep for inspection.");
    }
  }
};
