import { useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import useRecorderSync from "../hooks/useRecorderSync";
import Waveform from "../components/Waveform";
import LiveWave from "../components/LiveWave";

export default function Dictate() {
  const { isRecording, seconds } = useRecorderSync();
  const username = localStorage.getItem("username") || "Unknown";

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [priority, setPriority] = useState("normal");
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  /* ⏱ FORMAT TIMER */
  const formatTime = () => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `00:${m}:${s}`;
  };

  /* 🎙 START / STOP RECORD */
  const handleRecord = async () => {
    if (isRecording) {
      // STOP
      mediaRecorderRef.current?.stop();
      window.electronAPI.recorderStop();
    } else {
      // START
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        audioRef.current = new Audio(url);
      };

      recorder.start(200);

      window.electronAPI.recorderStart();
    }
  };

  /* ▶️ PLAY / PAUSE */
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();

      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }

    setIsPlaying(!isPlaying);
  };

  /* 🔁 DISCARD */
  const handleDiscard = () => {
    setAudioUrl(null);
    setIsPlaying(false);
    chunksRef.current = [];
    audioRef.current = null;

    window.electronAPI.recorderReset();
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col justify-between px-5 py-6">
      {/* HEADER */}
      <div className="text-center">
        <div className="text-center">
          <p className="text-sm text-gray-400">{username}</p>

          <h1
            className={`text-2xl font-semibold ${
              isRecording ? "text-red-500" : ""
            }`}
          >
            {isRecording ? "Recording" : "Dictate"}
          </h1>
        </div>

        <p className="text-5xl mt-5 tracking-widest font-semibold">
          {formatTime()}
        </p>
      </div>

      {/* 🌊 WAVE */}
      <div className="h-36 bg-[#0f0f0f] rounded-2xl relative overflow-hidden">
        {/* 🔴 CENTER LINE */}
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-red-500 -translate-x-1/2 z-10" />

        {isRecording ? (
          <LiveWave isRecording={true} />
        ) : audioUrl ? (
          <Waveform
            audioUrl={audioUrl}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        ) : (
          <div className="h-full" />
        )}
      </div>

      {/* ▶ PLAYBACK */}
      <div className="bg-[#0f0f0f] rounded-2xl py-4 flex justify-around items-center">
        <SkipBack className="text-gray-600" />

        <button
          onClick={handlePlayPause}
          disabled={!audioUrl}
          className="w-11 h-11 border border-gray-600 rounded-full flex items-center justify-center active:scale-90 transition disabled:opacity-30"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <SkipForward className="text-gray-600" />
      </div>

      {/* 🎙 RECORD + ACTION */}
      <div className="bg-[#0f0f0f] rounded-2xl py-6 flex flex-col items-center gap-5">
        {/* RECORD BUTTON */}
        <button
          onClick={handleRecord}
          className={`w-16 h-16 rounded-full border-4 transition active:scale-90 ${
            isRecording
              ? "bg-red-600 border-red-400 animate-pulse"
              : "bg-red-500 border-red-300"
          }`}
        />

        {/* ACTIONS AFTER STOP */}
        {!isRecording && audioUrl && (
          <div className="flex w-full gap-4 px-4">
            <button
              onClick={handleDiscard}
              className="flex-1 py-3 rounded-xl bg-red-700 text-white font-semibold shadow-lg active:scale-95 transition"
            >
              Discard
            </button>

            <button
              onClick={() => window.electronAPI.recorderReset()}
              className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-semibold shadow-lg active:scale-95 transition"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* PRIORITY */}
      <div>
        <div className="flex justify-between items-center">
          <p className="text-gray-400">Priority</p>

          <button
            onClick={() => setShowComment(!showComment)}
            className="text-blue-400 text-sm"
          >
            + Add comment
          </button>
        </div>

        <div className="flex gap-3 mt-3 items-center">
          <button
            onClick={() => setPriority("normal")}
            className={`px-4 py-2 rounded-full text-sm ${
              priority === "normal"
                ? "bg-blue-500 text-white"
                : "border border-gray-600 text-gray-400"
            }`}
          >
            normal
          </button>

          <button
            onClick={() => setPriority("high")}
            className={`px-4 py-2 rounded-full text-sm ${
              priority === "high"
                ? "bg-red-500 text-white"
                : "border border-gray-600 text-gray-400"
            }`}
          >
            high
          </button>

          {showComment && (
            <input
              placeholder="(optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-[#111] border border-gray-600 px-3 py-1 rounded text-sm outline-none"
            />
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div>
        <p className={`text-lg ${isRecording ? "text-red-500" : "text-white"}`}>
          {isRecording ? "Recording..." : "New Dictation"}
        </p>

        <p className="text-gray-500 text-sm">{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
