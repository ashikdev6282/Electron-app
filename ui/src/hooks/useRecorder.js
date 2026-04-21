import { useRef, useState } from "react";

export default function useRecorder() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const allChunksRef = useRef([]); // 🔥 store multiple recordings
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null); // 🔥 for cleanup

  const [isRecording, setIsRecording] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  /* 🎙 START */
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 48000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        googEchoCancellation: true,
        googNoiseSuppression: true,
        googAutoGainControl: true,
        googHighpassFilter: true,
      },
    });

    streamRef.current = stream;

    /* 🔥 AUDIO PROCESSING */
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);

    // 🎯 HIGH PASS FILTER (remove low noise like fan/AC)
    const highpass = audioContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(100, audioContext.currentTime);

    // 🎯 COMPRESSOR (focus voice, reduce background)
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-45, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    // 🎯 GAIN (boost voice)
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(1.3, audioContext.currentTime);

    // 🔗 CONNECT PIPELINE
    source.connect(highpass);
    highpass.connect(compressor);
    compressor.connect(gainNode);

    const destination = audioContext.createMediaStreamDestination();
    gainNode.connect(destination);

    const enhancedStream = destination.stream;

    /* 🔥 MEDIA RECORDER */
    const recorder = new MediaRecorder(enhancedStream, {
      mimeType: "audio/webm;codecs=opus",
      audioBitsPerSecond: 128000,
    });

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

      // 🔥 stop mic
      streamRef.current?.getTracks().forEach((t) => t.stop());

      // 🔥 cleanup audio context
      audioContextRef.current?.close();
    };

    recorder.start(); // ✅ high quality continuous recording

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