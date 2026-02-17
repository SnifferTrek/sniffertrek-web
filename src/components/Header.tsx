"use client";

import Link from "next/link";
import { Globe, Map, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Sniffer
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Trek
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              So funktioniert&apos;s
            </Link>
            <Link href="/meine-reisen" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Meine Reisen
            </Link>
            <Link
              href="/planer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105"
            >
              <Map className="w-4 h-4" />
              Reise planen
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4 space-y-3">
            <Link href="/#features" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 hover:text-gray-900 py-2">
              Features
            </Link>
            <Link href="/#how-it-works" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 hover:text-gray-900 py-2">
              So funktioniert&apos;s
            </Link>
            <Link href="/meine-reisen" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 hover:text-gray-900 py-2">
              Meine Reisen
            </Link>
            <Link
              href="/planer"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-full text-sm font-medium"
            >
              <Map className="w-4 h-4" />
              Reise planen
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
