import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Navigation
    services: 'Services',
    beforeAfter: 'Before & After',
    pricing: 'Pricing',
    faq: 'FAQ',
    contact: 'Contact',
    adminPortal: 'Clinical Portal',
    bookAppointment: 'Book Appointment',
    cancelBooking: 'Cancel Booking',
    menu: 'Menu',

    // Hero
    premiumCare: 'Premium Vascular Care',
    heroTitle: 'Healthy legs. Beautiful confidence.',
    heroSubtitle: 'Experience specialized vein treatments in a luxury setting. We combine medical precision with aesthetic refinement for results you can feel and see.',
    bookConsultation: 'Book Free Consultation',
    ourServices: 'Our Services',

    // Services
    ourTreatments: 'Our Specialized Treatments',
    sclerotherapyDesc: 'Gold standard treatment for eliminating spider and small varicose veins safely.',
    spiderVeinDesc: 'Targeted aesthetic treatment to clear superficial red and blue webs.',
    reticularDesc: 'Advanced care for deeper, blue or green feeder veins below the surface.',
    evalDesc: 'Comprehensive diagnostic assessment to create your personalized plan.',
    duration: 'Duration',
    recovery: 'Recovery',
    noDowntime: 'NO DOWNTIME',
    immediateReturn: 'IMMEDIATE RETURN',
    mildCompression: 'MILD COMPRESSION',
    initialConsult: 'INITIAL CONSULT',

    // Before/After
    resultsTitle: 'Visible Results',
    resultsSubtitle: 'Real clinical cases of our aesthetic sclerotherapy treatments.',
    disclaimer: 'Real patient results. Individual outcomes may vary. Photo consent obtained.',
    before: 'Before',
    after: 'After',
    case: 'Case',

    // Why Choose Us
    whyUsTitle: 'Why Choose Us?',
    whyUsSafe: 'Safe, minimally invasive procedures',
    whyUsCare: 'Personalized, compassionate care',
    whyUsExperts: 'Performed by certified vascular specialists',
    whyUsBeauty: 'Improve appearance and health of legs',

    // Pricing
    pricingTitle: 'Our Pricing & Packages',
    pricingSubtitle: 'Transparent pricing for personalized vascular beauty.',
    perSession: 'Per session',
    saveResults: 'Save and see results',
    smallArea: 'Small Area',
    oneLeg: '1 Leg',
    twoLegs: '2 Legs',
    threeSessions: '3 Sessions Package',
    fourSessions: '4 Sessions Package',

    // FAQs
    faqTitle: 'Frequently Asked Questions',
    faqQ1: 'What is Sclerotherapy?',
    faqA1: 'Sclerotherapy is a minimally invasive medical procedure used to treat spider veins and varicose veins. A specialized solution (sclerosant) is injected directly into the veins, causing them to shrink, collapse, and eventually be absorbed by the body.',
    faqQ2: 'Does it hurt?',
    faqA2: 'Most patients experience minimal discomfort, often described as a mild pinch or stinging sensation at the injection site. We use extremely fine needles and technique to maximize comfort.',
    faqQ3: 'How many sessions will I need?',
    faqA3: 'This depends on the extent of the veins. Typically, 2 to 4 sessions are recommended for optimal aesthetic results. A personalized evaluation will determine your exact plan.',
    faqQ4: 'What is the post-care recovery?',
    faqA4: 'There is virtually no downtime. You can return to normal daily activities immediately. Walking is encouraged, but we recommend avoiding strenuous exercise, hot tubs, and direct sun exposure on the treated area for a few days. Wear compression stockings if prescribed.',

    // Contact
    contactTitle: 'Contact Us',
    phone: 'Phone',
    address: 'Serving Miami-Dade & South Florida',
    wellbeingPriority: 'Your well-being is our priority.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    hipaa: 'HIPAA Compliant',

    // Booking Wizard
    bookTitle: 'Schedule Your Consultation',
    stepService: 'Service',
    stepDateTime: 'Date & Time',
    stepDetails: 'Details',
    stepPayment: 'Payment',
    stepDone: 'Done',
    selectTreatment: 'Select Treatment',
    selectSpecialist: 'Select Specialist',
    continue: 'Continue',
    back: 'Back',
    chooseDateTime: 'Choose Date & Time',
    patientInfo: 'Patient Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phoneLabel: 'Phone Number',
    dob: 'Date of Birth',
    concerns: 'Medical/Vascular Concerns',
    allergies: 'Known Allergies (if any)',
    paymentMethod: 'Secure Payment (Deposit $50 to secure booking)',
    cardNumber: 'Card Number',
    expiryDate: 'Expiry Date',
    cvv: 'CVV',
    confirmBooking: 'Confirm & Secure Booking',
    bookingSuccess: 'Booking Confirmed!',
    bookingSuccessDesc: 'Thank you for choosing VenaComfort. Your appointment has been scheduled and added to our system. A confirmation email has been sent to you.',
    appDetails: 'Appointment Details',
    close: 'Close',

    // Portal Admin
    clinicalPortal: 'Clinical & Admin Dashboard',
    todaysAppointments: "Today's Appointments",
    totalRevenue: 'Total Revenue',
    newPatientsWeekly: 'New Patients (Weekly)',
    searchPatients: 'Search patients...',
    clinicalNotesSOAP: 'Clinical Notes (SOAP)',
    subjective: 'Subjective (Symptoms, complaints)',
    objective: 'Objective (Treatment Details)',
    assessment: 'Assessment (Clinical diagnosis)',
    plan: 'Plan (Follow-up, compression, post-care)',
    medication: 'Medication / Sclerosant',
    volume: 'Volume (ml)',
    addObjectivePlaceholder: 'Identify injection sites, vein types treated, or injection parameters...',
    digitalConsent: 'Informed Consent for Treatment',
    consentAgreement: 'I hereby consent to undergo Sclerotherapy treatment for cosmetic veins. I understand the procedure, potential side effects, and agree to follow all post-treatment care instructions.',
    signHere: 'Sign Here',
    clearSignature: 'Clear Signature',
    saveRecord: 'Save Medical Record',
    cancel: 'Cancel',
    dobLabel: 'DOB',
    idLabel: 'Patient ID',
    noPatientSelected: 'Select a patient from the registry to view their clinical history and manage records.',
    newPatient: 'New Patient Record',
    patientFile: 'Patient Clinical File',
    gender: 'Gender',
    history: 'Appointments & History',
    unsigned: 'Consent Unsigned',
    signed: 'Consent Signed',

    // New Clinical Forms & Security Translations
    pregnancyQuestion: 'Are you currently pregnant or breastfeeding?',
    clotsQuestion: 'Do you have a personal history of blood clots or Deep Vein Thrombosis (DVT)?',
    prevTreatmentsQuestion: 'Have you had previous vein treatments (surgery, laser, injections)?',
    allergiesQuestion: 'Do you have allergies to sclerosants, tape, latex, or anesthetics?',
    pregnancyAlert: 'WARNING: Sclerotherapy is strictly contraindicated during pregnancy or breastfeeding.',
    clotsAlert: 'ALERT: A history of blood clots represents a high risk. Duplex Doppler imaging is required before treatment.',
    socialMediaConsent: 'Social Media & Photo Consent',
    socialConsentText: 'I consent to clinical photographs/videos being taken of my legs for tracking and documentation. I select my preference for how these photos can be used:',
    useLevel1: 'Clinical Use Only: Internal medical record tracking by my physician.',
    useLevel2: 'Anonymous Marketing: Allowed on social media and website, ensuring my face and identifying marks are completely hidden.',
    useLevel3: 'Full Public Use: Allowed for marketing, social media, and medical educational presentations.',
    sclerotherapyConsentText: 'I hereby consent to undergo Sclerotherapy treatment. I understand that a chemical solution (sclerosant) will be injected into my spider or varicose veins to collapse them. I have been informed of potential side effects, including temporary bruising, hyperpigmentation (brown staining), skin ulceration (rare), and deep vein thrombosis. I agree to follow post-treatment rules: wear compression stockings for 3-5 days, walk 20-30 minutes daily, and strictly avoid direct sun/UV exposure to the treated legs for 4-6 weeks to minimize staining.',
    hipaaConsentText: 'I authorize VenaComfort Vein Studio to handle my Protected Health Information (PHI) securely. I understand my records are confidential under HIPAA guidelines, and will only be shared for treatment billing, operations, or as selected in the Media Consent.',
    loginTitle: 'Portal Administration Access',
    username: 'Username / Email',
    password: 'Password',
    loginButton: 'Secure Login',
    invalidCredentials: 'Invalid username or password. Please try again.',
    uploadPhoto: 'Upload Evolution Photo',
    photoLabel: 'Photo Label / Session',
    beforeTreatment: 'Before Treatment',
    afterSession1: 'Post Session 1',
    afterSession2: 'Post Session 2',
    followUp: 'Follow Up',
    selectPhotoCompare: 'Select two photos to compare',
    comparePhotos: 'Compare Progress',
    exportPdfReport: 'Export Signed PDF Report',
    medicalHistoryTitle: 'Patient Medical Intake & History',
    prevTreatmentsLabel: 'Previous Vein Treatments',
    emergContact: 'Emergency Contact',
    selectImage: 'Select Local Image',
    procedureNoteSpecific: 'Procedure Note',
    veinLocation: 'Target Veins & Body Location',
    compressionPlaced: 'Compression Stockings Placed?'
  },
  es: {
    // Navigation
    services: 'Servicios',
    beforeAfter: 'Antes y Después',
    pricing: 'Precios',
    faq: 'FAQ',
    contact: 'Contacto',
    adminPortal: 'Portal Clínico',
    bookAppointment: 'Agendar Cita',
    cancelBooking: 'Cancelar Reserva',
    menu: 'Menú',

    // Hero
    premiumCare: 'Cuidado Vascular Premium',
    heroTitle: 'Resultados visibles. Piernas más saludables y confiadas.',
    heroSubtitle: 'Experimente tratamientos especializados de venas en un entorno de lujo. Combinamos precisión médica con refinamiento estético para obtener resultados que puede sentir y ver.',
    bookConsultation: 'Agendar Consulta Gratis',
    ourServices: 'Nuestros Servicios',

    // Services
    ourTreatments: 'Nuestros Tratamientos Especializados',
    sclerotherapyDesc: 'Tratamiento estándar de oro para eliminar arañas vasculares y pequeñas várices de forma segura.',
    spiderVeinDesc: 'Tratamiento estético localizado para eliminar redes rojas y azules superficiales.',
    reticularDesc: 'Cuidado avanzado para venas alimentadoras azules o verdes más profundas bajo la superficie.',
    evalDesc: 'Evaluación diagnóstica integral para diseñar su plan de tratamiento personalizado.',
    duration: 'Duración',
    recovery: 'Recuperación',
    noDowntime: 'SIN TIEMPO DE INACTIVIDAD',
    immediateReturn: 'RETORNO INMEDIATO',
    mildCompression: 'COMPRESIÓN SUAVE',
    initialConsult: 'CONSULTA INICIAL',

    // Before/After
    resultsTitle: 'Resultados Visibles',
    resultsSubtitle: 'Casos clínicos reales de nuestros tratamientos de escleroterapia estética.',
    disclaimer: 'Resultados reales de pacientes. Los resultados individuales pueden variar. Se cuenta con autorización firmada.',
    before: 'Antes',
    after: 'Después',
    case: 'Caso',

    // Why Choose Us
    whyUsTitle: '¿Por qué elegirnos?',
    whyUsSafe: 'Procedimientos seguros y mínimamente invasivos',
    whyUsCare: 'Atención personalizada y compasiva',
    whyUsExperts: 'Realizado por especialistas vasculares certificados',
    whyUsBeauty: 'Mejora la apariencia y salud de tus piernas',

    // Pricing
    pricingTitle: 'Nuestras Tarifas y Paquetes',
    pricingSubtitle: 'Precios transparentes para una belleza vascular personalizada.',
    perSession: 'Por sesión',
    saveResults: 'Ahorra y luce resultados',
    smallArea: 'Área Pequeña',
    oneLeg: '1 Pierna',
    twoLegs: '2 Piernas',
    threeSessions: 'Paquete de 3 Sesiones',
    fourSessions: 'Paquete de 4 Sesiones',

    // FAQs
    faqTitle: 'Preguntas Frecuentes',
    faqQ1: '¿Qué es la Escleroterapia?',
    faqA1: 'La escleroterapia es un procedimiento médico mínimamente invasivo que se utiliza para tratar las arañas vasculares y las várices. Se inyecta una solución especializada (esclerosante) directamente en las venas afectadas, lo que hace que se encojan, se colapsen y finalmente sean reabsorbidas por el cuerpo.',
    faqQ2: '¿El tratamiento es doloroso?',
    faqA2: 'La mayoría de los pacientes experimentan una molestia mínima, a menudo descrita como un leve pinchazo o sensación de ardor en el sitio de la inyección. Utilizamos agujas extremadamente finas y técnicas avanzadas para maximizar el confort.',
    faqQ3: '¿Cuántas sesiones necesitaré?',
    faqA3: 'Esto depende de la extensión y cantidad de las venas. Generalmente se recomiendan de 2 a 4 sesiones para obtener resultados estéticos óptimos. Una evaluación personalizada determinará su plan exacto.',
    faqQ4: '¿Cómo es la recuperación posterior?',
    faqA4: 'Prácticamente no hay tiempo de inactividad. Puede volver a sus actividades diarias normales inmediatamente. Se recomienda caminar, pero sugerimos evitar el ejercicio extenuante, los jacuzzis y la exposición solar directa sobre el área tratada durante unos días. Use medias de compresión si se le recetan.',

    // Contact
    contactTitle: 'Contáctenos',
    phone: 'Teléfono',
    address: 'Sirviendo a Miami-Dade y el sur de Florida',
    wellbeingPriority: 'Tu bienestar es nuestra prioridad.',
    privacyPolicy: 'Política de Privacidad',
    termsOfService: 'Términos de Servicio',
    hipaa: 'Cumplimiento HIPAA',

    // Booking Wizard
    bookTitle: 'Programe su Consulta',
    stepService: 'Servicio',
    stepDateTime: 'Fecha y Hora',
    stepDetails: 'Datos',
    stepPayment: 'Pago',
    stepDone: 'Listo',
    selectTreatment: 'Seleccione Tratamiento',
    selectSpecialist: 'Seleccione Especialista',
    continue: 'Continuar',
    back: 'Atrás',
    chooseDateTime: 'Seleccione Fecha y Hora',
    patientInfo: 'Información del Paciente',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo Electrónico',
    phoneLabel: 'Teléfono',
    dob: 'Fecha de Nacimiento',
    concerns: 'Síntomas / Preocupaciones Vasculares',
    allergies: 'Alergias conocidas (si aplica)',
    paymentMethod: 'Pago Seguro (Depósito de $50 para asegurar cita)',
    cardNumber: 'Número de Tarjeta',
    expiryDate: 'Fecha de Expiración',
    cvv: 'CVV',
    confirmBooking: 'Confirmar y Asegurar Cita',
    bookingSuccess: '¡Cita Confirmada!',
    bookingSuccessDesc: 'Gracias por elegir VenaComfort. Su cita ha sido agendada e incorporada a nuestro sistema de agenda. Se le ha enviado un correo electrónico de confirmación.',
    appDetails: 'Detalles de la Cita',
    close: 'Cerrar',

    // Portal Admin
    clinicalPortal: 'Panel Clínico y Administrativo',
    todaysAppointments: 'Citas de Hoy',
    totalRevenue: 'Ingresos Totales',
    newPatientsWeekly: 'Nuevos Pacientes (Semanal)',
    searchPatients: 'Buscar pacientes...',
    clinicalNotesSOAP: 'Notas Clínicas (SOAP)',
    subjective: 'Subjetivo (Síntomas, quejas)',
    objective: 'Objetivo (Detalles del tratamiento)',
    assessment: 'Evaluación (Diagnóstico clínico)',
    plan: 'Plan (Seguimiento, compresión, cuidados)',
    medication: 'Esclerosante / Concentración',
    volume: 'Volumen (ml)',
    addObjectivePlaceholder: 'Identificar sitios de inyección, venas tratadas o parámetros técnicos...',
    digitalConsent: 'Consentimiento Informado para Tratamiento',
    consentAgreement: 'Por la presente doy mi consentimiento para someterme al tratamiento de Escleroterapia para venas estéticas. Entiendo el procedimiento, los efectos secundarios potenciales y acepto seguir las pautas de cuidado post-tratamiento.',
    signHere: 'Firme Aquí',
    clearSignature: 'Limpiar Firma',
    saveRecord: 'Guardar Expediente Médico',
    cancel: 'Cancelar',
    dobLabel: 'F. Nac.',
    idLabel: 'ID Paciente',
    noPatientSelected: 'Seleccione un paciente del registro lateral para ver su historial clínico y administrar su expediente.',
    newPatient: 'Nuevo Registro de Paciente',
    patientFile: 'Expediente Clínico del Paciente',
    gender: 'Género',
    history: 'Citas e Historial',
    unsigned: 'Consentimiento Pendiente',
    signed: 'Consentimiento Firmado',

    // New Clinical Forms & Security Translations
    pregnancyQuestion: '¿Está actualmente embarazada o en período de lactancia?',
    clotsQuestion: '¿Tiene antecedentes personales de coágulos sanguíneos o Trombosis Venosa Profunda (TVP)?',
    prevTreatmentsQuestion: '¿Ha recibido tratamientos previos en las venas (cirugía, láser, escleroterapia)?',
    allergiesQuestion: '¿Tiene alergias a esclerosantes, cinta adhesiva, látex o anestésicos?',
    pregnancyAlert: 'ADVERTENCIA: La escleroterapia está estrictamente contraindicada durante el embarazo o la lactancia.',
    clotsAlert: 'ALERTA: El historial de coágulos sanguíneos representa un riesgo alto. Se requiere un Doppler venoso antes del tratamiento.',
    socialMediaConsent: 'Consentimiento de Redes Sociales y Fotos',
    socialConsentText: 'Doy mi consentimiento para la toma de fotografías/videos clínicos de mis piernas para seguimiento médico y documentación. Selecciono mi preferencia de uso:',
    useLevel1: 'Solo Uso Clínico: Seguimiento interno y confidencial en mi expediente médico.',
    useLevel2: 'Marketing Anónimo: Autorizado en redes sociales y sitio web, asegurando ocultar mi rostro y marcas corporales distintivas.',
    useLevel3: 'Uso Público Completo: Autorizado para marketing, redes sociales y presentaciones educativas médicas.',
    sclerotherapyConsentText: 'Por la presente doy mi consentimiento para someterme al tratamiento de Escleroterapia. Entiendo que se inyectará una solución química (esclerosante) en mis arañas vasculares o várices para colapsarlas. Se me ha informado de los efectos secundarios potenciales, que incluyen hematomas temporales, hiperpigmentación (manchas marrones), ulceración cutánea (poco común) y trombosis venosa profunda. Acepto seguir las pautas post-tratamiento: usar medias de compresión de 3 a 5 días, caminar de 20 a 30 minutos diarios y evitar estrictamente la exposición solar directa en las piernas tratadas durante 4 a 6 semanas para minimizar manchas.',
    hipaaConsentText: 'Autorizo a VenaComfort Vein Studio a manejar mi Información de Salud Protegida (PHI) de forma segura. Entiendo que mis registros son confidenciales según HIPAA y solo se compartirán para facturación de tratamientos, operaciones o según lo seleccionado en el Consentimiento de Medios.',
    loginTitle: 'Acceso de Administración del Portal',
    username: 'Usuario / Correo Electrónico',
    password: 'Contraseña',
    loginButton: 'Iniciar Sesión Seguro',
    invalidCredentials: 'Usuario o contraseña inválidos. Por favor intente de nuevo.',
    uploadPhoto: 'Subir Foto de Evolución',
    photoLabel: 'Etiqueta de Foto / Sesión',
    beforeTreatment: 'Antes del Tratamiento',
    afterSession1: 'Post Sesión 1',
    afterSession2: 'Post Sesión 2',
    followUp: 'Seguimiento',
    selectPhotoCompare: 'Seleccione dos fotos para comparar',
    comparePhotos: 'Comparar Evolución',
    exportPdfReport: 'Exportar Reporte PDF Firmado',
    medicalHistoryTitle: 'Admisión Médica e Historial del Paciente',
    prevTreatmentsLabel: 'Tratamientos Venosos Anteriores',
    emergContact: 'Contacto de Emergencia',
    selectImage: 'Seleccionar Imagen Local',
    procedureNoteSpecific: 'Nota de Procedimiento',
    veinLocation: 'Venas Tratadas y Localización Corporal',
    compressionPlaced: '¿Se colocaron medias de compresión?'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('venacomfort_lang');
    return saved === 'es' ? 'es' : 'en';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'en' ? 'es' : 'en';
      localStorage.setItem('venacomfort_lang', next);
      return next;
    });
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    if (language === 'es') {
      document.documentElement.classList.add('is-spanish');
      document.documentElement.lang = 'es';
    } else {
      document.documentElement.classList.remove('is-spanish');
      document.documentElement.lang = 'en';
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
