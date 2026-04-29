import { useState } from "react";
import { toast } from "sonner";

const functionKeys = [
  "F1","F2","F3","F4","F5","F6",
  "F7","F8","F9","F10","F11","F12"
];

export default function HotkeyPopup({ isOpen, onClose }) {
  const [recordKey, setRecordKey] = useState("F8");
  const [sendKey, setSendKey] = useState("F9");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    // ❌ prevent duplicate keys
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
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-[90%] max-w-sm shadow-xl">

        {/* TITLE */}
        <h2 className="text-white text-lg font-semibold text-center mb-1">
          Hotkey Settings
        </h2>
        <p className="text-gray-400 text-sm text-center mb-4">
          Customize your shortcut keys
        </p>

        {/* RECORD */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm">
            Record / Stop
          </label>

          <select
            value={recordKey}
            onChange={(e) => setRecordKey(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-[#111] border border-gray-600 text-white outline-none"
          >
            {functionKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        {/* SEND */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm">
            Send
          </label>

          <select
            value={sendKey}
            onChange={(e) => setSendKey(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-[#111] border border-gray-600 text-white outline-none"
          >
            {functionKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        {/* BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-black border border-gray-700 text-red-500"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}