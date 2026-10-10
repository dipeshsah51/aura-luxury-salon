import React, { useState } from 'react';
import { MessageCircle, Phone, X, Sparkles } from 'lucide-react';

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = "919360449096";
  const displayPhone = "+91 9360449096";
  const message = encodeURIComponent("Hello AURA Salon Chennai, I would like to book an appointment / enquire about your bridal and hair services.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
      {/* Quick Chat Popup */}
      {isOpen && (
        <div className="w-80 rounded-2xl bg-[#0F172A] border border-emerald-500/40 p-4 shadow-2xl backdrop-blur-lg animate-fadeIn mb-1">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/30">
                <MessageCircle className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-white text-sm">AURA WhatsApp Concierge</h4>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online • Quick Reply
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 text-xs text-slate-300 space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
              <span className="font-semibold text-gold-400 block mb-0.5">Vanakkam! 🙏</span>
              Chat with our salon manager in Ramapuram, Chennai for bridal bookings, custom hair transformations, or instant appointments.
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Line: <strong className="text-white">{displayPhone}</strong></span>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            Start WhatsApp Chat
          </a>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <div className="relative group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/40 font-semibold text-xs transition-all transform hover:scale-105"
          title="Chat on WhatsApp: +91 9360449096"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <MessageCircle className="w-5 h-5 fill-white" />
          <span className="hidden sm:inline font-bold">WhatsApp: {displayPhone}</span>
        </button>
      </div>
    </div>
  );
}
