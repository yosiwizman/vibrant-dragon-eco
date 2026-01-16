"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic, Sparkles, ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  return (
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
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
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
  );
}