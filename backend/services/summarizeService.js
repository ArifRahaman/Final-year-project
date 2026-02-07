import { GoogleGenAI } from "@google/genai"; // Import the NEW library
import dotenv from "dotenv";

dotenv.config();

// Initialize the new client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const summarizeText = async (text) => {
  if (!text || text.trim().length < 5) {
    return "No spoken content detected in the video.";
  }

  const prompt = `
Summarize this short video in 1–2 sentences only.
Be clear and simple.

Transcript:
${text}
`;

  try {
    // New Syntax: ai.models.generateContent
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite", // Or "gemini-2.0-flash-exp"
      contents: prompt,              // Note: Property is 'contents', not the first argument
    });

    // New Syntax: Access .text directly (not .response.text())
    return response.text;

  } catch (error) {
    console.error("AI Summary Error:", error);
    return "Failed to generate summary.";
  }
};