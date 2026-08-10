import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

// Custom Canvas Signature Pad Component
function ClinicalSignaturePad({ onSave, onClear, initialSignature }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    if (initialSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0A2540';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }, [initialSignature]);

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
    if (initialSignature) return;
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || initialSignature) return;
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
    if (initialSignature) return;
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
    <div className="space-y-2">
      {initialSignature ? (
        <div className="border border-outline-variant bg-white rounded-lg p-2 h-28 flex items-center justify-center relative shadow-inner">
          <img src={initialSignature} alt="Signature" className="max-h-full object-contain" />
          <span className="absolute bottom-2 right-2 text-[9px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {t('signed')}
          </span>
        </div>
      ) : (
        <div className="border border-outline-variant bg-white rounded-lg p-2">
          <canvas
            ref={canvasRef}
            width={500}
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
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-on-surface-variant font-medium">
              {t('language') === 'es' ? 'Firme dentro del cuadro' : 'Sign inside the box'}
            </span>
            <button
              type="button"
              onClick={clear}
              className="text-xs text-on-surface-variant hover:text-deep-cobalt underline font-bold cursor-pointer"
            >
              {t('clearSignature')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPortal() {
  const { t, language } = useLanguage();
  const { 
    patients, 
    appointments, 
    saveSoapNote, 
    updateSoapNote,
    saveConsentSignature, 
    saveSocialMediaConsent, 
    uploadPatientPhoto, 
    addPatient,
    updatePatient,
    addAppointment
  } = useData();

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('venacomfort_auth') === 'true';
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(false);

  // Layout navigation states
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('intake'); // 'intake', 'soap', 'consents', 'photos', 'export'
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // Editing state for patient details
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editPatientData, setEditPatientData] = useState(null);

  // SOAP Note editing state
  const [editingSoapNoteId, setEditingSoapNoteId] = useState(null);

  // Admin Photo consent level select state
  const [adminSocialConsentLevel, setAdminSocialConsentLevel] = useState('level1');

  // New follow-up appointment state
  const [newAppointmentData, setNewAppointmentData] = useState({
    service: 'Sclerotherapy',
    doctor: 'Dr. Elena Rodriguez',
    price: 300,
    date: '',
    time: ''
  });

  // SOAP notes form state (dynamic dependent on service type)
  const [selectedProcedureType, setSelectedProcedureType] = useState('Sclerotherapy');
  const [soap, setSoap] = useState({
    subjective: '',
    objectiveMedication: 'Polidocanol 0.5%',
    objectiveVolume: '2.0',
    objectiveNotes: '',
    veinLocation: '',
    compressionPlaced: 'Yes',
    
    // Evaluation Specifics
    ceapClass: 'C1',
    refluxGSV: false,
    refluxSSV: false,
    refluxPerforator: false,
    
    // Laser/Spider specific
    laserSettings: '',
    bodyAreaTreated: 'Calves',
    
    assessment: '',
    plan: ''
  });

  // Photo Evolution system state
  const [newPhotoLabel, setNewPhotoLabel] = useState('Before Treatment');
  const [selectedPhotosToCompare, setSelectedPhotosToCompare] = useState([]);
  const [compareMode, setCompareMode] = useState(false);

  // Signatures
  const [sclerotherapySignature, setSclerotherapySignature] = useState('');

  // New patient state
  const [newPatientData, setNewPatientData] = useState({
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
    pregnancy: 'No',
    clotsHistory: 'No',
    prevVeinTreatments: 'No',
    prevVeinTreatmentsDetail: '',
    allergiesHistory: 'No',
    allergiesHistoryDetail: ''
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Sync states on patient change
  useEffect(() => {
    if (selectedPatient) {
      setSoap({
        subjective: '',
        objectiveMedication: 'Polidocanol 0.5%',
        objectiveVolume: '2.0',
        objectiveNotes: '',
        veinLocation: '',
        compressionPlaced: 'Yes',
        ceapClass: 'C1',
        refluxGSV: false,
        refluxSSV: false,
        refluxPerforator: false,
        laserSettings: '',
        bodyAreaTreated: 'Calves',
        assessment: '',
        plan: ''
      });
      setSclerotherapySignature('');
      setSelectedPhotosToCompare([]);
      setCompareMode(false);
      setIsEditingPatient(false);
      setEditPatientData({ ...selectedPatient });
      setEditingSoapNoteId(null);
      setAdminSocialConsentLevel(selectedPatient.socialMediaConsentLevel || 'level1');
    }
  }, [selectedPatientId]);

  // Auth Handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin@venacomfort.com' && loginForm.password === 'ComfortVeins2026!') {
      setIsAuthenticated(true);
      sessionStorage.setItem('venacomfort_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('venacomfort_auth');
  };

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate metrics
  const totalRevenue = appointments.reduce((acc, curr) => acc + curr.price, 0);
  const todaysAppointmentsCount = appointments.filter(app => {
    return app.date === '2026-08-09' || app.date === new Date().toISOString().split('T')[0];
  }).length;

  // Handlers for SOAP & Consents
  const handleSaveRecord = (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    // Inject procedure notes depending on service
    let procedureNote = '';
    if (selectedProcedureType === 'Sclerotherapy') {
      procedureNote = `Sclerotherapy Note: Sclerosant: ${soap.objectiveMedication}, Volume: ${soap.objectiveVolume}ml, Target location: ${soap.veinLocation}, Compression: ${soap.compressionPlaced}.`;
    } else if (selectedProcedureType === 'Vascular Eval') {
      procedureNote = `Vascular Evaluation Note: CEAP: ${soap.ceapClass}, Reflux checks: GSV: ${soap.refluxGSV ? 'Yes' : 'No'}, SSV: ${soap.refluxSSV ? 'Yes' : 'No'}, Perforators: ${soap.refluxPerforator ? 'Yes' : 'No'}.`;
    } else {
      procedureNote = `Spider Vein Note: Laser Settings: ${soap.laserSettings}, Areas: ${soap.bodyAreaTreated}.`;
    }

    const notePayload = {
      ...soap,
      procedureType: selectedProcedureType,
      objectiveNotes: `${procedureNote} ${soap.objectiveNotes}`
    };

    if (editingSoapNoteId) {
      updateSoapNote(selectedPatientId, editingSoapNoteId, notePayload);
      setEditingSoapNoteId(null);
    } else {
      saveSoapNote(selectedPatientId, notePayload);
    }

    // Save procedure consent signature if signed
    if (sclerotherapySignature && !selectedPatient.consentSigned) {
      saveConsentSignature(selectedPatientId, sclerotherapySignature);
    }

    alert(language === 'es' ? 'Expediente actualizado correctamente.' : 'Medical record updated successfully.');
    
    // Reset
    setSoap({
      subjective: '',
      objectiveMedication: 'Polidocanol 0.5%',
      objectiveVolume: '2.0',
      objectiveNotes: '',
      veinLocation: '',
      compressionPlaced: 'Yes',
      ceapClass: 'C1',
      refluxGSV: false,
      refluxSSV: false,
      refluxPerforator: false,
      laserSettings: '',
      bodyAreaTreated: 'Calves',
      assessment: '',
      plan: ''
    });
    setSclerotherapySignature('');
    setActiveTab('intake');
  };

  const handleCreatePatient = (e) => {
    e.preventDefault();
    const created = addPatient(newPatientData);
    setSelectedPatientId(created.id);
    setShowNewPatientModal(false);
    setNewPatientData({
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
      pregnancy: 'No',
      clotsHistory: 'No',
      prevVeinTreatments: 'No',
      prevVeinTreatmentsDetail: '',
      allergiesHistory: 'No',
      allergiesHistoryDetail: ''
    });
  };

  // Update Patient Submission
  const handleUpdatePatientSubmit = (e) => {
    e.preventDefault();
    updatePatient(selectedPatientId, editPatientData);
    setIsEditingPatient(false);
  };

  // Book Follow-up Appointment Submission
  const handleBookFollowUp = (e) => {
    e.preventDefault();
    if (!newAppointmentData.date || !newAppointmentData.time) {
      alert(language === 'es' ? 'Por favor seleccione fecha y hora.' : 'Please select date and time.');
      return;
    }
    
    // Set pricing based on service type
    let price = 300;
    if (newAppointmentData.service === 'Spider Vein') price = 250;
    if (newAppointmentData.service === 'Reticular Veins') price = 500;
    if (newAppointmentData.service === 'Vascular Eval') price = 100;

    addAppointment(selectedPatient, {
      ...newAppointmentData,
      price
    });

    alert(language === 'es' ? 'Cita de seguimiento agendada con éxito.' : 'Follow-up appointment successfully scheduled.');
    setNewAppointmentData({
      service: 'Sclerotherapy',
      doctor: 'Dr. Elena Rodriguez',
      price: 300,
      date: '',
      time: ''
    });
  };

  // Upload Photo Sequence with Canvas Compression
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to highly-compressed jpeg (~50-80KB vs 3-5MB raw)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        uploadPatientPhoto(selectedPatientId, compressedBase64, newPhotoLabel);
        alert(language === 'es' ? 'Fotografía comprimida e incorporada con éxito.' : 'Photo compressed and successfully added.');
      };
    };
    reader.readAsDataURL(file);
  };

  const toggleSelectPhotoForCompare = (photoId) => {
    setSelectedPhotosToCompare(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      }
      if (prev.length >= 2) {
        return [prev[1], photoId]; // Keep max 2
      }
      return [...prev, photoId];
    });
  };

  // PDF Generation with html2pdf
  const exportPDF = () => {
    const element = document.getElementById('printable-report-area');
    if (!element) return;

    // Show temporary print container
    element.classList.remove('hidden');

    const opt = {
      margin:       10,
      filename:     `VenaComfort_Report_${selectedPatient.firstName}_${selectedPatient.lastName}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
      // Hide back print container
      element.classList.add('hidden');
    });
  };

  // LOGIN SCREEN RENDER
  if (!isAuthenticated) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-soft-ivory p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-champagne-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-20%] w-96 h-96 bg-primary-container/5 rounded-full blur-3xl" />

        <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl bg-white border border-champagne-gold/15 relative z-10 text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <img src="/logo.png" alt="VenaComfort Logo" className="h-10 w-10 object-contain" />
            <span className="font-display text-2xl font-bold text-deep-cobalt">VenaComfort</span>
          </div>

          <h3 className="font-display text-lg text-deep-cobalt font-semibold mb-6">{t('loginTitle')}</h3>

          {loginError && (
            <div className="p-3 bg-error-container/60 border border-error/25 text-error rounded-xl text-xs font-semibold mb-4">
              {t('invalidCredentials')}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('username')}</label>
              <input
                type="email"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="admin@venacomfort.com"
                className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('password')}</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-champagne-gold text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md cursor-pointer mt-6"
            >
              {t('loginButton')}
            </button>
          </form>

          <p className="text-[10px] text-on-surface-variant/60 mt-8 leading-relaxed">
            HIPAA Privacy Protected. Access is logged. Unauthorized connection attempts are reported.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Admin Top Header */}
      <header className="bg-white/80 backdrop-blur-xl h-20 flex items-center justify-between px-margin-mobile md:px-margin-desktop bg-white border-b border-champagne-gold/10 shrink-0 z-30">
        <div className="flex items-center gap-4 text-primary">
          <span className="material-symbols-outlined text-3xl font-light">local_hospital</span>
          <h2 className="font-display text-xl font-bold">{t('clinicalPortal')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewPatientModal(true)}
            className="bg-champagne-gold text-white font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-lg hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            {t('newPatient')}
          </button>
          <button 
            onClick={handleLogout}
            className="border border-outline-variant text-on-surface-variant hover:text-error hover:border-error px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main clinical canvas */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8">
        
        {/* KPI stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center h-36 relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <span className="material-symbols-outlined text-champagne-gold text-3xl mb-1.5 font-light">calendar_month</span>
            <h3 className="font-semibold text-xs tracking-wider text-on-surface-variant uppercase mb-0.5">{t('todaysAppointments')}</h3>
            <p className="font-display text-2xl text-deep-cobalt font-bold">{todaysAppointmentsCount}</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center h-36 relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <span className="material-symbols-outlined text-champagne-gold text-3xl mb-1.5 font-light">monetization_on</span>
            <h3 className="font-semibold text-xs tracking-wider text-on-surface-variant uppercase mb-0.5">{t('totalRevenue')}</h3>
            <p className="font-display text-2xl text-deep-cobalt font-bold">${totalRevenue}</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl shadow-sm h-36 flex flex-col justify-between">
            <h3 className="font-semibold text-xs tracking-wider text-on-surface-variant uppercase">{t('newPatientsWeekly')}</h3>
            <div className="flex-1 flex items-end gap-3 px-2 mt-2">
              <div className="w-1/6 bg-deep-cobalt/25 h-1/4 rounded-t-sm"></div>
              <div className="w-1/6 bg-deep-cobalt/40 h-2/4 rounded-t-sm"></div>
              <div className="w-1/6 bg-deep-cobalt/55 h-1/3 rounded-t-sm"></div>
              <div className="w-1/6 bg-deep-cobalt/70 h-3/4 rounded-t-sm"></div>
              <div className="w-1/6 bg-deep-cobalt h-[90%] rounded-t-sm relative">
                <div className="absolute -top-1 left-0 w-full h-[2px] bg-champagne-gold rounded-full"></div>
              </div>
              <div className="w-1/6 bg-deep-cobalt/60 h-2/3 rounded-t-sm"></div>
            </div>
          </div>
        </section>

        {/* Directory Split Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[600px]">
          
          {/* Patient sidebar list */}
          <div className="lg:col-span-4 glass-panel rounded-2xl shadow-sm flex flex-col overflow-hidden bg-white">
            <div className="p-4 border-b border-ice-blue">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
                <input 
                  type="text"
                  placeholder={t('searchPatients')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-soft-ivory/20 rounded-lg border border-outline-variant focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold text-sm text-on-surface"
                />
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto divide-y divide-ice-blue">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-4 cursor-pointer border-l-4 transition-all ${
                      selectedPatientId === p.id 
                        ? 'bg-champagne-gold/[0.06] border-champagne-gold' 
                        : 'border-transparent hover:bg-soft-ivory/40'
                    }`}
                  >
                    <h4 className="font-semibold text-sm text-deep-cobalt">{p.firstName} {p.lastName}</h4>
                    <p className="text-on-surface-variant text-[11px] mt-1 uppercase tracking-wide">
                      ID: {p.id} • {t('dobLabel')}: {p.dob}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${p.socialMediaConsentSigned ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                        <span className="text-[9px] text-on-surface-variant/80 font-bold uppercase tracking-wider">Media</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${p.consentSigned ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                        <span className="text-[9px] text-on-surface-variant/80 font-bold uppercase tracking-wider">Sclero</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${p.soapNotes && p.soapNotes.length > 0 ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                        <span className="text-[9px] text-on-surface-variant/80 font-bold uppercase tracking-wider">SOAP</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-on-surface-variant">No patients found.</div>
              )}
            </div>
          </div>

          {/* Clinical Record File */}
          <div className="lg:col-span-8 glass-panel rounded-2xl shadow-sm flex flex-col overflow-hidden bg-white">
            {selectedPatient ? (
              <div className="flex flex-col h-full divide-y divide-ice-blue">
                
                {/* Header Summary */}
                <div className="p-6 bg-soft-ivory/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-display text-xl text-deep-cobalt font-bold mb-1">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                    <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                      {selectedPatient.gender} • {t('dobLabel')}: {selectedPatient.dob} • {t('idLabel')}: {selectedPatient.id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-white/80 border border-champagne-gold/20 text-deep-cobalt text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                      {t('phoneLabel')}: {selectedPatient.phone}
                    </span>
                  </div>
                </div>

                {/* Tabs Navigator */}
                <div className="bg-white px-6 border-b border-ice-blue flex overflow-x-auto gap-6">
                  {[
                    { id: 'intake', label: 'Intake File' },
                    { id: 'soap', label: 'SOAP Notes' },
                    { id: 'consents', label: 'Consents' },
                    { id: 'photos', label: 'Photo Sequence' },
                    { id: 'export', label: 'PDF Export' },
                    { id: 'appointments', label: 'Citas / Appts' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                        activeTab === tab.id 
                          ? 'border-champagne-gold text-champagne-gold font-bold' 
                          : 'border-transparent text-on-surface-variant hover:text-deep-cobalt'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content area */}
                <div className="flex-1 overflow-y-auto p-6">
                  
                  {/* TAB 1: Intake Medical File / Edit Mode */}
                  {activeTab === 'intake' && (
                    <div className="space-y-6 fade-in-up">
                      <div className="flex justify-between items-center border-b border-ice-blue pb-2">
                        <h3 className="font-display text-lg text-deep-cobalt font-semibold">{t('medicalHistoryTitle')}</h3>
                        {!isEditingPatient ? (
                          <button
                            onClick={() => {
                              setEditPatientData({ ...selectedPatient });
                              setIsEditingPatient(true);
                            }}
                            className="text-xs bg-champagne-gold text-white font-semibold px-4 py-2 rounded-lg hover:brightness-110 shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                            {language === 'es' ? 'Editar Datos' : 'Edit Details'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                            {language === 'es' ? 'Modo Edición' : 'Edit Mode'}
                          </span>
                        )}
                      </div>

                      {!isEditingPatient ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                              <h4 className="font-bold text-deep-cobalt uppercase text-xs tracking-wider border-l-2 border-champagne-gold pl-2">Demographics</h4>
                              <p className="text-xs text-on-surface-variant"><span className="font-bold text-deep-cobalt">Email:</span> {selectedPatient.email}</p>
                              <p className="text-xs text-on-surface-variant"><span className="font-bold text-deep-cobalt">Address:</span> {selectedPatient.address || 'N/A'}</p>
                              <p className="text-xs text-on-surface-variant"><span className="font-bold text-deep-cobalt">{t('emergContact')}:</span> {selectedPatient.emergName || 'N/A'} ({selectedPatient.emergPhone || 'N/A'})</p>
                            </div>

                            <div className="space-y-3">
                              <h4 className="font-bold text-deep-cobalt uppercase text-xs tracking-wider border-l-2 border-champagne-gold pl-2">General Concerns</h4>
                              <p className="text-xs text-on-surface-variant">{selectedPatient.concerns || 'None reported'}</p>
                            </div>
                          </div>

                          <div className="border-t border-dashed border-surface-dim pt-6 space-y-4">
                            <h4 className="font-bold text-deep-cobalt uppercase text-xs tracking-wider">Medical Checklist Answers</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className={`p-4 rounded-xl border ${selectedPatient.pregnancy === 'Yes' ? 'bg-red-500/5 border-red-500/25' : 'bg-soft-ivory/20 border-surface-dim'}`}>
                                <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('pregnancyQuestion')}</span>
                                <span className={`font-bold text-xs ${selectedPatient.pregnancy === 'Yes' ? 'text-red-600' : 'text-deep-cobalt'}`}>{selectedPatient.pregnancy}</span>
                                {selectedPatient.pregnancy === 'Yes' && <p className="text-[10px] text-red-500 mt-1 font-semibold">⚠️ Sclerotherapy is contraindicated.</p>}
                              </div>

                              <div className={`p-4 rounded-xl border ${selectedPatient.clotsHistory === 'Yes' ? 'bg-amber-500/5 border-amber-500/25' : 'bg-soft-ivory/20 border-surface-dim'}`}>
                                <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('clotsQuestion')}</span>
                                <span className={`font-bold text-xs ${selectedPatient.clotsHistory === 'Yes' ? 'text-amber-600' : 'text-deep-cobalt'}`}>{selectedPatient.clotsHistory}</span>
                                {selectedPatient.clotsHistory === 'Yes' && <p className="text-[10px] text-amber-600 mt-1 font-semibold">⚠️ Requires ultrasound assessment.</p>}
                              </div>

                              <div className="p-4 rounded-xl border bg-soft-ivory/20 border-surface-dim">
                                <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('prevTreatmentsQuestion')}</span>
                                <span className="font-bold text-xs text-deep-cobalt">{selectedPatient.prevVeinTreatments}</span>
                                {selectedPatient.prevVeinTreatments === 'Yes' && <p className="text-xs text-on-surface-variant mt-1 italic">{selectedPatient.prevVeinTreatmentsDetail}</p>}
                              </div>

                              <div className={`p-4 rounded-xl border ${selectedPatient.allergiesHistory === 'Yes' ? 'bg-red-500/5 border-red-500/25' : 'bg-soft-ivory/20 border-surface-dim'}`}>
                                <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('allergiesQuestion')}</span>
                                <span className="font-bold text-xs text-deep-cobalt">{selectedPatient.allergiesHistory}</span>
                                {selectedPatient.allergiesHistory === 'Yes' && <p className="text-xs text-red-600 mt-1 font-semibold">{selectedPatient.allergiesHistoryDetail}</p>}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <form onSubmit={handleUpdatePatientSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('firstName')}</label>
                              <input type="text" value={editPatientData?.firstName || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, firstName: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('lastName')}</label>
                              <input type="text" value={editPatientData?.lastName || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, lastName: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('dob')}</label>
                              <input type="date" value={editPatientData?.dob || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, dob: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('gender')}</label>
                              <select value={editPatientData?.gender || 'Female'} onChange={(e) => setEditPatientData(prev => ({ ...prev, gender: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt">
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('email')}</label>
                              <input type="email" value={editPatientData?.email || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('phoneLabel')}</label>
                              <input type="text" value={editPatientData?.phone || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, phone: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant mb-1">{language === 'es' ? 'Dirección' : 'Address'}</label>
                            <input type="text" value={editPatientData?.address || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, address: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('emergContact')} (Name)</label>
                              <input type="text" value={editPatientData?.emergName || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, emergName: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('emergContact')} (Phone)</label>
                              <input type="text" value={editPatientData?.emergPhone || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, emergPhone: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('concerns')}</label>
                            <textarea value={editPatientData?.concerns || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, concerns: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs p-2 h-16 text-deep-cobalt" />
                          </div>

                          <div className="bg-soft-ivory/30 p-4 rounded-xl border border-outline-variant space-y-4">
                            <h4 className="font-bold text-xs text-deep-cobalt uppercase tracking-wider">{language === 'es' ? 'Cuestionario de Seguridad' : 'Vascular Safety Questions'}</h4>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <label className="block font-bold text-on-surface-variant mb-1">{t('pregnancyQuestion')}</label>
                                <select value={editPatientData?.pregnancy || 'No'} onChange={(e) => setEditPatientData(prev => ({ ...prev, pregnancy: e.target.value }))} className="rounded border-outline-variant text-xs text-deep-cobalt py-1 w-full">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-bold text-on-surface-variant mb-1">{t('clotsQuestion')}</label>
                                <select value={editPatientData?.clotsHistory || 'No'} onChange={(e) => setEditPatientData(prev => ({ ...prev, clotsHistory: e.target.value }))} className="rounded border-outline-variant text-xs text-deep-cobalt py-1 w-full">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <label className="block font-bold text-on-surface-variant mb-1">{t('prevTreatmentsQuestion')}</label>
                                <select value={editPatientData?.prevVeinTreatments || 'No'} onChange={(e) => setEditPatientData(prev => ({ ...prev, prevVeinTreatments: e.target.value }))} className="rounded border-outline-variant text-xs text-deep-cobalt py-1 w-full">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                                {editPatientData?.prevVeinTreatments === 'Yes' && (
                                  <input type="text" value={editPatientData?.prevVeinTreatmentsDetail || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, prevVeinTreatmentsDetail: e.target.value }))} className="w-full text-xs rounded border-outline-variant mt-1.5" placeholder="Previous vein treatment details" />
                                )}
                              </div>
                              <div>
                                <label className="block font-bold text-on-surface-variant mb-1">{t('allergiesQuestion')}</label>
                                <select value={editPatientData?.allergiesHistory || 'No'} onChange={(e) => setEditPatientData(prev => ({ ...prev, allergiesHistory: e.target.value }))} className="rounded border-outline-variant text-xs text-deep-cobalt py-1 w-full">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                                {editPatientData?.allergiesHistory === 'Yes' && (
                                  <input type="text" value={editPatientData?.allergiesHistoryDetail || ''} onChange={(e) => setEditPatientData(prev => ({ ...prev, allergiesHistoryDetail: e.target.value }))} className="w-full text-xs rounded border-outline-variant mt-1.5" placeholder="Specify allergies" />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsEditingPatient(false)} className="border border-deep-cobalt text-deep-cobalt px-4 py-2 rounded-lg text-xs font-semibold uppercase">{t('cancel')}</button>
                            <button type="submit" className="bg-champagne-gold text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase hover:brightness-110 shadow-sm">{language === 'es' ? 'Guardar Cambios' : 'Save Changes'}</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Dynamic SOAP procedure editor */}
                  {activeTab === 'soap' && (
                    <div className="space-y-8 fade-in-up">
                      <form onSubmit={handleSaveRecord} className="space-y-6">
                        <div className="flex justify-between items-center border-b border-ice-blue pb-3">
                        <h3 className="font-display text-lg text-deep-cobalt font-semibold">
                          {editingSoapNoteId 
                            ? (language === 'es' ? 'Editar Nota SOAP Registrada' : 'Edit Registered SOAP Note') 
                            : t('clinicalNotesSOAP')}
                        </h3>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-on-surface-variant uppercase">Procedure:</label>
                          <select 
                            value={selectedProcedureType}
                            onChange={(e) => setSelectedProcedureType(e.target.value)}
                            className="rounded-lg border-outline-variant text-xs py-1 text-deep-cobalt font-semibold"
                          >
                            <option value="Sclerotherapy">Sclerotherapy</option>
                            <option value="Vascular Eval">Vascular Eval</option>
                            <option value="Spider Vein">Spider Vein (Laser)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('subjective')}</label>
                          <textarea
                            value={soap.subjective}
                            onChange={(e) => setSoap(prev => ({ ...prev, subjective: e.target.value }))}
                            className="w-full bg-soft-ivory/10 rounded-lg border border-outline-variant text-xs text-deep-cobalt p-3 h-16 focus:ring-1 focus:ring-champagne-gold focus:border-champagne-gold"
                            placeholder="Symptoms described by the patient..."
                          />
                        </div>

                        {/* SERVICE-SPECIFIC PROCEDURE FIELDS */}
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('procedureNoteSpecific')}</label>
                          
                          {/* Option 1: Sclerotherapy */}
                          {selectedProcedureType === 'Sclerotherapy' && (
                            <div className="bg-soft-ivory/20 rounded-xl border border-champagne-gold/20 p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">{t('medication')}</label>
                                  <select
                                    value={soap.objectiveMedication}
                                    onChange={(e) => setSoap(prev => ({ ...prev, objectiveMedication: e.target.value }))}
                                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt"
                                  >
                                    <option>Polidocanol 0.5%</option>
                                    <option>Polidocanol 1.0%</option>
                                    <option>Sodium Tetradecyl Sulfate 0.2%</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">{t('volume')}</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={soap.objectiveVolume}
                                    onChange={(e) => setSoap(prev => ({ ...prev, objectiveVolume: e.target.value }))}
                                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt text-center"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">{t('veinLocation')}</label>
                                  <input
                                    type="text"
                                    value={soap.veinLocation}
                                    onChange={(e) => setSoap(prev => ({ ...prev, veinLocation: e.target.value }))}
                                    placeholder="e.g. Lateral thighs, medial calf"
                                    className="w-full rounded-lg border-outline-variant text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">{t('compressionPlaced')}</label>
                                  <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-1 text-xs cursor-pointer text-deep-cobalt font-medium">
                                      <input type="radio" checked={soap.compressionPlaced === 'Yes'} onChange={() => setSoap(prev => ({ ...prev, compressionPlaced: 'Yes' }))} className="text-champagne-gold focus:ring-champagne-gold" /> {language === 'es' ? 'Sí' : 'Yes'}
                                    </label>
                                    <label className="flex items-center gap-1 text-xs cursor-pointer text-deep-cobalt font-medium">
                                      <input type="radio" checked={soap.compressionPlaced === 'No'} onChange={() => setSoap(prev => ({ ...prev, compressionPlaced: 'No' }))} className="text-champagne-gold focus:ring-champagne-gold" /> No
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Option 2: Vascular Eval */}
                          {selectedProcedureType === 'Vascular Eval' && (
                            <div className="bg-soft-ivory/20 rounded-xl border border-champagne-gold/20 p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">CEAP Classification</label>
                                  <select
                                    value={soap.ceapClass}
                                    onChange={(e) => setSoap(prev => ({ ...prev, ceapClass: e.target.value }))}
                                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt"
                                  >
                                    <option value="C0">C0 - No visible signs</option>
                                    <option value="C1">C1 - Spider/Reticular veins</option>
                                    <option value="C2">C2 - Varicose veins</option>
                                    <option value="C3">C3 - Edema</option>
                                    <option value="C4">C4 - Skin changes (hyper-pigment)</option>
                                    <option value="C5">C5 - Healed venous ulcer</option>
                                    <option value="C6">C6 - Active venous ulcer</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Reflux Findings (Ultrasound)</label>
                                  <div className="space-y-1">
                                    <label className="flex items-center gap-1 text-xs cursor-pointer text-deep-cobalt font-medium">
                                      <input type="checkbox" checked={soap.refluxGSV} onChange={(e) => setSoap(prev => ({ ...prev, refluxGSV: e.target.checked }))} className="rounded text-champagne-gold focus:ring-champagne-gold" /> GSV Reflux (Saphenous)
                                    </label>
                                    <label className="flex items-center gap-1 text-xs cursor-pointer text-deep-cobalt font-medium">
                                      <input type="checkbox" checked={soap.refluxSSV} onChange={(e) => setSoap(prev => ({ ...prev, refluxSSV: e.target.checked }))} className="rounded text-champagne-gold focus:ring-champagne-gold" /> SSV Reflux
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Option 3: Spider Vein Laser */}
                          {selectedProcedureType === 'Spider Vein' && (
                            <div className="bg-soft-ivory/20 rounded-xl border border-champagne-gold/20 p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Laser Energy settings</label>
                                  <input
                                    type="text"
                                    value={soap.laserSettings}
                                    onChange={(e) => setSoap(prev => ({ ...prev, laserSettings: e.target.value }))}
                                    placeholder="e.g. 1064nm Nd:YAG, 70 J/cm²"
                                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Area Treated</label>
                                  <select
                                    value={soap.bodyAreaTreated}
                                    onChange={(e) => setSoap(prev => ({ ...prev, bodyAreaTreated: e.target.value }))}
                                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt"
                                  >
                                    <option value="Face">Face / Nose</option>
                                    <option value="Thighs">Thighs</option>
                                    <option value="Calves">Calves</option>
                                    <option value="Ankles">Ankles</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Objective Notes (Other findings)</label>
                          <textarea
                            value={soap.objectiveNotes}
                            onChange={(e) => setSoap(prev => ({ ...prev, objectiveNotes: e.target.value }))}
                            className="w-full bg-soft-ivory/10 rounded-lg border border-outline-variant text-xs text-deep-cobalt p-3 h-16"
                            placeholder={t('addObjectivePlaceholder')}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('assessment')}</label>
                            <textarea
                              value={soap.assessment}
                              onChange={(e) => setSoap(prev => ({ ...prev, assessment: e.target.value }))}
                              className="w-full bg-soft-ivory/10 rounded-lg border border-outline-variant text-xs text-deep-cobalt p-3 h-20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('plan')}</label>
                            <textarea
                              value={soap.plan}
                              onChange={(e) => setSoap(prev => ({ ...prev, plan: e.target.value }))}
                              className="w-full bg-soft-ivory/10 rounded-lg border border-outline-variant text-xs text-deep-cobalt p-3 h-20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Doctor Signature Pad if Sclerotherapy selected */}
                      {selectedProcedureType === 'Sclerotherapy' && !selectedPatient.consentSigned && (
                        <div className="bg-soft-ivory/10 rounded-xl border border-outline-variant p-4 space-y-3">
                          <label className="block text-xs font-bold text-deep-cobalt uppercase tracking-wider">{t('digitalConsent')} (Signature of Patient)</label>
                          <ClinicalSignaturePad 
                            initialSignature={null}
                            onSave={(base64) => setSclerotherapySignature(base64)}
                            onClear={() => setSclerotherapySignature('')}
                          />
                        </div>
                      )}

                      <div className="flex justify-end items-center gap-3 pt-4 border-t border-ice-blue">
                        {editingSoapNoteId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSoapNoteId(null);
                              setSoap({
                                subjective: '',
                                objectiveMedication: 'Polidocanol 0.5%',
                                objectiveVolume: '2.0',
                                objectiveNotes: '',
                                veinLocation: '',
                                compressionPlaced: 'Yes',
                                ceapClass: 'C1',
                                refluxGSV: false,
                                refluxSSV: false,
                                refluxPerforator: false,
                                laserSettings: '',
                                bodyAreaTreated: 'Calves',
                                assessment: '',
                                plan: ''
                              });
                            }}
                            className="border border-amber-600 text-amber-600 px-6 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase hover:bg-amber-600/5 transition-colors cursor-pointer mr-auto"
                          >
                            {language === 'es' ? 'Cancelar Edición' : 'Cancel Edit'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveTab('intake')}
                          className="border border-deep-cobalt text-deep-cobalt px-6 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase hover:bg-soft-ivory/50 transition-colors"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          type="submit"
                          className="bg-champagne-gold text-white px-6 py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition-all shadow-md cursor-pointer"
                        >
                          {editingSoapNoteId ? (language === 'es' ? 'Actualizar Nota' : 'Update Note') : t('saveRecord')}
                        </button>
                      </div>
                    </form>

                    {/* SOAP Notes History List */}
                    <div className="space-y-4 pt-6 border-t border-dashed border-surface-dim text-left">
                      <h4 className="font-display text-base font-semibold text-deep-cobalt border-b border-ice-blue pb-2 uppercase tracking-wider">
                        {language === 'es' ? 'Historial de Notas Clínicas' : 'Clinical SOAP Notes History'}
                      </h4>
                      
                      {selectedPatient.soapNotes && selectedPatient.soapNotes.length > 0 ? (
                        <div className="space-y-4">
                          {selectedPatient.soapNotes.map((note) => (
                            <div key={note.id} className="p-4 rounded-xl border border-outline-variant bg-white shadow-sm space-y-3 relative group">
                              <div className="flex justify-between items-center border-b border-ice-blue pb-1.5">
                                <span className="font-bold text-xs text-champagne-gold">Date: {note.date}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-deep-cobalt/5 text-deep-cobalt px-2.5 py-0.5 rounded-full font-bold uppercase">
                                    {note.procedureType || 'Sclerotherapy'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSoapNoteId(note.id);
                                      setSelectedProcedureType(note.procedureType || 'Sclerotherapy');
                                      setSoap({
                                        subjective: note.subjective || '',
                                        objectiveMedication: note.objectiveMedication || 'Polidocanol 0.5%',
                                        objectiveVolume: note.objectiveVolume || '2.0',
                                        objectiveNotes: note.objectiveNotes || '',
                                        veinLocation: note.veinLocation || '',
                                        compressionPlaced: note.compressionPlaced || 'Yes',
                                        ceapClass: note.ceapClass || 'C1',
                                        refluxGSV: !!note.refluxGSV,
                                        refluxSSV: !!note.refluxSSV,
                                        refluxPerforator: !!note.refluxPerforator,
                                        laserSettings: note.laserSettings || '',
                                        bodyAreaTreated: note.bodyAreaTreated || 'Calves',
                                        assessment: note.assessment || '',
                                        plan: note.plan || ''
                                      });
                                      // Scroll smoothly to form container
                                      const container = document.querySelector('.flex-grow');
                                      if (container) {
                                        container.scrollTo({ top: 0, behavior: 'smooth' });
                                      }
                                    }}
                                    className="text-[11px] bg-champagne-gold/10 text-champagne-gold font-bold px-3 py-1 rounded hover:bg-champagne-gold/20 transition-all cursor-pointer"
                                  >
                                    {language === 'es' ? 'Editar' : 'Edit'}
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-on-surface-variant">
                                <p><span className="font-bold text-deep-cobalt block mb-0.5">Subjective:</span> {note.subjective}</p>
                                <p><span className="font-bold text-deep-cobalt block mb-0.5">Objective Details:</span> {note.objectiveNotes}</p>
                                <p><span className="font-bold text-deep-cobalt block mb-0.5">Assessment:</span> {note.assessment}</p>
                                <p><span className="font-bold text-deep-cobalt block mb-0.5">Plan:</span> {note.plan}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-on-surface-variant italic">No clinical SOAP notes recorded yet.</p>
                      )}
                    </div>
                  </div>
                )}

                  {/* TAB 3: Informed Legal Consents */}
                  {activeTab === 'consents' && (
                    <div className="space-y-8 fade-in-up">
                      
                      {/* Consent 1: Sclerotherapy */}
                      <section className="space-y-4 bg-white p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-left">
                        <h4 className="font-display text-base font-bold text-deep-cobalt border-b border-ice-blue pb-1.5 uppercase tracking-wide flex justify-between items-center">
                          <span>1. {t('digitalConsent')} (Escleroterapia)</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${selectedPatient.consentSigned ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-400/15 text-amber-700'}`}>
                            {selectedPatient.consentSigned ? t('signed') : t('unsigned')}
                          </span>
                        </h4>
                        
                        <div className="bg-soft-ivory/20 p-4 rounded-xl border border-surface-dim max-h-48 overflow-y-auto text-xs text-on-surface-variant leading-relaxed space-y-2">
                          <p>{t('sclerotherapyConsentText')}</p>
                          <p>{t('hipaaConsentText')}</p>
                        </div>

                        {selectedPatient.consentSigned ? (
                          <div className="max-w-xs border border-outline-variant bg-white rounded-lg p-2 h-24 flex items-center justify-center shadow-inner mt-4">
                            <img src={selectedPatient.consentSignatureUrl} alt="Consent Signature" className="max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="space-y-3 pt-3">
                            <label className="block text-xs font-bold text-deep-cobalt uppercase">Patient Signature Required *</label>
                            <ClinicalSignaturePad 
                              initialSignature={null}
                              onSave={(base64) => {
                                saveConsentSignature(selectedPatientId, base64);
                                alert('Consent signature registered.');
                              }}
                              onClear={() => {}}
                            />
                          </div>
                        )}
                      </section>

                      {/* Consent 2: Photo & Social Media */}
                      <section className="space-y-4 bg-white p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-left">
                        <h4 className="font-display text-base font-bold text-deep-cobalt border-b border-ice-blue pb-1.5 uppercase tracking-wide flex justify-between items-center">
                          <span>2. {t('socialMediaConsent')}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${selectedPatient.socialMediaConsentSigned ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-400/15 text-amber-700'}`}>
                            {selectedPatient.socialMediaConsentSigned ? t('signed') : t('unsigned')}
                          </span>
                        </h4>

                        <div className="bg-soft-ivory/20 p-4 rounded-xl border border-surface-dim text-xs text-on-surface-variant leading-relaxed space-y-4">
                          <p>{t('socialConsentText')}</p>
                          
                          {/* Easy select buttons if not signed */}
                          {!selectedPatient.socialMediaConsentSigned && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              <button
                                type="button"
                                onClick={() => setAdminSocialConsentLevel('level1')}
                                className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${adminSocialConsentLevel === 'level1' ? 'bg-deep-cobalt text-white border-deep-cobalt' : 'bg-white text-deep-cobalt border-outline-variant hover:bg-soft-ivory/30'}`}
                              >
                                {language === 'es' ? 'Solo Clínico' : 'Clinical Only'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setAdminSocialConsentLevel('level1,level2')}
                                className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${adminSocialConsentLevel === 'level1,level2' ? 'bg-deep-cobalt text-white border-deep-cobalt' : 'bg-white text-deep-cobalt border-outline-variant hover:bg-soft-ivory/30'}`}
                              >
                                {language === 'es' ? 'Clínico + Anónimo' : 'Clinical + Anonymous'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setAdminSocialConsentLevel('level1,level2,level3')}
                                className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${adminSocialConsentLevel === 'level1,level2,level3' ? 'bg-deep-cobalt text-white border-deep-cobalt' : 'bg-white text-deep-cobalt border-outline-variant hover:bg-soft-ivory/30'}`}
                              >
                                {language === 'es' ? 'Marcar Todos (1, 2 y 3)' : 'Select All (1, 2 & 3)'}
                              </button>
                            </div>
                          )}

                          {/* Grid showing all three levels */}
                          <div className="grid grid-cols-1 gap-2.5">
                            {[
                              { level: 'level1', key: 'useLevel1' },
                              { level: 'level2', key: 'useLevel2' },
                              { level: 'level3', key: 'useLevel3' }
                            ].map((lvl) => {
                              const isChecked = selectedPatient.socialMediaConsentSigned 
                                ? (selectedPatient.socialMediaConsentLevel && selectedPatient.socialMediaConsentLevel.split(',').includes(lvl.level))
                                : (adminSocialConsentLevel && adminSocialConsentLevel.split(',').includes(lvl.level));

                              return (
                                <label key={lvl.level} className="flex items-start gap-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    disabled={selectedPatient.socialMediaConsentSigned || lvl.level === 'level1'} // clinical tracking is mandatory
                                    checked={isChecked || lvl.level === 'level1'}
                                    onChange={() => {
                                      const current = adminSocialConsentLevel ? adminSocialConsentLevel.split(',') : [];
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
                                      setAdminSocialConsentLevel(sorted.join(','));
                                    }}
                                    className="rounded text-champagne-gold focus:ring-champagne-gold mt-0.5 shrink-0"
                                  />
                                  <span className={(isChecked || lvl.level === 'level1') ? 'font-bold text-deep-cobalt' : 'text-on-surface-variant/80'}>
                                    {t(lvl.key)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {selectedPatient.socialMediaConsentSigned ? (
                          <div className="max-w-xs border border-outline-variant bg-white rounded-lg p-2 h-24 flex items-center justify-center shadow-inner mt-4">
                            <img src={selectedPatient.socialMediaSignatureUrl} alt="Social Media Consent Signature" className="max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="space-y-3 pt-3">
                            <label className="block text-xs font-bold text-deep-cobalt uppercase">Patient Signature Required *</label>
                            <ClinicalSignaturePad 
                              initialSignature={null}
                              onSave={(base64) => {
                                saveSocialMediaConsent(selectedPatientId, base64, adminSocialConsentLevel);
                                alert('Social Media signature registered.');
                              }}
                              onClear={() => {}}
                            />
                          </div>
                        )}
                      </section>
                    </div>
                  )}

                  {/* TAB 4: Photo Evolution Sequence */}
                  {activeTab === 'photos' && (
                    <div className="space-y-8 fade-in-up">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-ice-blue pb-4">
                        <h3 className="font-display text-lg text-deep-cobalt font-semibold">{t('uploadPhoto')}</h3>
                        
                        {/* File input */}
                        <div className="flex flex-wrap items-center gap-3">
                          <select 
                            value={newPhotoLabel}
                            onChange={(e) => setNewPhotoLabel(e.target.value)}
                            className="rounded-lg border-outline-variant text-xs py-1.5 text-deep-cobalt font-semibold"
                          >
                            <option value="Before Treatment">{t('beforeTreatment')}</option>
                            <option value="Post Session 1">{t('afterSession1')}</option>
                            <option value="Post Session 2">{t('afterSession2')}</option>
                            <option value="Follow Up">{t('followUp')}</option>
                          </select>
                          <label className="bg-champagne-gold text-white font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-lg hover:brightness-110 cursor-pointer shadow-sm">
                            {t('selectImage')}
                            <input 
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Photo Grid */}
                      <div className="space-y-6">
                        <h4 className="font-semibold text-xs tracking-wider text-on-surface-variant uppercase">
                          {t('language') === 'es' ? 'Fotografías Registradas' : 'Registered Photos'}
                        </h4>
                        
                        {selectedPatient.photos && selectedPatient.photos.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {selectedPatient.photos.map((photo) => {
                              const isSelected = selectedPhotosToCompare.includes(photo.id);
                              return (
                                <div 
                                  key={photo.id}
                                  onClick={() => toggleSelectPhotoForCompare(photo.id)}
                                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-white group hover:scale-[1.02] ${
                                    isSelected ? 'border-champagne-gold shadow-md' : 'border-outline-variant/60'
                                  }`}
                                >
                                  <img src={photo.base64Data} alt={photo.label} className="w-full h-28 object-cover" />
                                  <div className="p-2 bg-white flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-deep-cobalt truncate leading-tight">{photo.label}</span>
                                    <span className="text-[9px] text-on-surface-variant mt-0.5">{photo.date}</span>
                                  </div>
                                  
                                  {/* Selection Check Circle */}
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 bg-champagne-gold text-white w-5 h-5 rounded-full flex items-center justify-center shadow">
                                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-on-surface-variant italic">No photos uploaded in this patient profile yet.</p>
                        )}
                      </div>

                      {/* Photo Comparator */}
                      {selectedPatient.photos && selectedPatient.photos.length >= 2 && (
                        <div className="space-y-4 pt-6 border-t border-ice-blue">
                          <div className="flex justify-between items-center">
                            <h4 className="font-display text-base font-semibold text-deep-cobalt">{t('comparePhotos')}</h4>
                            <button
                              onClick={() => {
                                if (selectedPhotosToCompare.length !== 2) {
                                  alert(t('selectPhotoCompare'));
                                  return;
                                }
                                setCompareMode(!compareMode);
                              }}
                              className="bg-deep-cobalt text-white font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-lg hover:brightness-110 shadow-sm cursor-pointer"
                            >
                              {compareMode ? 'Exit Compare' : 'Open Comparative Slider'}
                            </button>
                          </div>

                          {compareMode && selectedPhotosToCompare.length === 2 && (() => {
                            const photoA = selectedPatient.photos.find(p => p.id === selectedPhotosToCompare[0]);
                            const photoB = selectedPatient.photos.find(p => p.id === selectedPhotosToCompare[1]);
                            return (
                              <div className="glass-panel p-6 rounded-2xl flex flex-col items-center bg-soft-ivory/10 gap-4">
                                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl bg-white p-3 rounded-xl border border-champagne-gold/15">
                                  <div className="relative rounded-lg overflow-hidden border border-outline-variant/60">
                                    <img src={photoA.base64Data} alt="Photo A" className="w-full h-56 object-cover" />
                                    <span className="absolute top-2 left-2 bg-deep-cobalt/80 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">{photoA.label} ({photoA.date})</span>
                                  </div>
                                  <div className="relative rounded-lg overflow-hidden border border-outline-variant/60">
                                    <img src={photoB.base64Data} alt="Photo B" className="w-full h-56 object-cover" />
                                    <span className="absolute top-2 right-2 bg-champagne-gold/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">{photoB.label} ({photoB.date})</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: PDF Print & Export template */}
                  {activeTab === 'export' && (
                    <div className="space-y-6 fade-in-up text-center py-6">
                      <div className="w-16 h-16 rounded-full bg-champagne-gold/10 flex items-center justify-center mx-auto mb-4 border border-champagne-gold/20">
                        <span className="material-symbols-outlined text-champagne-gold text-3xl font-light">picture_as_pdf</span>
                      </div>
                      <h3 className="font-display text-xl text-deep-cobalt font-bold">{t('exportPdfReport')}</h3>
                      <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                        Genera un informe médico membretado de alta fidelidad que unifica la ficha de admisión, los consentimientos legales firmados por el paciente, las notas SOAP de procedimiento y la firma digital.
                      </p>

                      <button
                        onClick={exportPDF}
                        className="bg-champagne-gold text-white font-semibold text-xs tracking-wider uppercase px-8 py-3 rounded-lg hover:brightness-110 shadow-md cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download Clinical PDF
                      </button>
                    </div>
                  )}

                  {/* TAB 6: Appointments Scheduling & History */}
                  {activeTab === 'appointments' && (
                    <div className="space-y-8 fade-in-up">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        
                        {/* Appointment History */}
                        <div className="space-y-4 text-left">
                          <h4 className="font-display text-base font-semibold text-deep-cobalt border-b border-ice-blue pb-2 uppercase tracking-wider">
                            {language === 'es' ? 'Historial de Citas' : 'Appointment History'}
                          </h4>
                          {selectedPatient.appointments && selectedPatient.appointments.length > 0 ? (
                            <div className="space-y-3">
                              {selectedPatient.appointments.map((app) => (
                                <div key={app.id} className="p-4 rounded-xl border border-outline-variant bg-soft-ivory/20 flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-bold text-deep-cobalt block">{app.service}</span>
                                    <span className="text-on-surface-variant">{app.doctor}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-deep-cobalt block">{app.date} @ {app.time}</span>
                                    <span className="text-[10px] bg-champagne-gold/10 text-champagne-gold px-2.5 py-0.5 rounded-full font-bold">${app.price}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-on-surface-variant italic">No appointments recorded for this patient.</p>
                          )}
                        </div>

                        {/* Schedule Follow-up Form */}
                        <div className="space-y-4 bg-white p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-left">
                          <h4 className="font-display text-base font-semibold text-deep-cobalt border-b border-ice-blue pb-2 uppercase tracking-wider">
                            {language === 'es' ? 'Agendar Seguimiento' : 'Schedule Follow-up'}
                          </h4>
                          
                          <form onSubmit={handleBookFollowUp} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">Service</label>
                              <select 
                                value={newAppointmentData.service}
                                onChange={(e) => setNewAppointmentData(prev => ({ ...prev, service: e.target.value }))}
                                className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt"
                              >
                                <option value="Sclerotherapy">Sclerotherapy ($300)</option>
                                <option value="Spider Vein">Spider Vein Laser ($250)</option>
                                <option value="Reticular Veins">Reticular Veins Treatment ($500)</option>
                                <option value="Vascular Eval">Vascular Evaluation ($100)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">Specialist</label>
                              <select 
                                value={newAppointmentData.doctor}
                                onChange={(e) => setNewAppointmentData(prev => ({ ...prev, doctor: e.target.value }))}
                                className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt"
                              >
                                <option value="Dr. Elena Rodriguez">Dr. Elena Rodriguez</option>
                                <option value="Dr. James Chen">Dr. James Chen</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1">Date</label>
                                <input 
                                  type="date"
                                  required
                                  value={newAppointmentData.date}
                                  onChange={(e) => setNewAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1">Time</label>
                                <select 
                                  value={newAppointmentData.time}
                                  onChange={(e) => setNewAppointmentData(prev => ({ ...prev, time: e.target.value }))}
                                  className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt text-center"
                                >
                                  <option value="">-- Time --</option>
                                  <option value="09:00 AM">09:00 AM</option>
                                  <option value="10:00 AM">10:00 AM</option>
                                  <option value="11:00 AM">11:00 AM</option>
                                  <option value="01:00 PM">01:00 PM</option>
                                  <option value="02:00 PM">02:00 PM</option>
                                  <option value="03:00 PM">03:00 PM</option>
                                  <option value="04:00 PM">04:00 PM</option>
                                </select>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-champagne-gold text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md cursor-pointer transition-all mt-4"
                            >
                              {language === 'es' ? 'Agendar Cita' : 'Book Appointment'}
                            </button>
                          </form>
                        </div>

                      </div>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center text-center p-12 text-on-surface-variant space-y-4">
                <span className="material-symbols-outlined text-5xl text-outline-variant font-light">patient_list</span>
                <p className="text-sm font-medium">{t('noPatientSelected')}</p>
              </div>
            )}
          </div>

        </section>
      </div>

      {/* PDF PRINT DESIGN AREA (HIDDEN FROM VIEWPORT, USED ONLY FOR html2pdf EXPORT) */}
      {selectedPatient && (
        <div id="printable-report-area" className="hidden p-10 bg-white text-deep-cobalt space-y-8 font-sans max-w-[800px] leading-relaxed">
          {/* Letterhead Header */}
          <div className="flex justify-between items-center border-b-2 border-champagne-gold pb-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="VenaComfort Logo" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-deep-cobalt">VenaComfort</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest text-champagne-gold">Vein Studio & Aesthetic Care</span>
              </div>
            </div>
            <div className="text-right text-[10px] text-on-surface-variant font-medium">
              <p>786-531-0664 | info@venacomfort.com</p>
              <p>Serving Miami-Dade & South Florida</p>
              <p className="font-bold text-deep-cobalt mt-1">HIPAA COMPLIANT MEDICAL RECORD</p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center bg-soft-ivory p-3 rounded-lg border border-champagne-gold/10">
            <h2 className="font-display text-xl font-bold text-deep-cobalt uppercase tracking-wide">Patient Clinical File & Signed Consents</h2>
            <p className="text-[10px] text-on-surface-variant uppercase font-semibold mt-0.5">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          {/* Patient Details Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs bg-white p-4 border border-outline-variant/60 rounded-xl">
            <div className="space-y-1.5">
              <p className="font-bold text-deep-cobalt text-[10px] uppercase tracking-wider border-b border-surface-dim pb-0.5">Demographics</p>
              <p><span className="font-semibold">Patient Name:</span> {selectedPatient.firstName} {selectedPatient.lastName}</p>
              <p><span className="font-semibold">DOB:</span> {selectedPatient.dob} ({selectedPatient.gender})</p>
              <p><span className="font-semibold">Email:</span> {selectedPatient.email}</p>
              <p><span className="font-semibold">Phone:</span> {selectedPatient.phone}</p>
              <p><span className="font-semibold">Address:</span> {selectedPatient.address || 'N/A'}</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-bold text-deep-cobalt text-[10px] uppercase tracking-wider border-b border-surface-dim pb-0.5">Emergency Contact</p>
              <p><span className="font-semibold">Name:</span> {selectedPatient.emergName || 'N/A'}</p>
              <p><span className="font-semibold">Phone:</span> {selectedPatient.emergPhone || 'N/A'}</p>
              <p className="font-bold text-deep-cobalt text-[10px] uppercase tracking-wider border-b border-surface-dim pb-0.5 mt-2">Vascular Concerns</p>
              <p className="italic text-on-surface-variant">{selectedPatient.concerns || 'None reported'}</p>
            </div>
          </div>

          {/* Intake Medical Answers */}
          <div className="space-y-3 bg-white p-4 border border-outline-variant/60 rounded-xl">
            <p className="font-bold text-deep-cobalt text-xs uppercase tracking-wide border-b border-surface-dim pb-1">Safety Questionnaire Answers</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <p><span className="font-semibold">Pregnant/Breastfeeding:</span> <span className={selectedPatient.pregnancy === 'Yes' ? 'text-red-600 font-bold' : ''}>{selectedPatient.pregnancy}</span></p>
              <p><span className="font-semibold">Blood Clots/DVT History:</span> <span className={selectedPatient.clotsHistory === 'Yes' ? 'text-amber-600 font-bold' : ''}>{selectedPatient.clotsHistory}</span></p>
              <p><span className="font-semibold">Allergies (latex/sclerosants):</span> <span className="font-semibold">{selectedPatient.allergiesHistory}</span> {selectedPatient.allergiesHistoryDetail && `(${selectedPatient.allergiesHistoryDetail})`}</p>
              <p><span className="font-semibold">Previous Vein Procedures:</span> <span className="font-semibold">{selectedPatient.prevVeinTreatments}</span> {selectedPatient.prevVeinTreatmentsDetail && `(${selectedPatient.prevVeinTreatmentsDetail})`}</p>
            </div>
          </div>

          {/* Legal photo consent */}
          <div className="space-y-3 bg-white p-4 border border-outline-variant/60 rounded-xl">
            <p className="font-bold text-deep-cobalt text-xs uppercase tracking-wide border-b border-surface-dim pb-1">{t('socialMediaConsent')}</p>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{t('socialConsentText')}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-deep-cobalt">
                Selected level: {
                  selectedPatient.socialMediaConsentLevel === 'level1' ? 'Clinical records only' :
                  selectedPatient.socialMediaConsentLevel === 'level2' ? 'Anonymous marketing' : 'Full public use'
                }
              </span>
              {selectedPatient.socialMediaConsentSigned && (
                <div className="w-40 border border-outline-variant rounded p-1 h-12 flex items-center justify-center bg-white shadow-inner">
                  <img src={selectedPatient.socialMediaSignatureUrl} alt="Social Signature" className="max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* SOAP Clinical note list */}
          <div className="space-y-4 bg-white p-4 border border-outline-variant/60 rounded-xl">
            <p className="font-bold text-deep-cobalt text-xs uppercase tracking-wide border-b border-surface-dim pb-1">Clinical SOAP Notes</p>
            {selectedPatient.soapNotes && selectedPatient.soapNotes.length > 0 ? (
              selectedPatient.soapNotes.map((note, idx) => (
                <div key={note.id} className="text-xs space-y-2 border-b border-dashed border-surface-dim pb-4 last:border-b-0">
                  <div className="flex justify-between font-bold text-champagne-gold">
                    <span>Note Date: {note.date}</span>
                    <span>Procedure: {note.procedureType || 'Sclerotherapy'} ({note.objectiveMedication} • {note.objectiveVolume}ml)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <p><span className="font-semibold text-deep-cobalt">Subjective:</span> {note.subjective}</p>
                    <p><span className="font-semibold text-deep-cobalt">Objective Notes:</span> {note.objectiveNotes}</p>
                    <p><span className="font-semibold text-deep-cobalt">Assessment:</span> {note.assessment}</p>
                    <p><span className="font-semibold text-deep-cobalt">Plan:</span> {note.plan}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-on-surface-variant italic">No clinical SOAP notes recorded yet.</p>
            )}
          </div>

          {/* Sclerotherapy Informed Consent & Signature Area */}
          <div className="space-y-4 bg-white p-4 border border-outline-variant/60 rounded-xl page-break-before">
            <p className="font-bold text-deep-cobalt text-xs uppercase tracking-wide border-b border-surface-dim pb-1">{t('digitalConsent')}</p>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              {t('sclerotherapyConsentText')}
            </p>
            
            <div className="flex justify-between items-end pt-6">
              <div className="space-y-2">
                <span className="block text-[9px] uppercase font-bold text-on-surface-variant">Attending Doctor</span>
                <div className="border-b border-deep-cobalt w-48 text-xs font-semibold py-1">Dr. Elena Rodriguez, MD</div>
              </div>
              <div className="space-y-2 flex flex-col items-center">
                <span className="block text-[9px] uppercase font-bold text-on-surface-variant align-left self-start">Patient Signature</span>
                {selectedPatient.consentSigned ? (
                  <div className="w-48 border border-outline-variant rounded p-1 h-14 flex items-center justify-center bg-white shadow-inner">
                    <img src={selectedPatient.consentSignatureUrl} alt="Patient Signature" className="max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="border-b border-deep-cobalt w-48 text-xs font-semibold py-4 text-center text-error font-bold uppercase tracking-wide">Consent Unsigned</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Patient Modal */}
      {showNewPatientModal && (
        <div className="fixed inset-0 bg-primary/45 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleCreatePatient} className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-champagne-gold/20 overflow-hidden flex flex-col">
            <header className="bg-soft-ivory p-4 border-b border-champagne-gold/15 flex justify-between items-center shrink-0">
              <h3 className="font-display text-lg text-deep-cobalt font-bold">{t('newPatient')}</h3>
              <button type="button" onClick={() => setShowNewPatientModal(false)} className="text-on-surface-variant hover:text-champagne-gold">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('firstName')} *</label>
                  <input type="text" required value={newPatientData.firstName} onChange={(e) => setNewPatientData(prev => ({ ...prev, firstName: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('lastName')} *</label>
                  <input type="text" required value={newPatientData.lastName} onChange={(e) => setNewPatientData(prev => ({ ...prev, lastName: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('dob')} *</label>
                  <input type="date" required value={newPatientData.dob} onChange={(e) => setNewPatientData(prev => ({ ...prev, dob: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('gender')}</label>
                  <select value={newPatientData.gender} onChange={(e) => setNewPatientData(prev => ({ ...prev, gender: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('email')} *</label>
                <input type="email" required value={newPatientData.email} onChange={(e) => setNewPatientData(prev => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs" />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('phoneLabel')} *</label>
                <input type="text" required placeholder="786-000-0000" value={newPatientData.phone} onChange={(e) => setNewPatientData(prev => ({ ...prev, phone: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs" />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('concerns')}</label>
                <textarea value={newPatientData.concerns} onChange={(e) => setNewPatientData(prev => ({ ...prev, concerns: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs p-2 h-16" />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('allergies')}</label>
                <input type="text" placeholder="E.g. None" value={newPatientData.allergies} onChange={(e) => setNewPatientData(prev => ({ ...prev, allergies: e.target.value }))} className="w-full rounded-lg border-outline-variant text-xs" />
              </div>
            </div>

            <footer className="bg-soft-ivory p-4 border-t border-champagne-gold/15 flex justify-end gap-2 shrink-0">
              <button type="button" onClick={() => setShowNewPatientModal(false)} className="border border-deep-cobalt text-deep-cobalt px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase hover:bg-surface-container">{t('cancel')}</button>
              <button type="submit" className="bg-champagne-gold text-white px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase hover:brightness-110 shadow-sm">{t('language') === 'es' ? 'Crear' : 'Create'}</button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
