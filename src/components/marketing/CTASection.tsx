"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic, ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
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
  );
}