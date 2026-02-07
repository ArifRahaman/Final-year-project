import React, { useState, useMemo } from "react";

// PreviousYearPapers - Tailwind CSS version
// Requirements: Tailwind must be configured in your React project (postcss + tailwind.config.js).
// This is a single-file component you can drop into your pages (e.g. src/components/PreviousYearPapers.jsx)

const EXAMS = [
  "GATE",
  "JEE",
  "College Exams",
  "CAT",
  "UPSC",
  "NEET",
];

const SAMPLE_PAPERS = [
  { id: 1, exam: "GATE", year: 2024, subject: "CS", title: "GATE CS 2024", url: "/papers/gate-cs-2024.pdf" },
  { id: 2, exam: "GATE", year: 2023, subject: "EE", title: "GATE EE 2023", url: "/papers/gate-ee-2023.pdf" },
  { id: 3, exam: "JEE", year: 2024, subject: "Physics", title: "JEE Physics 2024", url: "/papers/jee-phy-2024.pdf" },
  { id: 4, exam: "College Exams", year: 2022, subject: "Algorithms", title: "College Algo 2022", url: "/papers/college-algo-2022.pdf" },
  { id: 5, exam: "CAT", year: 2023, subject: "Quant", title: "CAT Quant 2023", url: "/papers/cat-quant-2023.pdf" },
  { id: 6, exam: "NEET", year: 2024, subject: "Biology", title: "NEET Bio 2024", url: "/papers/neet-bio-2024.pdf" },
];

export default function PreviousYearPapers({ papers = SAMPLE_PAPERS, onUpload }) {
  const [activeExam, setActiveExam] = useState(EXAMS[0]);
  const [yearFilter, setYearFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(null);

  const years = useMemo(() => {
    const ys = new Set(papers.map((p) => p.year));
    return ["All", ...Array.from(ys).sort((a, b) => b - a)];
  }, [papers]);

  const subjects = useMemo(() => {
    const s = new Set(papers.map((p) => p.subject));
    return ["All", ...Array.from(s).sort()];
  }, [papers]);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      if (p.exam !== activeExam) return false;
      if (yearFilter !== "All" && p.year.toString() !== yearFilter.toString()) return false;
      if (subjectFilter !== "All" && p.subject !== subjectFilter) return false;
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [papers, activeExam, yearFilter, subjectFilter, query]);

  const handleDownload = (paper) => {
    // For production, use presigned URLs or serve via authenticated endpoint.
    const link = document.createElement("a");
    link.href = paper.url;
    link.download = paper.title + ".pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (typeof onUpload === "function") onUpload(file, activeExam);
    else alert("Upload handler not provided. Received: " + file.name);
    e.target.value = null;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Previous Year Question Papers</h1>
          <p className="text-sm text-gray-500 mt-1">Select exam, year or subject — preview or download papers.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.386-1.414 1.415-4.387-4.387zM8 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
            </svg>
            <input
              placeholder="Search papers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none text-sm"
            />
          </label>

          {/* Upload (for teachers) */}
          <div className="flex items-center gap-2">
            <input id="paperUpload" type="file" accept="application/pdf" onChange={handleUpload} className="hidden" />
            <label htmlFor="paperUpload" className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md cursor-pointer hover:bg-indigo-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 17a1 1 0 001 1h12a1 1 0 001-1V7H3v10z" />
                <path d="M9 3h2v6H9V3z" />
              </svg>
              Upload Paper
            </label>
          </div>
        </div>
      </div>

      {/* Exam tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {EXAMS.map((ex) => (
          <button
            key={ex}
            onClick={() => { setActiveExam(ex); setYearFilter("All"); setSubjectFilter("All"); setQuery(""); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeExam === ex ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:scale-[1.02]'}`}
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Filters + results */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: filters */}
        <aside className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold mb-3">Filters</h4>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Year</label>
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Subject</label>
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500">Showing <span className="font-medium text-gray-900">{filtered.length}</span> papers</p>
          </div>
        </aside>

        {/* Right: results */}
        <section className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full p-6 bg-white rounded-lg shadow-sm text-center">
                <p className="text-gray-500">No papers found for <span className="font-medium">{activeExam}</span>.</p>
              </div>
            ) : filtered.map((paper) => (
              <article key={paper.id} className="bg-white rounded-lg p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{paper.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{paper.subject} • {paper.year}</p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPreview(paper.url)} className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50">Preview</button>
                    <button onClick={() => handleDownload(paper)} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">Download</button>
                  </div>

                  <div className="text-xs text-gray-400">ID: {paper.id}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-[90%] md:w-3/4 lg:w-2/3 h-[80%] rounded-lg overflow-hidden shadow-lg flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <h4 className="font-medium">Preview</h4>
              <div className="flex items-center gap-2">
                <a href={preview} target="_blank" rel="noreferrer" className="text-sm px-3 py-1 rounded-md border">Open in new tab</a>
                <button onClick={() => setPreview(null)} className="px-3 py-1 bg-red-500 text-white rounded-md">Close</button>
              </div>
            </div>

            <div className="flex-1">
              {/* PDF preview - if not a PDF, you can use an <img> for images */}
              <iframe src={preview} title="paper-preview" className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
