// app/center/dashboard/components/DraggableChatPopup.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Paperclip,
  Smile,
  Send,
  MoreVertical,
  Minimize2,
  Maximize2,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface Chat {
  id: number;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
}

interface DraggableChatPopupProps {
  chat: Chat | null;
  onClose: () => void;
}

export default function DraggableChatPopup({
  chat,
  onClose,
}: DraggableChatPopupProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Set initial position for mobile
  useEffect(() => {
    if (isMobile) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isMobile]);

  const messages = [
    {
      id: 1,
      text: "Hello, how can I help you today?",
      sender: "them",
      time: "2:30 PM",
    },
    {
      id: 2,
      text: "I need to discuss the patient's test results",
      sender: "me",
      time: "2:31 PM",
    },
    {
      id: 3,
      text: "The lab results are ready for review. Everything looks normal.",
      sender: "them",
      time: "2:32 PM",
    },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && !isMobile) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging && !isMobile) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, isMobile]);

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!chat) return null;

  // Mobile Full Screen Version
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                  {chat.avatar}
                </div>
                <div
                  className={cn(
                    "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white",
                    chat.status === "online" && "bg-emerald-400",
                    chat.status === "away" && "bg-amber-400",
                    chat.status === "offline" && "bg-slate-400",
                  )}
                />
              </div>
              <div>
                <h3 className={cn("text-lg font-bold", bebasNeue.className)}>
                  {chat.name}
                </h3>
                <p
                  className={cn("text-sm text-emerald-100", poppins.className)}
                >
                  {chat.status}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-5 h-5" />
                ) : (
                  <Minimize2 className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages - Hidden when minimized */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/80 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender === "me" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm",
                      msg.sender === "me"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        poppins.className,
                      )}
                    >
                      {msg.text}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        msg.sender === "me"
                          ? "text-emerald-100"
                          : "text-slate-400",
                      )}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-slate-200/80 bg-white/90 backdrop-blur-sm safe-area-padding">
              <div className="flex items-end space-x-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0">
                  <Smile className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className={cn(
                      "w-full border border-slate-200/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 resize-none placeholder:text-slate-400 text-slate-800 bg-white",
                      poppins.className,
                    )}
                    style={{
                      minHeight: "44px",
                      maxHeight: "120px",
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200/30 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="flex-1 bg-slate-50/50 flex items-center justify-center">
            <div className="text-center">
              <p className={cn("text-slate-500", poppins.className)}>
                Chat minimized
              </p>
              <p
                className={cn("text-sm text-slate-400 mt-1", poppins.className)}
              >
                Tap the expand button to continue chatting
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Draggable Version
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop Blur */}
      {isDragging && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity" />
      )}

      {/* Draggable Chat Window */}
      <div
        ref={chatRef}
        className={cn(
          "absolute bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden pointer-events-auto",
          "transition-shadow duration-200",
          isHovered && "shadow-2xl border-emerald-200/60",
          "w-96 h-[520px]",
        )}
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header - Draggable Area */}
        <div
          onMouseDown={handleMouseDown}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {chat.avatar}
                </div>
                <div
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                    chat.status === "online" && "bg-emerald-400",
                    chat.status === "away" && "bg-amber-400",
                    chat.status === "offline" && "bg-slate-400",
                  )}
                />
              </div>
              <div>
                <h3 className={cn("text-white font-bold", bebasNeue.className)}>
                  {chat.name}
                </h3>
                <p
                  className={cn("text-sm text-emerald-100", poppins.className)}
                >
                  {chat.status}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages - Hidden when minimized */}
        {!isMinimized && (
          <>
            <div className="h-80 overflow-y-auto p-4 bg-slate-50/80 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender === "me" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
                      msg.sender === "me"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        poppins.className,
                      )}
                    >
                      {msg.text}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        msg.sender === "me"
                          ? "text-emerald-100"
                          : "text-slate-400",
                      )}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-slate-200/80 bg-white">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0">
                  <Smile className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className={cn(
                    "flex-1 border border-slate-200/80 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-slate-800 placeholder:text-slate-400 bg-white",
                    poppins.className,
                  )}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200/30 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="h-16 bg-slate-50/80 flex items-center justify-center border-t border-slate-200/80">
            <p className={cn("text-sm text-slate-500", poppins.className)}>
              Chat minimized — click to expand
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
