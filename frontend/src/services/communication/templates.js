/**
 * MediMind AI — Phase 9 Communication Platform
 * Multilingual Reusable Notification Templates (EN, HI, MR)
 * Strictly enforces Minimum Necessary Information (zero raw EHR/biomarker dumps)
 * and Deterministic Emergency Safety notices.
 */

import { NOTIFICATION_PRIORITY, NOTIFICATION_CATEGORIES } from './provider.types.js';

export const NOTIFICATION_TEMPLATES = {
  // 1. APPOINTMENTS
  APPOINTMENT_BOOKED: {
    template_id: 'APPT_BOOKED',
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Appointment Requested',
      body: ({ appointmentNumber, date, time }) =>
        `Your appointment #${appointmentNumber} is scheduled for ${date} at ${time}.`,
      link: '/patient/appointments'
    },
    hi: {
      title: 'अपॉइंटमेंट अनुरोध प्राप्त हुआ',
      body: ({ appointmentNumber, date, time }) =>
        `आपकी अपॉइंटमेंट #${appointmentNumber} ${date} को ${time} बजे निर्धारित है।`,
      link: '/patient/appointments'
    },
    mr: {
      title: 'अपॉइंटमेंट विनंती स्वीकारली',
      body: ({ appointmentNumber, date, time }) =>
        `तुमची अपॉइंटमेंट #${appointmentNumber} ${date} रोजी ${time} वाजता नियोजित आहे.`,
      link: '/patient/appointments'
    }
  },

  APPOINTMENT_CONFIRMED: {
    template_id: 'APPT_CONFIRMED',
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Appointment Confirmed',
      body: ({ doctorName, date, time }) =>
        `Your consultation with ${doctorName || 'your doctor'} on ${date} at ${time} is confirmed.`,
      link: '/patient/appointments'
    },
    hi: {
      title: 'अपॉइंटमेंट की पुष्टि हो गई है',
      body: ({ doctorName, date, time }) =>
        `${doctorName || 'डॉक्टर'} के साथ आपकी परामर्श ${date} को ${time} बजे तय हो गई है।`,
      link: '/patient/appointments'
    },
    mr: {
      title: 'अपॉइंटमेंट निश्चित झाली आहे',
      body: ({ doctorName, date, time }) =>
        `${doctorName || 'डॉक्टरांसोबत'} तुमची सल्लामसलत ${date} रोजी ${time} वाजता निश्चित झाली आहे.`,
      link: '/patient/appointments'
    }
  },

  APPOINTMENT_CANCELLED: {
    template_id: 'APPT_CANCELLED',
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Appointment Cancelled',
      body: ({ appointmentNumber, reason }) =>
        `Appointment #${appointmentNumber} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
      link: '/patient/appointments'
    },
    hi: {
      title: 'अपॉइंटमेंट रद्द की गई',
      body: ({ appointmentNumber, reason }) =>
        `अपॉइंटमेंट #${appointmentNumber} रद्द कर दी गई है।${reason ? ` कारण: ${reason}` : ''}`,
      link: '/patient/appointments'
    },
    mr: {
      title: 'अपॉइंटमेंट रद्द करण्यात आली',
      body: ({ appointmentNumber, reason }) =>
        `अपॉइंटमेंट #${appointmentNumber} रद्द करण्यात आली आहे.${reason ? ` कारण: ${reason}` : ''}`,
      link: '/patient/appointments'
    }
  },

  APPOINTMENT_RESCHEDULED: {
    template_id: 'APPT_RESCHEDULED',
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Appointment Rescheduled',
      body: ({ appointmentNumber, newDate, newTime }) =>
        `Appointment #${appointmentNumber} has been rescheduled to ${newDate} at ${newTime}.`,
      link: '/patient/appointments'
    },
    hi: {
      title: 'अपॉइंटमेंट का समय बदला गया',
      body: ({ appointmentNumber, newDate, newTime }) =>
        `अपॉइंटमेंट #${appointmentNumber} अब ${newDate} को ${newTime} बजे निर्धारित है।`,
      link: '/patient/appointments'
    },
    mr: {
      title: 'अपॉइंटमेंटची तारीख बदलली',
      body: ({ appointmentNumber, newDate, newTime }) =>
        `अपॉइंटमेंट #${appointmentNumber} आता ${newDate} रोजी ${newTime} वाजता नियोजित आहे.`,
      link: '/patient/appointments'
    }
  },

  APPOINTMENT_REMINDER: {
    template_id: 'APPT_REMINDER',
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    priority: NOTIFICATION_PRIORITY.HIGH,
    en: {
      title: 'Consultation Starting Soon',
      body: ({ timeRemaining = '15 minutes' }) =>
        `Your upcoming medical teleconsultation starts in ${timeRemaining}. Please prepare your records.`,
      link: '/patient/appointments'
    },
    hi: {
      title: 'परामर्श जल्द शुरू होने वाला है',
      body: ({ timeRemaining = '15 मिनट' }) =>
        `आपकी ऑनलाइन डॉक्टर परामर्श ${timeRemaining} में शुरू होगी। कृपया तैयार रहें।`,
      link: '/patient/appointments'
    },
    mr: {
      title: 'सल्लामसलत लवकरच सुरू होत आहे',
      body: ({ timeRemaining = '15 मिनिटांत' }) =>
        `तुमची ऑनलाइन डॉक्टर सल्लामसलत ${timeRemaining} सुरू होईल. कृपया सज्ज राहा.`,
      link: '/patient/appointments'
    }
  },

  CONSULTATION_DOCTOR_JOINED: {
    template_id: 'CONSULTATION_DOC_JOINED',
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    priority: NOTIFICATION_PRIORITY.HIGH,
    en: {
      title: 'Doctor Joined Consultation',
      body: ({ doctorName }) =>
        `${doctorName || 'Your doctor'} has entered the teleconsultation room.`,
      link: '/patient/appointments'
    },
    hi: {
      title: 'डॉक्टर परामर्श में शामिल हुए',
      body: ({ doctorName }) =>
        `${doctorName || 'डॉक्टर'} परामर्श कक्ष में शामिल हो चुके हैं।`,
      link: '/patient/appointments'
    },
    mr: {
      title: 'डॉक्टर सल्लामसलतीत सामील झाले',
      body: ({ doctorName }) =>
        `${doctorName || 'डॉक्टर'} सल्लामसलत कक्षात सामील झाले आहेत.`,
      link: '/patient/appointments'
    }
  },

  CONSULTATION_PATIENT_JOINED: {
    template_id: 'CONSULTATION_PAT_JOINED',
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Patient In Waiting Room',
      body: ({ patientName }) =>
        `${patientName || 'The patient'} has joined the teleconsultation room.`,
      link: '/doctor/appointments'
    },
    hi: {
      title: 'मरीज कक्ष में उपस्थित हैं',
      body: ({ patientName }) =>
        `${patientName || 'मरीज'} परामर्श कक्ष में शामिल हो गए हैं।`,
      link: '/doctor/appointments'
    },
    mr: {
      title: 'रुग्ण कक्षात उपस्थित आहेत',
      body: ({ patientName }) =>
        `${patientName || 'रुग्ण'} सल्लामसलत कक्षात सामील झाले आहेत.`,
      link: '/doctor/appointments'
    }
  },

  CONSULTATION_CONCLUDED: {
    template_id: 'CONSULTATION_CONCLUDED',
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Consultation Concluded',
      body: ({ appointmentNumber }) =>
        `Teleconsultation #${appointmentNumber || ''} has concluded successfully.`,
      link: '/patient/appointments'
    },
    hi: {
      title: 'परामर्श समाप्त हुआ',
      body: ({ appointmentNumber }) =>
        `टेलीपरामर्श सत्र #${appointmentNumber || ''} समाप्त हो गया है।`,
      link: '/patient/appointments'
    },
    mr: {
      title: 'सल्लामसलत पूर्ण झाली',
      body: ({ appointmentNumber }) =>
        `टेलिसल्लामसलत सत्र #${appointmentNumber || ''} यशस्वीरीत्या पूर्ण झाले आहे.`,
      link: '/patient/appointments'
    }
  },

  // 2. PRESCRIPTIONS
  PRESCRIPTION_ISSUED: {
    template_id: 'RX_ISSUED',
    category: NOTIFICATION_CATEGORIES.PRESCRIPTION,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Prescription Issued',
      body: ({ rxId, doctorName }) =>
        doctorName
          ? `${doctorName} has issued a new digital prescription (${rxId || 'Rx'}). Open MediMind to view or order medications.`
          : `Your doctor has issued a new digital prescription (${rxId || 'Rx'}). Open MediMind to view or order medications.`,
      link: '/prescriptions'
    },
    hi: {
      title: 'डिजिटल पर्चा जारी किया गया',
      body: ({ rxId, doctorName }) =>
        doctorName
          ? `${doctorName} ने आपका नया डिजिटल पर्चा (${rxId || 'Rx'}) जारी किया है। देखने या दवा मंगाने के लिए MediMind खोलें।`
          : `डॉक्टर ने आपका नया डिजिटल पर्चा (${rxId || 'Rx'}) जारी किया है। देखने या दवा मंगाने के लिए MediMind खोलें।`,
      link: '/prescriptions'
    },
    mr: {
      title: 'नवीन डिजिटल प्रिस्क्रिप्शन उपलब्ध',
      body: ({ rxId, doctorName }) =>
        doctorName
          ? `${doctorName} यांनी तुमचे नवीन डिजिटल प्रिस्क्रिप्शन (${rxId || 'Rx'}) जारी केले आहे. औषधे ऑर्डर करण्यासाठी MediMind उघडा.`
          : `डॉक्टरांनी तुमचे नवीन डिजिटल प्रिस्क्रिप्शन (${rxId || 'Rx'}) जारी केले आहे. औषधे ऑर्डर करण्यासाठी MediMind उघडा.`,
      link: '/prescriptions'
    }
  },

  // 3. MEDICINE ORDERS
  ORDER_PLACED: {
    template_id: 'ORD_PLACED',
    category: NOTIFICATION_CATEGORIES.ORDER,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Medicine Order Placed',
      body: ({ orderNumber }) =>
        `Order #${orderNumber} has been received and forwarded to the partner dispensary for fulfillment.`,
      link: '/patient/orders'
    },
    hi: {
      title: 'दवा का ऑर्डर दर्ज हुआ',
      body: ({ orderNumber }) =>
        `ऑर्डर #${orderNumber} प्राप्त हो गया है और फार्मेसी को भेज दिया गया है।`,
      link: '/patient/orders'
    },
    mr: {
      title: 'औषध ऑर्डर नोंदवली गेली',
      body: ({ orderNumber }) =>
        `ऑर्डर #${orderNumber} स्वीकारण्यात आली आहे आणि फार्मसीकडे पाठवली आहे.`,
      link: '/patient/orders'
    }
  },

  ORDER_SHIPPED: {
    template_id: 'ORD_SHIPPED',
    category: NOTIFICATION_CATEGORIES.ORDER,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Medicine Order Shipped',
      body: ({ orderNumber }) =>
        `Order #${orderNumber} has been packed and dispatched for delivery.`,
      link: '/patient/orders'
    },
    hi: {
      title: 'दवा का ऑर्डर रवाना हुआ',
      body: ({ orderNumber }) =>
        `ऑर्डर #${orderNumber} पैक कर डिलीवरी के लिए भेज दिया गया है।`,
      link: '/patient/orders'
    },
    mr: {
      title: 'औषध ऑर्डर पाठवली गेली',
      body: ({ orderNumber }) =>
        `ऑर्डर #${orderNumber} पॅक करून डिलिव्हरीसाठी पाठवली आहे.`,
      link: '/patient/orders'
    }
  },

  ORDER_DELIVERED: {
    template_id: 'ORD_DELIVERED',
    category: NOTIFICATION_CATEGORIES.ORDER,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Medicine Order Delivered',
      body: ({ orderNumber }) =>
        `Order #${orderNumber} has been successfully delivered. Check your dosage instructions in MediMind.`,
      link: '/patient/orders'
    },
    hi: {
      title: 'दवा का ऑर्डर डिलीवर हो गया',
      body: ({ orderNumber }) =>
        `ऑर्डर #${orderNumber} सफलतापूर्वक डिलीवर हो गया है। दवा के निर्देश MediMind में देखें।`,
      link: '/patient/orders'
    },
    mr: {
      title: 'औषध ऑर्डर पोहोचली',
      body: ({ orderNumber }) =>
        `ऑर्डर #${orderNumber} यशस्वीरित्या पोहोचवली गेली आहे. डोस सूचना MediMind मध्ये तपासा.`,
      link: '/patient/orders'
    }
  },

  // 4. MEDICAL REPORTS & AI CLINICAL INTELLIGENCE
  REPORT_ANALYSIS_READY: {
    template_id: 'REPORT_READY',
    category: NOTIFICATION_CATEGORIES.REPORT,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Health Report Analysis Complete',
      body: () =>
        'Your medical lab report has been parsed and structured into your Health Records. View details securely.',
      link: '/reports'
    },
    hi: {
      title: 'मेडिकल रिपोर्ट विश्लेषण तैयार है',
      body: () =>
        'आपकी लैब रिपोर्ट का विश्लेषण पूरा हो गया है और यह आपके रिकॉर्ड में सुरक्षित है।',
      link: '/reports'
    },
    mr: {
      title: 'वैद्यकीय अहवाल विश्लेषण पूर्ण',
      body: () =>
        'तुमच्या लॅब रिपोर्टचे विश्लेषण पूर्ण झाले असून ते तुमच्या रेकॉर्डमध्ये सुरक्षित आहे.',
      link: '/reports'
    }
  },

  AI_ASSESSMENT_READY: {
    template_id: 'ASSESSMENT_READY',
    category: NOTIFICATION_CATEGORIES.CLINICAL_ALERT,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    en: {
      title: 'Health Assessment Available',
      body: () =>
        'Your preliminary clinical symptom assessment is available in your dashboard. Review non-prescriptive insights.',
      link: '/dashboard'
    },
    hi: {
      title: 'स्वास्थ्य मूल्यांकन उपलब्ध है',
      body: () =>
        'आपका प्रारंभिक लक्षण मूल्यांकन तैयार है। विस्तृत जानकारी अपने डैशबोर्ड पर देखें।',
      link: '/dashboard'
    },
    mr: {
      title: 'आरोग्य मूल्यांकन तयार आहे',
      body: () =>
        'तुमचे प्राथमिक लक्षण मूल्यांकन उपलब्ध आहे. अधिक माहितीसाठी डॅशबोर्ड तपासा.',
      link: '/dashboard'
    }
  },

  HIGH_RISK_ALERT: {
    template_id: 'RISK_HIGH',
    category: NOTIFICATION_CATEGORIES.CLINICAL_ALERT,
    priority: NOTIFICATION_PRIORITY.HIGH,
    en: {
      title: 'Elevated Clinical Risk Identified',
      body: () =>
        'Your assessment indicates an elevated health risk. Please consider consulting a licensed medical doctor promptly.',
      link: '/doctors'
    },
    hi: {
      title: 'गंभीर स्वास्थ्य जोखिम की पहचान',
      body: () =>
        'आपके मूल्यांकन में उच्च स्वास्थ्य जोखिम दिखा है। कृपया शीघ्र ही किसी डॉक्टर से परामर्श लें।',
      link: '/doctors'
    },
    mr: {
      title: 'उच्च आरोग्य जोखीम आढळली',
      body: () =>
        'तुमच्या मूल्यांकनामध्ये उच्च आरोग्य जोखीम दिसून आली आहे. कृपया लवकरात लवकर डॉक्टरांचा सल्ला घ्या.',
      link: '/doctors'
    }
  },

  CRITICAL_EMERGENCY_ALERT: {
    template_id: 'RISK_CRITICAL',
    category: NOTIFICATION_CATEGORIES.CLINICAL_ALERT,
    priority: NOTIFICATION_PRIORITY.CRITICAL,
    en: {
      title: 'Urgent Health Concern — Seek Immediate Care',
      body: () =>
        'Your clinical assessment indicates potential red-flag symptoms. Please visit the nearest emergency facility or call an ambulance immediately.',
      link: '/predict'
    },
    hi: {
      title: 'आपातकालीन स्वास्थ्य चेतावनी — तुरंत सहायता लें',
      body: () =>
        'आपके मूल्यांकन में आपातकालीन लक्षण दिखे हैं। कृपया तुरंत नजदीकी अस्पताल के इमरजेंसी विभाग में जाएं या एम्बुलेंस बुलाएं।',
      link: '/predict'
    },
    mr: {
      title: 'तातडीची आरोग्य सूचना — तात्काळ मदत घ्या',
      body: () =>
        'तुमच्या तपासणीत गंभीर लक्षणे आढळली आहेत. कृपया त्वरित नजीकच्या आपत्कालीन विभागात जा किंवा रुग्णवाहिका बोलवा.',
      link: '/predict'
    }
  },

  // 5. SECURITY & ACCREDITATION
  SECURITY_ALERT: {
    template_id: 'SEC_ALERT',
    category: NOTIFICATION_CATEGORIES.SECURITY,
    priority: NOTIFICATION_PRIORITY.HIGH,
    en: {
      title: 'Security Notice',
      body: ({ eventName = 'Account activity' }) =>
        `Important security event: ${eventName}. If you did not authorize this, contact support immediately.`,
      link: '/settings'
    },
    hi: {
      title: 'सुरक्षा सूचना',
      body: ({ eventName = 'खाता गतिविधि' }) =>
        `महत्वपूर्ण सुरक्षा सूचना: ${eventName}। यदि आपने यह नहीं किया, तो तुरंत सहायता से संपर्क करें।`,
      link: '/settings'
    },
    mr: {
      title: 'सुरक्षा सूचना',
      body: ({ eventName = 'खाते हालचाल' }) =>
        `महत्त्वाची सुरक्षा सूचना: ${eventName}. आपण हे केले नसल्यास त्वरित संपर्क साधा.`,
      link: '/settings'
    }
  },

  DOCTOR_VERIFIED: {
    template_id: 'DOC_VERIFIED',
    category: NOTIFICATION_CATEGORIES.VERIFICATION,
    priority: NOTIFICATION_PRIORITY.HIGH,
    en: {
      title: 'Practitioner License Approved',
      body: () =>
        'Congratulations! Your medical registration credentials have been verified by the administration.',
      link: '/doctor/dashboard'
    },
    hi: {
      title: 'डॉक्टर लाइसेंस सत्यापित हुआ',
      body: () =>
        'बधाई हो! आपके मेडिकल पंजीकरण और दस्तावेजों को व्यवस्थापक द्वारा स्वीकृत कर दिया गया है।',
      link: '/doctor/dashboard'
    },
    mr: {
      title: 'डॉक्टर परवाना मंजूर झाला',
      body: () =>
        'अभिनंदन! तुमच्या वैद्यकीय नोंदणीची आणि कागदपत्रांची प्रशासनाकडून पडताळणी पूर्ण झाली आहे.',
      link: '/doctor/dashboard'
    }
  },

  PHARMACY_VERIFIED: {
    template_id: 'PHARM_VERIFIED',
    category: NOTIFICATION_CATEGORIES.VERIFICATION,
    priority: NOTIFICATION_PRIORITY.HIGH,
    en: {
      title: 'Dispensary License Approved',
      body: () =>
        'Your retail drug license has been verified by the platform administration. You may now dispense orders.',
      link: '/pharmacy/dashboard'
    },
    hi: {
      title: 'फार्मेसी लाइसेंस स्वीकृत हुआ',
      body: () =>
        'आपके दवा लाइसेंस की पुष्टि हो गई है। अब आप मरीजों के ऑर्डर स्वीकार कर सकते हैं।',
      link: '/pharmacy/dashboard'
    },
    mr: {
      title: 'फार्मसी परवाना मंजूर झाला',
      body: () =>
        'तुमच्या औषध परवान्याची पडताळणी पूर्ण झाली आहे. तुम्ही आता ऑर्डर्स पूर्ण करू शकता.',
      link: '/pharmacy/dashboard'
    }
  }
};

/**
 * Render template into localized text payload
 */
export function renderTemplate(templateKey, locale = 'en', params = {}) {
  const tpl = NOTIFICATION_TEMPLATES[templateKey];
  if (!tpl) {
    return {
      template_id: 'CUSTOM_NOTIFICATION',
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      priority: NOTIFICATION_PRIORITY.NORMAL,
      title: params.title || 'MediMind Notification',
      body: params.body || params.message || '',
      link: params.link || null
    };
  }

  const lang = (tpl[locale] ? locale : 'en');
  const localized = tpl[lang];

  return {
    template_id: tpl.template_id,
    category: tpl.category,
    priority: tpl.priority,
    title: typeof localized.title === 'function' ? localized.title(params) : localized.title,
    body: typeof localized.body === 'function' ? localized.body(params) : localized.body,
    link: localized.link || null
  };
}
