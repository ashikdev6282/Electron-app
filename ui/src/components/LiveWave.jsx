import { useEffect, useRef, useState } from "react";

export default function LiveWave({ isRecording }) {
  const [bars, setBars] = useState([]);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const MAX_BARS = 40; // 🔥 controls width

  useEffect(() => {
    let audioContext;
    let source;
    let lastPushTime = 0;

    if (isRecording) {
      const start = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        audioContext = new AudioContext();
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 64;

        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const update = (time) => {
          analyserRef.current.getByteFrequencyData(dataArray);

          // 🔥 smoother amplitude (not raw avg)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

          const height = Math.max(6, avg / 3);

          // 🔥 CONTROL SPEED HERE (VERY IMPORTANT)
          if (time - lastPushTime > 80) {
            setBars((prev) => {
              const updated = [...prev, height];

              if (updated.length > MAX_BARS) {
                updated.shift(); // move left
              }

              return updated;
            });

            lastPushTime = time;
          }

          animationRef.current = requestAnimationFrame(update);
        };

        update();
      };

      start();
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      audioContext?.close();
    };
  }, [isRecording]);

  return (
    <div className="h-36 bg-[#0f0f0f] rounded-2xl relative overflow-hidden flex items-center">
      {/* 🔴 CENTER LINE (ALWAYS VISIBLE) */}
      <div className="absolute left-1/2 top-0 w-0.5 h-full bg-red-500 z-10 -translate-x-1/2" />

      {/* LEFT SIDE (WAVE ONLY LEFT) */}
      <div className="absolute left-1/2 flex items-center gap-0.75 -translate-x-full pr-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-1 bg-white rounded-full"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
}
