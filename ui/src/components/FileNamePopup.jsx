export default function FileNamePopup({
  isOpen,
  onClose,
  onSubmit,
  fileName,
  setFileName,
}) {
  if (!isOpen) return null;

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
          className="w-full px-4 py-2 rounded-lg bg-[#111] border border-gray-600 text-white outline-none mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              setFileName("");
            }}
            className="flex-1 py-2 rounded-lg bg-black text-red-500 border border-gray-700"
          >
            CANCEL
          </button>

          <button
            onClick={() => {
              if (!fileName.trim()) return;
              onSubmit(fileName);
              setFileName("");
            }}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}