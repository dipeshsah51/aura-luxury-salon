import React from 'react';
import { Sparkles, Calendar, Star, ShieldCheck, Clock, Award, MessageCircle, MapPin, Phone } from 'lucide-react';

export default function Hero({ onOpenBooking, onExploreServices }) {
  const whatsappUrl = "https://wa.me/919360449096?text=Hi%20AURA%20Salon%20Chennai%2C%20I%20would%20like%20to%20know%20more%20about%20your%20bridal%20and%20hair%20packages.";

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0B0F17] via-[#111827] to-[#0B0F17] py-16 md:py-24 border-b border-slate-800/80">
      
      {/* Background Subtle Luxury Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              Modern Haute Coiffure & Muhurtham Bridal Studio • Chennai
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Couture Beauty, <br />
              <span className="text-gold-gradient italic">Royal Indian Elegance</span>.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
              Chennai's premier sanctuary for Royal South Indian Muhurtham bridal transformations, Nanoplastia & Keratin silk smoothing, 24K Kumkumadi glow facials, and Maharaja hot towel grooming. Located in Ramapuram, Chennai.
            </p>

            {/* Address Banner */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-300 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-gold-300 font-medium">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0" />
                <span>Ramapuram, Chennai, Tamil Nadu 600089</span>
              </div>
              <span className="hidden sm:inline text-slate-600">|</span>
              <a
                href="tel:+919360449096"
                className="hover:text-gold-300 flex items-center gap-1.5 font-semibold text-slate-200"
              >
                <Phone className="w-3.5 h-3.5 text-gold-400" /> +91 9360449096
              </a>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => onOpenBooking()}
                className="btn-gold w-full sm:w-auto px-8 py-4 rounded-full text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl shadow-gold-500/20"
              >
                <Calendar className="w-4 h-4" /> Book Appointment
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-4 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-4 h-4 fill-white" /> WhatsApp Chat
              </a>
            </div>

            {/* Trust highlights */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-left max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-1">
                  4.99 <Star className="w-4 h-4 fill-gold-400 text-gold-400" />
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Top-Rated in Chennai</div>
              </div>

              <div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-white">
                  100%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Formaldehyde-Free</div>
              </div>

              <div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-white">
                  VIP Suites
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Private Bridal Dressing</div>
              </div>
            </div>

          </div>

          {/* Right Hero Visual Cards */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md">
              
              {/* Primary Image */}
              <div className="rounded-3xl overflow-hidden border border-gold-500/30 shadow-2xl relative aspect-[4/5]">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80"
                  alt="AURA Chennai Luxury Indian Bridal Experience"
                  className="w-full h-full object-cover transform hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Floating Bottom Card */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-gold-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider">
                        Next Open Opening
                      </span>
                      <h4 className="font-serif font-bold text-white text-sm">Tomorrow • 10:00 AM</h4>
                      <p className="text-[11px] text-slate-400">Priya Sundaram • Royal Muhurtham Trial</p>
                    </div>
                    <button
                      onClick={() => onOpenBooking()}
                      className="btn-gold px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -left-4 p-3 rounded-2xl bg-slate-900/95 border border-gold-500/40 shadow-xl hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-300 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Chennai Luxury Salon 2026</div>
                  <div className="text-[10px] text-gold-400">Ramapuram, Chennai 600089</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
