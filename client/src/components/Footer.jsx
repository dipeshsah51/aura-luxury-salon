import React from 'react';
import { MapPin, Phone, Mail, Clock, Sparkles, MessageCircle, Shield } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Footer({ onOpenBooking, onSwitchView }) {
  const whatsappLink = "https://wa.me/919360449096?text=Hello%20AURA%20Salon%20Chennai%2C%20I%20would%20like%20to%20enquire%20about%20booking%20an%20appointment";

  return (
    <footer className="bg-[#070A10] border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand info */}
          <div className="space-y-4">
            <BrandLogo
              size="md"
              subtitle="Luxury Salon & Bridal Lounge"
            />
            <p className="text-xs text-slate-400 leading-relaxed">
              Modern Haute Coiffure, South Indian Muhurtham Bridal Lounge, Nanoplastia Hair Smoothing & Ayurvedic Kesh Wellness in Ramapuram, Chennai.
            </p>
            <div className="text-[11px] text-gold-400/90 font-medium">
              Authentic Kumbakonam degree filter coffee & fresh jasmine flowers complimentary for every appointment.
            </div>
          </div>

          {/* Concierge & Location */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">The Salon Studio</h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              <span>
                Ramapuram, Chennai,<br />
                Tamil Nadu, 600089<br />
                <span className="text-slate-500 text-[11px]">(Near DLF Cybercity & MIOT Hospital)</span>
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Phone className="w-4 h-4 text-gold-400 shrink-0" />
              <a href="tel:+919360449096" className="hover:text-gold-300 transition">
                +91 9360449096
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-medium">
                WhatsApp: +91 9360449096
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Mail className="w-4 h-4 text-gold-400 shrink-0" />
              <a href="mailto:dsah56631@gmail.com" className="hover:text-gold-300 transition">
                dsah56631@gmail.com
              </a>
            </div>
          </div>

          {/* Salon Hours */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">Salon Hours</h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Monday – Thursday:</span>
                <span>9:00 AM – 9:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Friday:</span>
                <span>9:00 AM – 9:30 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Saturday – Sunday:</span>
                <span>8:30 AM – 9:30 PM</span>
              </div>
              <div className="text-[11px] text-gold-400/80 pt-1">
                Early morning bridal Muhurtham slots (4:00 AM onwards) available upon advance booking.
              </div>
            </div>
          </div>

          {/* Quick Actions & WhatsApp */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">Direct WhatsApp</h4>
            <p className="text-xs text-slate-400">
              Instant booking assistance, bridal inquiries, or portfolio requests via WhatsApp.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Chat on WhatsApp (+91 9360449096)
            </a>
            <button
              onClick={() => onOpenBooking()}
              className="btn-gold w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Book an Appointment
            </button>
            <div className="pt-2 flex items-center justify-between text-[11px]">
              <button onClick={() => onSwitchView('bookings')} className="hover:text-gold-300 transition">
                My Appointments
              </button>
              <button
                onClick={() => onSwitchView('admin')}
                className="text-slate-500 hover:text-gold-300 transition flex items-center gap-1"
                title="Salon Director & Staff Portal"
              >
                <Shield className="w-3 h-3 text-gold-500/50" /> Staff Portal
              </button>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 AURA Luxury Salon & Bridal Lounge • Ramapuram, Chennai 600089. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Sanitation Standards</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
