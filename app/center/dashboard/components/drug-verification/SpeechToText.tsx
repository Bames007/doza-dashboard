"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  StopCircle,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  language?: string;
  className?: string;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onTranscript,
  onStart,
  onStop,
  language = "en-US",
  className = "",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(fullTranscript);
      onTranscript(fullTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setError(`Error: ${event.error}`);
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [language, onTranscript]);

  const startListening = () => {
    if (!isSupported) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }

    setError(null);
    setTranscript("");
    recognitionRef.current?.start();
    setIsListening(true);
    onStart?.();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    onStop?.();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    onTranscript("");
    setCopied(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError("Failed to copy to clipboard");
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <h4 className="font-medium text-red-900">
              Speech Recognition Not Supported
            </h4>
            <p className="text-sm text-red-700">
              Your browser does not support speech recognition. Try using
              Chrome, Edge, or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full transition-colors ${
              isListening ? "bg-green-100 animate-pulse" : "bg-gray-100"
            }`}
          >
            {isListening ? (
              <Volume2 className="w-5 h-5 text-green-600" />
            ) : (
              <Mic className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Voice Input</h3>
            <p className="text-sm text-gray-600">
              {isListening
                ? "Listening... Speak clearly"
                : "Click to start speaking"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              isListening
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            type="button"
          >
            {isListening ? (
              <>
                <StopCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Start Speaking</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {transcript && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Transcript
            </label>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                type="button"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={clearTranscript}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 max-h-40 overflow-y-auto">
            <p className="text-gray-800 whitespace-pre-wrap text-sm">
              {transcript}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="text-xs text-gray-600">
          <div className="font-medium text-gray-700 mb-1">Tips:</div>
          <ul className="space-y-1">
            <li>• Speak clearly and naturally</li>
            <li>• Use commands like "period" or "comma"</li>
            <li>• Say "new paragraph" for line breaks</li>
          </ul>
        </div>
        <div className="text-xs text-gray-600">
          <div className="font-medium text-gray-700 mb-1">Commands:</div>
          <ul className="space-y-1">
            <li>• "period" → .</li>
            <li>• "comma" → ,</li>
            <li>• "question mark" → ?</li>
            <li>• "exclamation point" → !</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpeechToText;
