"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mic,
  CheckSquare,
  Bell,
  FileText,
  Calendar,
  Users,
  MessageSquare,
  Layout,
  Shield,
  Wifi,
  WifiOff,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Brain,
  Clock,
  ArrowRight,
  Star,
  Play,
} from "lucide-react";

// Feature Card Component
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Card className="border-slate-700/50 bg-slate-900/50 backdrop-blur-sm hover:border-fuchsia-500/30 transition-all duration-300 group">
      <CardContent className="p-6">
        <div
          className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

// FAQ Accordion Component
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-700/50 last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left hover:text-fuchsia-300 transition-colors"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-fuchsia-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-5 text-slate-400 leading-relaxed animate-in slide-in-from-top-2 duration-200">
          {answer}
        </div>
      )}
    </div>
  );
}

// Step Card Component
function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

// Use Case Card Component
function UseCaseCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-fuchsia-500/30 transition-all">
      <Icon className="h-8 w-8 text-fuchsia-400 mb-4" />
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

export default function Marketing() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-white">Echo</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-white"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-sm mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Voice-First • Privacy-First • Offline-First</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Meet{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Echo
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Your personal AI assistant that listens, understands, and helps you
            stay organized—all with natural voice commands.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/login">
              <Button
                size="lg"
                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-fuchsia-500/25"
              >
                <Mic className="mr-2 h-5 w-5" />
                Try Echo Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-6 rounded-xl"
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </a>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
            <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <Mic className="h-5 w-5 text-fuchsia-400" />
                  </div>
                  <div className="bg-slate-800/50 rounded-2xl rounded-tl-none p-4 max-w-md">
                    <p className="text-slate-300">
                      "Add a task to prepare the quarterly report, due Friday,
                      high priority"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 justify-end">
                  <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl rounded-tr-none p-4 max-w-md">
                    <p className="text-slate-200">
                      ✓ I've created a high-priority task "Prepare the quarterly
                      report" due this Friday. Would you like me to set a
                      reminder as well?
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">E</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              <span>Privacy-First</span>
            </div>
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-blue-400" />
              <span>95% Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-purple-400" />
              <span>Cross-Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span>Free Offline Mode</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
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

      {/* How It Works Section */}
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
            <StepCard
              number={1}
              title="Sign Up"
              description="Create your free account in seconds. No credit card required."
            />
            <StepCard
              number={2}
              title="Start Talking"
              description="Click the mic and speak naturally. Echo understands what you need."
            />
            <StepCard
              number={3}
              title="Stay Organized"
              description="Let Echo manage your tasks, reminders, and schedule automatically."
            />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
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

      {/* FAQ Section */}
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

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700/50 p-12 sm:p-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Meet Your AI Assistant?
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Join thousands of users who've simplified their lives with Echo.
                Start free today.
              </p>
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-lg px-10 py-6 rounded-xl shadow-lg shadow-fuchsia-500/25"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-white">Echo</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Echo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}