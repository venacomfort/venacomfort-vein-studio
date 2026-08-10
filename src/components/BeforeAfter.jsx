import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function BeforeAfter() {
  const { t } = useLanguage();
  const [activeCase, setActiveCase] = useState(1);

  const cases = [
    {
      id: 1,
      title: 'Sclerotherapy - Case 1',
      titleEs: 'Escleroterapia - Caso 1',
      details: 'Patient: Female, 44. Diagnosis: Reticular and spider veins. Result after 2 sessions.',
      detailsEs: 'Paciente: Femenina, 44. Diagnóstico: Venas reticulares y arañas vasculares. Resultado tras 2 sesiones.',
      image: '/sclerotherapy_before_after.png'
    }
  ];

  const currentCase = cases.find(c => c.id === activeCase);

  return (
    <section className="py-24 md:py-32 bg-soft-ivory" id="results">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h2 className="font-display text-3xl md:text-4xl text-deep-cobalt mb-6 font-bold">
            {t('resultsTitle')}
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">
            {t('resultsSubtitle')}
          </p>
          <div className="w-24 h-1 bg-champagne-gold mx-auto rounded-full opacity-60 mt-4"></div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Gallery Frame with glassmorphism */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl luxury-shadow flex flex-col items-center">
            {/* Case Selection Tabs (if multiple cases are added in future) */}
            <div className="flex gap-4 mb-8">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCase(c.id)}
                  className={`px-6 py-2 rounded-full font-semibold text-xs tracking-wider uppercase border transition-all cursor-pointer ${
                    activeCase === c.id
                      ? 'bg-champagne-gold text-white border-champagne-gold'
                      : 'bg-white/40 text-deep-cobalt border-champagne-gold/20 hover:border-champagne-gold/60'
                  }`}
                >
                  {t('case')} {c.id}
                </button>
              ))}
            </div>

            {/* Comparison Container */}
            <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-md border border-champagne-gold/15 bg-white">
              <img 
                src={currentCase.image} 
                alt="Sclerotherapy Before & After Comparison" 
                className="w-full h-auto object-cover"
              />
              
              {/* Overlay labels */}
              <div className="absolute top-4 left-4 bg-deep-cobalt/85 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
                {t('before')}
              </div>
              <div className="absolute top-4 right-4 bg-champagne-gold/90 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
                {t('after')}
              </div>
            </div>

            {/* Case Details */}
            <div className="mt-8 text-center max-w-xl">
              <h3 className="font-display text-xl text-deep-cobalt font-semibold mb-2">
                {t('language') === 'es' ? currentCase.titleEs : currentCase.title}
              </h3>
              <p className="text-sm text-on-surface-variant">
                {t('language') === 'es' ? currentCase.detailsEs : currentCase.details}
              </p>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-on-surface-variant/75">
            <span className="material-symbols-outlined text-sm text-champagne-gold">gavel</span>
            <span>{t('disclaimer')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
