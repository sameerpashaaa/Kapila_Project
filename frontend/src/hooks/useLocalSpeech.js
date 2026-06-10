/**
 * useLocalSpeech.js — React hook for local speech-to-text via Whisper Tiny.
 *
 * Usage:
 *   const { listening, transcript, interimText, startRecording, stopRecording } = useLocalSpeech(lang);
 *
 * @param {string} lang - BCP-47 language code, e.g. "en", "hi", "te"
 */

import { useState, useRef, useCallback } from "react";

// Map BCP-47 tags to Whisper language names
const LANG_MAP = {
  "en-IN": "english",
  "en":    "english",
  "hi-IN": "hindi",
  "hi":    "hindi",
  "te-IN": "telugu",
  "te":    "telugu",
  "ta-IN": "tamil",
  "ta":    "tamil",
  "kn-IN": "kannada",
  "kn":    "kannada",
  "ml-IN": "malayalam",
  "ml":    "malayalam",
  "mr-IN": "marathi",
  "mr":    "marathi",
  "gu-IN": "gujarati",
  "gu":    "gujarati",
  "bn-IN": "bengali",
  "bn":    "bengali",
  "pa-IN": "punjabi",
  "pa":    "punjabi",
};

export function useLocalSpeech(lang = "en-IN") {
  const [listening, setListening]     = useState(false);
  const [statusMsg, setStatusMsg]     = useState("");
  const [transcript, setTranscript]   = useState("");
  const [interimText, setInterimText] = useState("");

  const workerRef       = useRef(null);
  const mediaRecorder   = useRef(null);
  const audioChunks     = useRef([]);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/whisper.worker.js", import.meta.url),
        { type: "module" }
      );
    }
    return workerRef.current;
  }, []);

  const startRecording = useCallback(async (onResult, onStatus) => {
    if (listening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });

        const worker = getWorker();
        const whisperLang = LANG_MAP[lang] || "english";

        worker.onmessage = (e) => {
          const { type, text, message } = e.data;
          if (type === "progress") {
            setStatusMsg(message);
            setInterimText(message);
            if (onStatus) onStatus(message);
          } else if (type === "result") {
            setTranscript((prev) => (prev ? prev + "\n" + text : text));
            setInterimText("");
            setStatusMsg("");
            if (onResult) onResult(text);
          } else if (type === "error") {
            setStatusMsg("Error: " + message);
            setInterimText("");
            if (onStatus) onStatus("Error: " + message);
          }
        };

        try {
          // Decode audio on main thread because AudioContext is not available in Web Workers
          const arrayBuffer = await blob.arrayBuffer();
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
          const decoded = await audioCtx.decodeAudioData(arrayBuffer);
          audioCtx.close();
          const audioData = decoded.getChannelData(0); // Mono, 16 kHz Float32Array

          worker.postMessage({ type: "transcribe", audioData, language: whisperLang }, [audioData.buffer]);
        } catch (err) {
          setStatusMsg("Error decoding audio: " + err.message);
          if (onStatus) onStatus("Error decoding audio: " + err.message);
        }
      };

      mediaRecorder.current.start();
      setListening(true);
      setStatusMsg("🎙️ Recording… click stop when done.");
      if (onStatus) onStatus("🎙️ Recording… click stop when done.");
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow mic in browser settings."
          : "Could not start recording: " + err.message;
      setStatusMsg(msg);
      if (onStatus) onStatus(msg);
    }
  }, [listening, lang, getWorker]);

  const stopRecording = useCallback((onStatus) => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      setListening(false);
      setStatusMsg("Transcribing…");
      if (onStatus) onStatus("Transcribing…");
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimText("");
    setStatusMsg("");
  }, []);

  return {
    listening,
    statusMsg,
    transcript,
    interimText,
    startRecording,
    stopRecording,
    clearTranscript,
  };
}
