import { useState } from "react";
import { Mic, Square, Pause, Play, Send, Maximize2 } from "lucide-react";
import useRecorderSync from "../hooks/useRecorderSync";

export default function FloatingRecorder() {
  const { isRecording, isPaused, seconds } = useRecorderSync();

  const [chunksRef] = useState([]); // optional for future audio

  const formatTime = () => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  /* 🎙 RECORD / STOP */
  const handleRecord = () => {
    if (isRecording) {
      window.electronAPI.recorderStop();
    } else {
      window.electronAPI.recorderStart();
    }
  };

  /* ⏸ PAUSE / RESUME */
  const handlePause = () => {
    if (isPaused) {
      window.electronAPI.recorderResume();
    } else {
      window.electronAPI.recorderPause();
    }
  };

  /* 📤 SEND (only reset for now) */
  const handleSend = () => {
    window.electronAPI.recorderReset();
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#111",
        borderRadius: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        color: "white",
        WebkitAppRegion: "drag",
      }}
    >
      {/* TIMER */}
      <div
        style={{
          width: 50,
          textAlign: "center",
          fontSize: 13,
          opacity: isRecording ? 1 : 0.5,
        }}
      >
        {formatTime()}
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 10 }}>
        
        {/* RECORD */}
        <IconButton
          onClick={handleRecord}
          bg={isRecording ? "#dc2626" : "#ef4444"}
        >
          {isRecording ? <Square size={14} /> : <Mic size={14} />}
        </IconButton>

        {/* SEND */}
        <IconButton
          onClick={handleSend}
          disabled={!isRecording && seconds === 0}
          bg="#4f46e5"
        >
          <Send size={14} />
        </IconButton>
      </div>

      {/* MAXIMIZE */}
      <IconButton
        onClick={() => window.electronAPI.openMainWindow()}
        bg="#27272a"
      >
        <Maximize2 size={14} />
      </IconButton>
    </div>
  );
}

/* BUTTON */
function IconButton({ children, onClick, bg, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "none",
        background: bg,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        WebkitAppRegion: "no-drag",
      }}
    >
      {children}
    </button>
  );
}