import React, { useState } from 'react';
import { useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import BeforeAfter from './components/BeforeAfter';
import Pricing from './components/Pricing';
import BookingWizard from './components/BookingWizard';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const { t, language } = useLanguage();
  const [view, setView] = useState('landing'); // 'landing' or 'admin'
  const [bookingOpen, setBookingOpen] = useState(false);
  const [adminSubView, setAdminSubView] = useState('patients'); // 'patients' or 'specialists'
  const [bookingService, setBookingService] = useState('Sclerotherapy');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('venacomfort_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('venacomfort_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  const handleOpenBooking = (service = 'Sclerotherapy') => {
    setBookingService(service);
    setBookingOpen(true);
  };

  const toggleFaq = (index) => {
    setFaqOpen(prev => (prev === index ? null : index));
  };

  const faqs = [
    { qKey: 'faqQ1', aKey: 'faqA1' },
    { qKey: 'faqQ2', aKey: 'faqA2' },
    { qKey: 'faqQ3', aKey: 'faqA3' },
    { qKey: 'faqQ4', aKey: 'faqA4' }
  ];

  if (view === 'admin') {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Navigation Drawer for Admin */}
        <aside className="bg-soft-ivory h-full w-72 rounded-r-xl bg-surface-container-lowest shadow-xl flex flex-col py-6 shrink-0 z-40 hidden md:flex border-r border-champagne-gold/15">
          <div className="px-6 mb-8 flex items-center gap-2">
            <img src="/logo.png" alt="VenaComfort Logo" className="h-6 w-6 object-contain" />
            <span className="font-display text-xl font-bold text-deep-cobalt">VenaComfort</span>
          </div>
          <nav className="flex-grow space-y-2 px-2 overflow-y-auto">
            <button 
              onClick={() => setView('landing')} 
              className="w-full flex items-center gap-4 text-on-surface-variant hover:bg-champagne-gold/10 rounded-lg px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">home</span>
              <span>{language === 'es' ? 'Inicio Web' : 'Web Home'}</span>
            </button>
            <button 
              onClick={() => setView('landing')} 
              className="w-full flex items-center gap-4 text-on-surface-variant hover:bg-champagne-gold/10 rounded-lg px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">medical_services</span>
              <span>{t('services')}</span>
            </button>
            <button 
              onClick={() => { setView('landing'); setTimeout(() => { window.location.hash = 'results'; }, 100); }} 
              className="w-full flex items-center gap-4 text-on-surface-variant hover:bg-champagne-gold/10 rounded-lg px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">compare</span>
              <span>{t('beforeAfter')}</span>
            </button>
            {/* Hiding pricing from admin drawer as requested
            <button 
              onClick={() => { setView('landing'); setTimeout(() => { window.location.hash = 'pricing'; }, 100); }} 
              className="w-full flex items-center gap-4 text-on-surface-variant hover:bg-champagne-gold/10 rounded-lg px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">payments</span>
              <span>{t('pricing')}</span>
            </button>
            */}
            <div className="border-t border-surface-dim my-4 pt-4 px-2 space-y-2">
              <button 
                onClick={() => setAdminSubView('patients')}
                className={`w-full flex items-center gap-4 rounded-lg px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-all text-left cursor-pointer ${
                  adminSubView === 'patients' 
                    ? 'bg-champagne-gold/10 text-deep-cobalt border-l-4 border-champagne-gold' 
                    : 'text-on-surface-variant hover:bg-champagne-gold/10'
                }`}
              >
                <span className="material-symbols-outlined text-lg">dashboard</span>
                <span>{language === 'es' ? 'Portal Clínico' : 'Clinical Portal'}</span>
              </button>

              {isAuthenticated && currentUser?.role === 'admin' && (
                <>
                  <button 
                    onClick={() => setAdminSubView('specialists')}
                    className={`w-full flex items-center gap-4 rounded-lg px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-all text-left cursor-pointer ${
                      adminSubView === 'specialists' 
                        ? 'bg-champagne-gold/10 text-deep-cobalt border-l-4 border-champagne-gold' 
                        : 'text-on-surface-variant hover:bg-champagne-gold/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">groups</span>
                    <span>{language === 'es' ? 'Especialistas' : 'Specialists'}</span>
                  </button>

                  <button 
                    onClick={() => setAdminSubView('users')}
                    className={`w-full flex items-center gap-4 rounded-lg px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-all text-left cursor-pointer ${
                      adminSubView === 'users' 
                        ? 'bg-champagne-gold/10 text-deep-cobalt border-l-4 border-champagne-gold' 
                        : 'text-on-surface-variant hover:bg-champagne-gold/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">manage_accounts</span>
                    <span>{language === 'es' ? 'Usuarios' : 'Users'}</span>
                  </button>
                </>
              )}
            </div>
          </nav>
          
          <div className="p-4 border-t border-surface-container-high relative">
            {isAuthenticated && currentUser ? (
              <div className="flex flex-col">
                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute bottom-16 left-4 right-4 bg-white border border-outline-variant/60 rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1 text-left animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {currentUser?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => {
                            setAdminSubView('audit_logs');
                            setShowUserMenu(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-champagne-gold/10 cursor-pointer w-full text-left transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">history</span>
                          <span>{language === 'es' ? 'Registro de Acciones' : 'Action Logs'}</span>
                        </button>
                        <hr className="border-ice-blue/50 my-1" />
                      </>
                    )}
                    <button
                      onClick={() => {
                        setIsAuthenticated(false);
                        setCurrentUser(null);
                        sessionStorage.removeItem('venacomfort_auth');
                        sessionStorage.removeItem('venacomfort_user');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-error hover:bg-error-container/20 cursor-pointer w-full text-left transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      <span>{language === 'es' ? 'Cerrar Sesión' : 'Logout'}</span>
                    </button>
                  </div>
                )}

                {/* User Info Anchor Button */}
                <button
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-champagne-gold/10 border border-transparent hover:border-champagne-gold/15 transition-all text-left w-full cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-deep-cobalt text-white flex items-center justify-center font-display font-bold text-sm tracking-wide shrink-0 shadow-inner overflow-hidden">
                    {currentUser.role === 'specialist' ? (
                      <span className="material-symbols-outlined text-lg">medical_services</span>
                    ) : (
                      <span>{currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <span className="block text-xs font-bold text-deep-cobalt truncate leading-tight">{currentUser.name}</span>
                    <span className="block text-[10px] text-on-surface-variant/70 font-semibold uppercase tracking-wider mt-0.5">
                      {currentUser.role === 'admin' ? (language === 'es' ? 'Administrador' : 'Admin') : (language === 'es' ? 'Especialista' : 'Specialist')}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/60 shrink-0">unfold_more</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-2">
                <span className="text-[10px] text-on-surface-variant/80 font-bold uppercase tracking-wider block">VenaComfort CRM</span>
                <span className="text-[9px] text-on-surface-variant/60 block mt-0.5">v1.0.0 • HIPAA Secure</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Admin Portal Workspace */}
        <AdminPortal 
          adminSubView={adminSubView} 
          setAdminSubView={setAdminSubView} 
          isAuthenticated={isAuthenticated} 
          setIsAuthenticated={setIsAuthenticated} 
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      </div>
    );
  }

  return (
    <div className="bg-soft-ivory min-h-screen text-on-surface flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar 
        currentView={view} 
        setView={setView} 
        onOpenBooking={handleOpenBooking} 
      />

      <main className="flex-grow">
        {/* Hero Banner */}
        <Hero onOpenBooking={handleOpenBooking} />

        {/* Services / Treatments */}
        <Services />

        {/* Before and After Comparatives */}
        <BeforeAfter />

        {/* Prices list and value props - hidden for now as requested */}
        {/* <Pricing onOpenBooking={() => setBookingOpen(true)} /> */}

        {/* Interactive Bilingual FAQs */}
        <section className="py-24 md:py-32 bg-soft-ivory" id="faq">
          <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <img src="/faq-icon.png" alt="FAQ Logo" className="h-12 w-12 mx-auto mb-4 object-contain opacity-90 animate-fade-in" />
              <h2 className="font-display text-3xl md:text-4xl text-deep-cobalt mb-6 font-bold">
                {t('faqTitle')}
              </h2>
              <div className="w-24 h-1 bg-champagne-gold mx-auto rounded-full opacity-60"></div>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = faqOpen === index;
                return (
                  <div key={index} className="glass-panel rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-champagne-gold/[0.02] transition-colors focus:outline-none cursor-pointer"
                    >
                      <span className="font-display text-base md:text-lg text-deep-cobalt font-semibold flex items-center gap-2.5">
                        <img src="/faq-icon.png" alt="FAQ Icon" className="h-5 w-5 object-contain shrink-0 opacity-80" />
                        {t(faq.qKey)}
                      </span>
                      <span className={`material-symbols-outlined text-champagne-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        keyboard_arrow_down
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 text-sm text-on-surface-variant leading-relaxed animate-fade-in border-t border-dashed border-surface-dim pt-4">
                        {t(faq.aKey)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact info / Quick map simulation */}
        <section className="py-16 md:py-24 bg-white border-t border-champagne-gold/10" id="contact">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center space-y-6">
            <div className="inline-block px-4 py-1 rounded-full bg-champagne-gold/10 border border-champagne-gold/20 text-champagne-gold font-bold text-xs tracking-wider uppercase">
              {t('contact')}
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-deep-cobalt font-bold">
              {t('language') === 'es' ? 'Visita VenaComfort en Miami' : 'Visit VenaComfort in Miami'}
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 pt-4">
              <div className="flex items-center gap-3 bg-soft-ivory p-4 rounded-xl shadow-sm border border-champagne-gold/5 min-w-[240px]">
                <span className="material-symbols-outlined text-champagne-gold text-2xl">call</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">{t('phone')}</span>
                  <a href="tel:786-531-0664" className="font-bold text-deep-cobalt hover:underline text-sm">786-531-0664</a>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-soft-ivory p-4 rounded-xl shadow-sm border border-champagne-gold/5 min-w-[240px]">
                <span className="material-symbols-outlined text-champagne-gold text-2xl">photo_camera</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Instagram</span>
                  <a href="https://instagram.com/venacomfort.venastudio" target="_blank" rel="noreferrer" className="font-bold text-deep-cobalt hover:underline text-sm">@venacomfort.venastudio</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-deep-cobalt text-champagne-gold w-full border-t border-champagne-gold/20 pt-16 pb-8">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between gap-8 pb-12 border-b border-champagne-gold/15">
          {/* Logo & Brand */}
          <div className="flex flex-col gap-4 md:w-1/3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="VenaComfort Logo" className="h-8 w-8 object-contain brightness-0 invert" />
              <span className="font-display text-2xl text-soft-ivory font-bold">VenaComfort</span>
            </div>
            <p className="text-sm text-surface-container-highest/80 max-w-sm leading-relaxed">
              {t('language') === 'es' ? 'Elevando el cuidado vascular estético con precisión clínica y hospitalidad de lujo.' : 'Elevating aesthetic vascular care with clinical precision and luxury hospitality.'}
            </p>
            <p className="text-[10px] text-surface-container-highest/60 tracking-wider font-bold">
              © {new Date().getFullYear()} VenaComfort Vein Studio.<br />{t('hipaa')}.
            </p>
          </div>

          {/* Links columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:w-2/3 md:justify-items-end">
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-soft-ivory uppercase tracking-wider mb-2">{t('contact')}</h4>
              <a href="tel:786-531-0664" className="text-sm text-surface-container-highest/80 hover:text-champagne-gold transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">phone</span>
                786-531-0664
              </a>
              <span className="text-sm text-surface-container-highest/80 flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">location_on</span>
                {t('address')}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-soft-ivory uppercase tracking-wider mb-2">Legal</h4>
              <a href="#privacy" className="text-sm text-surface-container-highest/80 hover:text-champagne-gold transition-colors">{t('privacyPolicy')}</a>
              <a href="#terms" className="text-sm text-surface-container-highest/80 hover:text-champagne-gold transition-colors">{t('termsOfService')}</a>
            </div>
          </div>
        </div>

        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 text-center text-xs text-surface-container-highest/50">
          {t('wellbeingPriority')}
        </div>
      </footer>

      {/* Booking Wizard Modal Overlay */}
      {bookingOpen && (
        <BookingWizard onClose={() => setBookingOpen(false)} initialService={bookingService} />
      )}
    </div>
  );
}
