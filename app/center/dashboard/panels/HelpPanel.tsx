// app/center/dashboard/panels/HelpPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
  shortLabel: string;
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
  tone: "emerald" | "slate" | "rose";
}

// ─── Data ─────────────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    shortLabel: "Start",
    icon: LifeBuoy,
  },
  { id: "faqs", label: "FAQs", shortLabel: "FAQs", icon: HelpCircle },
  {
    id: "tutorials",
    label: "Video Tutorials",
    shortLabel: "Videos",
    icon: Video,
  },
  {
    id: "documentation",
    label: "Documentation",
    shortLabel: "Docs",
    icon: BookOpen,
  },
  {
    id: "contacts",
    label: "Contact Support",
    shortLabel: "Contact",
    icon: MessageCircle,
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    shortLabel: "Fix",
    icon: AlertCircle,
  },
  {
    id: "release-notes",
    label: "Release Notes",
    shortLabel: "Updates",
    icon: FileText,
  },
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
    tone: "emerald",
  },
  {
    id: "chat",
    title: "Live Chat",
    description: "Chat with our support team in real-time.",
    icon: MessageCircle,
    action: () => alert("Chat feature coming soon!"),
    tone: "emerald",
  },
  {
    id: "phone",
    title: "Phone Support",
    description: "Call us during business hours for urgent matters.",
    icon: Phone,
    action: () => alert("Call +234 800 000 0000"),
    tone: "slate",
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Reach us on WhatsApp for quick assistance.",
    icon: MessageCircle,
    action: () => alert("WhatsApp +234 800 000 0000"),
    tone: "emerald",
  },
];

const tutorials = [
  { id: "1", title: "Getting Started with Doza", duration: "8:15" },
  { id: "2", title: "Managing Patients & Records", duration: "12:30" },
  { id: "3", title: "Inventory Management Guide", duration: "15:45" },
  { id: "4", title: "Appointments & Scheduling", duration: "10:20" },
];

// ─── Shared style helpers ────────────────────────────────────────────

const toneStyles: Record<
  string,
  { card: string; iconBox: string; text: string; hover: string }
> = {
  emerald: {
    card: "bg-white border-slate-200",
    iconBox: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    text: "text-emerald-700",
    hover: "hover:border-emerald-200",
  },
  slate: {
    card: "bg-white border-slate-200",
    iconBox: "bg-slate-100 text-slate-600 border border-slate-200",
    text: "text-slate-700",
    hover: "hover:border-slate-300",
  },
  rose: {
    card: "bg-white border-slate-200",
    iconBox: "bg-rose-50 text-rose-600 border border-rose-100",
    text: "text-rose-700",
    hover: "hover:border-rose-200",
  },
};

// ─── Section header ──────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="p-1.5 md:p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 shrink-0">
        <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
      </div>
      <h2
        className={cn(
          "text-base md:text-xl font-bold text-slate-900 leading-none",
          bebasNeue.className,
        )}
      >
        {title}
      </h2>
    </div>
  );
}

// ─── FAQ Accordion ───────────────────────────────────────────────────

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {items.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className={cn(
              "bg-white rounded-xl border overflow-hidden transition-colors",
              isOpen ? "border-emerald-200" : "border-slate-200",
            )}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="w-full px-3.5 md:px-4 py-3 md:py-3.5 flex items-center justify-between gap-3 text-left"
            >
              <span
                className={cn(
                  "font-semibold text-slate-800 text-xs md:text-sm leading-snug",
                  poppins.className,
                )}
              >
                {faq.question}
              </span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen && (
              <div className="px-3.5 md:px-4 pb-3.5 md:pb-4 pt-0 text-[11px] md:text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function HelpPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("getting-started");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    <div className={cn("pb-24", poppins.className)}>
      {/* ─── Mobile sticky header ──────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 md:hidden">
        <div className="px-3 pt-3 pb-2">
          {/* Row 1: title + contact button */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
              <h2
                className={cn(
                  "text-base font-bold text-slate-900 truncate",
                  bebasNeue.className,
                )}
              >
                Help Center
              </h2>
            </div>
            <button
              onClick={() => scrollToSection("contacts")}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shrink-0"
              aria-label="Contact support"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Row 2: search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search help topics…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <span className="text-slate-400 text-xs">✕</span>
              </button>
            )}
          </div>

          {/* Row 3: section chips — horizontal scroll */}
          <div className="-mx-3 px-3 mt-2.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100",
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {section.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Layout ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-3 md:px-6 gap-4 md:gap-8 pt-3 md:pt-6">
        {/* ─── LEFT SIDEBAR (desktop only) ───────────────── */}
        <aside className="hidden md:block md:w-56 lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-3">
            <div>
              <h1
                className={cn(
                  "text-2xl font-bold text-slate-900 leading-none",
                  bebasNeue.className,
                )}
              >
                Help Center
              </h1>
              <p className="text-[11px] text-slate-500 mt-1">
                Find answers and support
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <nav className="space-y-0.5">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left",
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-emerald-600",
                      )}
                    />
                    <span className="text-xs font-semibold truncate">
                      {section.label}
                    </span>
                    {isActive && (
                      <ChevronRight className="w-3 h-3 ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mt-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600 shrink-0">
                  <LifeBuoy className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-800">
                    Need urgent help?
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Contact our team 24/7
                  </p>
                  <button
                    onClick={() => scrollToSection("contacts")}
                    className="mt-1.5 text-[10px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 uppercase tracking-wide"
                  >
                    Get in touch <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── RIGHT CONTENT ─────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-6 md:space-y-10">
          {/* ─── Getting Started ─────────────────────────── */}
          <section
            ref={setRef("getting-started")}
            data-section-id="getting-started"
          >
            <SectionHeader icon={LifeBuoy} title="Getting Started" />
            <div className="bg-white rounded-2xl p-3.5 md:p-5 border border-slate-200">
              <p className="text-[11px] md:text-xs text-slate-600 mb-3">
                Welcome to Doza! Here's a quick guide to help you get started.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-2.5">
                {[
                  { label: "Create your first patient", icon: Users },
                  { label: "Schedule an appointment", icon: Calendar },
                  { label: "Add inventory items", icon: Package },
                  { label: "Invite team members", icon: Settings },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-emerald-600 shrink-0">
                      <item.icon className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] md:text-xs font-semibold text-slate-700 truncate">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── FAQs ────────────────────────────────────── */}
          <section ref={setRef("faqs")} data-section-id="faqs">
            <SectionHeader
              icon={HelpCircle}
              title="Frequently Asked Questions"
            />
            {filteredFaqs.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 md:p-8 text-center border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2.5">
                  <Search className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-2">
                  No results found
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-[11px] md:text-xs font-bold uppercase tracking-wide text-emerald-700 hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <FaqAccordion items={filteredFaqs} />
            )}
          </section>

          {/* ─── Video Tutorials ─────────────────────────── */}
          <section ref={setRef("tutorials")} data-section-id="tutorials">
            <SectionHeader icon={Video} title="Video Tutorials" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-2.5">
              {tutorials.map((tutorial) => (
                <button
                  key={tutorial.id}
                  className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors text-left group"
                >
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] md:text-xs font-bold text-slate-800 truncate">
                      {tutorial.title}
                    </p>
                    <p className="text-[10px] md:text-[11px] text-slate-500 tabular-nums mt-0.5">
                      {tutorial.duration}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                </button>
              ))}
            </div>
          </section>

          {/* ─── Documentation ───────────────────────────── */}
          <section
            ref={setRef("documentation")}
            data-section-id="documentation"
          >
            <SectionHeader icon={BookOpen} title="Documentation" />
            <div className="bg-white rounded-2xl p-3.5 md:p-5 border border-slate-200">
              <p className="text-[11px] md:text-xs text-slate-600 mb-3">
                Comprehensive guides and API references to help you integrate
                and use Doza effectively.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-2.5">
                {[
                  { label: "API Reference", icon: FileText },
                  { label: "Integration Guide", icon: BookOpen },
                  { label: "Security Overview", icon: CheckCircle },
                  { label: "Best Practices", icon: Globe },
                ].map((doc) => (
                  <button
                    key={doc.label}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors text-left group"
                  >
                    <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-emerald-600 shrink-0">
                      <doc.icon className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] md:text-xs font-semibold text-slate-700 flex-1 truncate">
                      {doc.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Contact Support ─────────────────────────── */}
          <section ref={setRef("contacts")} data-section-id="contacts">
            <SectionHeader icon={MessageCircle} title="Contact Support" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-2.5">
              {contacts.map((contact) => {
                const Icon = contact.icon;
                const tone = toneStyles[contact.tone];
                return (
                  <button
                    key={contact.id}
                    onClick={contact.action}
                    className={cn(
                      "group p-3.5 md:p-4 rounded-xl border transition-colors text-left",
                      tone.card,
                      tone.hover,
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg w-fit mb-2.5",
                        tone.iconBox,
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs md:text-sm font-bold text-slate-900">
                      {contact.title}
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {contact.description}
                    </p>
                    <div
                      className={cn(
                        "mt-2.5 text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform",
                        tone.text,
                      )}
                    >
                      Contact <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── Troubleshooting ─────────────────────────── */}
          <section
            ref={setRef("troubleshooting")}
            data-section-id="troubleshooting"
          >
            <SectionHeader icon={AlertCircle} title="Troubleshooting" />
            <div className="bg-white rounded-2xl p-3.5 md:p-5 border border-slate-200">
              <div className="space-y-2 md:space-y-2.5">
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
                    className="p-2.5 md:p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <p className="text-[11px] md:text-xs font-bold text-slate-800">
                      {item.issue}
                    </p>
                    <p className="text-[10px] md:text-[11px] text-slate-600 mt-1 leading-relaxed">
                      → {item.solution}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Release Notes ───────────────────────────── */}
          <section
            ref={setRef("release-notes")}
            data-section-id="release-notes"
          >
            <SectionHeader icon={FileText} title="Release Notes" />
            <div className="bg-white rounded-2xl p-3.5 md:p-5 border border-slate-200">
              <div className="space-y-2 md:space-y-2.5">
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
                    className="p-2.5 md:p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] md:text-xs font-bold text-emerald-700">
                        {note.version}
                      </span>
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {note.date}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {note.features.map((feature) => (
                        <li
                          key={feature}
                          className="text-[10px] md:text-[11px] text-slate-600 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Footer ──────────────────────────────────── */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-4">
            Doza Medic
          </div>
        </main>
      </div>
    </div>
  );
}
