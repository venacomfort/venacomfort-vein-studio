import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Pricing({ onOpenBooking }) {
  const { t } = useLanguage();

  const pricingItems = [
    {
      nameKey: 'smallArea',
      nameEn: 'Small Area',
      nameEs: 'Área Pequeña',
      price: '$250 - $300',
      periodKey: 'perSession',
      isPackage: false
    },
    {
      nameKey: 'oneLeg',
      nameEn: '1 Leg',
      nameEs: '1 Pierna',
      price: '$350 - $450',
      periodKey: 'perSession',
      isPackage: false
    },
    {
      nameKey: 'twoLegs',
      nameEn: '2 Legs',
      nameEs: '2 Piernas',
      price: '$500 - $650',
      periodKey: 'perSession',
      isPackage: false
    },
    {
      nameKey: 'threeSessions',
      nameEn: '3 Sessions Package',
      nameEs: 'Paquete 3 Sesiones',
      price: '$950 - $1,200',
      periodKey: 'saveResults',
      isPackage: true
    },
    {
      nameKey: 'fourSessions',
      nameEn: '4 Sessions Package',
      nameEs: 'Paquete 4 Sesiones',
      price: '$1,200 - $1,450',
      periodKey: 'saveResults',
      isPackage: true
    }
  ];

  const benefits = [
    {
      icon: 'verified_user',
      titleEn: 'Safe & Minimally Invasive',
      titleEs: 'Procedimientos seguros y mínimamente invasivos'
    },
    {
      icon: 'person',
      titleEn: 'Personalized Care',
      titleEs: 'Atención personalizada'
    },
    {
      icon: 'medical_services',
      titleEn: 'Vascular Experts',
      titleEs: 'Realizado por profesionales vasculares'
    },
    {
      icon: 'spa',
      titleEn: 'Health & Aesthetics',
      titleEs: 'Mejora la apariencia y salud de tus piernas'
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-surface" id="pricing">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h2 className="font-display text-3xl md:text-4xl text-deep-cobalt mb-6 font-bold">
            {t('pricingTitle')}
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">
            {t('pricingSubtitle')}
          </p>
          <div className="w-24 h-1 bg-champagne-gold mx-auto rounded-full opacity-60 mt-4"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Prices List Card */}
          <div className="lg:col-span-7 glass-panel p-6 md:p-8 rounded-3xl luxury-shadow bg-white">
            <h3 className="font-display text-2xl text-deep-cobalt mb-8 font-semibold border-b border-surface-dim pb-4">
              {t('language') === 'es' ? 'Nuestros Precios' : 'Treatment Fees'}
            </h3>
            
            <div className="divide-y divide-surface-container-high/80">
              {pricingItems.map((item, index) => (
                <div key={index} className={`py-5 flex justify-between items-center ${item.isPackage ? 'bg-champagne-gold/[0.03] px-2 rounded-lg' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${item.isPackage ? 'text-champagne-gold' : 'text-deep-cobalt/60'} text-xl`}>
                      {item.isPackage ? 'auto_awesome' : 'double_arrow'}
                    </span>
                    <div>
                      <h4 className="font-semibold text-deep-cobalt text-base">
                        {t('language') === 'es' ? item.nameEs : item.nameEn}
                      </h4>
                      <p className="text-xs text-on-surface-variant italic mt-0.5">
                        {t(item.periodKey)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-lg md:text-xl text-deep-cobalt font-bold">
                      {item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose Us & CTA */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full gap-8">
            <div className="glass-panel p-6 md:p-8 rounded-3xl bg-deep-cobalt text-white">
              <h3 className="font-display text-2xl text-champagne-gold mb-6 font-semibold">
                {t('whyUsTitle')}
              </h3>

              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-champagne-gold/15 flex items-center justify-center shrink-0 border border-champagne-gold/20">
                      <span className="material-symbols-outlined text-champagne-gold text-lg">
                        {benefit.icon}
                      </span>
                    </div>
                    <p className="text-sm text-surface-container-low/90 leading-relaxed font-medium mt-1">
                      {t('language') === 'es' ? benefit.titleEs : benefit.titleEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-CTA Agenda tu cita */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between items-center text-center gap-4 bg-champagne-gold/5 border border-champagne-gold/20">
              <div className="flex flex-col gap-1">
                <h4 className="font-display text-lg text-deep-cobalt font-bold">
                  {t('language') === 'es' ? 'AGENDA TU CITA' : 'BOOK YOUR APPOINTMENT'}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {t('language') === 'es' ? 'Da el primer paso hacia unas piernas más ligeras y hermosas' : 'Take the first step towards lighter, more beautiful legs'}
                </p>
              </div>
              <button 
                onClick={onOpenBooking}
                className="bg-champagne-gold text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-secondary transition-all duration-300 shadow-md cursor-pointer hover:scale-95"
              >
                {t('bookAppointment')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
