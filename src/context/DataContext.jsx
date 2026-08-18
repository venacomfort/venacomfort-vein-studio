import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const DataContext = createContext();

const defaultSpecialists = [
  {
    id: 'doc-1',
    name: 'Dr. Elena Rodriguez',
    title: 'Lead Vascular Specialist',
    titleEs: 'Especialista Vascular Principal',
    email: 'elena.rodriguez@venacomfort.com',
    phone: '786-555-0190',
    schedule: 'Mon - Fri',
    scheduleEs: 'Lun - Vie',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    status: 'Active'
  }
];

const initialPatients = [
  {
    id: 'VC-8924',
    firstName: 'Eleanor',
    lastName: 'Vance',
    dob: '1980-12-04',
    gender: 'Female',
    email: 'eleanor.vance@example.com',
    phone: '786-224-9081',
    address: '455 Key Biscayne Dr, Miami FL 33149',
    emergName: 'Thomas Vance',
    emergPhone: '786-224-9080',
    concerns: 'Spider veins in left lateral calf and reticular feeder veins.',
    allergies: 'Penicillin',
    
    // Intake Medical Answers
    pregnancy: 'No',
    clotsHistory: 'No',
    prevVeinTreatments: 'Yes',
    prevVeinTreatmentsDetail: 'Laser therapy in 2022 at local spa, veins returned.',
    allergiesHistory: 'Yes',
    allergiesHistoryDetail: 'Hives when taking Penicillin.',
    
    // Social Media Consent
    socialMediaConsentSigned: true,
    socialMediaConsentLevel: 'level2', // Anonymous Marketing
    socialMediaSignatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADtOc5fAAAABmJLR0QA/wD/AP+gvaeTAAAAIklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAeBkdIAABn9h0/wAAAABJRU5CYII=',
    
    // Procedure Consent
    consentSigned: true,
    consentSignatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADtOc5fAAAABmJLR0QA/wD/AP+gvaeTAAAAIklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAeBkdIAABn9h0/wAAAABJRU5CYII=',
    
    // Photo Evolution Sequence
    photos: [
      {
        id: 'photo-old-1',
        date: '2026-08-05',
        label: 'Before Treatment',
        base64Data: '/sclerotherapy_before_after.png' // Utilizing the generated before-after split
      }
    ],

    soapNotes: [
      {
        id: 'note-1',
        date: '2026-08-05',
        subjective: 'Patient reports mild aching in left leg after standing for long periods. Noticed spider webs increasing over the last year.',
        objectiveMedication: 'Polidocanol 0.5%',
        objectiveVolume: '2.0',
        objectiveNotes: 'Injected spider webs on lateral left calf. Moderate spasm and immediate clearance observed.',
        veinLocation: 'Lateral left calf, reticular feeder veins',
        compressionPlaced: 'Yes',
        assessment: 'Aesthetic cosmetic spider veins with underlying reticular feeder vein (C1). Good candidate for aesthetic sclerotherapy.',
        plan: 'Follow-up sclerotherapy session in 4 weeks. Instructed to wear Class I compression stockings (20-30 mmHg) for 3-5 days. Avoid direct sun exposure.'
      }
    ],
    appointments: [
      { id: 'app-old-1', date: '2026-08-05', time: '10:00 AM', service: 'Sclerotherapy', doctor: 'Dr. Elena Rodriguez', price: 300 }
    ]
  },
  {
    id: 'VC-4122',
    firstName: 'Marcus',
    lastName: 'Sterling',
    dob: '1975-05-11',
    gender: 'Male',
    email: 'marcus.sterling@example.com',
    phone: '305-512-8822',
    address: '900 Brickell Ave, Miami FL 33131',
    emergName: 'Alice Sterling',
    emergPhone: '305-512-8820',
    concerns: 'Varicose veins on posterior right thigh and reticular veins.',
    allergies: 'None',
    
    // Intake Medical Answers
    pregnancy: 'No',
    clotsHistory: 'Yes',
    prevVeinTreatments: 'No',
    prevVeinTreatmentsDetail: '',
    allergiesHistory: 'No',
    allergiesHistoryDetail: '',
    
    // Social Media Consent
    socialMediaConsentSigned: false,
    socialMediaConsentLevel: 'level1', // Clinical Use Only
    socialMediaSignatureUrl: '',
    
    // Procedure Consent
    consentSigned: false,
    consentSignatureUrl: '',
    
    photos: [],
    soapNotes: [],
    appointments: [
      { id: 'app-upcoming-1', date: '2026-08-10', time: '11:00 AM', service: 'Vascular Eval', doctor: 'Dr. James Chen', price: 100 }
    ]
  },
  {
    id: 'VC-1992',
    firstName: 'Sophia',
    lastName: 'Laurent',
    dob: '1992-02-28',
    gender: 'Female',
    email: 'sophia.laurent@example.com',
    phone: '954-681-3044',
    address: '1020 Las Olas Blvd, Fort Lauderdale FL 33301',
    emergName: 'Jean Laurent',
    emergPhone: '954-681-3040',
    concerns: 'Cosmetic spider veins lateral thigh, no symptoms of swelling.',
    allergies: 'Sulfa drugs',
    
    // Intake Medical Answers
    pregnancy: 'No',
    clotsHistory: 'No',
    prevVeinTreatments: 'No',
    prevVeinTreatmentsDetail: '',
    allergiesHistory: 'Yes',
    allergiesHistoryDetail: 'Allergic rash to Sulfa antibiotics.',
    
    // Social Media Consent
    socialMediaConsentSigned: true,
    socialMediaConsentLevel: 'level3', // Public Use
    socialMediaSignatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADtOc5fAAAABmJLR0QA/wD/AP+gvaeTAAAAIklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAeBkdIAABn9h0/wAAAABJRU5CYII=',
    
    // Procedure Consent
    consentSigned: true,
    consentSignatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADtOc5fAAAABmJLR0QA/wD/AP+gvaeTAAAAIklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAeBkdIAABn9h0/wAAAABJRU5CYII=',
    
    photos: [],
    soapNotes: [],
    appointments: [
      { id: 'app-upcoming-2', date: '2026-08-09', time: '02:00 PM', service: 'Spider Vein', doctor: 'Dr. Elena Rodriguez', price: 250 }
    ]
  }
];

const isLocalDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.includes('192.168.') ||
  window.location.hostname.includes('.local')
);
const isProd = !isLocalDev;
const COLL_PATIENTS = isProd ? "patients" : "patients_dev";
const COLL_APPOINTMENTS = isProd ? "appointments" : "appointments_dev";
const COLL_SPECIALISTS = isProd ? "specialists" : "specialists_dev";
const COLL_USERS = isProd ? "users" : "users_dev";
const COLL_AUDIT_LOGS = isProd ? "audit_logs" : "audit_logs_dev";

export const DataProvider = ({ children }) => {
  const [dbMode, setDbMode] = useState(() => {
    const saved = localStorage.getItem('venacomfort_db_mode');
    if (saved) return saved;
    const isDummy = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes("DummyKey");
    return isDummy ? 'local' : 'cloud';
  });

  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem(isProd ? 'venacomfort_patients' : 'venacomfort_patients_dev');
    if (saved) return JSON.parse(saved);
    return isProd ? [] : initialPatients;
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem(isProd ? 'venacomfort_appointments' : 'venacomfort_appointments_dev');
    if (saved) return JSON.parse(saved);
    if (isProd) return [];
    const apps = [];
    initialPatients.forEach(p => {
      p.appointments.forEach(app => {
        apps.push({
          ...app,
          patientId: p.id,
          patientName: `${p.firstName} ${p.lastName}`
        });
      });
    });
    return apps;
  });

  const [specialists, setSpecialists] = useState(() => {
    const saved = localStorage.getItem(isProd ? 'venacomfort_specialists' : 'venacomfort_specialists_dev');
    return saved ? JSON.parse(saved) : defaultSpecialists;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(isProd ? 'venacomfort_users' : 'venacomfort_users_dev');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'user-admin', name: 'Clinical Administrator', email: 'admin@venacomfort.com', password: 'ComfortVeins2026!', role: 'admin' },
      { id: 'user-doc-1', name: 'Dr. Elena Rodriguez', email: 'elena.rodriguez@venacomfort.com', password: 'ElenaRodriguez2026!', role: 'specialist', specialistId: 'doc-1' }
    ];
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem(isProd ? 'venacomfort_audit_logs' : 'venacomfort_audit_logs_dev');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'log-1', timestamp: new Date().toISOString(), user: 'System', action: 'System Initialization', details: 'VenaComfort CRM initial state loaded.' }
    ];
  });

  // Sync cloud database on mount (load and seed if empty)
  // Only run when dbMode === 'cloud' to avoid clobbering local-only state
  useEffect(() => {
    if (dbMode !== 'cloud') return;
    const loadCloudData = async () => {
      try {
        const patientSnap = await getDocs(collection(db, COLL_PATIENTS));
        const appSnap = await getDocs(collection(db, COLL_APPOINTMENTS));
        const specSnap = await getDocs(collection(db, COLL_SPECIALISTS));
        const userSnap = await getDocs(collection(db, COLL_USERS));
        const logSnap = await getDocs(collection(db, COLL_AUDIT_LOGS));
        
        if (patientSnap.empty) {
          if (!isProd) {
            // Seed patients and appointments in development ONLY!
            const seedPromises = initialPatients.map(p => {
              return setDoc(doc(db, COLL_PATIENTS, p.id), p);
            });
            
            const apps = [];
            initialPatients.forEach(p => {
              p.appointments.forEach(app => {
                const a = {
                  ...app,
                  patientId: p.id,
                  patientName: `${p.firstName} ${p.lastName}`
                };
                apps.push(a);
                seedPromises.push(setDoc(doc(db, COLL_APPOINTMENTS, a.id), a));
              });
            });
            
            await Promise.all(seedPromises);
            console.log("Cloud Firestore seeded with default clinic data successfully (development)!");
            setPatients(initialPatients);
            setAppointments(apps);
          } else {
            // Production starts completely clean!
            setPatients([]);
            setAppointments([]);
            console.log("Production database is empty and clean. No mock data seeded.");
          }
        } else {
          const cloudPatients = [];
          patientSnap.forEach(d => {
            cloudPatients.push(d.data());
          });
          
          const cloudApps = [];
          appSnap.forEach(d => {
            cloudApps.push(d.data());
          });
          
          setPatients(cloudPatients);
          setAppointments(cloudApps);
          console.log(`Cloud Firestore patients and appointments loaded successfully from ${isProd ? 'production' : 'development'}!`);
        }

        if (specSnap.empty) {
          // Seed specialists in both dev and prod so appointments booking doesn't crash on empty select
          const specPromises = defaultSpecialists.map(s => {
            return setDoc(doc(db, COLL_SPECIALISTS, s.id), s);
          });
          await Promise.all(specPromises);
          console.log("Cloud Firestore specialists seeded successfully!");
          setSpecialists(defaultSpecialists);
        } else {
          const cloudSpecs = [];
          specSnap.forEach(d => {
            cloudSpecs.push(d.data());
          });
          setSpecialists(cloudSpecs);
          console.log("Cloud Firestore specialists loaded successfully!");
        }

        // Load or seed users
        if (userSnap.empty) {
          const defaultUsers = [
            { id: 'user-admin', name: 'Clinical Administrator', email: 'admin@venacomfort.com', password: 'ComfortVeins2026!', role: 'admin' },
            { id: 'user-doc-1', name: 'Dr. Elena Rodriguez', email: 'elena.rodriguez@venacomfort.com', password: 'ElenaRodriguez2026!', role: 'specialist', specialistId: 'doc-1' }
          ];
          const promises = defaultUsers.map(u => setDoc(doc(db, COLL_USERS, u.id), u));
          await Promise.all(promises);
          setUsers(defaultUsers);
          console.log("Cloud Firestore users seeded successfully!");
        } else {
          const cloudUsers = [];
          userSnap.forEach(d => {
            cloudUsers.push(d.data());
          });
          setUsers(cloudUsers);
          console.log("Cloud Firestore users loaded successfully!");
        }

        // Load or seed audit logs
        if (logSnap.empty) {
          const initialLogs = [
            { id: 'log-1', timestamp: new Date().toISOString(), user: 'System', action: 'System Initialization', details: 'VenaComfort CRM initial state loaded.' }
          ];
          await setDoc(doc(db, COLL_AUDIT_LOGS, initialLogs[0].id), initialLogs[0]);
          setAuditLogs(initialLogs);
          console.log("Cloud Firestore audit logs seeded successfully!");
        } else {
          const cloudLogs = [];
          logSnap.forEach(d => {
            cloudLogs.push(d.data());
          });
          cloudLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAuditLogs(cloudLogs);
          console.log("Cloud Firestore audit logs loaded successfully!");
        }
      } catch (error) {
        console.error("Firestore initialization or load error:", error);
      }
    };
    loadCloudData();
  }, [dbMode]);

  // Sync to local storage as safety cache
  useEffect(() => {
    try {
      localStorage.setItem(isProd ? 'venacomfort_patients' : 'venacomfort_patients_dev', JSON.stringify(patients));
    } catch (e) {
      console.error("Local storage sync error:", e);
      if (e.name === 'QuotaExceededError') {
        alert("Clinical Storage full! The system has caught the storage error. Please use smaller/compressed photo files under 1MB to avoid hitting storage quotas.");
      }
    }
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem(isProd ? 'venacomfort_appointments' : 'venacomfort_appointments_dev', JSON.stringify(appointments));
    } catch (e) {
      console.error("Local storage appts sync error:", e);
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(isProd ? 'venacomfort_specialists' : 'venacomfort_specialists_dev', JSON.stringify(specialists));
    } catch (e) {
      console.error("Local storage specialists sync error:", e);
    }
  }, [specialists]);

  useEffect(() => {
    try {
      localStorage.setItem(isProd ? 'venacomfort_users' : 'venacomfort_users_dev', JSON.stringify(users));
    } catch (e) {
      console.error("Local storage users sync error:", e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('venacomfort_db_mode', dbMode);
    } catch (e) {
      console.error("Local storage dbMode sync error:", e);
    }
  }, [dbMode]);

  useEffect(() => {
    try {
      localStorage.setItem(isProd ? 'venacomfort_audit_logs' : 'venacomfort_audit_logs_dev', JSON.stringify(auditLogs));
    } catch (e) {
      console.error("Local storage audit logs sync error:", e);
    }
  }, [auditLogs]);

  // Firestore background helper functions
  const savePatientToCloud = async (patient) => {
    try {
      await setDoc(doc(db, COLL_PATIENTS, patient.id), patient);
    } catch (error) {
      console.error("Firestore savePatientToCloud error:", error);
    }
  };

  const saveAppToCloud = async (app) => {
    try {
      await setDoc(doc(db, COLL_APPOINTMENTS, app.id), app);
    } catch (error) {
      console.error("Firestore saveAppToCloud error:", error);
    }
  };

  const deleteAppFromCloud = async (appId) => {
    try {
      await deleteDoc(doc(db, COLL_APPOINTMENTS, appId));
    } catch (error) {
      console.error("Firestore deleteAppFromCloud error:", error);
    }
  };

  const saveSpecialistToCloud = async (spec) => {
    try {
      await setDoc(doc(db, COLL_SPECIALISTS, spec.id), spec);
    } catch (error) {
      console.error("Firestore saveSpecialistToCloud error:", error);
    }
  };

  const deleteSpecialistFromCloud = async (specId) => {
    try {
      await deleteDoc(doc(db, COLL_SPECIALISTS, specId));
    } catch (e) {
      console.error("Firestore deleteSpecialistFromCloud error:", e);
    }
  };

  const saveUserToCloud = async (userData) => {
    try {
      await setDoc(doc(db, COLL_USERS, userData.id), userData);
    } catch (e) {
      console.error("Firestore saveUserToCloud error:", e);
    }
  };

  const deleteUserFromCloud = async (userId) => {
    try {
      await deleteDoc(doc(db, COLL_USERS, userId));
    } catch (e) {
      console.error("Firestore deleteUserFromCloud error:", e);
    }
  };

  const saveAuditLogToCloud = async (logData) => {
    try {
      await setDoc(doc(db, COLL_AUDIT_LOGS, logData.id), logData);
    } catch (e) {
      console.error("Firestore saveAuditLogToCloud error:", e);
    }
  };

  // Add Appointment (from wizard)
  const addAppointment = (patientData, bookingDetails) => {
    const normalizePhone = (ph) => {
      if (!ph) return '';
      return ph.replace(/\D/g, '');
    };

    const normalizeName = (nm) => {
      if (!nm) return '';
      return nm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Find patient by Email, Phone, or (Name + DOB) to prevent duplication
    let patient = patients.find(p => {
      if (p.email && patientData.email && p.email.trim().toLowerCase() === patientData.email.trim().toLowerCase()) {
        return true;
      }
      if (p.phone && patientData.phone && normalizePhone(p.phone) === normalizePhone(patientData.phone)) {
        return true;
      }
      if (p.dob && patientData.dob && p.dob === patientData.dob) {
        if (normalizeName(p.firstName) === normalizeName(patientData.firstName) && 
            normalizeName(p.lastName) === normalizeName(patientData.lastName)) {
          return true;
        }
      }
      return false;
    });

    const patientId = patient ? patient.id : `VC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApp = {
      id: `app-${Date.now()}`,
      date: bookingDetails.date,
      time: bookingDetails.time,
      service: bookingDetails.service,
      doctor: bookingDetails.doctor,
      price: bookingDetails.price,
      status: bookingDetails.status || 'pending_confirmation',
      patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : `${patientData.firstName} ${patientData.lastName}`
    };

    if (!patient) {
      // Create new patient profile
      const newPatient = {
        id: patientId,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        dob: patientData.dob,
        gender: patientData.gender || 'Female',
        email: patientData.email,
        phone: patientData.phone,
        address: patientData.address || '',
        emergName: patientData.emergName || '',
        emergPhone: patientData.emergPhone || '',
        concerns: patientData.concerns || '',
        allergies: patientData.allergies || '',
        pregnancy: patientData.pregnancy || 'No',
        clotsHistory: patientData.clotsHistory || 'No',
        prevVeinTreatments: patientData.prevVeinTreatments || 'No',
        prevVeinTreatmentsDetail: patientData.prevVeinTreatmentsDetail || '',
        allergiesHistory: patientData.allergiesHistory || 'No',
        allergiesHistoryDetail: patientData.allergiesHistoryDetail || '',
        socialMediaConsentSigned: !!patientData.socialMediaSignatureUrl,
        socialMediaConsentLevel: patientData.socialMediaConsentLevel || 'level1',
        socialMediaSignatureUrl: patientData.socialMediaSignatureUrl || '',
        consentSigned: false,
        consentSignatureUrl: '',
        photos: [],
        soapNotes: [],
        appointments: [newApp]
      };
      setPatients(prev => [...prev, newPatient]);
      savePatientToCloud(newPatient);
    } else {
      // Append appointment to existing patient and merge contact info updates
      const updatedPatient = {
        ...patient,
        firstName: patientData.firstName || patient.firstName,
        lastName: patientData.lastName || patient.lastName,
        dob: patientData.dob || patient.dob,
        email: patientData.email || patient.email,
        phone: patientData.phone || patient.phone,
        address: patientData.address || patient.address,
        emergName: patientData.emergName || patient.emergName,
        emergPhone: patientData.emergPhone || patient.emergPhone,
        concerns: patientData.concerns || patient.concerns,
        allergies: patientData.allergies || patient.allergies,
        appointments: [...patient.appointments, newApp]
      };
      setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));
      savePatientToCloud(updatedPatient);
    }

    setAppointments(prev => [...prev, newApp]);
    saveAppToCloud(newApp);
    return newApp;
  };

  const confirmAppointment = (appId) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === appId) {
        const updated = { ...app, status: 'confirmed' };
        saveAppToCloud(updated);
        return updated;
      }
      return app;
    }));
    
    setPatients(prev => prev.map(p => {
      const hasApp = p.appointments.some(app => app.id === appId);
      if (hasApp) {
        const updatedAppts = p.appointments.map(app => {
          if (app.id === appId) {
            return { ...app, status: 'confirmed' };
          }
          return app;
        });
        const updatedPatient = { ...p, appointments: updatedAppts };
        savePatientToCloud(updatedPatient);
        return updatedPatient;
      }
      return p;
    }));
  };

  const rescheduleAppointment = (appId, newDetails) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === appId) {
        const updated = { ...app, ...newDetails, status: 'confirmed' };
        saveAppToCloud(updated);
        return updated;
      }
      return app;
    }));
    
    setPatients(prev => prev.map(p => {
      const hasApp = p.appointments.some(app => app.id === appId);
      if (hasApp) {
        const updatedAppts = p.appointments.map(app => {
          if (app.id === appId) {
            return { ...app, ...newDetails, status: 'confirmed' };
          }
          return app;
        });
        const updatedPatient = { ...p, appointments: updatedAppts };
        savePatientToCloud(updatedPatient);
        return updatedPatient;
      }
      return p;
    }));
  };

  const markAsNoShow = (appId) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === appId) {
        const updated = { ...app, status: 'no_show' };
        saveAppToCloud(updated);
        return updated;
      }
      return app;
    }));
    
    setPatients(prev => prev.map(p => {
      const hasApp = p.appointments.some(app => app.id === appId);
      if (hasApp) {
        const updatedAppts = p.appointments.map(app => {
          if (app.id === appId) {
            return { ...app, status: 'no_show' };
          }
          return app;
        });
        const updatedPatient = { ...p, appointments: updatedAppts };
        savePatientToCloud(updatedPatient);
        return updatedPatient;
      }
      return p;
    }));
  };

  const markAsPresent = (appId) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === appId) {
        const updated = { ...app, status: 'completed' };
        saveAppToCloud(updated);
        return updated;
      }
      return app;
    }));
    
    setPatients(prev => prev.map(p => {
      const hasApp = p.appointments.some(app => app.id === appId);
      if (hasApp) {
        const updatedAppts = p.appointments.map(app => {
          if (app.id === appId) {
            return { ...app, status: 'completed' };
          }
          return app;
        });
        const updatedPatient = { ...p, appointments: updatedAppts };
        savePatientToCloud(updatedPatient);
        return updatedPatient;
      }
      return p;
    }));
  };

  // Add Patient directly from Admin Portal
  const addPatient = (patientInfo) => {
    const newId = `VC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient = {
      id: newId,
      ...patientInfo,
      pregnancy: patientInfo.pregnancy || 'No',
      clotsHistory: patientInfo.clotsHistory || 'No',
      prevVeinTreatments: patientInfo.prevVeinTreatments || 'No',
      prevVeinTreatmentsDetail: patientInfo.prevVeinTreatmentsDetail || '',
      allergiesHistory: patientInfo.allergiesHistory || 'No',
      allergiesHistoryDetail: patientInfo.allergiesHistoryDetail || '',
      
      socialMediaConsentSigned: false,
      socialMediaConsentLevel: 'level1',
      socialMediaSignatureUrl: '',
      
      consentSigned: false,
      consentSignatureUrl: '',
      
      photos: [],
      soapNotes: [],
      appointments: []
    };
    setPatients(prev => [...prev, newPatient]);
    savePatientToCloud(newPatient);
    return newPatient;
  };

  // Save SOAP Notes
  const saveSoapNote = (patientId, noteData) => {
    const newNote = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...noteData
    };

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const updated = {
          ...p,
          soapNotes: [newNote, ...p.soapNotes]
        };
        savePatientToCloud(updated);
        return updated;
      }
      return p;
    }));
  };

  // Update SOAP Notes
  const updateSoapNote = (patientId, noteId, updatedNoteData) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const updated = {
          ...p,
          soapNotes: p.soapNotes.map(n => n.id === noteId ? { ...n, ...updatedNoteData } : n)
        };
        savePatientToCloud(updated);
        return updated;
      }
      return p;
    }));
  };

  // Save Consent Signature (Escleroterapia)
  const saveConsentSignature = (patientId, signatureBase64, consentDetails) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const updated = {
          ...p,
          consentSigned: true,
          consentSignatureUrl: signatureBase64,
          consentDetails: consentDetails || null
        };
        savePatientToCloud(updated);
        return updated;
      }
      return p;
    }));
  };

  // Save Social Media Consent Signature & Level
  const saveSocialMediaConsent = (patientId, signatureBase64, consentLevel) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const updated = {
          ...p,
          socialMediaConsentSigned: true,
          socialMediaConsentLevel: consentLevel,
          socialMediaSignatureUrl: signatureBase64
        };
        savePatientToCloud(updated);
        return updated;
      }
      return p;
    }));
  };

  // Upload Patient Photo (Antes/Después) - Persisted to Cloud Firestore permanently
  const uploadPatientPhoto = (patientId, base64Data, label) => {
    const newPhoto = {
      id: `photo-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      label,
      url: base64Data,
      base64Data
    };

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const currentPhotos = Array.isArray(p.photos) ? p.photos : [];
        const updated = {
          ...p,
          photos: [...currentPhotos, newPhoto]
        };
        savePatientToCloud(updated);
        return updated;
      }
      return p;
    }));
  };

  // Update Patient Details
  const updatePatient = (patientId, updatedData) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const updated = {
          ...p,
          ...updatedData
        };
        savePatientToCloud(updated);
        return updated;
      }
      return p;
    }));
  };

  // Delete appointment
  const deleteAppointment = (appId) => {
    setAppointments(prev => prev.filter(app => app.id !== appId));
    deleteAppFromCloud(appId);
    setPatients(prev => prev.map(p => {
      const updated = {
        ...p,
        appointments: p.appointments.filter(app => app.id !== appId)
      };
      savePatientToCloud(updated);
      return updated;
    }));
  };

  // Add Specialist
  const addSpecialist = (specInfo) => {
    const newId = `doc-${Date.now()}`;
    const newSpec = {
      id: newId,
      ...specInfo,
      status: specInfo.status || 'Active'
    };
    setSpecialists(prev => [...prev, newSpec]);
    saveSpecialistToCloud(newSpec);

    // Sync to users: check if user exists
    const userEmail = specInfo.email.toLowerCase();
    const existingUser = users.find(u => u.email.toLowerCase() === userEmail);
    if (!existingUser) {
      const newUser = {
        id: `user-${newId}`,
        name: specInfo.name,
        email: specInfo.email,
        password: `${specInfo.name.replace(/\s+/g, '')}2026!`,
        role: 'specialist',
        specialistId: newId
      };
      setUsers(prev => [...prev, newUser]);
      saveUserToCloud(newUser);
    }
    return newSpec;
  };

  // Update Specialist
  const updateSpecialist = (specId, updatedInfo) => {
    setSpecialists(prev => prev.map(s => {
      if (s.id === specId) {
        const updated = { ...s, ...updatedInfo };
        saveSpecialistToCloud(updated);
        return updated;
      }
      return s;
    }));

    setUsers(prevUsers => prevUsers.map(u => {
      if (u.specialistId === specId) {
        const updatedUser = {
          ...u,
          name: updatedInfo.name || u.name,
          email: updatedInfo.email || u.email
        };
        saveUserToCloud(updatedUser);
        return updatedUser;
      }
      return u;
    }));
  };

  // Delete Specialist
  const deleteSpecialist = async (specId) => {
    // Sync to users (find before deletion)
    const linkedUser = users.find(u => u.specialistId === specId);
    
    // Update local state instantly (Optimistic UI update)
    setSpecialists(prev => prev.filter(s => s.id !== specId));
    if (linkedUser) {
      setUsers(prev => prev.filter(u => u.id !== linkedUser.id));
    }

    // Attempt Firestore deletes in background
    try {
      deleteSpecialistFromCloud(specId);
      if (linkedUser) {
        deleteUserFromCloud(linkedUser.id);
      }
    } catch (error) {
      console.error("Firestore deleteSpecialist cloud error:", error);
    }
  };

  // User Management
  const addUser = (userData) => {
    const newId = `user-${Date.now()}`;
    const newUser = {
      id: newId,
      ...userData
    };

    if (userData.role === 'specialist') {
      const specId = `doc-${Date.now()}`;
      const newSpec = {
        id: specId,
        name: userData.name,
        email: userData.email,
        phone: '786-555-0100',
        title: 'Specialist',
        titleEs: 'Especialista',
        schedule: 'Mon - Fri',
        scheduleEs: 'Lun - Vie',
        image: '',
        status: 'Active'
      };
      setSpecialists(prev => [...prev, newSpec]);
      saveSpecialistToCloud(newSpec);

      newUser.specialistId = specId;
    }

    setUsers(prev => [...prev, newUser]);
    saveUserToCloud(newUser);
    return newUser;
  };

  const updateUser = (userId, updatedData) => {
    let specToUpdate = null;
    let specToDeleteId = null;
    let specToAdd = null;

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const oldRole = u.role;
        const updated = { ...u, ...updatedData };
        saveUserToCloud(updated);

        if (updated.role === 'specialist') {
          if (!updated.specialistId) {
            const specId = `doc-${Date.now()}`;
            specToAdd = {
              id: specId,
              name: updated.name,
              email: updated.email,
              phone: '786-555-0100',
              title: 'Specialist',
              titleEs: 'Especialista',
              schedule: 'Mon - Fri',
              scheduleEs: 'Lun - Vie',
              image: '',
              status: 'Active'
            };
            updated.specialistId = specId;
            saveUserToCloud(updated);
          } else {
            specToUpdate = {
              id: updated.specialistId,
              name: updated.name,
              email: updated.email
            };
          }
        } else if (oldRole === 'specialist' && updated.role === 'admin') {
          if (u.specialistId) {
            specToDeleteId = u.specialistId;
            delete updated.specialistId;
            saveUserToCloud(updated);
          }
        }

        return updated;
      }
      return u;
    }));

    if (specToAdd) {
      setSpecialists(prev => [...prev, specToAdd]);
      saveSpecialistToCloud(specToAdd);
    }
    if (specToUpdate) {
      setSpecialists(prev => prev.map(s => {
        if (s.id === specToUpdate.id) {
          const updatedSpec = { ...s, name: specToUpdate.name, email: specToUpdate.email };
          saveSpecialistToCloud(updatedSpec);
          return updatedSpec;
        }
        return s;
      }));
    }
    if (specToDeleteId) {
      setSpecialists(prev => prev.filter(s => s.id !== specToDeleteId));
      deleteSpecialistFromCloud(specToDeleteId);
    }
  };

  const deleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    
    // Update local state instantly (Optimistic UI update)
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (user && user.specialistId) {
      setSpecialists(prev => prev.filter(s => s.id !== user.specialistId));
    }

    // Attempt Firestore deletes in background
    try {
      deleteUserFromCloud(userId);
      if (user && user.specialistId) {
        deleteSpecialistFromCloud(user.specialistId);
      }
    } catch (error) {
      console.error("Firestore deleteUser cloud error:", error);
    }
  };

  const cleanProductionDb = async (targetEnv, options, currentUser) => {
    if (targetEnv === 'prod') {
      throw new Error(
        window.location.hostname.includes('es') || true
          ? '🚨 ACCESO DENEGADO: La base de datos de PRODUCCIÓN está protegida y no se puede borrar ningún dato de ella.'
          : '🚨 ACCESS DENIED: Production database is protected and cannot be cleared.'
      );
    }

    try {
      const targetPrefix = '_dev';
      const isTargetActive = !isProd;

      // 1. Clean Specialists
      if (options.specialists) {
        const specSnap = await getDocs(collection(db, `specialists${targetPrefix}`));
        for (const d of specSnap.docs) {
          await deleteDoc(doc(db, `specialists${targetPrefix}`, d.id));
        }
        localStorage.removeItem(targetEnv === 'prod' ? 'venacomfort_specialists' : 'venacomfort_specialists_dev');
        if (isTargetActive) {
          setSpecialists([]);
        }
      }

      // 2. Clean Users
      if (options.users) {
        const userSnap = await getDocs(collection(db, `users${targetPrefix}`));
        for (const d of userSnap.docs) {
          const data = d.data();
          if (data.email?.toLowerCase() === 'admin@venacomfort.com') {
            continue;
          }
          await deleteDoc(doc(db, `users${targetPrefix}`, d.id));
        }
        localStorage.removeItem(targetEnv === 'prod' ? 'venacomfort_users' : 'venacomfort_users_dev');
        if (isTargetActive) {
          setUsers(prev => prev.filter(u => u.email?.toLowerCase() === 'admin@venacomfort.com'));
        }
      }

      // 3. Clean Patients
      if (options.patients) {
        const patSnap = await getDocs(collection(db, `patients${targetPrefix}`));
        for (const d of patSnap.docs) {
          await deleteDoc(doc(db, `patients${targetPrefix}`, d.id));
        }
        localStorage.removeItem(targetEnv === 'prod' ? 'venacomfort_patients' : 'venacomfort_patients_dev');
        if (isTargetActive) {
          setPatients([]);
        }
      }

      // 4. Clean Appointments
      if (options.appointments) {
        const appSnap = await getDocs(collection(db, `appointments${targetPrefix}`));
        for (const d of appSnap.docs) {
          await deleteDoc(doc(db, `appointments${targetPrefix}`, d.id));
        }
        localStorage.removeItem(targetEnv === 'prod' ? 'venacomfort_appointments' : 'venacomfort_appointments_dev');
        if (isTargetActive) {
          setAppointments([]);
        }
      }

      const collectionsCleaned = Object.keys(options).filter(k => options[k]).join(', ');
      logAction(currentUser?.name || 'Admin', 'Limpieza BD', `Se eliminaron datos de las colecciones (${collectionsCleaned}) en el entorno ${targetEnv.toUpperCase()}.`);
      return true;
    } catch (e) {
      console.error("cleanProductionDb error:", e);
      throw e;
    }
  };

  // Audit Action Logger
  const logAction = (userName, action, details) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: userName || 'System',
      action,
      details: details || ''
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToCloud(newLog);
  };

  return (
    <DataContext.Provider value={{
      patients,
      appointments,
      specialists,
      users,
      auditLogs,
      addAppointment,
      confirmAppointment,
      rescheduleAppointment,
      markAsNoShow,
      markAsPresent,
      addPatient,
      updatePatient,
      saveSoapNote,
      updateSoapNote,
      saveConsentSignature,
      saveSocialMediaConsent,
      uploadPatientPhoto,
      deleteAppointment,
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
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
