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

  /* ⏸ PAUSE / ▶ RESUME */
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

  /* ⏹ STOP */
  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
  };

  /* 📤 SEND */
  const sendRecording = async () => {
    stopRecording();

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });

    const formData = new FormData();
    formData.append("audio", blob);

    await fetch("https://your-backend-api/upload", {
      method: "POST",
      body: formData
    });
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#111] text-white shadow-xl"
      style={{ WebkitAppRegion: "drag" }}
    >
      {/* RECORD */}
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          recording ? "bg-zinc-600" : "bg-red-500"
        }`}
        style={{ WebkitAppRegion: "no-drag" }}
      >
        <Mic size={18} />
      </button>

      {/* PAUSE */}
      <button
        onClick={togglePause}
        disabled={!recording}
        className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center disabled:opacity-40"
        style={{ WebkitAppRegion: "no-drag" }}
      >
        {paused ? <Play size={18} /> : <Pause size={18} />}
      </button>

      {/* SEND */}
      <button
        onClick={sendRecording}
        disabled={!recording}
        className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center disabled:opacity-40"
        style={{ WebkitAppRegion: "no-drag" }}
      >
        <Send size={18} />
      </button>
    </div>
  );
}