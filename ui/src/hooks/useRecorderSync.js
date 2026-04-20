import { useEffect, useState } from "react";

export default function useRecorderSync() {
  const [state, setState] = useState({
    isRecording: false,
    isPaused: false,
    seconds: 0,
  });

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onRecorderUpdate((data) => {
      setState(data);
    });

  }, []);

  return state;
}