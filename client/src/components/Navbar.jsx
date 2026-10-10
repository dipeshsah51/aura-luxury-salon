import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Calendar, User, Shield, LogOut, ChevronRight, Menu, X, MessageCircle, Phone } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar({
  currentView,
  setCurrentView,
  onOpenBooking,
  onOpenAuth
}) {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const whatsappLink = "https://wa.me/919360449096?text=Hello%20AURA%20Salon%20Chennai%2C%20I%20would%20like%20to%20enquire%20about%20booking%20an%20appointment";

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80">
      
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-amber-950/60 via-gold-950/40 to-slate-950 px-4 py-1.5 text-[11px] text-slate-300 border-b border-gold-500/10 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gold-400 font-semibold">📍 Ramapuram, Chennai, Tamil Nadu 600089</span>
            <span className="hidden sm:inline text-slate-500">• Near DLF Cybercity</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:+919360449096"
              className="hover:text-gold-300 transition flex items-center gap-1 font-medium text-slate-200"
            >
              <Phone className="w-3 h-3 text-gold-400" /> +91 9360449096
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 font-semibold"
            >
              <MessageCircle className="w-3 h-3 fill-emerald-400" /> WhatsApp Direct
            </a>
            <button
              onClick={() => setCurrentView('admin')}
              className="text-slate-400 hover:text-gold-300 transition flex items-center gap-1 font-medium pl-3 border-l border-slate-700/80"
              title="Staff & Salon Director Portal"
            >
              <Shield className="w-3 h-3 text-gold-400" />
              <span className="hidden sm:inline">Director Portal</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <BrandLogo
          onClick={() => setCurrentView('customer')}
          size="md"
        />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setCurrentView('customer')}
            className={`transition ${currentView === 'customer' ? 'text-gold-400 font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Salon & Menu
          </button>
          
          <button
            onClick={() => setCurrentView('bookings')}
            className={`flex items-center gap-1.5 transition ${currentView === 'bookings' ? 'text-gold-400 font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            <Calendar className="w-3.5 h-3.5" /> My Appointments
          </button>
        </nav>

        {/* Right CTA & Profile */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-white transition text-xs font-semibold"
            title="Chat with us on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp</span>
          </a>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  {user.name}
                  {user.role === 'admin' && <span className="text-[9px] bg-gold-500/20 text-gold-300 px-1.5 py-0.2 rounded border border-gold-500/30 font-bold">ADMIN</span>}
                </div>
                <div className="text-[10px] text-slate-400">{user.email}</div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-xs font-semibold text-slate-300 hover:text-white transition px-3 py-2"
            >
              Sign In / VIP
            </button>
          )}

          <button
            onClick={() => onOpenBooking()}
            className="btn-gold px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-gold-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            Book Ritual
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-emerald-500 text-white"
            title="WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
          </a>
          <button
            onClick={() => onOpenBooking()}
            className="btn-gold px-3 py-1.5 rounded-full text-xs font-bold"
          >
            Book
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-3 text-sm">
          <div className="text-xs text-gold-400 pb-2 border-b border-slate-800">
            📍 Ramapuram, Chennai 600089 • 📞 +91 9360449096
          </div>
          <button
            onClick={() => { setCurrentView('customer'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 font-medium text-slate-200"
          >
            Salon & Menu
          </button>
          <button
            onClick={() => { setCurrentView('bookings'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 font-medium text-slate-200 flex items-center justify-between"
          >
            <span>My Appointments</span>
            <Calendar className="w-4 h-4 text-gold-400" />
          </button>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-white" /> Chat on WhatsApp (+91 9360449096)
          </a>

          <div className="pt-3 border-t border-slate-800">
            {user ? (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">{user.name}</span>
                <button onClick={logout} className="text-xs text-rose-400">Log out</button>
              </div>
            ) : (
              <button
                onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
                className="w-full text-center py-2 rounded-xl bg-slate-800 text-gold-300 text-xs font-semibold"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
