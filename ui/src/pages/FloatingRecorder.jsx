import { useState } from "react";
import { Mic, Square, Send, Maximize2 } from "lucide-react";
import useRecorderSync from "../hooks/useRecorderSync";

export default function FloatingRecorder() {
  const { isRecording, seconds } = useRecorderSync();
  const username = localStorage.getItem("username") || "Unknown";

  const [chunksRef] = useState([]); // optional

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

  /* 📤 SEND (always enabled) */
  const handleSend = () => {
    if (seconds === 0) {
      console.log("No recording yet");
      return;
    }

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
      {/* USERNAME + TIMER */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 80,
        }}
      >
        {/* USERNAME */}
        <div
          title={username}
          style={{
            fontSize: 10,
            color: "#aaa",
            maxWidth: 80,
            textAlign: "center",
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: "12px",
          }}
        >
          {username}
        </div>

        {/* TIMER + RECORDING STATUS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            opacity: isRecording ? 1 : 0.5,
          }}
        >
          {isRecording && (
            <>
              {/* 🔴 DOT */}
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ef4444",
                  boxShadow: "0 0 4px #ef4444",
                  animation: "pulse 1s infinite",
                }}
              />

              {/* TEXT */}
              <span style={{ color: "#ef4444", fontSize: 11 }}>
                REC
              </span>
            </>
          )}

          {/* TIME */}
          <span>{formatTime()}</span>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 10 }}>
        {/* RECORD / STOP */}
        <IconButton
          onClick={handleRecord}
          bg={isRecording ? "#dc2626" : "#ef4444"}
        >
          {isRecording ? <Square size={14} /> : <Mic size={14} />}
        </IconButton>

        {/* SEND (always active) */}
        <IconButton onClick={handleSend} bg="#4f46e5">
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

/* ---------------- BUTTON ---------------- */

function IconButton({ children, onClick, bg }) {
  return (
    <button
      onClick={onClick}
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
        cursor: "pointer",
        WebkitAppRegion: "no-drag",
        transition: "0.2s",
      }}
    >
      {children}
    </button>
  );
}