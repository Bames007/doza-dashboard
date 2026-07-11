// app/components/drug-verification/RichTextEditor.tsx (Compact Version)
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Mic,
  Eye,
  Undo,
  Redo,
  X,
  Check,
  Copy,
  Volume2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean; // New prop for compact mode
  maxHeight?: string; // New prop for mobile
}

const CompactRichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  compact = false,
  maxHeight = "200px",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const lastHtmlRef = useRef<string>("");

  // Sync value with editor content
  useEffect(() => {
    if (editorRef.current && value !== lastHtmlRef.current) {
      editorRef.current.innerHTML = value;
      lastHtmlRef.current = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      onChange(html);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value || "");
    handleInput();
    editorRef.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  };

  // Speech to Text Functions
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

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

      // Insert text at cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(fullTranscript));
        handleInput();
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  const stopSpeechRecognition = () => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.warn("Error stopping speech recognition:", err);
    } finally {
      setIsListening(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
  };

  const insertTranscript = () => {
    if (transcript) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(transcript));
        handleInput();
      }
      setTranscript("");
    }
  };

  const getWordCount = () => {
    if (!value) return 0;
    const text = value.replace(/<[^>]*>/g, "");
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const toolbarItems = [
    {
      icon: Bold,
      tooltip: "Bold",
      action: () => executeCommand("bold"),
      command: "bold",
    },
    {
      icon: Italic,
      tooltip: "Italic",
      action: () => executeCommand("italic"),
      command: "italic",
    },
    {
      icon: Underline,
      tooltip: "Underline",
      action: () => executeCommand("underline"),
      command: "underline",
    },
    {
      icon: List,
      tooltip: "Bullet List",
      action: () => executeCommand("insertUnorderedList"),
      command: "insertUnorderedList",
    },
    {
      icon: ListOrdered,
      tooltip: "Numbered List",
      action: () => executeCommand("insertOrderedList"),
      command: "insertOrderedList",
    },
  ];

  // For mobile, wrap recognition in ref
  const recognitionRef = useRef<any>(null);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Compact Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-1.5">
        <div className="flex items-center justify-between">
          {/* Formatting buttons */}
          <div className="flex items-center gap-1">
            {toolbarItems.map((item, index) => (
              <button
                key={item.command}
                onClick={item.action}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors min-w-[36px] flex items-center justify-center"
                title={item.tooltip}
                type="button"
              >
                <item.icon className="w-3.5 h-3.5" />
              </button>
            ))}

            {/* Quick actions */}
            <div className="w-px h-4 bg-gray-300 mx-0.5" />

            <button
              onClick={() => executeCommand("undo")}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"
              title="Undo"
              type="button"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => executeCommand("redo")}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"
              title="Redo"
              type="button"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSpeech(!showSpeech)}
              className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${
                showSpeech ? "bg-blue-100 text-blue-600" : "text-gray-700"
              }`}
              title="Voice Input"
              type="button"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"
              title={showPreview ? "Edit" : "Preview"}
              type="button"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Speech Panel */}
      {showSpeech && (
        <div className="border-b border-gray-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-full ${
                  isListening ? "bg-green-100 animate-pulse" : "bg-gray-100"
                }`}
              >
                {isListening ? (
                  <Volume2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Mic className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {isListening ? "Listening..." : "Voice Input"}
                </h4>
              </div>
            </div>

            <div className="flex gap-1">
              <button
                onClick={
                  isListening ? stopSpeechRecognition : startSpeechRecognition
                }
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  isListening
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                type="button"
              >
                {isListening ? "Stop" : "Start"}
              </button>

              {transcript && (
                <>
                  <button
                    onClick={copyToClipboard}
                    className="px-2 py-1 border border-blue-300 text-blue-700 rounded text-xs hover:bg-blue-50 flex items-center gap-1"
                    type="button"
                  >
                    {copied ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={insertTranscript}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    type="button"
                  >
                    Insert
                  </button>
                  <button
                    onClick={clearTranscript}
                    className="px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {transcript && (
            <div className="mt-2">
              <div className="bg-white border border-gray-300 rounded p-2 max-h-24 overflow-y-auto text-xs">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {transcript}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor/Preview Area */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: compact ? maxHeight : "300px" }}
      >
        {showPreview ? (
          <div className="p-3 prose prose-sm max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html:
                  value ||
                  '<p class="text-gray-400 text-center py-4 text-sm">No content to preview</p>',
              }}
            />
          </div>
        ) : (
          <div
            ref={editorRef}
            className="min-h-[120px] p-3 focus:outline-none prose prose-sm max-w-none text-gray-900 bg-white"
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            suppressContentEditableWarning
            style={{ whiteSpace: "pre-wrap" }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Compact Footer */}
      {!compact && (
        <div className="bg-gray-50 border-t border-gray-300 p-2 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-600">●</span>
              <span>Auto-saved</span>
            </div>
            <div>{getWordCount()} words</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactRichTextEditor;
