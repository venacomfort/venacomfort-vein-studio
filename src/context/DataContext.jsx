import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const DataContext = createContext();

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

export const DataProvider = ({ children }) => {
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('venacomfort_patients');
    return saved ? JSON.parse(saved) : initialPatients;
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('venacomfort_appointments');
    if (saved) return JSON.parse(saved);
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

  // Sync cloud database on mount (load and seed if empty)
  useEffect(() => {
    const loadCloudData = async () => {
      try {
        const patientSnap = await getDocs(collection(db, "patients"));
        const appSnap = await getDocs(collection(db, "appointments"));
        
        if (patientSnap.empty) {
          // Seed patients
          const seedPromises = initialPatients.map(p => {
            return setDoc(doc(db, "patients", p.id), p);
          });
          
          // Seed appointments
          const apps = [];
          initialPatients.forEach(p => {
            p.appointments.forEach(app => {
              const a = {
                ...app,
                patientId: p.id,
                patientName: `${p.firstName} ${p.lastName}`
              };
              apps.push(a);
              seedPromises.push(setDoc(doc(db, "appointments", a.id), a));
            });
          });
          
          await Promise.all(seedPromises);
          console.log("Cloud Firestore seeded with default clinic data successfully!");
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
          console.log("Cloud Firestore patients and appointments loaded successfully!");
        }
      } catch (error) {
        console.error("Firestore initialization or load error:", error);
      }
    };
    loadCloudData();
  }, []);

  // Sync to local storage as safety cache
  useEffect(() => {
    try {
      localStorage.setItem('venacomfort_patients', JSON.stringify(patients));
    } catch (e) {
      console.error("Local storage sync error:", e);
      if (e.name === 'QuotaExceededError') {
        alert("Clinical Storage full! The system has caught the storage error. Please use smaller/compressed photo files under 1MB to avoid hitting storage quotas.");
      }
    }
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem('venacomfort_appointments', JSON.stringify(appointments));
    } catch (e) {
      console.error("Local storage appts sync error:", e);
    }
  }, [appointments]);

  // Firestore background helper functions
  const savePatientToCloud = async (patient) => {
    try {
      await setDoc(doc(db, "patients", patient.id), patient);
    } catch (error) {
      console.error("Firestore savePatientToCloud error:", error);
    }
  };

  const saveAppToCloud = async (app) => {
    try {
      await setDoc(doc(db, "appointments", app.id), app);
    } catch (error) {
      console.error("Firestore saveAppToCloud error:", error);
    }
  };

  const deleteAppFromCloud = async (appId) => {
    try {
      await deleteDoc(doc(db, "appointments", appId));
    } catch (error) {
      console.error("Firestore deleteAppFromCloud error:", error);
    }
  };

  // Add Appointment (from wizard)
  const addAppointment = (patientData, bookingDetails) => {
    let patient = patients.find(p => p.email.toLowerCase() === patientData.email.toLowerCase());
    const patientId = patient ? patient.id : `VC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApp = {
      id: `app-${Date.now()}`,
      date: bookingDetails.date,
      time: bookingDetails.time,
      service: bookingDetails.service,
      doctor: bookingDetails.doctor,
      price: bookingDetails.price,
      patientId,
      patientName: `${patientData.firstName} ${patientData.lastName}`
    };

    if (!patient) {
      // Create new patient profile with the complete Intake & Social Consent
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
        
        // Intake Checklist
        pregnancy: patientData.pregnancy || 'No',
        clotsHistory: patientData.clotsHistory || 'No',
        prevVeinTreatments: patientData.prevVeinTreatments || 'No',
        prevVeinTreatmentsDetail: patientData.prevVeinTreatmentsDetail || '',
        allergiesHistory: patientData.allergiesHistory || 'No',
        allergiesHistoryDetail: patientData.allergiesHistoryDetail || '',
        
        // Social Media Consent
        socialMediaConsentSigned: !!patientData.socialMediaSignatureUrl,
        socialMediaConsentLevel: patientData.socialMediaConsentLevel || 'level1',
        socialMediaSignatureUrl: patientData.socialMediaSignatureUrl || '',
        
        // Procedure Consent
        consentSigned: false,
        consentSignatureUrl: '',
        
        photos: [],
        soapNotes: [],
        appointments: [newApp]
      };
      setPatients(prev => [...prev, newPatient]);
      savePatientToCloud(newPatient);
    } else {
      // Append appointment to existing patient
      const updatedPatient = {
        ...patient,
        appointments: [...patient.appointments, newApp]
      };
      setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));
      savePatientToCloud(updatedPatient);
    }

    setAppointments(prev => [...prev, newApp]);
    saveAppToCloud(newApp);
    return newApp;
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
  const saveConsentSignature = (patientId, signatureBase64) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const updated = {
          ...p,
          consentSigned: true,
          consentSignatureUrl: signatureBase64
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

  // Upload Patient Photo (Antes/Después)
  const uploadPatientPhoto = (patientId, base64Data, label) => {
    const newPhoto = {
      id: `photo-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      label,
      base64Data
    };

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const updated = {
          ...p,
          photos: [...p.photos, newPhoto]
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

  return (
    <DataContext.Provider value={{
      patients,
      appointments,
      addAppointment,
      addPatient,
      updatePatient,
      saveSoapNote,
      updateSoapNote,
      saveConsentSignature,
      saveSocialMediaConsent,
      uploadPatientPhoto,
      deleteAppointment
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
