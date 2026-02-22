import { useEffect, useRef, useState } from "react";

export default function Dictate() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const isRecordingRef = useRef(false);

  const [recording, setRecording] = useState(false);
  const [time, setTime] = useState(0);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    let timer;
    if (recording) {
      timer = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [recording]);

  /* ---------------- START RECORDING ---------------- */
  const startRecording = async () => {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(destination);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    micSource.connect(analyser);
    analyserRef.current = analyser;

    const recorder = new MediaRecorder(destination.stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = e => chunksRef.current.push(e.data);
    recorder.start();

    isRecordingRef.current = true;
    setRecording(true);
    setTime(0);

    drawWaveform();
  };

  /* ---------------- STOP RECORDING ---------------- */
  const stopRecording = () => {
    isRecordingRef.current = false;
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  /* ---------------- WAVEFORM ---------------- */
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecordingRef.current) return;

      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ff3b3b";
      ctx.beginPath();

      let sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.stroke();
      requestAnimationFrame(draw);
    };

    draw();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="h-full bg-black flex justify-center overflow-hidden">
      <div className="w-full max-w-105 px-4 pt-10 flex flex-col items-center text-white">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-3">Dictate</h1>
          <div className="text-4xl font-mono tracking-widest">
            {formatTime(time)}
          </div>
        </div>

        {/* WAVEFORM */}
        <div className="relative w-full h-37.5 bg-[#111] rounded-2xl mb-6 flex items-center justify-center">
          <canvas ref={canvasRef} width={320} height={140} />
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-500" />
        </div>

        {/* CONTROLS */}
        <div className="w-full bg-[#111] rounded-2xl flex justify-around items-center py-4 mb-6">
          <button className="text-white/80 text-xl">⏮</button>
          <button className="text-white text-2xl">▶</button>
          <button className="text-white/80 text-xl">⏭</button>
        </div>

        {/* RECORD BUTTON */}
        <div className="w-full bg-[#111] rounded-2xl flex justify-center py-6 mb-5">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full transition-all ${
              recording
                ? "bg-zinc-600"
                : "bg-red-500 hover:ring-4 hover:ring-red-500/40"
            }`}
          />
        </div>

        {/* META */}
        <div className="w-full flex justify-between items-center mb-5 text-sm">
          <div>
            <div className="mb-2 text-white/70">Priority</div>
            <div className="flex gap-2">
              <button className="px-4 py-1 rounded-full bg-zinc-700 text-white text-xs">
                normal
              </button>
              <button className="px-4 py-1 rounded-full bg-zinc-800 text-white/60 text-xs">
                high
              </button>
            </div>
          </div>

          <button className="text-blue-400 text-sm">
            + Add comment
          </button>
        </div>

        {/* INFO */}
        <div className="w-full text-left mt-auto mb-16">
          <h3 className="text-lg font-medium mb-1">New Dictation</h3>
          <span className="text-sm text-white/60">
            {new Date().toLocaleString()}
          </span>
        </div>

      </div>
    </div>
  );
}

/* ---------------- UTIL ---------------- */
function formatTime(seconds) {
  return new Date(seconds * 1000).toISOString().substring(11, 19);
}