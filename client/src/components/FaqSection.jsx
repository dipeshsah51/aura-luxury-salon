import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles, MapPin, Phone, MessageCircle } from 'lucide-react';

export default function FaqSection({ onOpenBooking }) {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "What is the best bridal makeup package available at AURA Salon Chennai?",
      a: "Our signature Royal South Indian Muhurtham Bridal Package (₹14,500) features HD airbrush makeup, heirloom Kanchipuram silk saree draping, temple jewelry placement, waterproof bridal sweat-resistance protection, and traditional jasmine poola jada styling. We also provide private VIP suites with dedicated photo-ready vanity lighting."
    },
    {
      q: "Where is AURA Luxury Salon located in Ramapuram, Chennai?",
      a: "AURA is prime-located in Ramapuram, Chennai (Pin: 600089), directly accessible from the Mount-Poonamallee corridor, situated close to DLF Cybercity IT Park, L&T Infotech campus, and MIOT International Hospital. We provide complimentary valet parking and private elevator access."
    },
    {
      q: "How does Nanoplastia hair smoothing work for Chennai's tropical humidity?",
      a: "Our Nanoplastia & Silk Keratin Therapy (₹6,500) utilizes 100% formaldehyde-free organic bio-amino acids that penetrate the hair cortex. Formulated specifically to combat Chennai's intense coastal humidity, it prevents frizz and provides manageable, salon-finish glass hair for up to 6 months."
    },
    {
      q: "How can I book an appointment or consult via WhatsApp?",
      a: "Booking is instant! You can select your preferred master stylist and real-time slot directly on our website, or click our WhatsApp Concierge button (+91 9360449096) to receive instant confirmation passes and personalized bridal consultations."
    },
    {
      q: "What are the salon hours and are early morning bridal bookings supported?",
      a: "We are open Monday through Sunday from 9:00 AM to 9:00 PM. For auspicious Tamil Muhurtham weddings, early dawn slots (from 4:00 AM onwards) and on-venue destination bridal makeup teams can be scheduled in advance."
    },
    {
      q: "What payment methods and loyalty privileges are accepted?",
      a: "We accept UPI (Google Pay, PhonePe, Paytm), all major Credit/Debit Cards, Net Banking, and Cash. Members of our VIP Loyalty Program also earn rewards on every visit, complimentary scalp analyses, and priority festival slot reservations."
    }
  ];

  return (
    <section id="faq-section" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-4 mb-14">
        <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20">
          <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions • Chennai
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Everything You Need to Know About <span className="text-gradient-gold">AURA Salon</span>
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Discover why discerning Chennai brides, corporate professionals, and style connoisseurs choose AURA for bridal majesty, organic hair rejuvenation, and bespoke luxury.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'bg-slate-900/90 border-gold-500/40 shadow-lg shadow-gold-500/5'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                aria-expanded={isOpen}
              >
                <span className="font-serif font-semibold text-base sm:text-lg text-white">
                  {faq.q}
                </span>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen
                      ? 'bg-gold-500 text-black rotate-180'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 mt-1">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Booking Call-to-Action Bar */}
      <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-gold-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-serif font-bold text-lg text-white">Ready for your transformation in Ramapuram, Chennai?</h3>
          <p className="text-xs text-slate-400">Lock in your bespoke stylist chair or book your bridal consultation today.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://wa.me/919360449096?text=Vanakkam%20AURA%20Salon!%20I%20would%20like%20to%20book%20an%20appointment."
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          {onOpenBooking && (
            <button
              onClick={() => onOpenBooking()}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-gold-500/20"
            >
              Book Online
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
