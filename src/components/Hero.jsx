import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Hero({ onOpenBooking }) {
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden min-h-[90vh] flex items-center" id="home">
      {/* Background Image - Luxury Spa Clinic */}
      <div 
        className="absolute inset-0 bg-cover bg-center w-full h-full z-0 opacity-30 mix-blend-multiply filter blur-[1px]" 
        style={{ 
          backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBHOb8umoLyCCquFa9XlyoySbAH5WCa5KbVT2YU78KvXPiL_Ldd7Hm6dwXDTYc90sCk9H6j1W3oStpCwZXxQ0bSxxEfYAlpjdlrjhyT1-FN5CoJgfcLVFAu3FrTv5pHx3C91Ef4wXFTk307xcvS0ikNp6Iydqu0OPSgdpb-JeM_iGzq6jJnOcuaRNgtsF8PsyZcQZ8sVSjRkg8hM6dnaty8zM7idMAlf5Hne4Oicj5bEKLQpbjGFtV-mg')" 
        }}
      />
      {/* Soft gradient overlay for high contrast text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-soft-ivory via-soft-ivory/95 to-soft-ivory/30 z-10" />

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-20 w-full">
        <div className="max-w-2xl fade-in-up">
          <div className="inline-block px-4 py-1.5 rounded-full border border-champagne-gold/30 bg-white/60 backdrop-blur-sm mb-6">
            <span className="font-semibold text-xs tracking-widest uppercase text-champagne-gold">
              {t('premiumCare')}
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-deep-cobalt mb-6 leading-tight font-bold">
            {t('heroTitle').split('.').map((part, idx) => {
              if (!part.trim()) return null;
              if (idx === 0) {
                return (
                  <span key={idx}>
                    {part.trim()}.<br />
                  </span>
                );
              }
              return (
                <span key={idx} className="gold-gradient-text">
                  {part.trim()}
                </span>
              );
            })}
          </h1>
          <p className="text-body-lg text-on-surface-variant mb-10 max-w-xl">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onOpenBooking}
              className="bg-champagne-gold text-white px-8 py-4 rounded-full font-semibold hover:bg-secondary transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
            >
              {t('bookConsultation')}
            </button>
            <a 
              href="#services" 
              className="bg-transparent text-deep-cobalt border-2 border-deep-cobalt px-8 py-4 rounded-full font-semibold hover:bg-deep-cobalt hover:text-white transition-all duration-300 text-center flex items-center justify-center"
            >
              {t('ourServices')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
