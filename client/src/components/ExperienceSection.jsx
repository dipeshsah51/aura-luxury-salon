import React from 'react';
import { Sparkles, Wine, Shield, HeartHandshake, Award, Clock } from 'lucide-react';

export default function ExperienceSection() {
  const amenities = [
    {
      icon: Wine,
      title: "Complimentary Degree Filter Coffee",
      desc: "Enjoy authentic Kumbakonam brass degree filter coffee, organic herbal decoctions, and fresh South Indian jasmine floral garlands."
    },
    {
      icon: Shield,
      title: "Private Muhurtham Bridal Suites",
      desc: "Dedicated VIP suites featuring heirloom mirror stations, full-length dressing mirrors for silk saree draping, and private photography lighting."
    },
    {
      icon: HeartHandshake,
      title: "Ayurvedic Scalp & Hair Analysis",
      desc: "Consultations combining modern trichology with pure Ayurvedic botanicals (Brahmi, Bhringraj, Amla) formulated for Chennai climate."
    },
    {
      icon: Clock,
      title: "Zero Waiting Guarantee",
      desc: "Strictly staggered appointments in Ramapuram ensuring your stylist chair is prepared the moment you arrive."
    }
  ];

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Visual Collage */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="rounded-3xl overflow-hidden border border-gold-500/20 aspect-[3/4] shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"
              alt="Salon Interior"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-3xl overflow-hidden border border-gold-500/20 aspect-[3/4] shadow-2xl mt-8">
            <img
              src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
              alt="Spa Ritual"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Details */}
        <div className="lg:col-span-7 space-y-6">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> The AURA Experience • Chennai
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Where Modern Couture Meets Timeless Indian Grandeur
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Founded to bring international hair artistry and traditional South Indian bridal majesty together, AURA offers Ramapuram, Chennai's most tranquil aesthetic escape.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {amenities.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif font-bold text-white text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
