"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

interface SpeechInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSpeechText?: (text: string) => void;
  showSpeechButton?: boolean;
}

const SpeechInput: React.FC<SpeechInputProps> = ({
  onSpeechText,
  showSpeechButton = true,
  className = "",
  value,
  onChange,
  ...props
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const handleSpeechResult = (event: any) => {
      const transcript = event.results[0][0].transcript;

      if (onChange) {
        // Create a synthetic event
        const syntheticEvent = {
          target: {
            value: transcript,
            name: props.name,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }

      if (onSpeechText) {
        onSpeechText(transcript);
      }
    };

    if (isListening && recognitionRef.current) {
      recognitionRef.current.onresult = handleSpeechResult;
    }
  }, [isListening, onChange, onSpeechText, props.name]);

  const startListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;

      if (onChange) {
        const syntheticEvent = {
          target: {
            value: transcript,
            name: props.name,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }

      if (onSpeechText) {
        onSpeechText(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative w-full">
      <input
        {...props}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500 bg-white ${className}`}
        style={{ paddingRight: showSpeechButton ? "3rem" : "1rem" }}
      />
      {showSpeechButton && (
        <button
          type="button"
          onClick={toggleListening}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
            isListening
              ? "bg-red-100 text-red-600 animate-pulse"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
};

export default SpeechInput;
