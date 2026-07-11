// app/center/dashboard/panels/MessagesPanel.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  User,
  Clock,
  Plus,
  ChevronRight,
  Send,
  Paperclip,
  MoreVertical,
  CheckCheck,
  Circle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/constants/constants";

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  online?: boolean;
  department?: string;
}

export default function MessagesPanel() {
  const [searchTerm, setSearchTerm] = useState("");

  const conversations: Conversation[] = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      lastMessage: "Patient test results are ready",
      time: "2 min ago",
      unread: true,
      online: true,
      department: "Cardiology",
    },
    {
      id: 2,
      name: "Nursing Staff",
      lastMessage: "Room 204 needs assistance",
      time: "10 min ago",
      unread: false,
      online: false,
      department: "Nursing",
    },
    {
      id: 3,
      name: "Lab Department",
      lastMessage: "Urgent blood work completed",
      time: "1 hour ago",
      unread: true,
      online: true,
      department: "Laboratory",
    },
    {
      id: 4,
      name: "Pharmacy",
      lastMessage: "Prescription ready for pickup",
      time: "2 hours ago",
      unread: false,
      online: false,
      department: "Pharmacy",
    },
    {
      id: 5,
      name: "Dr. Michael Chen",
      lastMessage: "Surgery scheduled for tomorrow",
      time: "Yesterday",
      unread: false,
      online: false,
      department: "Surgery",
    },
  ];

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.department?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getStatusColor = (online: boolean) =>
    online ? "bg-emerald-400" : "bg-slate-300";

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pb-40 pt-6",
        poppins.className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-4xl mx-auto px-4 md:px-6"
      >
        {/* --- HEADER --- */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                Team Communication
              </span>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {conversations.length} chats
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Messages
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md">
              Communicate with your team and stay connected
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-7 py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] hover:shadow-xl hover:shadow-emerald-200/50 transition-all flex items-center gap-2.5 shadow-lg shadow-emerald-200/30"
          >
            <Plus size={17} className="stroke-[2.5]" /> New Message
          </motion.button>
        </header>

        {/* --- SEARCH --- */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations, departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-sm text-slate-800 placeholder:text-slate-400 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
            >
              <span className="sr-only">Clear search</span>
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* --- CONVERSATIONS LIST --- */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2
              className={cn(
                "text-lg font-semibold text-slate-800",
                bebasNeue.className,
              )}
            >
              Recent Conversations
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {filteredConversations.length} active
            </span>
          </div>

          <div className="p-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  No conversations found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your search
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="group flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-transparent hover:border-emerald-200/60 hover:bg-emerald-50/50 transition-all duration-200 cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm",
                          "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200/50",
                        )}
                      >
                        {getInitials(conversation.name)}
                      </div>
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                          getStatusColor(conversation.online || false),
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-slate-800 text-[15px] leading-tight truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {conversation.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-slate-600 truncate flex-1">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      {conversation.department && (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {conversation.department}
                        </span>
                      )}
                    </div>

                    {/* Action icon */}
                    <ChevronRight
                      size={18}
                      className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- QUICK ACTION (optional) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/60 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Need urgent help?
              </p>
              <p className="text-xs text-slate-600">
                Contact the admin team directly
              </p>
            </div>
          </div>
          <button className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200/50">
            Get Help
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
