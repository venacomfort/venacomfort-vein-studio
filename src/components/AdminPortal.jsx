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

export default function AdminPortal({ adminSubView = 'patients', setAdminSubView, isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser }) {
  const { t, language } = useLanguage();
  const { 
    patients, 
    appointments, 
    specialists = [],
    users = [],
    auditLogs = [],
    saveSoapNote, 
    updateSoapNote,
    saveConsentSignature, 
    saveSocialMediaConsent, 
    uploadPatientPhoto, 
    addPatient,
    updatePatient,
    addAppointment,
    confirmAppointment,
    rescheduleAppointment,
    markAsNoShow,
    markAsPresent,
    addSpecialist,
    updateSpecialist,
    deleteSpecialist,
    addUser,
    updateUser,
    deleteUser,
    cleanProductionDb,
    logAction
  } = useData();

  // User management state variables
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'specialist'
  });

  // Action log state variables
  const [searchLogQuery, setSearchLogQuery] = useState('');

  // Specialist management state variables
  const [showNewSpecModal, setShowNewSpecModal] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [searchSpecQuery, setSearchSpecQuery] = useState('');
  const [specForm, setSpecForm] = useState({
    name: '',
    title: '',
    titleEs: '',
    email: '',
    phone: '',
    schedule: 'Mon - Fri',
    scheduleEs: 'Lun - Vie',
    image: '',
    status: 'Active'
  });

  // Rescheduling states
  const [reschedulingApp, setReschedulingApp] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    doctor: 'Dr. Elena Rodriguez'
  });

  // Notification center state
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

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

  // Reset states on patient change
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
      setEditingSoapNoteId(null);
    }
  }, [selectedPatientId]);

  // Keep edit state updated with fresh database data (including signatures)
  useEffect(() => {
    if (selectedPatient && !isEditingPatient) {
      setEditPatientData({ ...selectedPatient });
      setAdminSocialConsentLevel(selectedPatient.socialMediaConsentLevel || 'level1');
    }
  }, [selectedPatient, isEditingPatient]);

  useEffect(() => {
    const activeDoc = specialists.find(s => s.status === 'Active');
    if (activeDoc) {
      setNewAppointmentData(prev => ({ ...prev, doctor: activeDoc.name }));
    }
  }, [specialists]);

  // Security role check
  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'specialist') {
      if (adminSubView === 'users' || adminSubView === 'audit_logs' || adminSubView === 'specialists') {
        setAdminSubView('patients');
      }
    }
  }, [adminSubView, currentUser, isAuthenticated]);

  // Auth Handler
  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = users.find(u => u.email.toLowerCase() === loginForm.username.toLowerCase() && u.password === loginForm.password);
    if (foundUser) {
      setIsAuthenticated(true);
      setCurrentUser(foundUser);
      sessionStorage.setItem('venacomfort_auth', 'true');
      sessionStorage.setItem('venacomfort_user', JSON.stringify(foundUser));
      setLoginError(false);
      logAction(foundUser.name, 'Sesión Iniciada', `Usuario ingresó al sistema con rol: ${foundUser.role.toUpperCase()}`);
    } else {
      setLoginError(true);
      logAction('System', 'Intento de Acceso Fallido', `Correo electrónico utilizado: ${loginForm.username}`);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      logAction(currentUser.name, 'Sesión Cerrada', 'Usuario cerró sesión de forma segura.');
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.removeItem('venacomfort_auth');
    sessionStorage.removeItem('venacomfort_user');
  };

  const handleCleanDb = async () => {
    const isProd = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
    const firstConfirm = window.confirm(
      language === 'es'
        ? `⚠️ ¿Confirmas la eliminación de todos los especialistas y usuarios (excepto el administrador) de la base de datos de ${isProd ? 'PRODUCCIÓN' : 'DESARROLLO'}?`
        : `⚠️ Do you confirm clearing all specialists and users (except admin) from the ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} database?`
    );
    if (firstConfirm) {
      const secondConfirm = window.confirm(
        language === 'es'
          ? '🚨 ADVERTENCIA: Esta acción es completamente irreversible. ¿Seguro que deseas proceder con la limpieza?'
          : '🚨 WARNING: This action is completely irreversible. Are you absolutely sure you want to proceed with cleanup?'
      );
      if (secondConfirm) {
        try {
          await cleanProductionDb(currentUser);
          alert(language === 'es' ? 'Limpieza de base de datos completada con éxito.' : 'Database cleanup completed successfully.');
        } catch (e) {
          alert((language === 'es' ? 'Error al limpiar base de datos: ' : 'Database cleanup error: ') + e.message);
        }
      }
    }
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
      logAction(currentUser?.name || 'Admin', 'Nota SOAP Modificada', `Se actualizó la nota SOAP (${selectedProcedureType}) para el paciente ${selectedPatient.firstName} ${selectedPatient.lastName}`);
      setEditingSoapNoteId(null);
    } else {
      saveSoapNote(selectedPatientId, notePayload);
      logAction(currentUser?.name || 'Admin', 'Nota SOAP Creada', `Nueva nota SOAP registrada (${selectedProcedureType}) para el paciente ${selectedPatient.firstName} ${selectedPatient.lastName}`);
    }

    // Save procedure consent signature if signed
    if (sclerotherapySignature && !selectedPatient.consentSigned) {
      saveConsentSignature(selectedPatientId, sclerotherapySignature);
      logAction(currentUser?.name || 'Admin', 'Consentimiento Firmado', `Consentimiento firmado para escleroterapia por ${selectedPatient.firstName} ${selectedPatient.lastName}`);
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
    logAction(currentUser?.name || 'Admin', 'Paciente Creado', `Se registró al paciente: ${created.firstName} ${created.lastName} (ID: ${created.id})`);
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
    logAction(currentUser?.name || 'Admin', 'Expediente Modificado', `Se actualizaron los datos demográficos del paciente: ${editPatientData.firstName} ${editPatientData.lastName}`);
    setIsEditingPatient(false);
  };

  // Book Follow-up Appointment Submission
  const handleBookFollowUp = (e) => {
    e.preventDefault();
    if (!newAppointmentData.date || !newAppointmentData.time) {
      alert(language === 'es' ? 'Por favor seleccione fecha y hora.' : 'Please select date and time.');
      return;
    }

    // Block booking if there is any active, pending, or no-show appointment
    const hasActiveApp = selectedPatient.appointments?.some(app => 
      app.status === 'confirmed' || 
      app.status === 'pending_confirmation' || 
      app.status === 'no_show'
    );
    if (hasActiveApp) {
      alert(language === 'es' 
        ? 'No se puede agendar una cita nueva manual porque el paciente ya tiene una cita activa, pendiente o sin asistir. Por favor reagende la cita existente.' 
        : 'Cannot schedule a new follow-up appointment because this patient already has an active, pending, or no-show appointment. Please reschedule the existing one.'
      );
      return;
    }
    
    // Set pricing based on service type
    let price = 300;
    if (newAppointmentData.service === 'Spider Vein') price = 250;
    if (newAppointmentData.service === 'Reticular Veins') price = 500;
    if (newAppointmentData.service === 'Vascular Eval') price = 100;

    addAppointment(selectedPatient, {
      ...newAppointmentData,
      status: 'confirmed',
      price
    });

    logAction(currentUser?.name || 'Admin', 'Seguimiento Agendado', `Nueva cita confirmada para ${selectedPatient.firstName} ${selectedPatient.lastName} el ${newAppointmentData.date} a las ${newAppointmentData.time}`);

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

  const handleSpecPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
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

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setSpecForm(prev => ({ ...prev, image: compressedBase64 }));
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

  // Notification calculations
  const pendingAppointments = appointments.filter(app => app.status === 'pending_confirmation');
  const noShowAlerts = appointments.filter(app => app.status === 'no_show');

  const unsignedConsentsAlerts = [];
  const suggestionAlerts = [];

  const today = new Date();
  const seventyTwoHoursLater = new Date(today.getTime() + 72 * 60 * 60 * 1000);
  const twentyFourHoursLater = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  appointments.forEach(app => {
    const appDate = new Date(app.date);
    const pat = patients.find(p => p.id === app.patientId);
    
    if (pat) {
      // Unsigned consents before 72 hours
      if (appDate >= today && appDate <= seventyTwoHoursLater) {
        if (!pat.consentSigned || !pat.socialMediaConsentSigned) {
          unsignedConsentsAlerts.push({
            id: `alert-consent-${app.id}`,
            patientName: app.patientName,
            patientId: app.patientId,
            appointmentId: app.id,
            date: app.date,
            time: app.time,
            unsignedSclero: !pat.consentSigned,
            unsignedSocial: !pat.socialMediaConsentSigned
          });
        }
      }
      
      // Suggestions: appointment in next 24 hours but last appointment has no SOAP note
      if (appDate >= today && appDate <= twentyFourHoursLater) {
        if (pat.soapNotes.length === 0) {
          suggestionAlerts.push({
            id: `alert-sug-${app.id}`,
            patientName: app.patientName,
            patientId: app.patientId,
            appointmentId: app.id,
            type: 'no_soap'
          });
        }
      }
    }
  });

  const totalNotificationsCount = pendingAppointments.length + unsignedConsentsAlerts.length + suggestionAlerts.length + noShowAlerts.length;

  const renderUsers = () => {
    const filteredUsersList = users.filter(u => 
      u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUserQuery.toLowerCase())
    );

    return (
      <section className="space-y-6 fade-in-up text-left">
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-champagne-gold/10">
          <div className="relative max-w-md w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              type="text"
              placeholder={language === 'es' ? "Buscar usuarios por nombre, correo..." : "Search users by name, email..."}
              value={searchUserQuery}
              onChange={(e) => setSearchUserQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-soft-ivory/20 rounded-lg border border-outline-variant focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold text-sm text-on-surface"
            />
          </div>
          <div className="flex gap-3 self-start md:self-auto flex-wrap">
            <button 
              onClick={handleCleanDb}
              className="border border-error/30 hover:bg-error-container/10 text-error px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">cleaning_services</span>
              {language === 'es' ? 'Limpiar BD' : 'Clean DB'}
            </button>
            <button 
              onClick={() => {
                setUserForm({ name: '', email: '', password: '', role: 'specialist' });
                setEditingUser(null);
                setShowNewUserModal(true);
              }}
              className="bg-deep-cobalt hover:bg-deep-cobalt/95 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              {language === 'es' ? 'Nuevo Usuario' : 'New User'}
            </button>
          </div>
        </div>

        {/* Users list grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsersList.map(u => (
            <div key={u.id} className="bg-white p-6 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-champagne-gold/10 text-deep-cobalt flex items-center justify-center font-display font-bold text-sm tracking-wide">
                    {u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-deep-cobalt">{u.name}</h4>
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 ${
                      u.role === 'admin' ? 'bg-deep-cobalt/10 text-deep-cobalt' : 'bg-emerald-500/10 text-emerald-700'
                    }`}>
                      {u.role === 'admin' ? (language === 'es' ? 'Administrador' : 'Admin') : (language === 'es' ? 'Especialista' : 'Specialist')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1.5 pt-2 text-xs border-t border-ice-blue">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant/80">{language === 'es' ? 'Correo:' : 'Email:'}</span>
                    <span className="font-semibold text-deep-cobalt">{u.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant/80">{language === 'es' ? 'Contraseña:' : 'Password:'}</span>
                    <span className="font-mono text-outline font-semibold select-all" title="Click to select">
                      {u.password}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-ice-blue pt-3 mt-1">
                <button
                  onClick={() => {
                    setUserForm({ name: u.name, email: u.email, password: u.password, role: u.role });
                    setEditingUser(u);
                    setShowNewUserModal(true);
                  }}
                  className="text-xs font-bold text-deep-cobalt hover:text-champagne-gold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  {language === 'es' ? 'Editar' : 'Edit'}
                </button>
                {u.id !== 'user-admin' && u.email !== currentUser?.email && (
                  <button
                    onClick={() => {
                      const first = window.confirm(language === 'es' ? '¿Eliminar este usuario?' : 'Delete this user?');
                      if (first) {
                        const second = window.confirm(
                          language === 'es'
                            ? '⚠️ ADVERTENCIA: Esta acción eliminará la cuenta de acceso y su especialista vinculado de forma permanente. ¿Confirmas?'
                            : '⚠️ WARNING: This will permanently delete the access account and its linked specialist. Confirm?'
                        );
                        if (second) {
                          deleteUser(u.id);
                          logAction(currentUser?.name || 'Admin', 'Usuario Eliminado', `Cuenta: ${u.email} (${u.name})`);
                        }
                      }
                    }}
                    className="text-xs font-bold text-error hover:text-error/85 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    {language === 'es' ? 'Eliminar' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredUsersList.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-2xl text-center border border-champagne-gold/10 text-on-surface-variant/60 text-xs">
              <span className="material-symbols-outlined text-4xl mb-2 text-on-surface-variant/40 block">manage_accounts</span>
              {language === 'es' ? 'No se encontraron usuarios' : 'No users found'}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderAuditLogs = () => {
    const filteredLogs = auditLogs.filter(log => 
      log.user.toLowerCase().includes(searchLogQuery.toLowerCase()) || 
      log.action.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchLogQuery.toLowerCase())
    );

    return (
      <section className="space-y-6 fade-in-up text-left">
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-champagne-gold/10">
          <div>
            <h3 className="font-display text-base font-bold text-deep-cobalt uppercase tracking-wider">
              {language === 'es' ? 'Registro de Acciones del Sistema' : 'System Action Logs'}
            </h3>
            <p className="text-[10px] text-on-surface-variant/70 font-semibold tracking-wide mt-1 uppercase">
              {language === 'es' ? 'Registro de auditoría de seguridad clínica (Cumplimiento HIPAA)' : 'Clinical security audit log (HIPAA Compliance)'}
            </p>
          </div>
          
          <div className="relative max-w-md w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              type="text"
              placeholder={language === 'es' ? "Buscar registros por acción, usuario o detalles..." : "Search logs by action, user or details..."}
              value={searchLogQuery}
              onChange={(e) => setSearchLogQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-soft-ivory/20 rounded-lg border border-outline-variant focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold text-sm text-on-surface"
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-soft-ivory/40 text-deep-cobalt border-b border-ice-blue uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-4 w-1/5">{language === 'es' ? 'Fecha y Hora' : 'Date & Time'}</th>
                  <th className="p-4 w-1/5">{language === 'es' ? 'Usuario' : 'User'}</th>
                  <th className="p-4 w-1/4">{language === 'es' ? 'Acción' : 'Action'}</th>
                  <th className="p-4 w-2/5">{language === 'es' ? 'Detalles' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ice-blue text-on-surface-variant">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-soft-ivory/20 transition-colors">
                    <td className="p-4 font-mono font-medium whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="p-4 font-bold text-deep-cobalt">{log.user}</td>
                    <td className="p-4">
                      <span className="inline-block bg-champagne-gold/10 text-deep-cobalt px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-champagne-gold/15">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-medium max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-on-surface-variant/60">
                      <span className="material-symbols-outlined text-4xl mb-2 text-on-surface-variant/40 block">history</span>
                      {language === 'es' ? 'No se encontraron registros de auditoría' : 'No audit logs found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  };

  const renderSpecialists = () => {
    const filteredSpecs = specialists.filter(s => 
      s.name.toLowerCase().includes(searchSpecQuery.toLowerCase()) || 
      (s.title && s.title.toLowerCase().includes(searchSpecQuery.toLowerCase())) ||
      (s.titleEs && s.titleEs.toLowerCase().includes(searchSpecQuery.toLowerCase()))
    );

    return (
      <section className="space-y-6 fade-in-up">
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-champagne-gold/10">
          <div className="relative max-w-md w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              type="text"
              placeholder={language === 'es' ? 'Buscar especialista por nombre o título...' : 'Search specialist by name or title...'}
              value={searchSpecQuery}
              onChange={(e) => setSearchSpecQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-soft-ivory/20 rounded-lg border border-outline-variant focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold text-sm text-on-surface"
            />
          </div>
          <button
            onClick={() => {
              setEditingSpec(null);
              setSpecForm({
                name: '',
                title: '',
                titleEs: '',
                email: '',
                phone: '',
                schedule: 'Mon - Fri',
                scheduleEs: 'Lun - Vie',
                image: '',
                status: 'Active'
              });
              setShowNewSpecModal(true);
            }}
            className="bg-champagne-gold text-white font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-lg hover:brightness-110 transition-all shadow-sm cursor-pointer flex items-center gap-1 self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {language === 'es' ? 'Agregar Especialista' : 'Add Specialist'}
          </button>
        </div>

        {/* Specialists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecs.map(spec => (
            <div key={spec.id} className="glass-panel p-6 rounded-2xl bg-white shadow-sm flex flex-col justify-between border border-champagne-gold/10 relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
              <div className="flex gap-4">
                <img 
                  src={spec.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'} 
                  alt={spec.name} 
                  className="w-16 h-16 rounded-full object-cover border border-champagne-gold/30 shrink-0" 
                />
                <div className="space-y-1">
                  <span className="font-display font-bold text-deep-cobalt block text-base">{spec.name}</span>
                  <span className="text-xs text-secondary font-semibold block">
                    {language === 'es' ? spec.titleEs || spec.title : spec.title}
                  </span>
                  <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    spec.status === 'Active' ? 'bg-success-container/30 text-success' : 'bg-surface-dim text-on-surface-variant'
                  }`}>
                    {spec.status === 'Active' ? (language === 'es' ? 'Activo' : 'Active') : (language === 'es' ? 'Inactivo' : 'Inactive')}
                  </span>
                </div>
              </div>

              <div className="border-t border-surface-container-high/60 my-4 pt-4 space-y-2 text-xs text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-champagne-gold">mail</span>
                  <span>{spec.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-champagne-gold">phone</span>
                  <span>{spec.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-champagne-gold">calendar_month</span>
                  <span>{language === 'es' ? spec.scheduleEs || spec.schedule : spec.schedule}</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-surface-container-high/60 pt-4">
                <button
                  onClick={() => {
                    setEditingSpec(spec);
                    setSpecForm({
                      name: spec.name,
                      title: spec.title || '',
                      titleEs: spec.titleEs || '',
                      email: spec.email || '',
                      phone: spec.phone || '',
                      schedule: spec.schedule || 'Mon - Fri',
                      scheduleEs: spec.scheduleEs || 'Lun - Vie',
                      image: spec.image || '',
                      status: spec.status || 'Active'
                    });
                    setShowNewSpecModal(true);
                  }}
                  className="border border-outline-variant text-on-surface-variant hover:text-champagne-gold hover:border-champagne-gold px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {language === 'es' ? 'Editar' : 'Edit'}
                </button>
                <button
                  onClick={() => {
                    const nextStatus = spec.status === 'Active' ? 'Inactive' : 'Active';
                    updateSpecialist(spec.id, { status: nextStatus });
                  }}
                  className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    spec.status === 'Active' 
                      ? 'border border-error/25 text-error hover:bg-error-container/20' 
                      : 'border border-success/25 text-success hover:bg-success-container/20'
                  }`}
                >
                  {spec.status === 'Active' ? (language === 'es' ? 'Desactivar' : 'Deactivate') : (language === 'es' ? 'Activar' : 'Activate')}
                </button>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => {
                      const firstConfirm = window.confirm(
                        language === 'es' 
                          ? '¿Estás seguro de que deseas eliminar este especialista?' 
                          : 'Are you sure you want to delete this specialist?'
                      );
                      if (firstConfirm) {
                        const secondConfirm = window.confirm(
                          language === 'es'
                            ? '⚠️ ADVERTENCIA: Esta acción es irreversible y eliminará permanentemente al especialista de los registros clínicos. ¿Confirmas la eliminación definitiva?'
                            : '⚠️ WARNING: This action is irreversible and will permanently delete the specialist from all clinical records. Do you confirm the final deletion?'
                        );
                        if (secondConfirm) {
                          deleteSpecialist(spec.id);
                          logAction(currentUser?.name || 'Admin', 'Especialista Eliminado', `Especialista: ${spec.name} (${spec.email})`);
                        }
                      }
                    }}
                    className="border border-error/25 text-error hover:bg-error-container/20 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    {language === 'es' ? 'Eliminar' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredSpecs.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-2xl text-center border border-champagne-gold/10 text-on-surface-variant/60 text-xs">
              <span className="material-symbols-outlined text-4xl mb-2 text-on-surface-variant/40 block">groups</span>
              {language === 'es' ? 'No se encontraron especialistas' : 'No specialists found'}
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-background relative">
      {/* Toast popup */}
      {toastMessage && (
        <div className="absolute top-4 right-4 bg-deep-cobalt text-white border border-champagne-gold/25 px-4 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-champagne-gold text-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="bg-white/80 backdrop-blur-xl h-20 flex items-center justify-between px-margin-mobile md:px-margin-desktop bg-white border-b border-champagne-gold/10 shrink-0 z-30">
        <div className="flex items-center gap-4 text-primary">
          <span className="material-symbols-outlined text-3xl font-light">local_hospital</span>
          <h2 className="font-display text-xl font-bold">{t('clinicalPortal')}</h2>
        </div>
        <div className="flex items-center gap-3 relative">
          
          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-champagne-gold/10 text-on-surface-variant transition-all cursor-pointer flex items-center justify-center focus:outline-none"
            >
              <span className="material-symbols-outlined text-2xl font-light">notifications</span>
              {totalNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {totalNotificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Popover Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-champagne-gold/15 rounded-2xl shadow-xl z-50 overflow-hidden text-left animate-fade-in max-h-[500px] flex flex-col">
                <header className="px-4 py-3 bg-soft-ivory border-b border-champagne-gold/10 flex justify-between items-center">
                  <span className="font-display font-semibold text-xs text-deep-cobalt uppercase tracking-wider">
                    {language === 'es' ? 'Notificaciones' : 'System Notifications'}
                  </span>
                  <span className="text-[10px] bg-champagne-gold/15 text-secondary px-2.5 py-0.5 rounded-full font-bold">
                    {totalNotificationsCount} {language === 'es' ? 'activas' : 'active'}
                  </span>
                </header>

                <div className="flex-1 overflow-y-auto divide-y divide-surface-container-high/60 max-h-[400px]">
                  {/* Category 1: Pending Appointments */}
                  {pendingAppointments.length > 0 && (
                    <div className="p-3 bg-champagne-gold/5">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-widest block mb-2">
                        {language === 'es' ? '⚠️ Confirmar Citas' : '⚠️ Confirm Appointments'}
                      </span>
                      <div className="space-y-2">
                        {pendingAppointments.map(app => (
                          <div key={app.id} className="text-xs bg-white p-2.5 rounded-lg border border-champagne-gold/10 flex flex-col gap-2">
                            <div 
                              onClick={() => {
                                setSelectedPatientId(app.patientId);
                                setActiveTab('appointments');
                                setAdminSubView('patients');
                                setShowNotifications(false);
                              }}
                              className="cursor-pointer hover:opacity-80 transition-opacity text-left"
                            >
                              <span className="font-semibold text-deep-cobalt block">{app.patientName}</span>
                              <span className="text-on-surface-variant block text-[10px] mt-0.5">{app.service} • {app.date} a las {app.time}</span>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => {
                                  confirmAppointment(app.id);
                                  setToastMessage(language === 'es' ? '¡Cita confirmada con éxito!' : 'Appointment confirmed successfully!');
                                  setTimeout(() => setToastMessage(null), 3000);
                                }}
                                className="bg-champagne-gold text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer font-semibold"
                              >
                                {language === 'es' ? 'Confirmar' : 'Confirm'}
                              </button>
                              
                              <button 
                                onClick={() => {
                                  setReschedulingApp(app);
                                  setRescheduleForm({
                                    date: app.date || '',
                                    time: app.time || '',
                                    doctor: app.doctor || 'Dr. Elena Rodriguez'
                                  });
                                  setShowNotifications(false);
                                }}
                                className="border border-deep-cobalt text-deep-cobalt hover:bg-deep-cobalt hover:text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors font-semibold"
                              >
                                {language === 'es' ? 'Reagendar' : 'Reagendar'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 2: Unsigned Consents <72 hours */}
                  {unsignedConsentsAlerts.length > 0 && (
                    <div className="p-3">
                      <span className="text-[9px] font-bold text-error uppercase tracking-widest block mb-2">
                        {language === 'es' ? '✍️ Firmas Pendientes (<72h)' : '✍️ Unsigned Consents (<72h)'}
                      </span>
                      <div className="space-y-2">
                        {unsignedConsentsAlerts.map(alert => (
                          <div key={alert.id} className="text-xs bg-error-container/20 p-2.5 rounded-lg border border-error/10 flex flex-col gap-2">
                            <div 
                              onClick={() => {
                                setSelectedPatientId(alert.patientId);
                                setActiveTab('appointments');
                                setAdminSubView('patients');
                                setShowNotifications(false);
                              }}
                              className="cursor-pointer hover:opacity-80 transition-opacity text-left"
                            >
                              <span className="font-semibold text-deep-cobalt block">{alert.patientName}</span>
                              <span className="text-on-surface-variant block text-[10px] mt-0.5 leading-normal">
                                {language === 'es' 
                                  ? `Cita el ${alert.date} a las ${alert.time}. Falta: ` 
                                  : `Appt on ${alert.date} @ ${alert.time}. Missing: `
                                }
                                <strong className="text-error font-semibold">
                                  {[alert.unsignedSclero && 'Consentimiento', alert.unsignedSocial && 'Redes'].filter(Boolean).join(', ')}
                                </strong>
                              </span>
                            </div>
                            <div className="flex justify-end">
                              <button 
                                onClick={() => {
                                  setToastMessage(language === 'es' ? `¡Recordatorio enviado a ${alert.patientName}!` : `Reminder sent to ${alert.patientName}!`);
                                  setTimeout(() => setToastMessage(null), 3000);
                                }}
                                className="border border-error/30 text-error px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-error-container/40 cursor-pointer"
                              >
                                {language === 'es' ? 'Recordar' : 'Remind'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Clinical Suggestions */}
                  {suggestionAlerts.length > 0 && (
                    <div className="p-3">
                      <span className="text-[9px] font-bold text-deep-cobalt uppercase tracking-widest block mb-2">
                        {language === 'es' ? '💡 Sugerencias Clínicas' : '💡 Clinical Suggestions'}
                      </span>
                      <div className="space-y-2">
                        {suggestionAlerts.map(sug => (
                          <div key={sug.id} className="text-xs bg-soft-ivory p-2.5 rounded-lg border border-surface-dim flex flex-col gap-2">
                            <div 
                              onClick={() => {
                                setSelectedPatientId(sug.patientId);
                                setActiveTab('appointments');
                                setAdminSubView('patients');
                                setShowNotifications(false);
                              }}
                              className="cursor-pointer hover:opacity-80 transition-opacity text-left"
                            >
                              <span className="font-semibold text-deep-cobalt block">{sug.patientName}</span>
                              <span className="text-on-surface-variant block text-[10px] mt-0.5 leading-normal">
                                {language === 'es' 
                                  ? 'Tiene cita próxima pero no se ha registrado Nota SOAP para la sesión.' 
                                  : 'Has upcoming appointment but no SOAP note is registered for the treatment.'
                                }
                              </span>
                            </div>
                            <div className="flex justify-end">
                              <button 
                                onClick={() => {
                                  setSelectedPatientId(sug.patientId);
                                  setActiveTab('soap');
                                  setAdminSubView('patients');
                                  setShowNotifications(false);
                                }}
                                className="bg-deep-cobalt text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                {language === 'es' ? 'Crear Nota' : 'Create SOAP'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 4: No Shows */}
                  {noShowAlerts.length > 0 && (
                    <div className="p-3 bg-red-50/70 border-t border-red-100">
                      <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest block mb-2">
                        {language === 'es' ? '❌ No Show (Llamar y Reagendar)' : '❌ No Show (Call & Reschedule)'}
                      </span>
                      <div className="space-y-2">
                        {noShowAlerts.map(app => {
                          const pat = patients.find(p => p.id === app.patientId);
                          const phone = pat ? pat.phone : '';
                          return (
                            <div key={app.id} className="text-xs bg-white p-2.5 rounded-lg border border-red-200 flex flex-col gap-2 shadow-sm">
                              <div 
                                onClick={() => {
                                  setSelectedPatientId(app.patientId);
                                  setActiveTab('appointments');
                                  setAdminSubView('patients');
                                  setShowNotifications(false);
                                }}
                                className="cursor-pointer hover:opacity-80 transition-opacity text-left"
                              >
                                <span className="font-semibold text-deep-cobalt block">{app.patientName}</span>
                                <span className="text-on-surface-variant block text-[10px] mt-0.5 leading-normal">
                                  {language === 'es' 
                                    ? `No se presentó a la cita del ${app.date}.` 
                                    : `Did not show up for appointment on ${app.date}.`
                                  }
                                </span>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <a 
                                  href={`tel:${phone}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setToastMessage(language === 'es' ? `Llamando a ${app.patientName} (${phone})...` : `Calling ${app.patientName} (${phone})...`);
                                    setTimeout(() => setToastMessage(null), 4000);
                                  }}
                                  className="border border-red-500 text-red-500 hover:bg-red-50 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors font-semibold flex items-center gap-1 bg-transparent"
                                >
                                  <span className="material-symbols-outlined text-xs">phone</span>
                                  {language === 'es' ? 'Llamar' : 'Call'}
                                </a>
                                
                                <button 
                                  onClick={() => {
                                    setReschedulingApp(app);
                                    setRescheduleForm({
                                      date: app.date || '',
                                      time: app.time || '',
                                      doctor: app.doctor || 'Dr. Elena Rodriguez'
                                    });
                                    setShowNotifications(false);
                                  }}
                                  className="bg-deep-cobalt text-white hover:brightness-110 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors font-semibold flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                                  {language === 'es' ? 'Reagendar' : 'Reschedule'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {totalNotificationsCount === 0 && (
                    <div className="p-8 text-center text-on-surface-variant/60 text-xs">
                      <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant/40 block">check_circle</span>
                      {language === 'es' ? 'No tienes alertas pendientes' : 'No pending notifications'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowNewPatientModal(true)}
            className="bg-champagne-gold text-white font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-lg hover:brightness-110 transition-all shadow-sm cursor-pointer animate-fade-in"
          >
            {t('newPatient')}
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
        {adminSubView === 'specialists' ? (
          renderSpecialists()
        ) : adminSubView === 'users' ? (
          renderUsers()
        ) : adminSubView === 'audit_logs' ? (
          renderAuditLogs()
        ) : (
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
                                <div key={app.id} className="p-4 rounded-xl border border-outline-variant bg-soft-ivory/20 flex flex-col gap-3 text-xs">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-bold text-deep-cobalt">{app.service}</span>
                                        {/* Status Badges */}
                                        {app.status === 'confirmed' && (
                                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                            {language === 'es' ? 'Confirmada' : 'Confirmed'}
                                          </span>
                                        )}
                                        {(app.status === 'pending_confirmation' || !app.status) && (
                                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                            {language === 'es' ? 'Pendiente' : 'Pending'}
                                          </span>
                                        )}
                                        {app.status === 'no_show' && (
                                          <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                            {language === 'es' ? 'No Presentó' : 'No Show'}
                                          </span>
                                        )}
                                        {app.status === 'completed' && (
                                          <span className="bg-deep-cobalt/10 text-deep-cobalt text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                            {language === 'es' ? 'Presente' : 'Arrived'}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-on-surface-variant block">{app.doctor}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-bold text-deep-cobalt block">{app.date} @ {app.time}</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 justify-end border-t border-champagne-gold/10 pt-2.5">
                                    {/* Reschedule Button */}
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setReschedulingApp(app);
                                        setRescheduleForm({
                                          date: app.date || '',
                                          time: app.time || '',
                                          doctor: app.doctor || 'Dr. Elena Rodriguez'
                                        });
                                      }}
                                      className="border border-deep-cobalt hover:bg-deep-cobalt hover:text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors font-semibold"
                                    >
                                      {language === 'es' ? 'Reagendar' : 'Reschedule'}
                                    </button>

                                    {/* Mark as No Show */}
                                    {app.status !== 'no_show' && app.status !== 'completed' && (
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          markAsNoShow(app.id);
                                          logAction(currentUser?.name || 'Admin', 'Inasistencia Registrada', `Paciente ${selectedPatient.firstName} ${selectedPatient.lastName} marcado como No Presentó (Cita el ${app.date} @ ${app.time})`);
                                          setToastMessage(language === 'es' ? '¡Marcado como No Presentó!' : 'Marked as No Show!');
                                          setTimeout(() => setToastMessage(null), 3000);
                                        }}
                                        className="border border-rose-500 text-rose-500 hover:bg-rose-50 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors font-semibold"
                                      >
                                        {language === 'es' ? 'No se presentó' : 'No Show'}
                                      </button>
                                    )}

                                    {/* Mark as Present (Suggestion for check-in) */}
                                    {app.status !== 'no_show' && app.status !== 'completed' && (
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          markAsPresent(app.id);
                                          logAction(currentUser?.name || 'Admin', 'Check-In Realizado', `Paciente ${selectedPatient.firstName} ${selectedPatient.lastName} ingresó a su cita (${app.service} con ${app.doctor})`);
                                          setToastMessage(language === 'es' ? '¡Marcado como Presente!' : 'Marked as Present!');
                                          setTimeout(() => setToastMessage(null), 3000);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors font-semibold"
                                      >
                                        {language === 'es' ? 'Presente' : 'Check-In'}
                                      </button>
                                    )}
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
                          
                          {selectedPatient.appointments?.some(app => 
                            app.status === 'confirmed' || 
                            app.status === 'pending_confirmation' || 
                            app.status === 'no_show'
                          ) && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-3 rounded-lg leading-relaxed flex items-start gap-2 animate-pulse">
                              <span className="material-symbols-outlined text-sm shrink-0 mt-0.5 text-rose-500 font-bold">warning</span>
                              <span>
                                {language === 'es'
                                  ? 'El paciente ya tiene una cita activa, pendiente o sin asistir. Favor reagendar la cita correspondiente en el historial de la izquierda en vez de crear una nueva.'
                                  : 'The patient already has an active, pending, or no-show appointment. Please reschedule that existing appointment in the list to the left instead of scheduling a new one.'
                                }
                              </span>
                            </div>
                          )}

                          <form onSubmit={handleBookFollowUp} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">Service</label>
                              <select 
                                value={newAppointmentData.service}
                                onChange={(e) => setNewAppointmentData(prev => ({ ...prev, service: e.target.value }))}
                                className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt"
                              >
                                <option value="Sclerotherapy">Sclerotherapy</option>
                                <option value="Spider Vein">Spider Vein Laser</option>
                                <option value="Reticular Veins">Reticular Veins Treatment</option>
                                <option value="Vascular Eval">Vascular Evaluation</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1">Specialist</label>
                              <select 
                                value={newAppointmentData.doctor}
                                onChange={(e) => setNewAppointmentData(prev => ({ ...prev, doctor: e.target.value }))}
                                className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt bg-white"
                              >
                                {specialists.filter(s => s.status === 'Active').map(s => (
                                  <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
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
        )}
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

      {/* ADD / EDIT SPECIALIST MODAL */}
      {showNewSpecModal && (
        <div className="fixed inset-0 bg-primary/45 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-soft-ivory rounded-3xl overflow-hidden shadow-2xl border border-champagne-gold/20 flex flex-col max-h-[90vh]">
            <header className="bg-white px-6 py-4 border-b border-champagne-gold/15 flex justify-between items-center shrink-0">
              <span className="font-display text-lg font-bold text-deep-cobalt">
                {editingSpec 
                  ? (language === 'es' ? 'Editar Especialista' : 'Edit Specialist') 
                  : (language === 'es' ? 'Nuevo Especialista' : 'New Specialist')
                }
              </span>
              <button 
                onClick={() => setShowNewSpecModal(false)}
                className="text-on-surface-variant hover:text-champagne-gold transition-colors flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </header>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (editingSpec) {
                  updateSpecialist(editingSpec.id, specForm);
                  setToastMessage(language === 'es' ? '¡Especialista actualizado!' : 'Specialist updated successfully!');
                } else {
                  addSpecialist(specForm);
                  setToastMessage(language === 'es' ? '¡Especialista registrado!' : 'Specialist registered successfully!');
                }
                setTimeout(() => setToastMessage(null), 3000);
                setShowNewSpecModal(false);
              }}
              className="flex-grow overflow-y-auto p-6 space-y-4 text-left"
            >
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Nombre Completo' : 'Full Name'} *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Alejandro Guerrero"
                  value={specForm.name}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    {language === 'es' ? 'Especialidad (EN)' : 'Specialty (EN)'} *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Vascular Surgeon"
                    value={specForm.title}
                    onChange={(e) => setSpecForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    {language === 'es' ? 'Especialidad (ES)' : 'Specialty (ES)'} *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Cirujano Vascular"
                    value={specForm.titleEs}
                    onChange={(e) => setSpecForm(prev => ({ ...prev, titleEs: e.target.value }))}
                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Email *
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@venacomfort.com"
                    value={specForm.email}
                    onChange={(e) => setSpecForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    {language === 'es' ? 'Teléfono' : 'Phone'} *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="786-555-0100"
                    value={specForm.phone}
                    onChange={(e) => setSpecForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    {language === 'es' ? 'Horario (EN)' : 'Schedule (EN)'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Mon - Fri"
                    value={specForm.schedule}
                    onChange={(e) => setSpecForm(prev => ({ ...prev, schedule: e.target.value }))}
                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    {language === 'es' ? 'Horario (ES)' : 'Schedule (ES)'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Lun - Vie"
                    value={specForm.scheduleEs}
                    onChange={(e) => setSpecForm(prev => ({ ...prev, scheduleEs: e.target.value }))}
                    className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Foto del Especialista' : 'Specialist Photo'}
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <img 
                    src={specForm.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-full object-cover border border-champagne-gold/30 bg-surface-dim" 
                  />
                  <div className="flex flex-col gap-1">
                    <label className="bg-deep-cobalt hover:bg-deep-cobalt/95 text-white px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-sm text-center inline-block">
                      <span>{language === 'es' ? 'Seleccionar Imagen' : 'Choose Image'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleSpecPhotoUpload}
                        className="sr-only" 
                      />
                    </label>
                    <span className="text-[10px] text-on-surface-variant/60">
                      {language === 'es' ? 'JPG, PNG. Max 5MB (se comprimirá)' : 'JPG, PNG. Max 5MB (will be compressed)'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={specForm.status}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold bg-white"
                >
                  <option value="Active">{language === 'es' ? 'Activo' : 'Active'}</option>
                  <option value="Inactive">{language === 'es' ? 'Inactivo' : 'Inactive'}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-champagne-gold/15 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowNewSpecModal(false)}
                  className="border border-outline-variant text-on-surface-variant px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer font-semibold"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="bg-champagne-gold text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer font-semibold"
                >
                  {language === 'es' ? 'Guardar' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {reschedulingApp && (
        <div className="fixed inset-0 bg-primary/45 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-soft-ivory rounded-3xl overflow-hidden shadow-2xl border border-champagne-gold/20 flex flex-col">
            <header className="bg-white px-6 py-4 border-b border-champagne-gold/15 flex justify-between items-center">
              <span className="font-display text-base font-bold text-deep-cobalt">
                {language === 'es' ? 'Reagendar Cita' : 'Reschedule Appointment'}
              </span>
              <button 
                onClick={() => setReschedulingApp(null)}
                className="text-on-surface-variant hover:text-champagne-gold transition-colors flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </header>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                rescheduleAppointment(reschedulingApp.id, rescheduleForm);
                logAction(currentUser?.name || 'Admin', 'Cita Reagendada', `Cita del paciente ${reschedulingApp.patientName} reagendada para el ${rescheduleForm.date} a las ${rescheduleForm.time} con ${rescheduleForm.doctor}`);
                setToastMessage(language === 'es' ? '¡Cita reagendada con éxito!' : 'Appointment rescheduled successfully!');
                setTimeout(() => setToastMessage(null), 3000);
                setReschedulingApp(null);
              }}
              className="p-6 space-y-4 text-left"
            >
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  {language === 'es' ? 'Paciente' : 'Patient'}
                </span>
                <span className="font-bold text-deep-cobalt block text-sm">
                  {reschedulingApp.patientName}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Nueva Fecha' : 'New Date'} *
                </label>
                <input 
                  type="date"
                  required
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Nueva Hora' : 'New Time'} *
                </label>
                <select 
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold bg-white"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Especialista' : 'Specialist'} *
                </label>
                <select
                  value={rescheduleForm.doctor}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, doctor: e.target.value }))}
                  className="w-full rounded-lg border-outline-variant text-xs text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold bg-white"
                >
                  {specialists.filter(s => s.status === 'Active').map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-champagne-gold/15">
                <button 
                  type="button" 
                  onClick={() => setReschedulingApp(null)}
                  className="border border-outline-variant text-on-surface-variant px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer font-semibold"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="bg-champagne-gold text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer font-semibold"
                >
                  {language === 'es' ? 'Confirmar' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT USER MODAL */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-primary/45 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-soft-ivory rounded-3xl overflow-hidden shadow-2xl border border-champagne-gold/20 flex flex-col max-h-[90vh]">
            <header className="bg-white px-6 py-4 border-b border-champagne-gold/15 flex justify-between items-center shrink-0">
              <span className="font-display text-lg font-bold text-deep-cobalt">
                {editingUser 
                  ? (language === 'es' ? 'Editar Usuario' : 'Edit User') 
                  : (language === 'es' ? 'Nuevo Usuario' : 'New User')
                }
              </span>
              <button 
                onClick={() => setShowNewUserModal(false)}
                className="text-on-surface-variant hover:text-champagne-gold transition-colors flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </header>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!userForm.name || !userForm.email || !userForm.password) {
                  alert(language === 'es' ? 'Por favor complete todos los campos.' : 'Please complete all fields.');
                  return;
                }
                if (editingUser) {
                  updateUser(editingUser.id, userForm);
                  logAction(currentUser?.name || 'Admin', 'Usuario Modificado', `Cuenta: ${userForm.email} (${userForm.name})`);
                  setToastMessage(language === 'es' ? '¡Usuario actualizado!' : 'User updated successfully!');
                } else {
                  addUser(userForm);
                  logAction(currentUser?.name || 'Admin', 'Usuario Creado', `Cuenta: ${userForm.email} (${userForm.name}) - Rol: ${userForm.role.toUpperCase()}`);
                  setToastMessage(language === 'es' ? '¡Usuario registrado!' : 'User registered successfully!');
                }
                setTimeout(() => setToastMessage(null), 3000);
                setShowNewUserModal(false);
              }}
              className="flex-grow overflow-y-auto p-6 space-y-4 text-left"
            >
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Nombre Completo' : 'Full Name'} *
                </label>
                <input 
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs rounded-lg border-outline-variant text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Correo Electrónico' : 'Email Address'} *
                </label>
                <input 
                  type="email"
                  required
                  value={userForm.email}
                  disabled={!!editingUser}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full text-xs rounded-lg border-outline-variant text-deep-cobalt disabled:bg-soft-ivory/50 focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Contraseña' : 'Password'} *
                </label>
                <input 
                  type="text"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={language === 'es' ? 'Contraseña de acceso' : 'Access password'}
                  className="w-full text-xs rounded-lg border-outline-variant text-deep-cobalt font-mono focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Rol del Sistema' : 'System Role'} *
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full text-xs rounded-lg border-outline-variant text-deep-cobalt focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold"
                >
                  <option value="specialist">{language === 'es' ? 'Especialista Clínico' : 'Clinical Specialist'}</option>
                  <option value="admin">{language === 'es' ? 'Administrador del Sistema' : 'System Administrator'}</option>
                </select>
              </div>

              <footer className="pt-4 border-t border-ice-blue flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowNewUserModal(false)}
                  className="border border-outline-variant text-on-surface-variant hover:bg-outline-variant/15 px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase cursor-pointer"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="bg-champagne-gold text-white px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase hover:brightness-110 shadow-sm cursor-pointer"
                >
                  {editingUser ? (language === 'es' ? 'Guardar' : 'Save') : (language === 'es' ? 'Registrar' : 'Register')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
