import { useState, useRef } from "react";
import { Mic, Square, Send, Maximize2 } from "lucide-react";
import useRecorderSync from "../hooks/useRecorderSync";

export default function FloatingRecorder() {
  const { isRecording, seconds } = useRecorderSync();
  const username = localStorage.getItem("username") || "Unknown";

  const chunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);

  const formatTime = () => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  /* 🎙 RECORD / STOP */
  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      window.electronAPI.recorderStop();
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (!chunksRef.current.length) return;

        const buffers = [];

        for (const chunk of chunksRef.current) {
          const arrayBuffer = await chunk.arrayBuffer();
          buffers.push(Array.from(new Uint8Array(arrayBuffer)));
        }

        console.log("SENDING BUFFERS:", buffers);

        window.electronAPI.setRecordedChunks(buffers);
      };

      recorder.start(200);
      window.electronAPI.recorderStart();
    }
  };

  /* 📤 SEND */
  const handleSend = () => {
    if (seconds === 0) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      window.electronAPI.recorderStop();
    }

    // 🚀 No hacky delay needed anymore
    setTimeout(() => {
      window.electronAPI.openMainWindow();
    }, 150);
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
        style={{ marginLeft: 6 }}
      >
        <Maximize2 size={18} />
      </IconButton>
    </div>
  );
}

/* BUTTON */
function IconButton({ children, onClick, bg, style }) {
  return (
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
        WebkitAppRegion: "no-drag",
        transition: "0.2s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
