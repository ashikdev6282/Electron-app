import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, HelpCircle } from "lucide-react";
import useRecorderSync from "../hooks/useRecorderSync";
import Waveform from "../components/Waveform";
import LiveWave from "../components/LiveWave";
import FileNamePopup from "../components/FileNamePopup";
import { convertWebmToWav } from "../utils/audioConverter";
import DiscardPopup from "../components/DiscardPopup";
import { toast } from "sonner";

export default function Dictate() {
  const { isRecording, seconds } = useRecorderSync();
  const username = localStorage.getItem("username") || "Unknown";

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const waveRef = useRef(null);

  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [priority, setPriority] = useState("normal");
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  const [showNamePopup, setShowNamePopup] = useState(false);
  const [fileNameInput, setFileNameInput] = useState("");

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  //  REPLACE YOUR useEffect WITH THIS

  useEffect(() => {
    let retryCount = 0;

    const loadChunks = async () => {
      try {
        const rawChunks = await window.electronAPI.getRecordedChunks();

        if (!rawChunks || !rawChunks.length) {
          // 🔥 retry (max 5 times)
          if (retryCount < 5) {
            retryCount++;
            setTimeout(loadChunks, 150);
          }
          return;
        }

        // 🔥 convert back to Uint8Array
        const reconstructed = rawChunks.map((chunkArray) => {
          return new Uint8Array(chunkArray);
        });

        chunksRef.current = reconstructed;

        const blob = new Blob(reconstructed, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(blob);

        setAudioUrl(url);
        audioRef.current = new Audio(url);
      } catch (err) {
        console.error("Load chunks error:", err);
      }
    };

    // 🔥 RUN ON MOUNT
    loadChunks();

    // 🔥 RUN AFTER STOP
    if (window.electronAPI?.onRecorderFinished) {
      window.electronAPI.onRecorderFinished(() => {
        retryCount = 0; // reset
        loadChunks();
      });
    }
  }, []);

  /*  FORMAT TIMER */
  const formatTime = () => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `00:${m}:${s}`;
  };

  /*  START / STOP RECORD */
  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
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
        if (!chunksRef.current.length) {
          console.error("❌ No chunks recorded");
          return;
        }

        // 🔥 Convert properly like floating
        const buffers = [];

        for (const chunk of chunksRef.current) {
          const arrayBuffer = await chunk.arrayBuffer();
          buffers.push(Array.from(new Uint8Array(arrayBuffer)));
        }

        // 🔥 Save globally FIRST
        window.electronAPI.setRecordedChunks(buffers);

        // 🔥 THEN stop recorder state (VERY IMPORTANT)
        window.electronAPI.recorderStop();

        // 🔥 UI preview
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      recorder.start(200);
      window.electronAPI.recorderStart();
    }
  };

  /*  PLAY / PAUSE */
  const handlePlayPause = () => {
    const wave = waveRef.current;
    if (!wave) return;

    if (isPlaying) {
      wave.pause();
      setIsPlaying(false);
    } else {
      wave.play();
      setIsPlaying(true);
    }
  };

  /*  DISCARD */
  const handleDiscard = () => {
    setAudioUrl(null);
    setIsPlaying(false);
    chunksRef.current = [];

    window.electronAPI.recorderReset();
    window.electronAPI.clearRecordedChunks();
  };

  /*  UPLOAD FUNCTION */
  const uploadRecording = async (customName = "") => {
    try {
      if (isUploading) return;
      setIsUploading(true);

      const user = JSON.parse(localStorage.getItem("user"));

      if (!audioUrl || !chunksRef.current.length) {
        console.error("❌ No audio recorded");
        return;
      }

      const timestamp = Date.now();

      // ✅ sanitize
      const safeUsername = (user.username || "user").replace(/\s+/g, "_");
      const safeInput = (customName || "").replace(/\s+/g, "_");

      let fileName = "";

      // 🔥 TYPE 1 & 3 → SAME FORMAT
      if (user.file_naming_type === 1 || user.file_naming_type === 3) {
        fileName = `REC_${user.userid}_${safeUsername}_${timestamp}.wav`;
      }

      // 🔥 TYPE 2 → CUSTOM
      else if (user.file_naming_type === 2) {
        fileName = `REC_${user.userid}_${safeUsername}_${safeInput}_${timestamp}.wav`;
      }

      // 🔥 CONVERT
      const wavBlob = await convertWebmToWav(chunksRef.current);
      const buffer = await wavBlob.arrayBuffer();

      const res = await window.electronAPI.uploadAudio({
        fileBuffer: buffer,
        fileName,
        priority,
        comment,
      });

      console.log("UPLOAD RESPONSE 👉", res);

      if (res.success) {
        toast.success("Audio uploaded successfully ✅");
        handleDiscard();
      } else {
        toast.error(res.message || "Upload failed ❌");
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      toast.error("An error occurred during upload ❌");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendFlow = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return;

    // 🔥 WAIT until audio is ready
    setTimeout(() => {
      if (!chunksRef.current.length) return;

      if (user.file_naming_type === 2) {
        setShowNamePopup(true);
      } else {
        uploadRecording();
      }
    }, 200);
  };

  useEffect(() => {
    if (!window.electronAPI?.onTriggerSendFlow) return;

    window.electronAPI.onTriggerSendFlow(() => {
      handleSendFlow();
    });
  }, []);

  return (
    <div className="h-screen bg-black text-white flex flex-col gap-4 px-5 py-6">
      <div className="relative text-center">
        <button
          onClick={() => {
            // 👉 open help link OR modal
            window.open("https://your-help-link.com", "_blank");
          }}
          className="absolute right-0 top-0 text-gray-400 hover:text-white transition"
          title="Help"
        >
          <HelpCircle size={20} />
        </button>
        <p className="text-sm text-gray-400">{username}</p>

        <h1
          className={`text-2xl font-semibold ${isRecording ? "text-red-500" : ""}`}
        >
          {isRecording ? "Recording" : "Dictate"}
        </h1>

        <p className="text-5xl mt-5 tracking-widest font-semibold">
          {formatTime()}
        </p>
      </div>

      <div className="h-40 min-h-40 bg-[#111] rounded-2xl relative overflow-hidden">
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-red-500 -translate-x-1/2 z-10" />

        {isRecording ? (
          <LiveWave isRecording={true} />
        ) : audioUrl ? (
          <Waveform
            audioUrl={audioUrl}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onReady={(wave) => (waveRef.current = wave)}
          />
        ) : (
          <div className="h-full" />
        )}
      </div>

      <div className="h-30 bg-[#111] rounded-2xl flex items-center justify-around px-6">
        <SkipBack
          onClick={() => {
            const wave = waveRef.current;
            if (!wave) return;

            const duration = wave.getDuration();
            const current = wave.getCurrentTime();

            wave.pause(); // 🔥 fix overlap

            const newTime = Math.max(0, current - 5);
            wave.seekTo(newTime / duration);

            if (isPlaying) wave.play();
          }}
          className="text-gray-600 w-6 h-6 cursor-pointer"
        />

        <button
          onClick={handlePlayPause}
          disabled={!audioUrl}
          className="w-12 h-12 border border-gray-600 rounded-full flex items-center justify-center active:scale-90 transition disabled:opacity-30"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <SkipForward
          onClick={() => {
            const wave = waveRef.current;
            if (!wave) return;

            const duration = wave.getDuration();
            const current = wave.getCurrentTime();

            wave.pause(); // 🔥 fix overlap

            const newTime = Math.min(duration, current + 5);
            wave.seekTo(newTime / duration);

            if (isPlaying) wave.play();
          }}
          className="text-gray-600 w-6 h-6 cursor-pointer"
        />
      </div>

      <div className="h-40 bg-[#111] rounded-2xl flex flex-col items-center justify-center">
        <button
          onClick={handleRecord}
          className={`w-16 h-16 rounded-full border-4 transition active:scale-90 ${
            isRecording
              ? "bg-red-600 border-red-400 animate-pulse"
              : "bg-red-500 border-red-300"
          }`}
        />

        {!isRecording && audioUrl && (
          <div className="flex w-full gap-4 px-4">
            <button
              onClick={() => setShowDiscardPopup(true)}
              className="flex-1 py-3 rounded-xl bg-red-700 text-white font-semibold shadow-lg active:scale-95 transition"
            >
              DISCARD
            </button>

            <button
              onClick={() => {
                const user = JSON.parse(localStorage.getItem("user"));

                if (user.file_naming_type === 2) {
                  setShowNamePopup(true);
                } else {
                  uploadRecording();
                }
              }}
              disabled={isUploading}
              className={`flex-1 py-3 rounded-xl font-semibold shadow-lg transition 
    ${
      isUploading
        ? "bg-blue-400 cursor-not-allowed"
        : "bg-blue-700 active:scale-95"
    } text-white`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Uploading...
                </span>
              ) : (
                "SEND"
              )}
            </button>
          </div>
        )}
      </div>

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

      <div>
        <p className={`text-lg ${isRecording ? "text-red-500" : "text-white"}`}>
          {isRecording ? "Recording..." : "New Dictation"}
        </p>

        <p className="text-gray-500 text-sm">{new Date().toLocaleString()}</p>
      </div>

      <DiscardPopup
        isOpen={showDiscardPopup}
        onCancel={() => setShowDiscardPopup(false)}
        onConfirm={() => {
          handleDiscard();
          setShowDiscardPopup(false);
        }}
      />

      <FileNamePopup
        isOpen={showNamePopup}
        fileName={fileNameInput}
        setFileName={setFileNameInput}
        onClose={() => setShowNamePopup(false)}
        onSubmit={(name) => {
          uploadRecording(name);
          setShowNamePopup(false);
        }}
      />
    </div>
  );
}
