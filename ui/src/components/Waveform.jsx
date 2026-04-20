import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export default function Waveform({ audioUrl, isPlaying, setIsPlaying }) {
  const containerRef = useRef(null);
  const waveRef = useRef(null);

  /* 🔥 INIT + LOAD AUDIO */
  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // destroy old instance safely
    if (waveRef.current) {
      waveRef.current.destroy();
      waveRef.current = null;
    }

    try {
      waveRef.current = WaveSurfer.create({
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

      waveRef.current.load(audioUrl);

      /* 🔥 AUTO STOP */
      waveRef.current.on("finish", () => {
        setIsPlaying(false);
      });

    } catch (err) {
      console.error("WaveSurfer error:", err);
    }

    return () => {
      waveRef.current?.destroy();
    };
  }, [audioUrl]);

  /* ▶️ PLAY / PAUSE */
  useEffect(() => {
    if (!waveRef.current) return;

    if (isPlaying) {
      waveRef.current.play();
    } else {
      waveRef.current.pause();
    }
  }, [isPlaying]);

  return (
    <div className="relative overflow-hidden h-36 bg-[#0f0f0f] rounded-2xl">
      {/* CENTERED WAVE */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full">
        <div ref={containerRef} />
      </div>
    </div>
  );
}