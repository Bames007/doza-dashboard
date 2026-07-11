// app/center/dashboard/components/MessagesPanel.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Video,
  Phone,
  MoreVertical,
  Send,
  Mic,
  UserPlus,
  CheckCircle,
  Clock,
  Users,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface User {
  id: number;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  role: string;
}

interface Message {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  status: "online" | "offline" | "away";
  role: string;
}

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onChatSelect: (chat: any) => void;
}

export default function MessagesPanel({
  isOpen,
  onClose,
  onChatSelect,
}: MessagesPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"contacts" | "chats">("chats");

  const onlineUsers: User[] = [
    {
      id: 1,
      name: "Dr. Sarah",
      avatar: "SJ",
      status: "online",
      role: "Cardiologist",
    },
    {
      id: 2,
      name: "Nurse Mike",
      avatar: "NM",
      status: "online",
      role: "Head Nurse",
    },
    {
      id: 3,
      name: "Dr. Alex",
      avatar: "AC",
      status: "away",
      role: "Surgeon",
    },
    {
      id: 4,
      name: "Lab Tech",
      avatar: "LT",
      status: "online",
      role: "Lab Technician",
    },
    {
      id: 5,
      name: "Pharmacy",
      avatar: "PH",
      status: "offline",
      role: "Pharmacist",
    },
    {
      id: 6,
      name: "Admin",
      avatar: "AD",
      status: "online",
      role: "Administrator",
    },
  ];

  const messages: Message[] = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      avatar: "SJ",
      lastMessage: "Patient test results are ready for review",
      time: "2 min ago",
      unread: true,
      status: "online",
      role: "Cardiologist",
    },
    {
      id: 2,
      name: "Nursing Staff",
      avatar: "NS",
      lastMessage: "Room 204 needs immediate assistance",
      time: "10 min ago",
      unread: false,
      status: "online",
      role: "Nursing Team",
    },
    {
      id: 3,
      name: "Lab Department",
      avatar: "LD",
      lastMessage: "Urgent blood work completed and uploaded",
      time: "1 hour ago",
      unread: true,
      status: "away",
      role: "Laboratory",
    },
    {
      id: 4,
      name: "Pharmacy Team",
      avatar: "PT",
      lastMessage: "Prescription ready for patient pickup",
      time: "2 hours ago",
      unread: false,
      status: "offline",
      role: "Pharmacy",
    },
  ];

  const filteredMessages = messages.filter(
    (message) =>
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredUsers = onlineUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto bg-white flex flex-col safe-padding shadow-2xl lg:rounded-2xl lg:border lg:border-slate-200/80">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-xl transition-all duration-200 active:scale-95 lg:hidden"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h3
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Messages
              </h3>
              <p className={cn("text-sm text-slate-500", poppins.className)}>
                {activeView === "chats"
                  ? `${filteredMessages.length} conversations`
                  : `${filteredUsers.length} contacts`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button className="p-2.5 hover:bg-white/60 rounded-xl transition-all duration-200 active:scale-95 text-emerald-600">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2.5 hover:bg-white/60 rounded-xl transition-all duration-200 active:scale-95 text-emerald-600">
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/60 rounded-xl transition-all duration-200 active:scale-95 hidden lg:block text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-white/80 rounded-xl p-1 mt-3 border border-slate-200/60 backdrop-blur-sm">
          <button
            onClick={() => setActiveView("chats")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
              activeView === "chats"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/50"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50",
              poppins.className,
            )}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveView("contacts")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
              activeView === "contacts"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/50"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50",
              poppins.className,
            )}
          >
            Contacts
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-200/80 bg-slate-50/50">
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${
              activeView === "chats" ? "messages" : "contacts"
            }...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-sm placeholder:text-slate-400 bg-white text-slate-800",
              poppins.className,
            )}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Online Users Horizontal Scroll - Only for Contacts View */}
      <AnimatePresence>
        {activeView === "contacts" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3 border-b border-slate-200/80 bg-slate-50/30 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h4
                className={cn(
                  "text-sm font-semibold text-slate-700",
                  poppins.className,
                )}
              >
                Online Now
              </h4>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {onlineUsers.filter((u) => u.status === "online").length} online
              </span>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer group"
                  onClick={() => onChatSelect(user)}
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-semibold text-sm shadow-sm transition-all group-hover:scale-105",
                        "bg-gradient-to-br from-emerald-500 to-teal-600",
                        user.status === "online" &&
                          "ring-2 ring-emerald-400 ring-offset-2",
                        user.status === "away" &&
                          "ring-2 ring-amber-400 ring-offset-2",
                      )}
                    >
                      {user.avatar}
                    </div>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
                        user.status === "online" && "bg-emerald-500",
                        user.status === "away" && "bg-amber-500",
                        user.status === "offline" && "bg-slate-400",
                      )}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={cn(
                        "text-xs font-medium text-slate-700 truncate w-16",
                        poppins.className,
                      )}
                    >
                      {user.name}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] text-slate-400 truncate w-16",
                        poppins.className,
                      )}
                    >
                      {user.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white">
        {activeView === "chats" ? (
          /* Messages List */
          filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p
                className={cn(
                  "text-sm text-slate-600 text-center mb-1",
                  poppins.className,
                )}
              >
                {searchTerm ? "No messages found" : "No conversations yet"}
              </p>
              <p
                className={cn(
                  "text-xs text-slate-400 text-center",
                  poppins.className,
                )}
              >
                {searchTerm
                  ? "Try a different search term"
                  : "Start a new conversation to get started"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onChatSelect(message)}
                  className="p-3 cursor-pointer transition-all hover:bg-emerald-50/50 active:bg-emerald-100/50 group"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar with Status */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-semibold text-sm shadow-sm",
                          "bg-gradient-to-br from-emerald-500 to-teal-600",
                          message.status === "online" &&
                            "ring-2 ring-emerald-400 ring-offset-2",
                          message.status === "away" &&
                            "ring-2 ring-amber-400 ring-offset-2",
                        )}
                      >
                        {message.avatar}
                      </div>
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                          message.status === "online" && "bg-emerald-500",
                          message.status === "away" && "bg-amber-500",
                          message.status === "offline" && "bg-slate-400",
                        )}
                      />
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center space-x-2">
                          <h4
                            className={cn(
                              "text-sm font-semibold text-slate-800 truncate",
                              poppins.className,
                            )}
                          >
                            {message.name}
                          </h4>
                          {message.unread && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0",
                            poppins.className,
                          )}
                        >
                          {message.time}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm text-slate-600 truncate",
                          poppins.className,
                        )}
                      >
                        {message.lastMessage}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] text-emerald-600 mt-0.5 font-medium",
                          poppins.className,
                        )}
                      >
                        {message.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : /* Contacts List */
        filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p
              className={cn(
                "text-sm text-slate-600 text-center mb-1",
                poppins.className,
              )}
            >
              {searchTerm ? "No contacts found" : "No contacts available"}
            </p>
            <p
              className={cn(
                "text-xs text-slate-400 text-center",
                poppins.className,
              )}
            >
              {searchTerm
                ? "Try a different search term"
                : "Your contacts will appear here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onChatSelect(user)}
                className="p-3 cursor-pointer transition-all hover:bg-emerald-50/50 active:bg-emerald-100/50 group"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar with Status */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-semibold text-sm shadow-sm",
                        "bg-gradient-to-br from-emerald-500 to-teal-600",
                        user.status === "online" &&
                          "ring-2 ring-emerald-400 ring-offset-2",
                        user.status === "away" &&
                          "ring-2 ring-amber-400 ring-offset-2",
                      )}
                    >
                      {user.avatar}
                    </div>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                        user.status === "online" && "bg-emerald-500",
                        user.status === "away" && "bg-amber-500",
                        user.status === "offline" && "bg-slate-400",
                      )}
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4
                        className={cn(
                          "text-sm font-semibold text-slate-800",
                          poppins.className,
                        )}
                      >
                        {user.name}
                      </h4>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize",
                          user.status === "online" &&
                            "bg-emerald-100 text-emerald-700",
                          user.status === "away" &&
                            "bg-amber-100 text-amber-700",
                          user.status === "offline" &&
                            "bg-slate-100 text-slate-600",
                        )}
                      >
                        {user.status}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm text-slate-600",
                        poppins.className,
                      )}
                    >
                      {user.role}
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all duration-200 active:scale-95 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChatSelect(user);
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <button
          onClick={() => {
            // Open new conversation logic
            alert("Start a new conversation");
          }}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg shadow-emerald-200/50 active:scale-95 flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span className={cn("text-sm font-semibold", poppins.className)}>
            New Conversation
          </span>
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200/80 p-3 safe-padding-b">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center space-y-1 p-2 text-emerald-600">
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <span className={cn("text-[10px] font-medium", poppins.className)}>
              Chats
            </span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <span className={cn("text-[10px] font-medium", poppins.className)}>
              Calls
            </span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
              <MoreVertical className="w-5 h-5" />
            </div>
            <span className={cn("text-[10px] font-medium", poppins.className)}>
              More
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
