// backend/src/services/transcribeService.js
import fs from "fs";
import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";
dotenv.config();
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export const transcribeAudio = async (audioPath) => {
  try {
    if (!fs.existsSync(audioPath)) {
      throw new Error("Audio file missing: " + audioPath);
    }

    const buffer = fs.readFileSync(audioPath);

    // Call Deepgram prerecorded API
    const response = await deepgram.listen.prerecorded.transcribeFile(buffer, {
      model: "nova-3",         // nova-3 is a strong default
      punctuate: true,
      smart_format: true,
      detect_language: true,
      utterances: true,
      diarize: false,
    });

    // Log the raw object to inspect alternatives/confidences
    // console.log("Deepgram raw result:", JSON.stringify(response?.result ?? response, null, 2));

    // Safe path to transcript text
const dgResult = response.result;

const transcript = response.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    console.log("Extracted Transcript:", transcript); // This should now show your Hindi text
    return transcript;



  } catch (err) {
    console.error("transcribeAudio error:", err);
    throw err;
  }
};
