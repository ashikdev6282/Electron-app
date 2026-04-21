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

  /* 📤 SEND */
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
        padding: "0 10px 0 12px",
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
          minWidth: 85,
        }}
      >
        {/* USERNAME */}
        <div
          title={username}
          style={{
            fontSize: 11,
            color: "#aaa",
            maxWidth: 80,
            textAlign: "center",
            wordBreak: "break-word",
            lineHeight: "12px",
            marginBottom: 8, // 🔥 better alignment
            fontWeight: "bold",
          }}
        >
          {username}
        </div>

        {/* TIMER + REC */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8, // 🔥 better spacing
            fontSize: 15, // 🔥 clearer
            opacity: isRecording ? 1 : 0.5,
            lineHeight: "1",
          }}
        >
          {isRecording && (
            <>
              {/* 🔴 DOT */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#f87171", // 🔥 softer red
                  boxShadow: "0 0 6px #ef4444",
                  animation: "pulse 1s infinite",
                }}
              />

              {/* REC TEXT */}
              <span
                style={{
                  color: "#f87171",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                }}
              >
                REC
              </span>
            </>
          )}

          {/* TIME */}
          <span
            style={{
              fontWeight: 600,
              letterSpacing: "1px",
            }}
          >
            {formatTime()}
          </span>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 12 }}>
        <IconButton
          onClick={handleRecord}
          bg={isRecording ? "#dc2626" : "#ef4444"}
        >
          {isRecording ? <Square size={18} /> : <Mic size={18} />}
        </IconButton>

        <IconButton onClick={handleSend} bg="#4f46e5">
          <Send size={18} />
        </IconButton>
      </div>

      {/* MAXIMIZE */}
      <IconButton
        onClick={() => window.electronAPI.openMainWindow()}
        bg="#27272a"
        style={{ marginLeft: 6 }} // 🔥 correct spacing fix
      >
        <Maximize2 size={18} />
      </IconButton>
    </div>
  );
}

/* ---------------- BUTTON ---------------- */

function IconButton({ children, onClick, bg, primary, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width:  40, // 🔥 record button slightly bigger
        height:  40,
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
        boxShadow: primary
          ? "0 0 12px rgba(239,68,68,0.5)"
          : "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}