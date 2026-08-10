import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ currentView, setView, onOpenBooking }) {
  const { language, toggleLanguage, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-champagne-gold/10 transition-all duration-300 ${scrolled ? 'shadow-md py-1' : 'py-3'}`}>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex justify-between items-center h-20">
          {/* Logo / Brand */}
          <button onClick={() => setView('landing')} className="flex items-center gap-2 group focus:outline-none">
            <span className="material-symbols-outlined text-champagne-gold text-3xl group-hover:scale-110 transition-transform duration-300">home_health</span>
            <span className="font-display text-2xl text-primary tracking-tight font-bold">VenaComfort</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" onClick={() => setView('landing')} className="text-on-surface font-semibold text-sm nav-link hover:text-champagne-gold transition-colors duration-300">
              {t('services')}
            </a>
            <a href="#results" onClick={() => setView('landing')} className="text-on-surface font-semibold text-sm nav-link hover:text-champagne-gold transition-colors duration-300">
              {t('beforeAfter')}
            </a>
            <a href="#pricing" onClick={() => setView('landing')} className="text-on-surface font-semibold text-sm nav-link hover:text-champagne-gold transition-colors duration-300">
              {t('pricing')}
            </a>
            <a href="#faq" onClick={() => setView('landing')} className="text-on-surface font-semibold text-sm nav-link hover:text-champagne-gold transition-colors duration-300">
              {t('faq')}
            </a>
            
            {/* View Toggle link for Demo */}
            <button 
              onClick={() => setView(currentView === 'admin' ? 'landing' : 'admin')} 
              className={`font-semibold text-sm nav-link flex items-center gap-1 transition-colors duration-300 ${currentView === 'admin' ? 'text-champagne-gold active' : 'text-on-surface hover:text-champagne-gold'}`}
            >
              <span className="material-symbols-outlined text-sm">dashboard</span>
              {currentView === 'admin' ? t('services') : t('adminPortal')}
            </button>

            {/* Language Switch */}
            <div className="flex items-center ml-4 border-l border-surface-dim pl-6">
              <button 
                onClick={toggleLanguage}
                className="flex items-center border border-champagne-gold/40 hover:border-champagne-gold rounded-full px-3 py-1 bg-white/50 text-xs font-bold text-deep-cobalt cursor-pointer transition-all duration-300 hover:shadow-sm"
              >
                <span className="material-symbols-outlined text-xs mr-1">translate</span>
                {language === 'en' ? 'ESP' : 'ENG'}
              </button>
            </div>

            {/* CTA Book Button */}
            <button 
              onClick={onOpenBooking}
              className="bg-champagne-gold text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-secondary transition-all duration-300 hover:scale-95 shadow-sm ml-4 cursor-pointer"
            >
              {t('bookAppointment')}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Toggle menu" 
            className="md:hidden text-primary hover:text-champagne-gold transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[99] transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={`fixed top-0 right-0 h-full w-72 bg-soft-ivory shadow-xl z-[100] transform transition-transform duration-300 flex flex-col py-6 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 pb-6 border-b border-surface-container-high flex justify-between items-center">
          <span className="font-display text-xl text-deep-cobalt font-bold">VenaComfort</span>
          <button className="text-on-surface-variant hover:text-champagne-gold transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2">
          <a 
            href="#services" 
            onClick={() => { setView('landing'); setMobileMenuOpen(false); }}
            className="text-on-surface-variant hover:bg-champagne-gold/10 rounded-lg mx-2 px-4 py-3 font-semibold text-sm flex items-center gap-3 transition-all"
          >
            <span className="material-symbols-outlined text-base">medical_services</span>
            {t('services')}
          </a>
          <a 
            href="#results" 
            onClick={() => { setView('landing'); setMobileMenuOpen(false); }}
            className="text-on-surface-variant hover:bg-champagne-gold/10 rounded-lg mx-2 px-4 py-3 font-semibold text-sm flex items-center gap-3 transition-all"
          >
            <span className="material-symbols-outlined text-base">compare</span>
            {t('beforeAfter')}
          </a>
          <a 
            href="#pricing" 
            onClick={() => { setView('landing'); setMobileMenuOpen(false); }}
            className="text-on-surface-variant hover:bg-champagne-gold/10 rounded-lg mx-2 px-4 py-3 font-semibold text-sm flex items-center gap-3 transition-all"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            {t('pricing')}
          </a>
          <button 
            onClick={() => { setView(currentView === 'admin' ? 'landing' : 'admin'); setMobileMenuOpen(false); }}
            className="text-on-surface-variant hover:bg-champagne-gold/10 rounded-lg mx-2 px-4 py-3 font-semibold text-sm flex items-center gap-3 transition-all text-left w-full"
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            {currentView === 'admin' ? t('services') : t('adminPortal')}
          </button>
        </nav>

        <div className="p-6 border-t border-surface-container-high flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs tracking-wider text-on-surface-variant">IDIOMA / LANGUAGE</span>
            <button 
              onClick={toggleLanguage}
              className="flex items-center border border-champagne-gold/40 rounded-full px-3 py-1 bg-white text-xs font-bold text-deep-cobalt cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs mr-1">translate</span>
              {language === 'en' ? 'ESPAÑOL' : 'ENGLISH'}
            </button>
          </div>
          <button 
            onClick={() => { onOpenBooking(); setMobileMenuOpen(false); }}
            className="bg-champagne-gold text-white w-full py-3 rounded-lg font-semibold text-sm text-center hover:bg-secondary transition-colors cursor-pointer"
          >
            {t('bookAppointment')}
          </button>
        </div>
      </aside>
    </>
  );
}
