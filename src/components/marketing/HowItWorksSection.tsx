"use client";

import StepCard from "./StepCard";

const steps = [
  {
    number: 1,
    title: "Sign Up",
    description: "Create your free account in seconds. No credit card required.",
  },
  {
    number: 2,
    title: "Start Talking",
    description: "Click the mic and speak naturally. Echo understands what you need.",
  },
  {
    number: 3,
    title: "Stay Organized",
    description: "Let Echo manage your tasks, reminders, and schedule automatically.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How Echo Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Get started in seconds. No complex setup required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {steps.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}