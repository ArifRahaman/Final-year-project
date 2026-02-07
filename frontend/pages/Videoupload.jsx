import axios from "axios";
import { useState } from "react";

export default function VideoUpload() {
  const [video, setVideo] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uploadVideo = async () => {
    if (!video) return alert("Please select a video first");

    setLoading(true);
    setError("");
    setSummary("");

    const formData = new FormData();
    formData.append("video", video);

    try {
      // This might take 10-20 seconds depending on video length
      const res = await axios.post("http://localhost:5000/api/summarize", formData);
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch summary. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Video Summarizer</h1>
      
      <input 
        type="file" 
        accept="video/*" 
        onChange={e => setVideo(e.target.files[0])} 
      />
      
      <button onClick={uploadVideo} disabled={loading} style={{ marginLeft: "10px" }}>
        {loading ? "Processing..." : "Summarize Video"}
      </button>

      {/* Status Messages */}
      {loading && <p style={{ color: "blue" }}>⏳ Uploading and processing... please wait.</p>}
      {error && <p style={{ color: "red" }}>❌ {error}</p>}
      
      {/* Result */}
      {summary && (
        <div style={{ marginTop: "20px", padding: "10px", background: "#f0f0f0" }}>
          <h3>Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}