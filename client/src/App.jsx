import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { api } from './api/client';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import StaffSection from './components/StaffSection';
import ExperienceSection from './components/ExperienceSection';
import FaqSection from './components/FaqSection';
import Footer from './components/Footer';

import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import NotificationModal from './components/NotificationModal';

import MyBookingsPage from './pages/MyBookingsPage';
import AdminPortal from './pages/AdminPortal';
import WhatsAppButton from './components/WhatsAppButton';

function MainApp() {
  const { user, isAdmin, logout } = useAuth();

  const [currentView, setCurrentView] = useState('customer'); // 'customer', 'bookings'
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bookingPreselectService, setBookingPreselectService] = useState(null);
  const [bookingPreselectStaff, setBookingPreselectStaff] = useState(null);

  useEffect(() => {
    loadSalonData();
  }, []);

  const loadSalonData = async () => {
    try {
      const [srvs, stf] = await Promise.all([
        api.getServices(),
        api.getStaff()
      ]);
      setServices(srvs);
      setStaffList(stf);
    } catch (err) {
      console.error("Failed to load salon catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = (service = null, staff = null) => {
    setBookingPreselectService(service);
    setBookingPreselectStaff(staff);
    setBookingModalOpen(true);
  };

  const handleBookService = (service) => {
    handleOpenBooking(service, null);
  };

  const handleSelectStaff = (staff) => {
    handleOpenBooking(null, staff);
  };

  const scrollToServices = () => {
    const el = document.getElementById('services-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setCurrentView('customer');
      setTimeout(() => {
        document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // ----------------------------------------------------
  // DEDICATED ADMIN INTERFACE (When Admin is Logged In)
  // Shows ONLY the Admin Suite workspace (no customer menu, appointments, or hero)
  // ----------------------------------------------------
  if (isAdmin || currentView === 'admin') {
    return (
      <div className="min-h-screen bg-[#0A0E17] text-slate-100 font-sans selection:bg-gold-500 selection:text-black">
        <AdminPortal
          onLogout={() => {
            logout();
            setCurrentView('customer');
          }}
          onSwitchToCustomer={() => {
            logout();
            setCurrentView('customer');
          }}
        />
        {/* SMS & Email preview modal accessible from Admin notification tester */}
        <NotificationModal />
      </div>
    );
  }

  // ----------------------------------------------------
  // DEDICATED CUSTOMER INTERFACE (For Salon Clients & Visitors)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col text-slate-100 font-sans selection:bg-gold-500 selection:text-black">
      
      {/* Header Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenBooking={() => handleOpenBooking()}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Customer View */}
      {currentView === 'customer' && (
        <main className="flex-1">
          <Hero
            onOpenBooking={() => handleOpenBooking()}
            onExploreServices={scrollToServices}
          />
          <ServicesSection
            services={services}
            onBookService={handleBookService}
          />
          <StaffSection
            staffList={staffList}
            onSelectStaff={handleSelectStaff}
          />
          <ExperienceSection />
          <FaqSection onOpenBooking={() => handleOpenBooking()} />
        </main>
      )}

      {/* My Appointments View */}
      {currentView === 'bookings' && (
        <main className="flex-1 py-6">
          <MyBookingsPage
            onOpenBooking={() => handleOpenBooking()}
          />
        </main>
      )}

      {/* Footer */}
      <Footer
        onOpenBooking={() => handleOpenBooking()}
        onSwitchView={setCurrentView}
        onOpenAdminLogin={() => setAuthModalOpen(true)}
      />

      {/* Global Interactive Modals */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setBookingPreselectService(null);
          setBookingPreselectStaff(null);
        }}
        initialService={bookingPreselectService}
        initialStaff={bookingPreselectStaff}
        onBookingSuccess={() => {
          // Can refresh lists if needed
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* SMS & Email preview modal */}
      <NotificationModal />

      {/* Floating WhatsApp Quick Chat Button */}
      <WhatsAppButton />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
