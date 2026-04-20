import { useRef, useState } from "react";

export default function useRecorder() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const allChunksRef = useRef([]); // 🔥 store multiple recordings
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  /* 🎙 START */
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      // 🔥 append instead of replace
      allChunksRef.current.push(...chunksRef.current);

      const blob = new Blob(allChunksRef.current, {
        type: "audio/webm",
      });

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      audioRef.current = new Audio(url);

      streamRef.current?.getTracks().forEach((t) => t.stop());
    };

    recorder.start(200);
    setIsRecording(true);
    setIsFinished(false);
  };

  /* ⏹ STOP */
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsFinished(true);
  };

  /* ▶️ PLAY */
  const play = () => audioRef.current?.play();
  const pause = () => audioRef.current?.pause();

  /* 🔁 DISCARD */
  const discard = () => {
    allChunksRef.current = [];
    audioRef.current = null;
    setAudioUrl(null);
    setIsFinished(false);
  };

  return {
    isRecording,
    isFinished,
    audioUrl,
    startRecording,
    stopRecording,
    play,
    pause,
    discard,
  };
}