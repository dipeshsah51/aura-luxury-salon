import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { MessageSquare, Mail, X, CheckCircle, Smartphone, Send, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function NotificationModal() {
  const { activePreview, closePreview } = useNotification();
  const [activeTab, setActiveTab] = useState('sms');

  React.useEffect(() => {
    if (activePreview) {
      if (activePreview.email && !activePreview.sms) {
        setActiveTab('email');
      } else if (activePreview.sms) {
        setActiveTab('sms');
      }
    }
  }, [activePreview]);

  if (!activePreview) return null;

  const { sms, email } = activePreview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-gold-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                Instant Notification Dispatched
                <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Delivered
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated SMS & Email confirmations were triggered to the client
              </p>
            </div>
          </div>
          <button
            onClick={closePreview}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 pt-3 gap-2">
          {sms && (
            <button
              onClick={() => setActiveTab('sms')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 ${
                activeTab === 'sms'
                  ? 'border-gold-400 text-gold-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              SMS Notification Preview
            </button>
          )}
          {email && (
            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 ${
                activeTab === 'email'
                  ? 'border-gold-400 text-gold-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Confirmation Preview
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-b from-[#0F172A] to-[#0A0E1A]">
          {activeTab === 'sms' && sms && (
            <div className="max-w-md mx-auto">
              {/* Smartphone mockup */}
              <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 shadow-2xl">
                <div className="flex justify-between items-center text-xs text-slate-400 pb-3 border-b border-slate-800">
                  <span>9:41 AM</span>
                  <div className="font-semibold text-slate-300">AURA Concierge</div>
                  <span>5G 100%</span>
                </div>

                <div className="py-6 flex flex-col gap-3">
                  <div className="text-[11px] text-center text-slate-500">Today • {sms.sentAt ? new Date(sms.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</div>
                  
                  {/* SMS Bubble */}
                  <div className="self-start max-w-[85%] bg-gradient-to-br from-gold-600/30 to-amber-900/30 border border-gold-500/40 rounded-2xl rounded-tl-sm p-3.5 text-xs text-slate-100 shadow-md">
                    <div className="flex items-center gap-1.5 font-bold text-gold-300 mb-1 text-[11px] tracking-wide uppercase">
                      <Sparkles className="w-3.5 h-3.5" /> AURA Haute Coiffure
                    </div>
                    <p className="whitespace-pre-line leading-relaxed text-slate-200">
                      {sms.message}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>To: {sms.recipient}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Delivered
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && email && (
            <div className="max-w-xl mx-auto bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl">
              {/* Fake Email client header */}
              <div className="bg-slate-950 p-4 border-b border-slate-800 text-xs">
                <div className="flex gap-2 mb-1.5">
                  <span className="text-slate-400 w-16">Subject:</span>
                  <span className="text-gold-300 font-semibold">{email.subject}</span>
                </div>
                <div className="flex gap-2 mb-1.5">
                  <span className="text-slate-400 w-16">From:</span>
                  <span className="text-slate-300">AURA Luxury Salon &lt;dsah56631@gmail.com&gt;</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16">To:</span>
                  <span className="text-slate-300">{email.recipient}</span>
                </div>
              </div>

              {/* Styled Email Body */}
              <div className="p-6 bg-slate-900 text-slate-200 text-sm">
                <div className="pb-6 border-b border-slate-800 flex justify-center">
                  <BrandLogo
                    variant="vertical"
                    size="sm"
                    subtitle="Luxury Salon & Bridal Lounge"
                  />
                </div>

                <div className="py-6 whitespace-pre-line leading-relaxed text-slate-300 text-sm">
                  {email.message}
                </div>

                <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-gold-500/20 text-xs text-slate-400 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-gold-300 font-semibold">
                    <MapPin className="w-4 h-4 text-gold-400" /> Ramapuram, Chennai, Tamil Nadu, 600089
                  </div>
                  <p>Landmark: Near DLF Cybercity & MIOT Hospital. WhatsApp: +91 9360449096.</p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
                  AURA Chennai • Haute Coiffure, Muhurtham Bridal & Ayurvedic Wellness
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={closePreview}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Close Notification View
          </button>
        </div>

      </div>
    </div>
  );
}
