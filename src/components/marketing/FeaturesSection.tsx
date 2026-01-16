"use client";

import {
  Mic,
  CheckSquare,
  Bell,
  FileText,
  Calendar,
  Users,
  Layout,
  WifiOff,
  Shield,
} from "lucide-react";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: Mic,
    title: "Voice-First AI",
    description:
      "Have natural conversations with Echo. Just speak—it listens, understands, and responds intelligently.",
    gradient: "bg-gradient-to-br from-fuchsia-500 to-pink-500",
  },
  {
    icon: CheckSquare,
    title: "Smart Task Management",
    description:
      "Create, organize, and track tasks with priorities, due dates, and smart filters. Voice or text—your choice.",
    gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
  },
  {
    icon: Bell,
    title: "Intelligent Reminders",
    description:
      "Never forget anything. Set reminders with natural language and get notified at the right time.",
    gradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
  },
  {
    icon: FileText,
    title: "Notes & Documents",
    description:
      "Capture ideas instantly. Create, organize, and search notes with tags and full-text search.",
    gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
  {
    icon: Calendar,
    title: "Calendar & Events",
    description:
      "Manage your schedule effortlessly. Create events, view your calendar, and never miss an appointment.",
    gradient: "bg-gradient-to-br from-purple-500 to-violet-500",
  },
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Keep your contacts organized. Store names, phones, emails, and notes all in one place.",
    gradient: "bg-gradient-to-br from-indigo-500 to-blue-500",
  },
  {
    icon: Layout,
    title: "14 Customizable Widgets",
    description:
      "Design your perfect dashboard. Drag, drop, and resize widgets to create your ideal workspace.",
    gradient: "bg-gradient-to-br from-rose-500 to-pink-500",
  },
  {
    icon: WifiOff,
    title: "95% Offline Capable",
    description:
      "Works without internet. Local AI processing means your data stays private and Echo stays fast.",
    gradient: "bg-gradient-to-br from-slate-500 to-zinc-500",
  },
  {
    icon: Shield,
    title: "Privacy-First Design",
    description:
      "Your data, your control. Row-level security, local processing, and full data export anytime.",
    gradient: "bg-gradient-to-br from-teal-500 to-green-500",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything You Need to Stay Organized
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Echo combines powerful AI with intuitive design to help you manage
            your life effortlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}