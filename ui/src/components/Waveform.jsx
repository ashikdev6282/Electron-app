import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export default function Waveform({
  audioUrl,
  isPlaying,
  setIsPlaying,
  onReady,
}) {
  const containerRef = useRef(null);
  const waveRef = useRef(null);

  /* 🔥 INIT WAVE */
  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // destroy old instance
    if (waveRef.current) {
      waveRef.current.destroy();
      waveRef.current = null;
    }

    try {
      const wave = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#ffffff",
        progressColor: "#ef4444",
        cursorWidth: 0,
        barWidth: 3,
        barGap: 2,
        height: 100,
        responsive: true,
        interact: false,
      });

      wave.load(audioUrl);

      /* 🔥 READY */
      wave.on("ready", () => {
        if (onReady) onReady(wave);
      });

      /* 🔥 FINISH */
      wave.on("finish", () => {
        setIsPlaying(false);
      });

      waveRef.current = wave;
    } catch (err) {
      console.error("WaveSurfer error:", err);
    }

    return () => {
      waveRef.current?.destroy();
    };
  }, [audioUrl]);

  /* ▶️ PLAY / PAUSE SYNC */
  useEffect(() => {
    const wave = waveRef.current;
    if (!wave) return;

    if (isPlaying) {
      wave.play();
    } else {
      wave.pause();
    }
  }, [isPlaying]);

  return (
    <div className="relative overflow-hidden h-36 bg-[#0f0f0f] rounded-2xl">
      {/* CENTER ALIGN */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full">
        <div ref={containerRef} />
      </div>
    </div>
  );
}