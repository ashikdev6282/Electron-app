import { useState, useEffect } from "react";

export default function FileNamePopup({
  isOpen,
  onClose,
  onSubmit,
  fileName,
  setFileName,
}) {
  const [error, setError] = useState("");

  /* 🔥 AUTO CLEAR ERROR */
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [error]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const name = fileName.trim();

    // ❌ EMPTY
    if (!name) {
      setError("File name is required");
      return;
    }

    // ❌ TOO SHORT
    if (name.length < 3) {
      setError("Minimum 3 characters required");
      return;
    }

    // ❌ INVALID CHARACTERS
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setError("Only letters, numbers, _ and - allowed");
      return;
    }

    // ✅ SUCCESS
    onSubmit(name);
    setFileName("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-[90%] max-w-sm shadow-xl">
        
        <h2 className="text-lg font-semibold text-white text-center mb-2">
          Send Recording?
        </h2>

        <p className="text-gray-400 text-sm text-center mb-4">
          Please confirm before sending the audio.
        </p>

        <input
          type="text"
          placeholder="Enter file name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-[#111] border border-gray-600 text-white outline-none mb-2"
        />

        {/* 🔥 ERROR MESSAGE */}
        {error && (
          <p className="text-red-500 text-xs text-center mb-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-2">
          <button
            onClick={() => {
              onClose();
              setFileName("");
              setError("");
            }}
            className="flex-1 py-2 rounded-lg bg-black text-red-500 border border-gray-700"
          >
            CANCEL
          </button>

          <button
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}