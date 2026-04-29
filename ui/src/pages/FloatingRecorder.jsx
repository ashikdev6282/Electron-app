import { useRef, useEffect } from "react";
import { Mic, Square, Send, Maximize2 } from "lucide-react";
import useRecorderSync from "../hooks/useRecorderSync";

export default function FloatingRecorder() {
  const { isRecording, seconds } = useRecorderSync();
  const username = localStorage.getItem("username") || "Unknown";

  const isBusyRef = useRef(false);

  const formatTime = () => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  /* 🎙 RECORD / STOP (UPDATED) */
  const handleRecord = async () => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;

    try {
      if (isRecording) {
        await window.sharedRecorder.stop(); // 🔥 STOP SHARED
      } else {
        await window.sharedRecorder.start(); // 🔥 START SHARED
      }
    } catch (err) {
      console.error("Recording error:", err);
    } finally {
      setTimeout(() => {
        isBusyRef.current = false;
      }, 300);
    }
  };

  /* 📤 SEND */
  const handleSend = async () => {
    if (seconds === 0) return;

    if (isRecording) {
      await window.sharedRecorder.stop(); // 🔥 ensure stop
    }

    setTimeout(() => {
      window.electronAPI.openMainWindow("send");
    }, 150);
  };

  /* ⌨️ SHORTCUT SYNC */
 useEffect(() => {
  if (!window.electronAPI) return;

  window.electronAPI.onShortcut((action) => {
    switch (action) {
      case "record":
        // 🔥 TOGGLE LOGIC
        if (isRecording) {
          window.electronAPI.recorderStop();
        } else {
          window.electronAPI.recorderStart();
        }
        break;

      case "send":
        handleSend();
        break;

      default:
        break;
    }
  });
}, [isRecording]);

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
        overflow: "visible",
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
        <div
          title={username}
          style={{
            fontSize: 11,
            color: "#aaa",
            maxWidth: 80,
            textAlign: "center",
            wordBreak: "break-word",
            lineHeight: "12px",
            marginBottom: 8,
            fontWeight: "bold",
          }}
        >
          {username}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            opacity: isRecording ? 1 : 0.5,
            lineHeight: "1",
          }}
        >
          {isRecording && (
            <>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#f87171",
                  boxShadow: "0 0 6px #ef4444",
                  animation: "pulse 1s infinite",
                }}
              />
              <span
                style={{
                  color: "#f87171",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                REC
              </span>
            </>
          )}

          <span style={{ fontWeight: 600, letterSpacing: "1px" }}>
            {formatTime()}
          </span>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 12, WebkitAppRegion: "no-drag" }}>
        <IconButton
          onClick={handleRecord}
          bg={isRecording ? "#dc2626" : "#ef4444"}
          shortcut={isRecording ? "F10" : "F9"}
        >
          {isRecording ? <Square size={18} /> : <Mic size={18} />}
        </IconButton>

        <IconButton onClick={handleSend} bg="#4f46e5" shortcut="F8">
          <Send size={18} />
        </IconButton>
      </div>

      {/* MAXIMIZE */}
      <div style={{ WebkitAppRegion: "no-drag" }}>
        <IconButton
          onClick={() => {
            if (isRecording) return; // 🚫 block when recording
            window.electronAPI.openMainWindow("normal");
          }}
          bg={isRecording ? "#555" : "#27272a"}
          style={{
            marginLeft: 6,
            cursor: isRecording ? "not-allowed" : "pointer",
            opacity: isRecording ? 0.5 : 1,
          }}
          title={
            isRecording ? "Stop recording to open Dictate" : "Open Dictate"
          }
        >
          <Maximize2 size={18} />
        </IconButton>
      </div>
    </div>
  );
}

/* BUTTON */
function IconButton({ children, onClick, bg, style, shortcut }) {
  return (
    <div style={{ position: "relative", WebkitAppRegion: "no-drag" }}>
      <button
        onClick={onClick}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: bg,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "0.2s",
          WebkitAppRegion: "no-drag",
          ...style,
        }}
      >
        {children}
      </button>
    </div>
  );
}
