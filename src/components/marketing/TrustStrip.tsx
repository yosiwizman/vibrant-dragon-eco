"use client";

import { Shield, WifiOff, Smartphone, Star } from "lucide-react";

const trustItems = [
  { icon: Shield, label: "Privacy-First", color: "text-green-400" },
  { icon: WifiOff, label: "95% Offline", color: "text-blue-400" },
  { icon: Smartphone, label: "Cross-Platform", color: "text-purple-400" },
  { icon: Star, label: "Free Offline Mode", color: "text-yellow-400" },
];

export default function TrustStrip() {
  return (
    <section className="py-12 border-y border-slate-800/50 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}