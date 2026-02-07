const mongoose=require("mongoose");
const VideoSchema = new mongoose.Schema({
  filename: String,
  transcript: String,
  summary: String,
  createdAt: { type: Date, default: Date.now },
});
