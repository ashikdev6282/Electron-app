import { useState } from "react";
import { toast } from "sonner";

const functionKeys = [
  "F1","F2","F3","F4","F5","F6",
  "F7","F8","F9","F10",
];

export default function HotkeyPopup({ isOpen, onClose }) {
  const [recordKey, setRecordKey] = useState("F8");
  const [sendKey, setSendKey] = useState("F9");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (recordKey === sendKey) {
      setError("Keys must be different");
      return;
    }

    window.electronAPI.updateShortcuts({
      record: recordKey,
      send: sendKey,
    });

    setError("");
    toast.success(`Hotkeys updated: ${recordKey} (Record) / ${sendKey} (Send)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-[90%] max-w-sm shadow-xl space-y-5">

        {/* TITLE */}
        <div className="text-center">
          <h2 className="text-white text-lg font-semibold">
            Hotkey Settings
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Customize your shortcut keys
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-4">

          {/* RECORD */}
          <div className="flex items-center justify-between gap-4">
            <label className="text-gray-400 text-sm w-1/2">
              Record / Stop
            </label>

            <select
              value={recordKey}
              onChange={(e) => setRecordKey(e.target.value)}
              className="w-1/2 px-3 py-2 rounded-lg bg-[#111] border border-gray-600 text-white outline-none focus:border-blue-500"
            >
              {functionKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* SEND */}
          <div className="flex items-center justify-between gap-4">
            <label className="text-gray-400 text-sm w-1/2">
              Send
            </label>

            <select
              value={sendKey}
              onChange={(e) => setSendKey(e.target.value)}
              className="w-1/2 px-3 py-2 rounded-lg bg-[#111] border border-gray-600 text-white outline-none focus:border-blue-500"
            >
              {functionKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {/* BUTTONS */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-black border border-gray-700 text-red-500 hover:bg-[#111] transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}