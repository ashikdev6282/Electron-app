import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export default function Waveform({
  audioUrl,
  isPlaying,
  setIsPlaying,
  onReady,
  onTimeUpdate,
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
        cursorWidth: 2,
        barWidth: 3,
        barGap: 2,
        height: 100,
        minPxPerSec: 100, // 🔥 makes waveform scrollable
        scrollParent: true,
        responsive: true,
        interact: true,
      });

      wave.load(audioUrl);

      /* 🔥 READY */
      wave.on("ready", () => {
        if (onReady) onReady(wave);
      });

      wave.on("audioprocess", () => {
        const current = wave.getCurrentTime();

        onTimeUpdate?.(current);
      });

      wave.on("interaction", () => {
        const current = wave.getCurrentTime();

        // 🔥 update timer immediately
        if (onTimeUpdate) {
          onTimeUpdate(current);
        }
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
      <div ref={containerRef} />
    </div>
  );
}
