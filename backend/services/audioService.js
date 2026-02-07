import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

export const extractAudio = (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioChannels(1)      // mono
      .audioFrequency(16000) // 16 kHz
      .audioCodec("pcm_s16le")
      .format("wav")
      .save(audioPath)
      .on("end", resolve)
      .on("error", reject);
  });
};
