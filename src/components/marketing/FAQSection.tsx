"use client";

import { useState } from "react";
import FAQItem from "./FAQItem";

const faqs = [
  {
    question: "What is Echo?",
    answer:
      "Echo is a voice-first AI personal assistant that helps you manage tasks, reminders, notes, calendar events, and contacts. It works through natural voice conversations or text chat, and runs 95% offline for privacy and speed.",
  },
  {
    question: "How does voice control work?",
    answer:
      "Simply click the microphone button and speak naturally. Say things like 'Add a task to buy groceries' or 'What's on my calendar tomorrow?' Echo understands natural language and responds with voice or text.",
  },
  {
    question: "Does Echo work offline?",
    answer:
      "Yes! Echo is designed to work 95% offline using local AI processing. Your tasks, notes, reminders, and calendar all work without internet. Only features like live weather updates require connectivity.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Absolutely. Echo uses row-level security on all data, processes AI locally when offline, and never shares your information. You can export all your data anytime.",
  },
  {
    question: "What platforms does Echo support?",
    answer:
      "Echo works on web browsers, iOS, and Android. It's built as a progressive web app with native mobile support through Capacitor.",
  },
  {
    question: "Do I need an API key?",
    answer:
      "For online AI features, you can optionally add your own OpenAI API key. Offline mode works without any API key using local AI models.",
  },
  {
    question: "Can I customize the dashboard?",
    answer:
      "Yes! Echo includes 14 customizable widgets that you can drag, drop, and resize. Create your perfect workspace with weather, tasks, calendar, notes, and more.",
  },
  {
    question: "Is Echo free to use?",
    answer:
      "Echo's offline mode is completely free with no API costs. Online features use your own API keys, so you only pay for what you use.",
  },
];

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-400">
            Everything you need to know about Echo.
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6 sm:p-8">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFAQ === index}
              onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}