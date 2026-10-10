import React from 'react';
import { Star, Sparkles, Scissors, Calendar } from 'lucide-react';

export default function StaffSection({ staffList, onSelectStaff }) {
  return (
    <section className="py-20 bg-slate-950/60 border-t border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Master Artisans & Barbers
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
            World-Class Stylists Dedicated to You
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Each artisan brings over a decade of international editorial and luxury salon mastery.
          </p>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {staffList.map((st) => (
            <div
              key={st.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between hover:border-gold-500/40 transition duration-300 group"
            >
              <div>
                {/* Avatar Portrait */}
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 border border-gold-500/20">
                  <img
                    src={st.avatar}
                    alt={st.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-slate-950/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-bold text-gold-400 flex items-center gap-1 border border-gold-500/30">
                    <Star className="w-3 h-3 fill-gold-400" /> {st.rating}
                  </div>
                </div>

                <h3 className="font-serif font-bold text-white text-lg">{st.name}</h3>
                <p className="text-xs text-gold-300/90 font-medium mb-2">{st.role}</p>
                <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">{st.bio}</p>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {st.specialties?.map((sp, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectStaff(st)}
                className="w-full py-2.5 rounded-xl border border-gold-500/30 bg-gold-500/5 hover:bg-gold-500 text-gold-300 hover:text-black text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Book With {st.name.split(' ')[0]}
              </button>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
