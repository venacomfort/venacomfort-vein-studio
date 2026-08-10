import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Services() {
  const { t } = useLanguage();

  const servicesData = [
    {
      icon: 'water_drop',
      titleKey: 'Sclerotherapy', // Wait, we can translate title or just keep standard
      title: 'Sclerotherapy',
      titleEs: 'Escleroterapia',
      descKey: 'sclerotherapyDesc',
      duration: '30-45 MINS',
      recoveryKey: 'noDowntime'
    },
    {
      icon: 'blur_on',
      title: 'Spider Vein Treatment',
      titleEs: 'Arañas Vasculares',
      descKey: 'spiderVeinDesc',
      duration: '30 MINS',
      recoveryKey: 'immediateReturn'
    },
    {
      icon: 'route',
      title: 'Reticular Veins',
      titleEs: 'Venas Reticulares',
      descKey: 'reticularDesc',
      duration: '45 MINS',
      recoveryKey: 'mildCompression'
    },
    {
      icon: 'stethoscope',
      title: 'Vascular Evaluation',
      titleEs: 'Evaluación Vascular',
      descKey: 'evalDesc',
      duration: '30 MINS',
      recoveryKey: 'initialConsult'
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-surface" id="services">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h2 className="font-display text-3xl md:text-4xl text-deep-cobalt mb-6 font-bold">
            {t('ourTreatments')}
          </h2>
          <div className="w-24 h-1 bg-champagne-gold mx-auto rounded-full opacity-60"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {servicesData.map((service, index) => (
            <div 
              key={index} 
              className="glass-panel p-8 rounded-2xl hover:scale-[1.02] transition-transform duration-300 group flex flex-col justify-between h-full hover:shadow-lg"
            >
              <div>
                <div className="w-16 h-16 rounded-full bg-champagne-gold/10 flex items-center justify-center mb-6 group-hover:bg-champagne-gold/20 transition-colors">
                  <span className="material-symbols-outlined text-champagne-gold text-3xl font-light">
                    {service.icon}
                  </span>
                </div>
                <h3 className="font-display text-xl text-deep-cobalt mb-3 font-semibold">
                  {t('language') === 'es' ? service.titleEs : service.title}
                </h3>
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                  {t(service.descKey)}
                </p>
              </div>

              <div className="border-t border-surface-dim pt-4 mt-auto">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-champagne-gold text-sm">schedule</span>
                  <span className="font-semibold text-xs tracking-wider text-on-surface-variant uppercase">
                    {service.duration}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-champagne-gold text-sm">healing</span>
                  <span className="font-semibold text-xs tracking-wider text-on-surface-variant uppercase">
                    {t(service.recoveryKey)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
