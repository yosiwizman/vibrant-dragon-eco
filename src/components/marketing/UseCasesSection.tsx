"use client";

import { Brain, Clock, FileText, Users, Zap, Smartphone } from "lucide-react";
import UseCaseCard from "./UseCaseCard";

const useCases = [
  {
    icon: Brain,
    title: "Personal Productivity",
    description:
      "Manage your daily tasks, set reminders, and stay organized with voice commands.",
  },
  {
    icon: Clock,
    title: "Time Management",
    description:
      "Schedule events, track deadlines, and never miss an important appointment.",
  },
  {
    icon: FileText,
    title: "Note Taking",
    description:
      "Capture ideas on the go with voice notes that convert to searchable text.",
  },
  {
    icon: Users,
    title: "Contact Organization",
    description:
      "Keep your professional and personal contacts organized and accessible.",
  },
  {
    icon: Zap,
    title: "Quick Actions",
    description:
      "Execute common tasks instantly with voice shortcuts and keyboard commands.",
  },
  {
    icon: Smartphone,
    title: "Mobile Assistant",
    description:
      "Access Echo anywhere—on your phone, tablet, or desktop browser.",
  },
];

export default function UseCasesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built for Your Life
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Whether you're managing work projects or personal goals, Echo
            adapts to your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <UseCaseCard key={index} {...useCase} />
          ))}
        </div>
      </div>
    </section>
  );
}