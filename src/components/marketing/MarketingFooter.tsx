"use client";

import { Link } from "react-router-dom";

export default function MarketingFooter() {
  return (
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
  );
}