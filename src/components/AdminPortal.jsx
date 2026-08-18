import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

// Custom Canvas Signature Pad Component
function ClinicalSignaturePad({ onSave, onClear, initialSignature }) {
  const { t, language } = useLanguage();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0); // tracks how many strokes drawn

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
    setStrokeCount(0);
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
    if (isDrawing) {
      setStrokeCount(prev => prev + 1); // count completed stroke
    }
    setIsDrawing(false);
    // DO NOT auto-save here — user must click Confirm button
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    setStrokeCount(0);
    onClear();
  };

  const confirmSignature = () => {
    if (!hasSigned || strokeCount < 2) return; // require at least 2 strokes
    const canvas = canvasRef.current;
    const base64 = canvas.toDataURL('image/png');
    onSave(base64);
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
        <div className="border border-outline-variant bg-white rounded-lg p-2 space-y-2">
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {hasSigned && strokeCount < 2 && (
                <span className="text-[10px] text-amber-600 font-semibold">
                  {language === 'es' ? 'Continúa firmando...' : 'Keep signing...'}
                </span>
              )}
              {!hasSigned && (
                <span className="text-[10px] text-on-surface-variant font-medium">
                  {language === 'es' ? 'Firme dentro del cuadro' : 'Sign inside the box'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clear}
              className="text-xs text-on-surface-variant hover:text-deep-cobalt underline font-bold cursor-pointer"
            >
              {t('clearSignature')}
            </button>
          </div>
          {/* Explicit confirm button — only enabled after sufficient strokes */}
          <button
            type="button"
            disabled={!hasSigned || strokeCount < 2}
            onClick={confirmSignature}
            className={`w-full py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
              hasSigned && strokeCount >= 2
                ? 'bg-deep-cobalt text-white hover:bg-deep-cobalt/90 shadow-md cursor-pointer'
                : 'bg-surface-dim text-on-surface-variant/50 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">draw</span>
              {language === 'es' ? 'Confirmar Firma' : 'Confirm Signature'}
            </span>
          </button>
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
    logAction,
    dbMode,
    setDbMode
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

  // Clean DB Modal state variables
  const [showCleanDbModal, setShowCleanDbModal] = useState(false);
  const [cleanDbTarget, setCleanDbTarget] = useState('dev'); // 'dev' or 'prod'
  const [cleanDbConfirmText, setCleanDbConfirmText] = useState('');
  const [cleanDbCollections, setCleanDbCollections] = useState({
    specialists: false,
    users: false,
    patients: false,
    appointments: false
  });

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // deleteConfirm = { type: 'user'|'specialist', id, name } or null

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

  // Sclerotherapy Consent form input states
  const [consentInitials, setConsentInitials] = useState({
    hyperpigmentation: '',
    matting: '',
    trappedBlood: '',
    skinUlceration: '',
    bloodClots: '',
    allergicReaction: '',
    otherRare: '',
    foamSclero: '',
    noGuarantee: ''
  });
  const [consentMedicalHistory, setConsentMedicalHistory] = useState({
    dvt: false,
    clotting: false,
    pad: false,
    reaction: false,
    pregnancy: false,
    breastfeeding: false,
    infection: false,
    mobility: false,
    migraine: false,
    pfo: false,
    anticoagulant: false
  });
  const [consentPhotoConsent, setConsentPhotoConsent] = useState(null);
  const [consentPrintedName, setConsentPrintedName] = useState('');

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

      if (selectedPatient.consentDetails) {
        setConsentInitials(selectedPatient.consentDetails.initials || {
          hyperpigmentation: '',
          matting: '',
          trappedBlood: '',
          skinUlceration: '',
          bloodClots: '',
          allergicReaction: '',
          otherRare: '',
          foamSclero: '',
          noGuarantee: ''
        });
        setConsentMedicalHistory(selectedPatient.consentDetails.medicalHistory || {
          dvt: false,
          clotting: false,
          pad: false,
          reaction: false,
          pregnancy: false,
          breastfeeding: false,
          infection: false,
          mobility: false,
          migraine: false,
          pfo: false,
          anticoagulant: false
        });
        setConsentPhotoConsent(selectedPatient.consentDetails.photoConsent ?? null);
        setConsentPrintedName(selectedPatient.consentDetails.printedName || selectedPatient.firstName + ' ' + selectedPatient.lastName);
      } else {
        setConsentInitials({
          hyperpigmentation: '',
          matting: '',
          trappedBlood: '',
          skinUlceration: '',
          bloodClots: '',
          allergicReaction: '',
          otherRare: '',
          foamSclero: '',
          noGuarantee: ''
        });
        setConsentMedicalHistory({
          dvt: false,
          clotting: false,
          pad: false,
          reaction: false,
          pregnancy: false,
          breastfeeding: false,
          infection: false,
          mobility: false,
          migraine: false,
          pfo: false,
          anticoagulant: false
        });
        setConsentPhotoConsent(null);
        setConsentPrintedName(selectedPatient.firstName + ' ' + selectedPatient.lastName);
      }
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

  const handleCleanDb = () => {
    setCleanDbConfirmText('');
    setCleanDbTarget('dev');
    setCleanDbCollections({
      specialists: false,
      users: false,
      patients: false,
      appointments: false
    });
    setShowCleanDbModal(true);
  };

  const handleCleanDbSubmit = async (e) => {
    e.preventDefault();

    const selectedAny = Object.values(cleanDbCollections).some(val => val);
    if (!selectedAny) {
      alert(
        language === 'es'
          ? 'Por favor, selecciona al menos una colección para limpiar.'
          : 'Please select at least one collection to clear.'
      );
      return;
    }

    const expectedText = cleanDbTarget === 'prod' ? 'ELIMINAR PRODUCCION' : 'ELIMINAR DESARROLLO';
    if (cleanDbConfirmText.trim() !== expectedText) {
      alert(
        language === 'es'
          ? `Por favor, escribe exactamente "${expectedText}" para continuar.`
          : `Please type exactly "${expectedText}" to proceed.`
      );
      return;
    }

    try {
      await cleanProductionDb(cleanDbTarget, cleanDbCollections, currentUser);
      setShowCleanDbModal(false);
      alert(language === 'es' ? 'Limpieza de base de datos completada con éxito.' : 'Database cleanup completed successfully.');
    } catch (err) {
      alert((language === 'es' ? 'Error al limpiar base de datos: ' : 'Database cleanup error: ') + err.message);
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
  // Native browser print / Save as PDF (100% vector, crisp text, zero distortion)
  const handlePrintPDF = () => {
    if (!selectedPatient) return;
    window.print();
    logAction(currentUser?.name || 'Admin', 'Expediente Impr/PDF', `Impresión/PDF procesado para ${selectedPatient.firstName} ${selectedPatient.lastName}`);
  };

  // PDF Generation using native jsPDF & html2canvas
  const exportPDF = async () => {
    const element = document.getElementById('printable-report-area');
    if (!element || !selectedPatient) return;

    const originalStyle = element.getAttribute('style') || '';

    // Show temporary print container behind main layout for A4 canvas capture
    element.style.cssText = 'display: block !important; position: fixed !important; left: 0 !important; top: 0 !important; width: 794px !important; z-index: -9999 !important; background: #ffffff !important; visibility: visible !important;';

    // Allow DOM layout and wait for images to decode
    await new Promise(resolve => setTimeout(resolve, 300));
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map(img => {
        if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794
      });

      element.setAttribute('style', originalStyle);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2; // 190mm
      const pageHeightMM = pdfHeight - margin * 2; // 277mm
      
      const imgHeightMM = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeightMM;
      let position = margin;

      // Add first page
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeightMM);
      heightLeft -= pageHeightMM;

      // Add subsequent pages if content exceeds single page height
      while (heightLeft > 0) {
        position = heightLeft - imgHeightMM + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeightMM);
        heightLeft -= pageHeightMM;
      }

      const safePatientName = `${selectedPatient.firstName || 'Paciente'}_${selectedPatient.lastName || ''}`.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `VenaComfort_Historial_Clinico_${safePatientName}.pdf`;

      // Trigger standard PDF save
      pdf.save(filename);

      logAction(currentUser?.name || 'Admin', 'Expediente Exportado', `PDF descargado para ${selectedPatient.firstName} ${selectedPatient.lastName}`);
    } catch (err) {
      console.error('PDF Export failed:', err);
      element.setAttribute('style', originalStyle);
      alert(language === 'es' ? 'Error al generar el documento PDF.' : 'Error generating PDF document.');
    }
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
            <div className="flex items-center gap-2 border border-outline-variant bg-soft-ivory/30 px-3 py-2 rounded-xl text-xs font-semibold text-deep-cobalt shadow-sm">
              <span className="material-symbols-outlined text-base">database</span>
              <span>{language === 'es' ? 'Base de Datos:' : 'Database:'}</span>
              <select 
                value={dbMode} 
                onChange={(e) => {
                  setDbMode(e.target.value);
                  alert(
                    language === 'es'
                      ? `Modo de base de datos cambiado a: ${e.target.value === 'local' ? 'Local (Offline)' : 'Nube (Firebase)'}. Por favor, recarga la página para aplicar el cambio.`
                      : `Database mode changed to: ${e.target.value === 'local' ? 'Local (Offline)' : 'Cloud (Firebase)'}. Please reload the page to apply the change.`
                  );
                }}
                className="bg-transparent border-none text-xs font-bold text-champagne-gold focus:ring-0 cursor-pointer p-0 select-none outline-none focus:outline-none"
              >
                <option value="local">Local (Offline)</option>
                <option value="cloud">Cloud (Firebase)</option>
              </select>
            </div>
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
                {currentUser?.role === 'admin' && u.id !== 'user-admin' && u.email !== currentUser?.email && (
                  <button
                    onClick={() => setDeleteConfirm({ type: 'user', id: u.id, name: u.name })}
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
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(spec.name)}&background=0A2540&color=ffffff`;
                  }}
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
                    onClick={() => setDeleteConfirm({ type: 'specialist', id: spec.id, name: spec.name })}
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
    <>
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

                        <div className="bg-white border border-outline-variant/60 rounded-xl p-4 md:p-6 max-h-[500px] overflow-y-auto text-xs text-on-surface-variant leading-relaxed space-y-6">
                          <div className="text-center space-y-1">
                            <h5 className="font-display font-bold text-sm text-deep-cobalt">VENA COMFORT VEIN STUDIO, LLC</h5>
                            <h6 className="font-display font-bold text-xs text-secondary">INFORMED CONSENT FOR COSMETIC SCLEROTHERAPY</h6>
                            <h6 className="font-display font-bold text-xs text-secondary">CONSENTIMIENTO INFORMADO PARA ESCLEROTERAPIA COSMÉTICA</h6>
                          </div>

                          {/* Metadata Fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-ice-blue pb-4">
                            <div>
                              <p className="font-bold text-deep-cobalt">Patient Name / Nombre del paciente:</p>
                              <p className="bg-soft-ivory/40 px-2 py-1 rounded mt-1 border border-outline-variant/30">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                            </div>
                            <div>
                              <p className="font-bold text-deep-cobalt">Date of Birth / Fecha de nacimiento:</p>
                              <p className="bg-soft-ivory/40 px-2 py-1 rounded mt-1 border border-outline-variant/30">{selectedPatient.dob || '—'}</p>
                            </div>
                            <div>
                              <p className="font-bold text-deep-cobalt">Date / Fecha:</p>
                              <p className="bg-soft-ivory/40 px-2 py-1 rounded mt-1 border border-outline-variant/30">
                                {selectedPatient.consentSigned 
                                  ? (selectedPatient.consentDetails?.date || '—') 
                                  : new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')
                                }
                              </p>
                            </div>
                            <div>
                              <p className="font-bold text-deep-cobalt">Treating Provider / Proveedor:</p>
                              <p className="bg-soft-ivory/40 px-2 py-1 rounded mt-1 border border-outline-variant/30">Dr. Elena Rodriguez</p>
                            </div>
                          </div>

                          {/* 1. PROCEDURE */}
                          <div className="space-y-2">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">1. PROCEDURE / PROCEDIMIENTO</h6>
                            <p className="italic font-bold text-[10px] text-secondary">ENGLISH</p>
                            <p>Sclerotherapy is a procedure used to treat appropriate spider veins (telangiectasias), reticular veins, and selected small superficial varicose veins. A sclerosing medication is injected directly into the selected vein. The medication irritates the inner lining of the vein, causing it to close. Over time, the treated vein is gradually absorbed by the body and may become less visible.</p>
                            <p>I understand that this treatment is being performed primarily for cosmetic purposes unless otherwise documented.</p>
                            <p className="italic font-bold text-[10px] text-secondary mt-2">ESPAÑOL</p>
                            <p>La escleroterapia es un procedimiento utilizado para tratar venas de araña (telangiectasias), venas reticulares y ciertas venas varicosas superficiales pequeñas que sean apropiadas para tratamiento. Se inyecta un medicamento esclerosante directamente dentro de la vena seleccionada. El medicamento irrita la capa interna de la vena, provocando su cierre. Con el tiempo, la vena tratada es gradualmente absorbida por el organismo y puede hacerse menos visible.</p>
                            <p>Entiendo que este tratamiento se realiza principalmente con fines cosméticos, a menos que se documente lo contrario.</p>
                          </div>

                          {/* 2. EXPECTED RESULTS */}
                          <div className="space-y-2">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">2. EXPECTED RESULTS AND LIMITATIONS / RESULTADOS ESPERADOS Y LIMITACIONES</h6>
                            <p className="italic font-bold text-[10px] text-secondary">ENGLISH</p>
                            <p>I understand that:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Results vary between patients.</li>
                              <li>Improvement occurs gradually and may take several weeks to months.</li>
                              <li>More than one treatment session may be necessary.</li>
                              <li>Complete disappearance of all treated veins cannot be guaranteed.</li>
                              <li>Some veins may respond only partially or may not respond.</li>
                              <li>Treated veins may recur or become visible again.</li>
                              <li>New spider or reticular veins may develop in the future.</li>
                              <li>Additional treatment may be necessary and may involve additional charges.</li>
                            </ul>
                            <p className="font-semibold text-deep-cobalt">No specific cosmetic result has been promised or guaranteed.</p>
                            
                            <p className="italic font-bold text-[10px] text-secondary mt-2">ESPAÑOL</p>
                            <p>Entiendo que:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Los resultados varían entre pacientes.</li>
                              <li>La mejoría ocurre gradualmente y puede tomar varias semanas o meses.</li>
                              <li>Puede ser necesario realizar más de una sesión.</li>
                              <li>No se puede garantizar la desaparición completa de todas las venas tratadas.</li>
                              <li>Algunas venas pueden responder parcialmente o no responder al tratamiento.</li>
                              <li>Las venas tratadas pueden reaparecer o hacerse visibles nuevamente.</li>
                              <li>Pueden desarrollarse nuevas venas de araña o venas reticulares en el futuro.</li>
                              <li>Pueden ser necesarios tratamientos adicionales y estos pueden generar cargos adicionales.</li>
                            </ul>
                            <p className="font-semibold text-deep-cobalt">No se me ha prometido ni garantizado ningún resultado cosmético específico.</p>
                          </div>

                          {/* 3. COMMON SIDE EFFECTS */}
                          <div className="space-y-2">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">3. COMMON SIDE EFFECTS / EFECTOS SECUNDARIOS COMUNES</h6>
                            <p className="italic font-bold text-[10px] text-secondary">ENGLISH</p>
                            <p>Temporary effects may include burning or stinging during injection, itching, tenderness, redness, bruising, mild swelling, firmness or small lumps along the treated vein, inflammation, and temporary discoloration.</p>
                            <p>Treated veins may initially appear darker or more noticeable before improving.</p>
                            
                            <p className="italic font-bold text-[10px] text-secondary mt-2">ESPAÑOL</p>
                            <p>Los efectos temporales pueden incluir ardor o sensación de picadura durante la inyección, picazón, sensibilidad, enrojecimiento, moretones, inflamación leve, áreas firmes o pequeños bultos a lo largo de la vena tratada, inflamación y cambios temporales en el color de la piel.</p>
                            <p>Las venas tratadas pueden inicialmente verse más oscuras o más visibles antes de comenzar a mejorar.</p>
                          </div>

                          {/* 4. IMPORTANT RISKS */}
                          <div className="space-y-4">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">4. IMPORTANT RISKS / RIESGOS IMPORTANTES</h6>
                            <p className="italic text-on-surface-variant/80">Please initial each section after reviewing it / Por favor coloque sus iniciales después de revisar cada sección.</p>
                            
                            {/* Risk Items */}
                            {[
                              { key: 'hyperpigmentation', title: 'HYPERPIGMENTATION / HIPERPIGMENTACIÓN', en: 'Brown or dark discoloration may develop over or around treated veins. It commonly fades gradually but may remain for several months and, rarely, may persist long-term or permanently.', es: 'Puede desarrollarse una coloración marrón u oscura sobre o alrededor de las venas tratadas. Generalmente desaparece gradualmente, pero puede permanecer durante varios meses y, en raras ocasiones, persistir a largo plazo o permanentemente.' },
                              { key: 'matting', title: 'TELANGIECTATIC MATTING / MATTING TELANGIECTÁSICO', en: 'Very small red or purple blood vessels may develop near the treated area. These may resolve spontaneously but can persist and may require additional treatment.', es: 'Pueden aparecer vasos sanguíneos muy pequeños de color rojo o morado cerca del área tratada. Estos pueden desaparecer espontáneamente, pero también pueden persistir y requerir tratamiento adicional.' },
                              { key: 'trappedBlood', title: 'TRAPPED BLOOD / SANGRE ATRAPADA', en: 'Blood may become trapped or coagulated inside a treated vein, producing a dark, firm, tender area or small lump. In some cases, additional evaluation or treatment may be recommended.', es: 'Puede quedar sangre atrapada o coagulada dentro de una vena tratada, produciendo un área oscura, firme, sensible o un pequeño bulto. En algunos casos puede recomendarse evaluación o tratamiento adicional.' },
                              { key: 'skinUlceration', title: 'SKIN ULCERATION, TISSUE INJURY OR NECROSIS / ÚLCERA, LESIÓN O NECROSIS DE LA PIEL', en: 'Although uncommon, injury to the skin or surrounding tissue may occur, including blistering, ulceration or tissue necrosis. Healing may take time and may result in discoloration or permanent scarring.', es: 'Aunque es poco común, puede ocurrir lesión de la piel o del tejido circundante, incluyendo ampollas, ulceración o necrosis del tejido. La recuperación puede tomar tiempo y puede producir cambios en la pigmentación o cicatrices permanentes.' },
                              { key: 'bloodClots', title: 'BLOOD CLOTS / COÁGULOS SANGUÍNEOS', en: 'Superficial thrombophlebitis or clotting within treated superficial veins may occur. Deep vein thrombosis (DVT) and pulmonary embolism (PE) are uncommon but potentially serious complications.', es: 'Puede ocurrir tromboflebitis superficial o formación de coágulos dentro de las venas superficiales tratadas. La trombosis venosa profunda (DVT/TVP) y la embolia pulmonar (PE/EP) son complicaciones poco frecuentes pero potencialmente graves.' },
                              { key: 'allergicReaction', title: 'ALLERGIC REACTION / REACCIÓN ALÉRGICA', en: 'Allergic reactions to the sclerosant are uncommon but may occur. Rarely, a severe allergic or anaphylactic reaction may occur and require emergency medical treatment.', es: 'Las reacciones alérgicas al medicamento esclerosante son poco frecuentes, pero pueden ocurrir. En raras ocasiones puede ocurrir una reacción alérgica grave o anafiláctica que requiera tratamiento médico de emergencia.' },
                              { key: 'otherRare', title: 'OTHER RARE COMPLICATIONS / OTRAS COMPLICACIONES POCO FRECUENTES', en: 'Other potential complications include infection, nerve irritation or injury, persistent pain, scarring, vasovagal reaction, dizziness or fainting. Inadvertent injection outside the intended vein or into an artery can cause significant tissue injury.', es: 'Otras posibles complicaciones incluyen infección, irritación o lesión de nervios, dolor persistente, cicatrices, reacción vasovagal, mareo o desmayo. La inyección accidental fuera de la vena seleccionada o dentro de una arteria puede causar una lesión significativa del tejido.' },
                              { key: 'foamSclero', title: 'FOAM SCLEROTHERAPY RISKS, IF USED / RIESGOS DE ESCLEROTERAPIA CON ESPUMA, SI SE UTILIZA', en: 'If foam sclerotherapy is used, temporary visual disturbances, headache or migraine-like symptoms, tingling, or other neurologic symptoms have been reported. Serious neurologic complications are rare but possible.', es: 'Si se utiliza escleroterapia con espuma, se han reportado alteraciones visuales temporales, dolor de cabeza o síntomas similares a migraña, hormigueo u otros síntomas neurológicos. Las complicaciones neurológicas graves son poco frecuentes, pero posibles.' },
                              { key: 'noGuarantee', title: 'NO GUARANTEE OF RESULTS / NO SE GARANTIZAN LOS RESULTADOS', en: 'I understand that multiple sessions may be necessary and that complete elimination of my veins cannot be guaranteed.', es: 'Entiendo que pueden ser necesarias varias sesiones y que no se puede garantizar la eliminación completa de mis venas.' }
                            ].map(risk => (
                              <div key={risk.key} className="p-3 bg-soft-ivory/30 rounded-lg border border-outline-variant/40 flex items-start gap-4">
                                <div className="shrink-0 flex flex-col items-center">
                                  <input 
                                    type="text"
                                    required
                                    disabled={selectedPatient.consentSigned}
                                    maxLength={3}
                                    value={consentInitials[risk.key] || ''}
                                    onChange={(e) => setConsentInitials(prev => ({ ...prev, [risk.key]: e.target.value.toUpperCase() }))}
                                    placeholder="Init"
                                    className="w-12 text-center font-mono font-bold text-[10px] rounded border-outline-variant text-deep-cobalt focus:ring-1 focus:ring-champagne-gold uppercase py-1 px-0"
                                  />
                                  <span className="text-[8px] text-on-surface-variant/70 mt-1 uppercase tracking-wider font-bold">Initials *</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-deep-cobalt text-[10px]">{risk.title}</p>
                                  <p className="text-[10px] text-on-surface-variant leading-relaxed"><strong className="text-[9px] uppercase tracking-wider text-secondary">EN:</strong> {risk.en}</p>
                                  <p className="text-[10px] text-on-surface-variant leading-relaxed"><strong className="text-[9px] uppercase tracking-wider text-secondary">ES:</strong> {risk.es}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 5. ALTERNATIVES */}
                          <div className="space-y-2">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">5. ALTERNATIVES / ALTERNATIVAS</h6>
                            <p className="italic font-bold text-[10px] text-secondary">ENGLISH</p>
                            <p>Depending upon the type of vein and my individual condition, alternatives may include no treatment/observation, compression therapy, conservative management, surface laser/light-based treatment for appropriate vessels, or evaluation for other venous treatments when clinically indicated.</p>
                            
                            <p className="italic font-bold text-[10px] text-secondary mt-2">ESPAÑOL</p>
                            <p>Dependiendo del tipo de vena y de mi condición individual, las alternativas pueden incluir no realizar tratamiento/observación, terapia de compresión, tratamiento conservador, láser superficial u otros tratamientos con luz para vasos apropiados, o evaluación para otros tratamientos venosos cuando estén clínicamente indicados.</p>
                          </div>

                          {/* 6. COMPRESSION AND AFTERCARE */}
                          <div className="space-y-2">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">6. COMPRESSION AND AFTERCARE / COMPRESIÓN Y CUIDADOS POSTERIORES</h6>
                            <p className="italic font-bold text-[10px] text-secondary">ENGLISH</p>
                            <p>I understand that compression stockings or other compression therapy may be recommended following treatment. I agree to follow the post-treatment instructions provided to me regarding compression, walking/activity, exercise, heat exposure, sun exposure, medications, and follow-up.</p>
                            <p>I understand that following the recommended aftercare is an important part of my treatment.</p>
                            
                            <p className="italic font-bold text-[10px] text-secondary mt-2">ESPAÑOL</p>
                            <p>Entiendo que puede recomendarse el uso de medias de compresión u otra terapia de compresión después del tratamiento. Acepto seguir las instrucciones posteriores al procedimiento relacionadas con compresión, caminar/actividad física, ejercicio, exposición al calor y al sol, medicamentos y seguimiento.</p>
                            <p>Entiendo que cumplir con los cuidados recomendados después del procedimiento es una parte importante de mi tratamiento.</p>
                          </div>

                          {/* 7. MEDICAL INFORMATION */}
                          <div className="space-y-4">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">7. MEDICAL INFORMATION / INFORMACIÓN MÉDICA</h6>
                            <p className="italic text-on-surface-variant/80">Please check any history of the following / Marcar en caso de tener antecedentes de:</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-soft-ivory/20 p-4 rounded-xl border border-outline-variant/40">
                              {[
                                { key: 'dvt', labelEn: 'DVT or pulmonary embolism', labelEs: 'DVT/TVP o embolia pulmonar' },
                                { key: 'clotting', labelEn: 'Blood-clotting disorder', labelEs: 'Trastorno de coagulación' },
                                { key: 'pad', labelEn: 'Significant peripheral arterial disease', labelEs: 'Enfermedad arterial periférica' },
                                { key: 'reaction', labelEn: 'Previous reaction/allergy to a sclerosant', labelEs: 'Alergia previa a un esclerosante' },
                                { key: 'pregnancy', labelEn: 'Pregnancy or possible pregnancy', labelEs: 'Embarazo o posibilidad' },
                                { key: 'breastfeeding', labelEn: 'Breastfeeding', labelEs: 'Lactancia' },
                                { key: 'infection', labelEn: 'Active infection or skin infection', labelEs: 'Infección activa o de piel' },
                                { key: 'mobility', labelEn: 'Significant limitation in mobility', labelEs: 'Limitación de movilidad' },
                                { key: 'migraine', labelEn: 'Migraine with aura or neurologic symptoms', labelEs: 'Migraña con aura o neurológicos' },
                                { key: 'pfo', labelEn: 'Known patent foramen ovale (PFO) or cardiac condition', labelEs: 'Foramen oval permeable (PFO)' },
                                { key: 'anticoagulant', labelEn: 'Anticoagulant or antiplatelet medications', labelEs: 'Anticoagulantes o antiplaquetarios' }
                              ].map(item => (
                                <label key={item.key} className="flex items-start gap-2.5 text-xs text-deep-cobalt cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    disabled={selectedPatient.consentSigned}
                                    checked={consentMedicalHistory[item.key] || false}
                                    onChange={(e) => setConsentMedicalHistory(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                    className="rounded border-outline-variant text-champagne-gold focus:ring-champagne-gold mt-0.5"
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{item.labelEn}</span>
                                    <span className="text-[10px] text-on-surface-variant/75 font-medium">{item.labelEs}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* 8. CLINICAL PHOTOGRAPHY */}
                          <div className="space-y-3">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">8. CLINICAL PHOTOGRAPHY / FOTOGRAFÍA CLÍNICA</h6>
                            <p className="italic text-on-surface-variant/80">Select one option / Seleccione una opción:</p>
                            
                            <div className="space-y-3 bg-soft-ivory/20 p-4 rounded-xl border border-outline-variant/40">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input 
                                  type="radio"
                                  name="photoConsent"
                                  disabled={selectedPatient.consentSigned}
                                  checked={consentPhotoConsent === true}
                                  onChange={() => setConsentPhotoConsent(true)}
                                  className="text-champagne-gold focus:ring-champagne-gold mt-0.5"
                                />
                                <div className="text-xs text-deep-cobalt flex flex-col">
                                  <span><strong>I CONSENT / ACEPTO</strong> clinical photographs for my confidential medical record.</span>
                                  <span className="text-[10px] text-on-surface-variant/75 font-medium mt-0.5">Acepto fotografías clínicas para mi registro médico confidencial.</span>
                                </div>
                              </label>

                              <label className="flex items-start gap-3 cursor-pointer">
                                <input 
                                  type="radio"
                                  name="photoConsent"
                                  disabled={selectedPatient.consentSigned}
                                  checked={consentPhotoConsent === false}
                                  onChange={() => setConsentPhotoConsent(false)}
                                  className="text-champagne-gold focus:ring-champagne-gold mt-0.5"
                                />
                                <div className="text-xs text-deep-cobalt flex flex-col">
                                  <span><strong>I DO NOT CONSENT / NO ACEPTO</strong> clinical photographs.</span>
                                  <span className="text-[10px] text-on-surface-variant/75 font-medium mt-0.5">No acepto fotografías clínicas.</span>
                                </div>
                              </label>
                            </div>
                            <p className="text-[10px] text-on-surface-variant/80 mt-1">These photographs will not be used for social media, advertising, websites, or other promotional purposes without separate authorization.</p>
                            <p className="text-[10px] text-on-surface-variant/80">Estas fotografías no serán utilizadas en redes sociales, publicidad, páginas web u otros fines promocionales sin una autorización por separado.</p>
                          </div>

                          {/* 9. EMERGENCY WARNING SIGNS */}
                          <div className="space-y-2">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">9. EMERGENCY WARNING SIGNS / SIGNOS DE ALARMA</h6>
                            <p className="italic font-bold text-[10px] text-secondary">ENGLISH</p>
                            <p>I understand that I should seek prompt medical attention for severe or rapidly worsening pain or swelling, significant skin changes, chest pain, shortness of breath, coughing blood, sudden weakness or numbness, difficulty speaking, significant visual changes, or other severe/unexpected symptoms.</p>
                            
                            <p className="italic font-bold text-[10px] text-secondary mt-2">ESPAÑOL</p>
                            <p>Entiendo que debo buscar atención médica inmediata si presento dolor o inflamación severa o que empeora rápidamente, cambios importantes en la piel, dolor de pecho, dificultad para respirar, tos con sangre, debilidad o entumecimiento repentino, dificultad para hablar, cambios importantes en la visión u otros síntomas severos o inesperados.</p>
                          </div>

                          {/* 10. INFORMED AND VOLUNTARY CONSENT */}
                          <div className="space-y-2">
                            <h6 className="font-bold text-deep-cobalt uppercase border-b border-surface-dim pb-1 text-[11px]">10. INFORMED AND VOLUNTARY CONSENT / CONSENTIMIENTO INFORMADO Y VOLUNTARIO</h6>
                            <p className="italic font-bold text-[10px] text-secondary">ENGLISH</p>
                            <p>I acknowledge that the nature and purpose of sclerotherapy, expected benefits, limitations, reasonable alternatives, risks and potential complications have been explained to me. I have had the opportunity to ask questions and my questions have been answered to my satisfaction. I understand that medicine is not an exact science and no particular result has been promised or guaranteed. I understand that I may decline treatment or withdraw my consent before the procedure begins. I voluntarily authorize the treating provider to perform cosmetic sclerotherapy on the treatment areas identified above and to provide reasonable medical care should an unexpected reaction or complication occur.</p>
                            
                            <p className="italic font-bold text-[10px] text-secondary mt-2">ESPAÑOL</p>
                            <p>Reconozco que se me han explicado la naturaleza y el propósito de la escleroterapia, sus beneficios esperados, limitaciones, alternativas razonables, riesgos y posibles complicaciones. He tenido la oportunidad de hacer preguntas y mis preguntas han sido respondidas satisfactoriamente. Entiendo que la medicina no es una ciencia exacta y que no se me ha prometido ni garantizado ningún resultado específico. Entiendo que puedo rechazar el tratamiento o retirar mi consentimiento antes de que comience el procedimiento. Autorizo voluntariamente al proveedor tratante a realizar escleroterapia cosmética en las áreas identificadas anteriormente y a proporcionar atención médica razonable en caso de una reacción o complicación inesperada.</p>
                          </div>

                          {/* Printed Name Input */}
                          <div className="space-y-2 pt-3 border-t border-outline-variant/60">
                            <label className="block text-xs font-bold text-deep-cobalt uppercase">Patient Printed Name / Nombre del paciente *</label>
                            <input 
                              type="text"
                              required
                              disabled={selectedPatient.consentSigned}
                              value={consentPrintedName}
                              onChange={(e) => setConsentPrintedName(e.target.value)}
                              className="w-full max-w-md text-xs rounded-lg border-outline-variant text-deep-cobalt focus:border-champagne-gold focus:ring-champagne-gold"
                              placeholder="First and Last Name / Nombre y Apellidos"
                            />
                          </div>
                        </div>

                        {selectedPatient.consentSigned ? (
                          <div className="bg-soft-ivory/20 p-4 rounded-xl border border-outline-variant/60 space-y-4">
                            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-base">check_circle</span>
                              {language === 'es' ? 'Documento firmado digitalmente y guardado con éxito' : 'Document digitally signed and successfully recorded'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Patient Signature / Firma del paciente:</span>
                                <div className="border border-outline-variant bg-white rounded-lg p-2 h-24 flex items-center justify-center shadow-inner mt-1 max-w-xs">
                                  <img src={selectedPatient.consentSignatureUrl} alt="Consent Signature" className="max-h-full object-contain" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 pt-3 border-t border-ice-blue">
                            <label className="block text-xs font-bold text-deep-cobalt uppercase">Patient Signature Required / Firma del Paciente Requerida *</label>
                            <ClinicalSignaturePad 
                              initialSignature={null}
                              onSave={(base64) => {
                                // Perform validations
                                const incompleteInitials = Object.entries(consentInitials).some(([k, v]) => !v || v.trim().length === 0);
                                if (incompleteInitials) {
                                  alert(language === 'es' 
                                    ? 'Por favor, introduce tus iniciales en todas las secciones de riesgos antes de firmar.' 
                                    : 'Please enter your initials in all risk sections before signing.'
                                  );
                                  return;
                                }
                                if (consentPhotoConsent === null) {
                                  alert(language === 'es'
                                    ? 'Por favor, selecciona una opción de consentimiento de fotografía clínica antes de firmar.'
                                    : 'Please select a clinical photography consent option before signing.'
                                  );
                                  return;
                                }
                                if (!consentPrintedName || consentPrintedName.trim().length === 0) {
                                  alert(language === 'es'
                                    ? 'Por favor, introduce tu nombre completo impreso antes de firmar.'
                                    : 'Please enter your printed full name before signing.'
                                  );
                                  return;
                                }

                                // Save details
                                const consentDetails = {
                                  initials: consentInitials,
                                  medicalHistory: consentMedicalHistory,
                                  photoConsent: consentPhotoConsent,
                                  printedName: consentPrintedName,
                                  date: new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US'),
                                  time: new Date().toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US')
                                };

                                saveConsentSignature(selectedPatientId, base64, consentDetails);
                                logAction(currentUser?.name || 'Admin', 'Consentimiento Firmado', `Consentimiento informado bilingüe para escleroterapia firmado por ${consentPrintedName}`);
                                alert(language === 'es' ? 'Firma de consentimiento registrada.' : 'Consent signature registered.');
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

                      <div className="flex justify-center pt-2">
                        <button
                          onClick={handlePrintPDF}
                          className="bg-deep-cobalt text-white font-bold text-xs tracking-wider uppercase px-8 py-3.5 rounded-xl hover:bg-deep-cobalt/90 shadow-lg cursor-pointer inline-flex items-center gap-2.5 transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                          {language === 'es' ? 'Imprimir / Guardar como PDF' : 'Print / Save as PDF'}
                        </button>
                      </div>
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
        <div id="printable-report-area" style={{ display: 'none', width: '800px', backgroundColor: '#ffffff', color: '#0A2540', padding: '30px', fontFamily: 'sans-serif', lineHeight: '1.6' }} className="space-y-6">
          {/* Letterhead Header */}
          <div className="flex justify-between items-center pb-4" style={{ borderBottom: '2px solid #C5A880' }}>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="VenaComfort Logo" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0A2540' }}>VenaComfort</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#C5A880' }}>Vein Studio & Aesthetic Care</span>
              </div>
            </div>
            <div className="text-right text-[10px] font-medium" style={{ color: '#4A5568' }}>
              <p>786-531-0664 | info@venacomfort.com</p>
              <p>Serving Miami-Dade & South Florida</p>
              <p className="font-bold mt-1" style={{ color: '#0A2540' }}>EXPEDIENTE CLÍNICO REGLAMENTARIO HIPAA</p>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#F8F6F0', border: '1px solid #E5E0D8' }}>
            <h2 className="text-lg font-bold uppercase tracking-wide" style={{ color: '#0A2540' }}>Resumen Clínico Completo e Historial del Paciente</h2>
            <p className="text-[10px] uppercase font-semibold mt-0.5" style={{ color: '#718096' }}>Fecha de generación: {new Date().toLocaleDateString()} @ {new Date().toLocaleTimeString()}</p>
          </div>

          {/* 1. Demographics & Emergency Contact */}
          <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-xl" style={{ border: '1px solid #E2E8F0', backgroundColor: '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="space-y-1.5">
              <p className="font-bold text-[10px] uppercase tracking-wider pb-1" style={{ color: '#0A2540', borderBottom: '1px solid #EDF2F7' }}>Datos Demográficos</p>
              <p><span className="font-semibold">Nombre:</span> {selectedPatient.firstName} {selectedPatient.lastName}</p>
              <p><span className="font-semibold">Fecha Nacimiento:</span> {selectedPatient.dob} ({selectedPatient.gender})</p>
              <p><span className="font-semibold">Correo:</span> {selectedPatient.email}</p>
              <p><span className="font-semibold">Teléfono:</span> {selectedPatient.phone}</p>
              <p><span className="font-semibold">Dirección:</span> {selectedPatient.address || 'N/A'}</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-bold text-[10px] uppercase tracking-wider pb-1" style={{ color: '#0A2540', borderBottom: '1px solid #EDF2F7' }}>Contacto de Emergencia</p>
              <p><span className="font-semibold">Nombre:</span> {selectedPatient.emergName || 'N/A'}</p>
              <p><span className="font-semibold">Teléfono:</span> {selectedPatient.emergPhone || 'N/A'}</p>
              <p className="font-bold text-[10px] uppercase tracking-wider pb-1 mt-2" style={{ color: '#0A2540', borderBottom: '1px solid #EDF2F7' }}>Motivo de Consulta Vascular</p>
              <p className="italic" style={{ color: '#4A5568' }}>{selectedPatient.concerns || 'Ninguno reportado'}</p>
            </div>
          </div>

          {/* 2. Safety Questionnaire Answers */}
          <div className="space-y-2 p-4 rounded-xl text-xs" style={{ border: '1px solid #E2E8F0', backgroundColor: '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <p className="font-bold text-xs uppercase tracking-wide pb-1" style={{ color: '#0A2540', borderBottom: '1px solid #EDF2F7' }}>Cuestionario de Seguridad e Ingreso</p>
            <div className="grid grid-cols-2 gap-3">
              <p><span className="font-semibold">Embarazo/Lactancia:</span> <span className={selectedPatient.pregnancy === 'Yes' ? 'font-bold text-red-600' : ''}>{selectedPatient.pregnancy === 'Yes' ? 'Sí' : 'No'}</span></p>
              <p><span className="font-semibold">Antecedentes de Coágulos/TVP:</span> <span className={selectedPatient.clotsHistory === 'Yes' ? 'font-bold text-amber-600' : ''}>{selectedPatient.clotsHistory === 'Yes' ? 'Sí' : 'No'}</span></p>
              <p><span className="font-semibold">Alergias (látex/esclerosantes):</span> <span>{selectedPatient.allergiesHistory || 'No'}</span> {selectedPatient.allergiesHistoryDetail && `(${selectedPatient.allergiesHistoryDetail})`}</p>
              <p><span className="font-semibold">Procedimientos Venosos Previos:</span> <span>{selectedPatient.prevVeinTreatments || 'No'}</span> {selectedPatient.prevVeinTreatmentsDetail && `(${selectedPatient.prevVeinTreatmentsDetail})`}</p>
            </div>
          </div>

          {/* 3. Complete Appointment History */}
          <div className="space-y-3 p-4 rounded-xl text-xs" style={{ border: '1px solid #E2E8F0', backgroundColor: '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <p className="font-bold text-xs uppercase tracking-wide pb-1" style={{ color: '#0A2540', borderBottom: '1px solid #EDF2F7' }}>Historial Completo de Citas</p>
            {selectedPatient.appointments && selectedPatient.appointments.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#718096', fontSize: '10px', textTransform: 'uppercase' }}>
                    <th className="py-1">Fecha / Hora</th>
                    <th className="py-1">Tratamiento / Servicio</th>
                    <th className="py-1">Especialista</th>
                    <th className="py-1 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPatient.appointments.map((app) => (
                    <tr key={app.id} style={{ borderBottom: '1px border-dashed #EDF2F7' }}>
                      <td className="py-2 font-semibold" style={{ color: '#0A2540' }}>{app.date} @ {app.time}</td>
                      <td className="py-2">{app.service}</td>
                      <td className="py-2">{app.doctor}</td>
                      <td className="py-2 text-right font-bold uppercase text-[9px]">
                        {app.status === 'completed' && <span style={{ color: '#059669' }}>Atendido / Presente</span>}
                        {app.status === 'confirmed' && <span style={{ color: '#2563EB' }}>Confirmado</span>}
                        {app.status === 'no_show' && <span style={{ color: '#DC2626' }}>No se presentó</span>}
                        {(app.status === 'pending_confirmation' || !app.status) && <span style={{ color: '#D97706' }}>Pendiente</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="italic text-[11px]" style={{ color: '#718096' }}>No hay registros de citas anteriores.</p>
            )}
          </div>

          {/* 4. Signed Consents Status */}
          <div className="space-y-3 p-4 rounded-xl text-xs" style={{ border: '1px solid #E2E8F0', backgroundColor: '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <p className="font-bold text-xs uppercase tracking-wide pb-1" style={{ color: '#0A2540', borderBottom: '1px solid #EDF2F7' }}>Estado de Consentimientos Informados</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="font-bold text-[11px]" style={{ color: '#0A2540' }}>1. Consentimiento de Escleroterapia:</p>
                <p className="font-semibold">
                  Estado: {selectedPatient.consentSigned ? (
                    <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ FIRMADO</span>
                  ) : (
                    <span style={{ color: '#DC2626', fontWeight: 'bold' }}>✗ NO FIRMADO</span>
                  )}
                </p>
                {selectedPatient.consentSigned && selectedPatient.consentDetails && (
                  <div className="text-[10px] space-y-0.5" style={{ color: '#4A5568' }}>
                    <p>Nombre impreso: {selectedPatient.consentDetails.printedName}</p>
                    <p>Fecha de firma: {selectedPatient.consentDetails.date} @ {selectedPatient.consentDetails.time}</p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-bold text-[11px]" style={{ color: '#0A2540' }}>2. Consentimiento de Foto / Redes Sociales:</p>
                <p className="font-semibold">
                  Estado: {selectedPatient.socialMediaConsentSigned ? (
                    <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ FIRMADO</span>
                  ) : (
                    <span style={{ color: '#D97706', fontWeight: 'bold' }}>PENDIENTE</span>
                  )}
                </p>
                <p className="text-[10px]" style={{ color: '#4A5568' }}>
                  Nivel autorizado: {
                    selectedPatient.socialMediaConsentLevel === 'level1' ? 'Solo registro clínico confidencial' :
                    selectedPatient.socialMediaConsentLevel === 'level2' ? 'Uso promocional anónimo' : 'Uso promocional completo'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* 5. SOAP Clinical Notes History */}
          <div className="space-y-4 p-4 rounded-xl text-xs" style={{ border: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
            <p className="font-bold text-xs uppercase tracking-wide pb-1" style={{ color: '#0A2540', borderBottom: '1px solid #EDF2F7' }}>Notas Clínicas SOAP</p>
            {selectedPatient.soapNotes && selectedPatient.soapNotes.length > 0 ? (
              selectedPatient.soapNotes.map((note) => (
                <div key={note.id} className="space-y-2 pb-3" style={{ borderBottom: '1px dashed #E2E8F0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div className="flex justify-between font-bold text-[11px]" style={{ color: '#C5A880' }}>
                    <span>Fecha: {note.date}</span>
                    <span>Procedimiento: {note.procedureType || 'Escleroterapia'} ({note.objectiveMedication} • {note.objectiveVolume}ml)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <p><span className="font-semibold" style={{ color: '#0A2540' }}>Subjetivo:</span> {note.subjective}</p>
                    <p><span className="font-semibold" style={{ color: '#0A2540' }}>Notas Objetivas:</span> {note.objectiveNotes}</p>
                    <p><span className="font-semibold" style={{ color: '#0A2540' }}>Evaluación:</span> {note.assessment}</p>
                    <p><span className="font-semibold" style={{ color: '#0A2540' }}>Plan:</span> {note.plan}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="italic text-[11px]" style={{ color: '#718096' }}>No hay notas clínicas SOAP registradas aún.</p>
            )}
          </div>

          {/* 6. Clinical Progress Photos Gallery (If Any) */}
          {selectedPatient.photos && selectedPatient.photos.length > 0 && (
            <div className="space-y-3 p-4 rounded-xl text-xs" style={{ border: '1px solid #E2E8F0', backgroundColor: '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <p className="font-bold text-xs uppercase tracking-wide pb-1" style={{ color: '#0A2540', borderBottom: '1px solid #EDF2F7' }}>Galería de Evolución Clínica / Fotografías</p>
              <div className="grid grid-cols-3 gap-3">
                {selectedPatient.photos.map((photo) => (
                  <div key={photo.id} className="p-2 text-center rounded" style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8F6F0' }}>
                    <div className="h-28 w-full flex items-center justify-center overflow-hidden rounded bg-white mb-1">
                      <img src={photo.url} alt={photo.label} className="max-h-full max-w-full object-contain" />
                    </div>
                    <p className="font-bold text-[10px]" style={{ color: '#0A2540' }}>{photo.label}</p>
                    <p className="text-[9px]" style={{ color: '#718096' }}>{photo.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Signatures & Medical Verification Block */}
          <div className="html2pdf__page-break"></div>
          <div className="space-y-4 p-4 rounded-xl text-xs" style={{ border: '1px solid #E2E8F0', backgroundColor: '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <p className="font-bold text-xs uppercase tracking-wide pb-1" style={{ color: '#0A2540', borderBottom: '1px solid #EDF2F7' }}>Firma Digital y Verificación del Expediente</p>
            
            <div className="grid grid-cols-2 gap-8 pt-4 items-end">
              <div className="space-y-2 text-center">
                <span className="block text-[9px] uppercase font-bold" style={{ color: '#718096' }}>Médico Tratante</span>
                <div className="py-2 font-bold text-sm" style={{ borderBottom: '1px solid #0A2540', color: '#0A2540' }}>Dr. Elena Rodriguez, MD</div>
                <span className="block text-[9px]" style={{ color: '#718096' }}>VenaComfort Vein Studio & Aesthetic Care</span>
              </div>
              <div className="space-y-2 text-center">
                <span className="block text-[9px] uppercase font-bold" style={{ color: '#718096' }}>Firma del Paciente</span>
                {selectedPatient.consentSigned && selectedPatient.consentSignatureUrl ? (
                  <div className="h-16 flex items-center justify-center p-1 rounded" style={{ border: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
                    <img src={selectedPatient.consentSignatureUrl} alt="Firma del Paciente" className="max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="py-4 text-center font-bold uppercase text-red-500" style={{ borderBottom: '1px solid #0A2540' }}>Consentimiento No Firmado</div>
                )}
                <span className="block text-[9px]" style={{ color: '#718096' }}>{selectedPatient.firstName} {selectedPatient.lastName}</span>
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

      {/* CLEAN DB MODAL */}
      {showCleanDbModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-primary/45 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="w-full max-w-md bg-soft-ivory rounded-3xl overflow-hidden shadow-2xl border border-error/20 flex flex-col max-h-[90vh]">
            <header className="bg-white px-6 py-4 border-b border-error/15 flex justify-between items-center shrink-0">
              <span className="font-display text-lg font-bold text-error flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">cleaning_services</span>
                {language === 'es' ? 'Limpiar Base de Datos' : 'Clean Database'}
              </span>
              <button 
                onClick={() => setShowCleanDbModal(false)}
                className="text-on-surface-variant hover:text-error transition-colors flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </header>

            <form onSubmit={handleCleanDbSubmit} className="flex-grow overflow-y-auto p-6 space-y-4 text-left">
              <div className="p-4 bg-error-container/10 border border-error/20 rounded-2xl text-error text-xs space-y-2">
                <p className="font-bold">
                  {language === 'es' ? '🚨 ADVERTENCIA CRÍTICA:' : '🚨 CRITICAL WARNING:'}
                </p>
                <p>
                  {language === 'es' 
                    ? 'Esta acción eliminará de forma permanente a todos los especialistas clínicos y usuarios (excepto el administrador principal "admin@venacomfort.com") de la base de datos seleccionada.'
                    : 'This action will permanently delete all clinical specialists and users (except primary administrator "admin@venacomfort.com") from the selected database.'
                  }
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  {language === 'es' ? 'Seleccionar Base de Datos' : 'Select Database'} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCleanDbTarget('dev')}
                    className="p-4 rounded-xl border text-left cursor-pointer transition-all border-champagne-gold bg-soft-ivory/50 ring-1 ring-champagne-gold"
                  >
                    <span className="block font-bold text-xs text-deep-cobalt">
                      {language === 'es' ? 'Desarrollo' : 'Development'}
                    </span>
                    <span className="block text-[10px] text-outline mt-1 font-mono">
                      _dev collections
                    </span>
                  </button>
                  <div className="p-4 rounded-xl border text-left bg-surface-dim/40 border-outline-variant/30 opacity-75 relative cursor-not-allowed">
                    <span className="block font-bold text-xs text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      {language === 'es' ? 'Producción (Protegida)' : 'Production (Protected)'}
                    </span>
                    <span className="block text-[9px] text-error font-semibold mt-1">
                      {language === 'es' ? 'Bloqueada contra borrados' : 'Locked against deletions'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  {language === 'es' ? 'Seleccionar Colecciones a Limpiar' : 'Select Collections to Clear'} *
                </label>
                <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-outline-variant/60">
                  <label className="flex items-center gap-3 text-xs font-semibold text-deep-cobalt cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanDbCollections.specialists}
                      onChange={(e) => setCleanDbCollections(prev => ({ ...prev, specialists: e.target.checked }))}
                      className="rounded border-outline-variant text-error focus:ring-error"
                    />
                    <span>
                      {language === 'es' ? 'Especialistas Clínicos' : 'Clinical Specialists'}
                    </span>
                  </label>

                  <label className="flex items-center gap-3 text-xs font-semibold text-deep-cobalt cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanDbCollections.users}
                      onChange={(e) => setCleanDbCollections(prev => ({ ...prev, users: e.target.checked }))}
                      className="rounded border-outline-variant text-error focus:ring-error"
                    />
                    <span>
                      {language === 'es' ? 'Usuarios del Sistema (excepto admin)' : 'System Users (except admin)'}
                    </span>
                  </label>

                  <label className="flex items-center gap-3 text-xs font-semibold text-deep-cobalt cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanDbCollections.patients}
                      onChange={(e) => setCleanDbCollections(prev => ({ ...prev, patients: e.target.checked }))}
                      className="rounded border-outline-variant text-error focus:ring-error"
                    />
                    <span>
                      {language === 'es' ? 'Pacientes Clínicos' : 'Clinical Patients'}
                    </span>
                  </label>

                  <label className="flex items-center gap-3 text-xs font-semibold text-deep-cobalt cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanDbCollections.appointments}
                      onChange={(e) => setCleanDbCollections(prev => ({ ...prev, appointments: e.target.checked }))}
                      className="rounded border-outline-variant text-error focus:ring-error"
                    />
                    <span>
                      {language === 'es' ? 'Citas Agendadas' : 'Scheduled Appointments'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  {language === 'es' 
                    ? 'Para confirmar la limpieza de desarrollo, escribe "ELIMINAR DESARROLLO"' 
                    : 'To confirm development cleanup, type "ELIMINAR DESARROLLO"'
                  } *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="ELIMINAR DESARROLLO"
                  value={cleanDbConfirmText}
                  onChange={(e) => setCleanDbConfirmText(e.target.value)}
                  className="w-full text-xs rounded-lg border-outline-variant text-deep-cobalt uppercase font-mono focus:border-error focus:ring-1 focus:ring-error"
                />
              </div>

              <footer className="pt-4 border-t border-ice-blue flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowCleanDbModal(false)}
                  className="border border-outline-variant text-on-surface-variant hover:bg-outline-variant/15 px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase cursor-pointer"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase hover:brightness-110 shadow-sm cursor-pointer text-white ${
                    cleanDbTarget === 'prod' ? 'bg-error' : 'bg-champagne-gold'
                  }`}
                >
                  {language === 'es' ? 'Confirmar Limpieza' : 'Confirm Cleanup'}
                </button>
              </footer>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
    {deleteConfirm && ReactDOM.createPortal(
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4" style={{ border: '1px solid #fca5a5' }}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#fef2f2' }}>
              <span className="material-symbols-outlined text-3xl" style={{ color: '#dc2626' }}>delete_forever</span>
            </div>
            <div>
              <p className="font-bold text-base mb-1" style={{ color: '#111827' }}>
                {language === 'es' ? '¿Eliminar permanentemente?' : 'Permanently delete?'}
              </p>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                {language === 'es' ? 'Esta acción eliminará a ' : 'This will permanently remove '}
                <span className="font-bold" style={{ color: '#111827' }}>{deleteConfirm.name}</span>
                {language === 'es' ? ' de forma irreversible.' : ' and cannot be undone.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, border: '1px solid #d1d5db', padding: '10px 16px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', background: 'white', color: '#374151' }}
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { type, id, name } = deleteConfirm;
                  setDeleteConfirm(null);
                  try {
                    if (type === 'user') {
                      await deleteUser(id);
                      logAction(currentUser?.name || 'Admin', 'Usuario Eliminado', `Cuenta eliminada: ${name}`);
                    } else {
                      await deleteSpecialist(id);
                      logAction(currentUser?.name || 'Admin', 'Especialista Eliminado', `Especialista eliminado: ${name}`);
                    }
                  } catch (err) {
                    console.error('Delete error:', err);
                  }
                }}
                style={{ flex: 1, background: '#dc2626', color: 'white', padding: '10px 16px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none' }}
              >
                {language === 'es' ? 'Sí, eliminar' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );

}
