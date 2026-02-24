import { useRef, useState } from "react";
import { Mic, Pause, Play, Send } from "lucide-react";

export default function FloatingRecorder() {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);

  /* 🎙 START */
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = e => chunksRef.current.push(e.data);
    recorder.start();

    setRecording(true);
    setPaused(false);
  };

  /* ⏸ / ▶ */
  const togglePause = () => {
    if (!recorderRef.current) return;

    if (paused) {
      recorderRef.current.resume();
      setPaused(false);
    } else {
      recorderRef.current.pause();
      setPaused(true);
    }
  };

  /* ⏹ */
  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
  };

  /* 📤 */
  const sendRecording = async () => {
    stopRecording();
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });

    // send to backend later
    console.log("Recorded blob:", blob);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "64px",
        background: "#111",
        borderRadius: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        WebkitAppRegion: "drag", // 🔥 draggable area
      }}
    >
      {/* RECORD */}
      <IconButton
        onClick={recording ? stopRecording : startRecording}
        bg={recording ? "#555" : "#ef4444"}
      >
        <Mic size={18} />
      </IconButton>

      {/* PAUSE */}
      <IconButton
        onClick={togglePause}
        disabled={!recording}
        bg="#3f3f46"
      >
        {paused ? <Play size={18} /> : <Pause size={18} />}
      </IconButton>

      {/* SEND */}
      <IconButton
        onClick={sendRecording}
        disabled={!recording}
        bg="#4f46e5"
      >
        <Send size={18} />
      </IconButton>
    </div>
  );
}

/* ---------------- BUTTON ---------------- */

function IconButton({ children, onClick, bg, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
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
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,

        WebkitAppRegion: "no-drag", // 🔥 clickable
      }}
    >
      {children}
    </button>
  );
}