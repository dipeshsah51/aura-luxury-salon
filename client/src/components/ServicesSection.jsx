import React, { useState, useMemo } from 'react';
import { Clock, Star, Sparkles, Search, Check, ChevronRight } from 'lucide-react';

export default function ServicesSection({ services, onBookService }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(services.map(s => s.category));
    return ['All', ...Array.from(set)];
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchCat = activeCategory === 'All' || s.category === activeCategory;
      const matchQuery = !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [services, activeCategory, searchQuery]);

  return (
    <section id="services-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Haute Artistry Menu
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
          Curated Treatments & Rituals
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Every appointment begins with an in-depth botanical consultation, organic cleansing ritual, and bespoke customization tailored exclusively to your personal aesthetic.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-gold-500 text-black font-bold shadow-md shadow-gold-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
          />
        </div>

      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="rounded-3xl border border-slate-800/80 bg-slate-900/60 overflow-hidden flex flex-col justify-between group hover:border-gold-500/40 transition-all duration-300 hover:-translate-y-1 shadow-xl"
          >
            <div>
              {/* Image Banner */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                {/* Category chip */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-gold-300 border border-gold-500/30">
                  {service.category}
                </div>

                {service.popular && (
                  <div className="absolute top-3 right-3 bg-gold-500 text-black px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    Signature
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <span className="font-serif text-2xl font-bold text-white">
                    ₹{service.price?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-300 flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5 text-gold-400" /> {service.duration} mins
                  </span>
                </div>
              </div>

              {/* Service Info */}
              <div className="p-5">
                <div className="flex items-center gap-1 text-[11px] text-gold-400 font-semibold mb-1">
                  <Star className="w-3.5 h-3.5 fill-gold-400" />
                  <span>{service.rating || '5.0'}</span>
                  <span className="text-slate-500 font-normal">({service.reviewsCount || 100}+ reviews)</span>
                </div>

                <h3 className="font-serif font-bold text-white text-lg leading-snug mb-2 group-hover:text-gold-200 transition">
                  {service.name}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {service.description}
                </p>
              </div>
            </div>

            {/* Action footer */}
            <div className="p-5 pt-0">
              <button
                onClick={() => onBookService(service)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-gold-500 text-slate-200 hover:text-black font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-700 hover:border-gold-400 shadow-md group/btn"
              >
                <span>Book This Ritual</span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
