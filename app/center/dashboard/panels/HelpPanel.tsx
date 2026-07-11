// app/center/dashboard/panels/HelpPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  BookOpen,
  Video,
  FileText,
  ChevronDown,
  ChevronRight,
  Users,
  Settings,
  LifeBuoy,
  Globe,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  Package,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

// ─── Types ────────────────────────────────────────────────────────────

interface Section {
  id: string;
  label: string;
  icon: any;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface ContactItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: () => void;
  color: string;
}

// ─── Data ─────────────────────────────────────────────────────────────

const sections: Section[] = [
  { id: "getting-started", label: "Getting Started", icon: LifeBuoy },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "tutorials", label: "Video Tutorials", icon: Video },
  { id: "documentation", label: "Documentation", icon: BookOpen },
  { id: "contacts", label: "Contact Support", icon: MessageCircle },
  { id: "troubleshooting", label: "Troubleshooting", icon: AlertCircle },
  { id: "release-notes", label: "Release Notes", icon: FileText },
];

const faqs: FaqItem[] = [
  {
    id: "1",
    question: "How do I add a new patient?",
    answer:
      "Navigate to the Patients panel from the sidebar. Click the 'Add Patient' button in the top right corner. Fill in the patient's personal details and click 'Save'.",
  },
  {
    id: "2",
    question: "How can I schedule an appointment?",
    answer:
      "Go to the Appointments panel and click 'New Appointment'. Search for an existing patient or create a new one, then choose the date, time, and type of appointment.",
  },
  {
    id: "3",
    question: "What should I do if a drug is expired?",
    answer:
      "Expired drugs are flagged in the Inventory panel. You can remove them from stock by clicking the 'Remove' button next to the item. It's recommended to dispose of them safely.",
  },
  {
    id: "4",
    question: "How do I generate a sales report?",
    answer:
      "In the Analytics panel, you'll find a 'Revenue Overview' section. You can filter by date range and export the data as a CSV for further analysis.",
  },
  {
    id: "5",
    question: "Can I invite other staff members to the center?",
    answer:
      "Yes. As an admin, you can add staff from the Staff panel. Click 'Add Staff' and enter their details. They will receive an email invitation to join.",
  },
  {
    id: "6",
    question: "How do I update my center's information?",
    answer:
      "Go to the Settings panel and select 'Center Information'. You can update the name, address, contact details, and logo of your center.",
  },
];

const contacts: ContactItem[] = [
  {
    id: "email",
    title: "Email Support",
    description: "Send us an email and we'll respond within 24 hours.",
    icon: Mail,
    action: () => window.open("mailto:support@doza.com", "_blank"),
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "chat",
    title: "Live Chat",
    description: "Chat with our support team in real-time.",
    icon: MessageCircle,
    action: () => alert("Chat feature coming soon!"),
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "phone",
    title: "Phone Support",
    description: "Call us during business hours for urgent matters.",
    icon: Phone,
    action: () => alert("Call +234 800 000 0000"),
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Reach us on WhatsApp for quick assistance.",
    icon: MessageCircle,
    action: () => alert("WhatsApp +234 800 000 0000"),
    color: "from-green-500 to-emerald-600",
  },
];

const tutorials = [
  { id: "1", title: "Getting Started with Doza", duration: "8:15" },
  { id: "2", title: "Managing Patients & Records", duration: "12:30" },
  { id: "3", title: "Inventory Management Guide", duration: "15:45" },
  { id: "4", title: "Appointments & Scheduling", duration: "10:20" },
];

// ─── Helper Components ──────────────────────────────────────────────

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {items.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <span
                className={cn(
                  "font-medium text-slate-800 text-sm",
                  poppins.className,
                )}
              >
                {faq.question}
              </span>
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-sm text-slate-600 border-t border-slate-100">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionLink({ section, isActive, onClick }: any) {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left group",
        isActive
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200/50"
          : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600",
      )}
    >
      <Icon
        size={17}
        className={
          isActive
            ? "text-white"
            : "text-slate-400 group-hover:text-emerald-600"
        }
      />
      <span className={cn("text-sm font-medium", poppins.className)}>
        {section.label}
      </span>
      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function HelpPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("getting-started");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Filter FAQs by search
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  // Intersection Observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section-id");
            if (id) setActiveSection(id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px -100px 0px" },
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className={cn("pb-20", poppins.className)}>
      {/* ─── Mobile Header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <h2
            className={cn(
              "text-lg font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Help Center
          </h2>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-emerald-600 text-white rounded-xl text-xs font-medium">
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-4 sm:px-6 gap-6 md:gap-8 pt-4 md:pt-6">
        {/* ─── LEFT SIDEBAR ──────────────────────────────────────────── */}
        <aside className="md:w-64 lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            {/* Desktop header */}
            <div className="hidden md:block">
              <h1
                className={cn(
                  "text-2xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Help Center
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Find answers and support
              </p>
            </div>

            {/* Desktop search */}
            <div className="hidden md:block relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {sections.map((section) => (
                <SectionLink
                  key={section.id}
                  section={section}
                  isActive={activeSection === section.id}
                  onClick={() => scrollToSection(section.id)}
                />
              ))}
            </nav>

            {/* Quick contact card */}
            <div className="hidden md:block bg-emerald-50/80 rounded-xl p-4 border border-emerald-200/60 mt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-xs font-bold text-slate-700",
                      poppins.className,
                    )}
                  >
                    Need urgent help?
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Contact our team 24/7
                  </p>
                  <button
                    onClick={() => scrollToSection("contacts")}
                    className="mt-2 text-[10px] font-medium text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    Get in touch <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── RIGHT CONTENT ─────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-10 md:space-y-12">
          {/* ─── Getting Started ────────────────────────────────────── */}
          <section
            ref={setRef("getting-started")}
            data-section-id="getting-started"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <h2
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Getting Started
              </h2>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <p className="text-sm text-slate-600">
                Welcome to Doza! Here's a quick guide to help you get started
                with the platform.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  { label: "Create your first patient", icon: Users },
                  { label: "Schedule an appointment", icon: Calendar },
                  { label: "Add inventory items", icon: Package },
                  { label: "Invite team members", icon: Settings },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60"
                  >
                    <item.icon className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── FAQs ────────────────────────────────────────────────── */}
          <section ref={setRef("faqs")} data-section-id="faqs">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Frequently Asked Questions
              </h2>
            </div>
            {filteredFaqs.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm">
                <p className="text-slate-500">No results found</p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-emerald-600 font-medium hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <FaqAccordion items={filteredFaqs} />
            )}
          </section>

          {/* ─── Video Tutorials ────────────────────────────────────── */}
          <section ref={setRef("tutorials")} data-section-id="tutorials">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                <Video className="w-5 h-5" />
              </div>
              <h2
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Video Tutorials
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tutorials.map((tutorial) => (
                <button
                  key={tutorial.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200/60 transition-all text-left group"
                >
                  <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {tutorial.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {tutorial.duration}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all ml-auto" />
                </button>
              ))}
            </div>
          </section>

          {/* ─── Documentation ──────────────────────────────────────── */}
          <section
            ref={setRef("documentation")}
            data-section-id="documentation"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Documentation
              </h2>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <p className="text-sm text-slate-600">
                Comprehensive guides and API references to help you integrate
                and use Doza effectively.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  { label: "API Reference", icon: FileText },
                  { label: "Integration Guide", icon: BookOpen },
                  { label: "Security Overview", icon: CheckCircle },
                  { label: "Best Practices", icon: Globe },
                ].map((doc) => (
                  <button
                    key={doc.label}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left"
                  >
                    <doc.icon className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {doc.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Contact Support ────────────────────────────────────── */}
          <section ref={setRef("contacts")} data-section-id="contacts">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h2
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Contact Support
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contacts.map((contact) => {
                const Icon = contact.icon;
                return (
                  <button
                    key={contact.id}
                    onClick={contact.action}
                    className="group p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-emerald-200/60 transition-all text-left hover:-translate-y-0.5"
                  >
                    <div
                      className={cn(
                        "p-2.5 rounded-xl w-fit mb-3 bg-gradient-to-br text-white shadow-md",
                        contact.color,
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3
                      className={cn(
                        "font-semibold text-slate-800",
                        poppins.className,
                      )}
                    >
                      {contact.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {contact.description}
                    </p>
                    <div className="mt-3 text-sm font-medium text-emerald-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Contact <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── Troubleshooting ────────────────────────────────────── */}
          <section
            ref={setRef("troubleshooting")}
            data-section-id="troubleshooting"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Troubleshooting
              </h2>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="space-y-4">
                {[
                  {
                    issue: "Patient data not saving",
                    solution:
                      "Check your internet connection and try again. If the issue persists, contact support.",
                  },
                  {
                    issue: "Appointment conflicts",
                    solution:
                      "Ensure you're not double-booking. Check the calendar view for existing appointments.",
                  },
                  {
                    issue: "Inventory sync issues",
                    solution:
                      "Refresh the page and verify your stock levels. Contact support if discrepancies continue.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {item.issue}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      → {item.solution}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Release Notes ──────────────────────────────────────── */}
          <section
            ref={setRef("release-notes")}
            data-section-id="release-notes"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
              <h2
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Release Notes
              </h2>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="space-y-4">
                {[
                  {
                    version: "v2.4.0",
                    date: "June 15, 2024",
                    features: [
                      "New Analytics Dashboard",
                      "Improved Patient Search",
                      "API Rate Limit Updates",
                    ],
                  },
                  {
                    version: "v2.3.0",
                    date: "May 28, 2024",
                    features: [
                      "Inventory Expiry Alerts",
                      "Appointment Reminders",
                      "Bug Fixes",
                    ],
                  },
                  {
                    version: "v2.2.0",
                    date: "May 10, 2024",
                    features: [
                      "Staff Management",
                      "Enhanced Security",
                      "UI Improvements",
                    ],
                  },
                ].map((note) => (
                  <div
                    key={note.version}
                    className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-emerald-600">
                        {note.version}
                      </span>
                      <span className="text-xs text-slate-400">
                        {note.date}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {note.features.map((feature) => (
                        <li
                          key={feature}
                          className="text-sm text-slate-600 flex items-center gap-2"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Footer ──────────────────────────────────────────────── */}
          <div className="text-center text-xs text-slate-400 border-t border-slate-200/80 pt-6 mt-4">
            Doza Health © 2024 — Help Center v1.0
          </div>
        </main>
      </div>
    </div>
  );
}
