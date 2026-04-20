import { useEffect, useRef, useState } from "react";

export default function useTimer(isRecording) {
  const [seconds, setSeconds] = useState(0);

  const startTimeRef = useRef(0);
  const accumulatedRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();

      const update = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000 + accumulatedRef.current;

        setSeconds(elapsed); // 🔥 no floor (smooth)

        rafRef.current = requestAnimationFrame(update);
      };

      rafRef.current = requestAnimationFrame(update);
    } else {
      accumulatedRef.current = seconds;
      cancelAnimationFrame(rafRef.current);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [isRecording]);

  const reset = () => {
    setSeconds(0);
    accumulatedRef.current = 0;
    startTimeRef.current = Date.now();
  };

  return { seconds, reset };
}