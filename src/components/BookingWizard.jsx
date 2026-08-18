import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

// Simple Canvas Signature Pad inside the Wizard
function BookingSignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0A2540';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasSigned) {
      const canvas = canvasRef.current;
      const base64 = canvas.toDataURL('image/png');
      onSave(base64);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    onClear();
  };

  return (
    <div className="border border-outline-variant bg-white rounded-lg p-2 max-w-md mx-auto">
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-24 bg-soft-ivory/20 rounded cursor-crosshair border border-dashed border-outline-variant/60"
      />
      <div className="flex justify-between items-center mt-1">
        <span className="text-[9px] text-on-surface-variant">Sign with mouse or touch</span>
        <button
          type="button"
          onClick={clear}
          className="text-[10px] text-on-surface-variant hover:text-deep-cobalt underline cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default function BookingWizard({ onClose, initialService }) {
  const { t, language } = useLanguage();
  const { addAppointment, specialists, patients } = useData();

  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState(() => {
    const servicesList = [
      { id: 'Sclerotherapy', price: 300 }
    ];
    const defaultSvcId = 'Sclerotherapy';
    const svc = servicesList[0];
    return {
      service: svc.id,
      doctor: 'Dr. Elena Rodriguez',
      price: svc.price,
      date: '',
      time: ''
    };
  });

  const [patient, setPatient] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'Female',
    email: '',
    phone: '',
    address: '',
    emergName: '',
    emergPhone: '',
    concerns: '',
    allergies: '',
    
    // Intake checklist
    pregnancy: 'No',
    clotsHistory: 'No',
    prevVeinTreatments: 'No',
    prevVeinTreatmentsDetail: '',
    allergiesHistory: 'No',
    allergiesHistoryDetail: '',
    
    // Social Consent
    socialMediaConsentLevel: 'level1',
    socialMediaSignatureUrl: ''
  });

  const [payment, setPayment] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const [errors, setErrors] = useState({});
  const [confirmationCode, setConfirmationCode] = useState('');

  // Input Handlers
  const handleBookingChange = (field, value, price = null) => {
    setBooking(prev => {
      const updated = { ...prev, [field]: value };
      if (price !== null) updated.price = price;
      return updated;
    });
  };

  const handlePatientChange = (field, value) => {
    setPatient(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePaymentChange = (field, value) => {
    setPayment(prev => ({ ...prev, [field]: value }));
  };

  // Validators
  const validateIntake = () => {
    const errs = {};
    if (!patient.firstName.trim()) errs.firstName = 'Required';
    if (!patient.lastName.trim()) errs.lastName = 'Required';
    if (!patient.dob) errs.dob = 'Required';
    if (!patient.email.trim() || !/\S+@\S+\.\S+/.test(patient.email)) errs.email = 'Valid email required';
    if (!patient.phone.trim()) errs.phone = 'Required';
    
    if (patient.pregnancy === 'Yes') {
      alert(language === 'es' ? 'La escleroterapia está contraindicada durante el embarazo.' : 'Sclerotherapy is contraindicated during pregnancy.');
      return false;
    }
    
    const hasMarketingConsent = patient.socialMediaConsentLevel && (patient.socialMediaConsentLevel.includes('level2') || patient.socialMediaConsentLevel.includes('level3'));
    if (hasMarketingConsent && !patient.socialMediaSignatureUrl) {
      errs.socialSignature = 'Signature required for marketing photo authorization';
      alert(language === 'es' ? 'Firma requerida para autorizar consentimiento de fotos.' : 'Signature required to authorize photo consent.');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (step === 2 && (!booking.date || !booking.time)) {
      alert(language === 'es' ? 'Por favor seleccione fecha y hora.' : 'Please select date and time.');
      return;
    }
    if (step === 3) {
      if (!validateIntake()) {
        return;
      }

      // Check if patient already has an active appointment
      const normalizePhone = (ph) => ph ? ph.replace(/\D/g, '') : '';
      const normalizeName = (nm) => nm ? nm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
      
      const existingPat = patients.find(p => {
        if (p.email && patient.email && p.email.trim().toLowerCase() === patient.email.trim().toLowerCase()) return true;
        if (p.phone && patient.phone && normalizePhone(p.phone) === normalizePhone(patient.phone)) return true;
        if (p.dob && patient.dob && p.dob === patient.dob) {
          if (normalizeName(p.firstName) === normalizeName(patient.firstName) && 
              normalizeName(p.lastName) === normalizeName(patient.lastName)) {
            return true;
          }
        }
        return false;
      });

      if (existingPat) {
        const hasActive = existingPat.appointments?.some(app => 
          app.status === 'confirmed' || 
          app.status === 'pending_confirmation' || 
          app.status === 'no_show'
        );
        if (hasActive) {
          alert(language === 'es'
            ? 'Ya tienes una cita activa o pendiente. Por favor, comunícate con la clínica para reagendarla.'
            : 'You already have an active or pending appointment. Please contact the clinic to reschedule it.'
          );
          return;
        }
      }

      const app = addAppointment(patient, booking);
      setConfirmationCode(app.id);
      setStep(5);
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!payment.cardNumber || !payment.expiry || !payment.cvv) {
      alert(language === 'es' ? 'Por favor complete los datos de pago.' : 'Please complete the payment details.');
      return;
    }
    const app = addAppointment(patient, booking);
    setConfirmationCode(app.id);
    setStep(5);
  };

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-primary/45 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-soft-ivory rounded-3xl overflow-hidden shadow-2xl border border-champagne-gold/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="bg-white px-6 py-5 border-b border-champagne-gold/15 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-deep-cobalt">
            <img src="/logo.png" alt="VenaComfort Logo" className="h-6 w-6 object-contain" />
            <span className="font-display text-xl font-bold">VenaComfort</span>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-champagne-gold transition-colors duration-300 font-semibold text-xs tracking-wider uppercase flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            {t('cancelBooking')}
          </button>
        </header>

        {/* Progress Bar */}
        <div className="bg-white/60 px-6 py-4 border-b border-surface-dim shrink-0">
          <div className="flex justify-between items-center relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-4 w-full h-[2px] bg-surface-container-high -z-10"></div>
            <div 
              className="absolute left-0 top-4 h-[2px] bg-champagne-gold -z-10 transition-all duration-300"
              style={{ width: `${((step === 5 ? 3 : step - 1) / 3) * 100}%` }}
            />
            {[1, 2, 3, 5].map((s) => {
              const displayStep = s === 5 ? 4 : s;
              const isActive = step === 5 ? s === 5 : step >= s;
              return (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow transition-colors ${
                      isActive ? 'bg-champagne-gold text-white' : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {displayStep}
                  </div>
                  <span className={`text-[10px] font-bold tracking-wider uppercase hidden sm:block ${isActive ? 'text-deep-cobalt' : 'text-on-surface-variant/60'}`}>
                    {s === 1 && t('stepService')}
                    {s === 2 && t('stepDateTime')}
                    {s === 3 && t('stepDetails')}
                    {s === 5 && t('stepDone')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white/40">
          {/* Step 1: Select Treatment */}
          {step === 1 && (
            <div className="space-y-6 fade-in-up">
              <h2 className="font-display text-2xl text-deep-cobalt text-center font-bold">
                {t('selectTreatment')}
              </h2>
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <h3 className="font-semibold text-xs tracking-wider text-on-surface-variant uppercase mb-2">
                    {t('ourTreatments')}
                  </h3>
                  {[
                    { id: 'Sclerotherapy', name: 'Sclerotherapy', nameEs: 'Escleroterapia', price: 300, desc: 'Gold standard injection' }
                  ].map((s) => (
                    <label key={s.id} className="block cursor-pointer">
                      <input 
                        type="radio" 
                        name="service"
                        checked={booking.service === s.id}
                        onChange={() => handleBookingChange('service', s.id, s.price)}
                        className="sr-only"
                      />
                      <div className={`p-4 border rounded-xl hover:border-champagne-gold transition-all flex items-center justify-between ${
                        booking.service === s.id ? 'border-champagne-gold bg-champagne-gold/5 shadow-sm' : 'border-outline-variant bg-white/70'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-xl ${booking.service === s.id ? 'text-champagne-gold' : 'text-on-surface-variant/70'}`}>
                            {s.id === 'Vascular Eval' ? 'stethoscope' : 'water_drop'}
                          </span>
                          <div>
                            <span className="font-semibold text-sm text-deep-cobalt block">
                              {language === 'es' ? s.nameEs : s.name}
                            </span>
                            <span className="text-xs text-on-surface-variant">{s.desc}</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-xs tracking-wider text-on-surface-variant uppercase mb-2">
                    {t('selectSpecialist')}
                  </h3>
                  {specialists.filter(s => s.status === 'Active').map((doc) => (
                    <label key={doc.id} className="block cursor-pointer">
                      <input 
                        type="radio" 
                        name="doctor"
                        checked={booking.doctor === doc.name}
                        onChange={() => handleBookingChange('doctor', doc.name)}
                        className="sr-only"
                      />
                      <div className={`p-4 border rounded-xl hover:border-champagne-gold transition-all flex items-center gap-4 ${
                        booking.doctor === doc.name ? 'border-champagne-gold bg-champagne-gold/5 shadow-sm' : 'border-outline-variant bg-white/70'
                      }`}>
                        <img src={doc.image} alt={doc.name} className="w-12 h-12 rounded-full object-cover border border-champagne-gold/30" />
                        <div>
                          <span className="font-semibold text-sm text-deep-cobalt block">{doc.name}</span>
                          <span className="text-xs text-on-surface-variant">
                            {language === 'es' ? doc.titleEs || doc.title : doc.title}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={nextStep} className="bg-champagne-gold text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-secondary transition-all shadow-md flex items-center gap-1 cursor-pointer">
                  {t('continue')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-6 fade-in-up">
              <h2 className="font-display text-2xl text-deep-cobalt text-center font-bold">{t('chooseDateTime')}</h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto bg-white p-6 rounded-2xl border border-champagne-gold/10">
                <div>
                  <label className="block font-semibold text-xs tracking-wider text-on-surface-variant uppercase mb-2">Select Date</label>
                  <input 
                    type="date"
                    min={todayStr}
                    value={booking.date}
                    onChange={(e) => handleBookingChange('date', e.target.value)}
                    className="w-full rounded-xl border border-outline-variant p-3 text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold bg-soft-ivory/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-xs tracking-wider text-on-surface-variant uppercase mb-2">Select Time</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleBookingChange('time', time)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          booking.time === time
                            ? 'bg-champagne-gold text-white border-champagne-gold shadow-sm'
                            : 'bg-white border-outline-variant hover:border-champagne-gold text-deep-cobalt hover:bg-champagne-gold/5'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-6 max-w-3xl mx-auto">
                <button onClick={prevStep} className="border border-deep-cobalt text-deep-cobalt px-6 py-3 rounded-full font-semibold text-sm hover:bg-surface-container transition-all cursor-pointer">{t('back')}</button>
                <button onClick={nextStep} className="bg-champagne-gold text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-secondary transition-all shadow-md flex items-center gap-1 cursor-pointer">
                  {t('continue')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Expanded Intake & Media Consent */}
          {step === 3 && (
            <div className="space-y-8 fade-in-up">
              <h2 className="font-display text-2xl text-deep-cobalt text-center font-bold">{t('patientInfo')}</h2>
              
              <div className="max-w-3xl mx-auto space-y-8 bg-white p-6 md:p-8 rounded-3xl border border-champagne-gold/10">
                {/* Section A: Contact Info */}
                <div className="space-y-4">
                  <h3 className="font-display text-base font-bold text-deep-cobalt border-b border-ice-blue pb-1">{t('language') === 'es' ? 'Datos Personales' : 'Personal Information'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('firstName')} *</label>
                      <input type="text" value={patient.firstName} onChange={(e) => handlePatientChange('firstName', e.target.value)} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                      {errors.firstName && <span className="text-xs text-error mt-0.5 block">{errors.firstName}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('lastName')} *</label>
                      <input type="text" value={patient.lastName} onChange={(e) => handlePatientChange('lastName', e.target.value)} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                      {errors.lastName && <span className="text-xs text-error mt-0.5 block">{errors.lastName}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('dob')} *</label>
                      <input type="date" value={patient.dob} max={todayStr} onChange={(e) => handlePatientChange('dob', e.target.value)} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                      {errors.dob && <span className="text-xs text-error mt-0.5 block">{errors.dob}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('gender')}</label>
                      <select value={patient.gender} onChange={(e) => handlePatientChange('gender', e.target.value)} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt">
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('email')} *</label>
                      <input type="email" value={patient.email} onChange={(e) => handlePatientChange('email', e.target.value)} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                      {errors.email && <span className="text-xs text-error mt-0.5 block">{errors.email}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('phoneLabel')} *</label>
                      <input type="text" value={patient.phone} onChange={(e) => handlePatientChange('phone', e.target.value)} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" placeholder="786-000-0000" />
                      {errors.phone && <span className="text-xs text-error mt-0.5 block">{errors.phone}</span>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('language') === 'es' ? 'Dirección' : 'Home Address'}</label>
                      <input type="text" value={patient.address} onChange={(e) => handlePatientChange('address', e.target.value)} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('emergContact')} (Name)</label>
                      <input type="text" value={patient.emergName} onChange={(e) => handlePatientChange('emergName', e.target.value)} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('emergContact')} (Phone)</label>
                      <input type="text" value={patient.emergPhone} onChange={(e) => handlePatientChange('emergPhone', e.target.value)} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                    </div>
                  </div>
                </div>

                {/* Section B: Medical History Safety Checklist */}
                <div className="space-y-4 pt-4 border-t border-dashed border-surface-dim">
                  <h3 className="font-display text-base font-bold text-deep-cobalt border-b border-ice-blue pb-1">{t('language') === 'es' ? 'Cuestionario de Salud' : 'Medical Safety Intake'}</h3>
                  <div className="space-y-4">
                    {/* Pregnancy */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-deep-cobalt">{t('pregnancyQuestion')}</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer">
                          <input type="radio" checked={patient.pregnancy === 'Yes'} onChange={() => handlePatientChange('pregnancy', 'Yes')} className="text-champagne-gold focus:ring-champagne-gold" /> {language === 'es' ? 'Sí' : 'Yes'}
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer">
                          <input type="radio" checked={patient.pregnancy === 'No'} onChange={() => handlePatientChange('pregnancy', 'No')} className="text-champagne-gold focus:ring-champagne-gold" /> No
                        </label>
                      </div>
                      {patient.pregnancy === 'Yes' && (
                        <div className="p-3 bg-error-container/60 border border-error/20 text-error rounded-xl text-xs font-semibold leading-relaxed">
                          ⚠️ {t('pregnancyAlert')}
                        </div>
                      )}
                    </div>

                    {/* Blood Clots */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-deep-cobalt">{t('clotsQuestion')}</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer">
                          <input type="radio" checked={patient.clotsHistory === 'Yes'} onChange={() => handlePatientChange('clotsHistory', 'Yes')} className="text-champagne-gold focus:ring-champagne-gold" /> {language === 'es' ? 'Sí' : 'Yes'}
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer">
                          <input type="radio" checked={patient.clotsHistory === 'No'} onChange={() => handlePatientChange('clotsHistory', 'No')} className="text-champagne-gold focus:ring-champagne-gold" /> No
                        </label>
                      </div>
                      {patient.clotsHistory === 'Yes' && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-xl text-xs font-semibold leading-relaxed">
                          ⚠️ {t('clotsAlert')}
                        </div>
                      )}
                    </div>

                    {/* Previous Treatments */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-deep-cobalt">{t('prevTreatmentsQuestion')}</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer">
                          <input type="radio" checked={patient.prevVeinTreatments === 'Yes'} onChange={() => handlePatientChange('prevVeinTreatments', 'Yes')} className="text-champagne-gold focus:ring-champagne-gold" /> {language === 'es' ? 'Sí' : 'Yes'}
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer">
                          <input type="radio" checked={patient.prevVeinTreatments === 'No'} onChange={() => handlePatientChange('prevVeinTreatments', 'No')} className="text-champagne-gold focus:ring-champagne-gold" /> No
                        </label>
                      </div>
                      {patient.prevVeinTreatments === 'Yes' && (
                        <input 
                          type="text"
                          value={patient.prevVeinTreatmentsDetail}
                          onChange={(e) => handlePatientChange('prevVeinTreatmentsDetail', e.target.value)}
                          placeholder={language === 'es' ? 'Por favor especifique tratamientos venosos previos' : 'Please specify previous vein treatments'}
                          className="w-full rounded-lg border-outline-variant text-xs mt-1"
                        />
                      )}
                    </div>

                    {/* Allergies Checklist */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-deep-cobalt">{t('allergiesQuestion')}</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer">
                          <input type="radio" checked={patient.allergiesHistory === 'Yes'} onChange={() => handlePatientChange('allergiesHistory', 'Yes')} className="text-champagne-gold focus:ring-champagne-gold" /> {language === 'es' ? 'Sí' : 'Yes'}
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer">
                          <input type="radio" checked={patient.allergiesHistory === 'No'} onChange={() => handlePatientChange('allergiesHistory', 'No')} className="text-champagne-gold focus:ring-champagne-gold" /> No
                        </label>
                      </div>
                      {patient.allergiesHistory === 'Yes' && (
                        <input 
                          type="text"
                          value={patient.allergiesHistoryDetail}
                          onChange={(e) => handlePatientChange('allergiesHistoryDetail', e.target.value)}
                          placeholder={language === 'es' ? 'Detalle alergias críticas' : 'Detail critical drug/latex allergies'}
                          className="w-full rounded-lg border-outline-variant text-xs mt-1"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Section C: Social Media & Photo Consent */}
                <div className="space-y-4 pt-4 border-t border-dashed border-surface-dim">
                  <h3 className="font-display text-base font-bold text-deep-cobalt border-b border-ice-blue pb-1">{t('socialMediaConsent')}</h3>
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {t('socialConsentText')}
                    </p>

                    {/* Easy select buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => handlePatientChange('socialMediaConsentLevel', 'level1')}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${patient.socialMediaConsentLevel === 'level1' ? 'bg-deep-cobalt text-white border-deep-cobalt' : 'bg-white text-deep-cobalt border-outline-variant hover:bg-soft-ivory/30'}`}
                      >
                        {language === 'es' ? 'Solo Clínico' : 'Clinical Only'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePatientChange('socialMediaConsentLevel', 'level1,level2')}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${patient.socialMediaConsentLevel === 'level1,level2' ? 'bg-deep-cobalt text-white border-deep-cobalt' : 'bg-white text-deep-cobalt border-outline-variant hover:bg-soft-ivory/30'}`}
                      >
                        {language === 'es' ? 'Clínico + Anónimo' : 'Clinical + Anonymous'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePatientChange('socialMediaConsentLevel', 'level1,level2,level3')}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${patient.socialMediaConsentLevel === 'level1,level2,level3' ? 'bg-deep-cobalt text-white border-deep-cobalt' : 'bg-white text-deep-cobalt border-outline-variant hover:bg-soft-ivory/30'}`}
                      >
                        {language === 'es' ? 'Marcar Todos' : 'Select All'}
                      </button>
                    </div>

                    {/* Usage levels selector */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {[
                        { level: 'level1', labelKey: 'useLevel1' },
                        { level: 'level2', labelKey: 'useLevel2' },
                        { level: 'level3', labelKey: 'useLevel3' }
                      ].map((lvl) => {
                        const isChecked = patient.socialMediaConsentLevel ? patient.socialMediaConsentLevel.split(',').includes(lvl.level) : false;
                        return (
                          <label key={lvl.level} className="flex items-start gap-2.5 text-xs text-on-surface cursor-pointer bg-soft-ivory/20 p-2.5 rounded-lg border border-surface-dim hover:border-champagne-gold/40">
                            <input 
                              type="checkbox" 
                              disabled={lvl.level === 'level1'} // Clinical tracking is mandatory
                              checked={isChecked || lvl.level === 'level1'}
                              onChange={() => {
                                const current = patient.socialMediaConsentLevel ? patient.socialMediaConsentLevel.split(',') : [];
                                let next;
                                if (current.includes(lvl.level)) {
                                  if (lvl.level === 'level1') return;
                                  next = current.filter(x => x !== lvl.level);
                                } else {
                                  next = [...current, lvl.level];
                                }
                                const sorted = [];
                                if (next.includes('level1') || lvl.level === 'level1') sorted.push('level1');
                                if (next.includes('level2')) sorted.push('level2');
                                if (next.includes('level3')) sorted.push('level3');
                                handlePatientChange('socialMediaConsentLevel', sorted.join(','));
                              }}
                              className="rounded text-champagne-gold focus:ring-champagne-gold mt-0.5 shrink-0" 
                            />
                            <span>{t(lvl.labelKey)}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Sign pad for social consent if marketing levels are checked */}
                    {patient.socialMediaConsentLevel && (patient.socialMediaConsentLevel.includes('level2') || patient.socialMediaConsentLevel.includes('level3')) && (
                      <div className="space-y-2 pt-2">
                        <label className="block text-xs font-bold text-deep-cobalt">{t('digitalConsent')} (Signature) *</label>
                        <BookingSignaturePad 
                          onSave={(base64) => handlePatientChange('socialMediaSignatureUrl', base64)}
                          onClear={() => handlePatientChange('socialMediaSignatureUrl', '')}
                        />
                        {errors.socialSignature && <span className="text-xs text-error mt-0.5 block">{errors.socialSignature}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 max-w-3xl mx-auto">
                <button onClick={prevStep} className="border border-deep-cobalt text-deep-cobalt px-6 py-3 rounded-full font-semibold text-sm hover:bg-surface-container transition-all cursor-pointer">{t('back')}</button>
                <button onClick={nextStep} className="bg-champagne-gold text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-secondary transition-all shadow-md flex items-center gap-1 cursor-pointer">
                  {t('continue')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Secure Payment */}
          {step === 4 && (
            <div className="space-y-6 fade-in-up">
              <h2 className="font-display text-2xl text-deep-cobalt text-center font-bold">{t('paymentMethod')}</h2>
              
              <div className="max-w-md mx-auto bg-white rounded-2xl border border-champagne-gold/15 p-6 shadow-md">
                <div className="bg-soft-ivory p-4 rounded-xl mb-6 border border-champagne-gold/10">
                  <div className="flex justify-between text-xs text-on-surface-variant font-bold uppercase mb-1">
                    <span>{t('stepService')}</span>
                    <span>{booking.service}</span>
                  </div>
                  <div className="flex justify-between text-xs text-on-surface-variant font-bold uppercase mb-3">
                    <span>{t('stepDateTime')}</span>
                    <span>{booking.date} @ {booking.time}</span>
                  </div>
                  <div className="border-t border-champagne-gold/15 pt-2 flex justify-between font-display text-sm font-bold text-deep-cobalt">
                    <span>{language === 'es' ? 'Depósito de Cita' : 'Intake Deposit'}</span>
                    <span>$50.00</span>
                  </div>
                </div>

                <form onSubmit={handleConfirm} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('cardNumber')}</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        placeholder="4111 2222 3333 4444"
                        value={payment.cardNumber}
                        onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                        className="w-full rounded-lg border-outline-variant text-sm text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold pl-10"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">credit_card</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('expiryDate')}</label>
                      <input 
                        type="text" 
                        required
                        placeholder="MM/YY"
                        value={payment.expiry}
                        onChange={(e) => handlePaymentChange('expiry', e.target.value)}
                        className="w-full rounded-lg border-outline-variant text-sm text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('cvv')}</label>
                      <input 
                        type="text" 
                        required
                        placeholder="123"
                        maxLength="4"
                        value={payment.cvv}
                        onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                        className="w-full rounded-lg border-outline-variant text-sm text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold text-center"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-deep-cobalt bg-champagne-gold/10 p-3 rounded-lg border border-champagne-gold/20 text-center font-medium mt-4">
                    <span className="material-symbols-outlined text-xs inline-block align-middle mr-1">info</span>
                    {language === 'es' 
                      ? 'Para pruebas usa: 4242 4242 4242 4242 | Exp: 12/28 | CVV: 123' 
                      : 'For testing use: 4242 4242 4242 4242 | Exp: 12/28 | CVV: 123'}
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-champagne-gold text-white py-3.5 rounded-xl font-bold text-sm hover:bg-secondary transition-all shadow-md flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">lock</span> {t('confirmBooking')}
                  </button>
                </form>
              </div>

              <div className="flex justify-start max-w-md mx-auto mt-6">
                <button onClick={prevStep} className="border border-deep-cobalt text-deep-cobalt px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-surface-container transition-all cursor-pointer">{t('back')}</button>
              </div>
            </div>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <div className="text-center space-y-6 max-w-lg mx-auto py-8 fade-in-up">
              <div className="w-20 h-20 rounded-full bg-champagne-gold/15 flex items-center justify-center mx-auto border-2 border-champagne-gold">
                <span className="material-symbols-outlined text-champagne-gold text-5xl font-light">verified</span>
              </div>
              <h2 className="font-display text-3xl text-deep-cobalt font-bold">{t('bookingSuccess')}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t('bookingSuccessDesc')}</p>
              
              <div className="bg-white p-6 rounded-2xl border border-champagne-gold/10 text-left space-y-3">
                <h3 className="font-display text-base text-deep-cobalt font-semibold border-b border-surface-dim pb-2 mb-2 uppercase tracking-wide">{t('appDetails')}</h3>
                <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                  <span>{t('language') === 'es' ? 'Código de Confirmación' : 'Confirmation Code'}</span>
                  <span className="font-bold text-deep-cobalt">{confirmationCode}</span>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                  <span>{t('stepService')}</span>
                  <span className="font-bold text-deep-cobalt">{booking.service}</span>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                  <span>{t('stepDateTime')}</span>
                  <span className="font-bold text-deep-cobalt">{booking.date} @ {booking.time}</span>
                </div>
              </div>

              <div className="pt-6">
                <button onClick={onClose} className="bg-deep-cobalt text-white px-8 py-3 rounded-full font-semibold text-sm hover:brightness-110 transition-all shadow-md cursor-pointer">{t('close')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
