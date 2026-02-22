import { Mic, FileText, Settings } from "lucide-react";

export default function BottomNav({ tab, setTab }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-zinc-800">
      <div className="max-w-[420px] mx-auto h-16 flex justify-around items-center text-xs text-zinc-400">

        {/* Dictate */}
        <button
          onClick={() => setTab("dictate")}
          className={`flex flex-col items-center gap-1 ${
            tab === "dictate" ? "text-indigo-400" : ""
          }`}
        >
          <Mic size={22} />
          <span>Dictate</span>
        </button>

        {/* My Dictations */}
        <button
          onClick={() => setTab("list")}
          className={`flex flex-col items-center gap-1 ${
            tab === "list" ? "text-indigo-400" : ""
          }`}
        >
          <FileText size={22} />
          <span>My Dictations</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setTab("settings")}
          className={`flex flex-col items-center gap-1 ${
            tab === "settings" ? "text-indigo-400" : ""
          }`}
        >
          <Settings size={22} />
          <span>Settings</span>
        </button>

      </div>
    </div>
  );
}