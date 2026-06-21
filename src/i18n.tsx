import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'app.title': 'Taita Taveta County GRM',
    'app.subtitle': 'Grievance Redress Mechanism System',
    'nav.log': 'Log Feedback',
    'nav.track': 'Track Resolution',
    'nav.admin': 'Staff Login',
    'nav.logout': 'Logout',
    'submit.title': 'Submit a Grievance (Form TT-GRM-01)',
    'submit.subtitle': 'All submissions are handled fairly, confidentially, and transparently.',
    'submit.anonymous': 'Submit Anonymously',
    'submit.anonymous_desc': 'If checked, you do not need to provide your personal details. However, tracking might require you to save your specific tracking number securely.',
    'submit.complainant': 'Complainant Details',
    'submit.name': 'Full Name',
    'submit.id': 'ID Number',
    'submit.phone': 'Phone Number',
    'submit.gender': 'Gender',
    'submit.select_gender': 'Select Gender',
    'submit.male': 'Male',
    'submit.female': 'Female',
    'submit.other': 'Other',
    'submit.details': 'Grievance Details',
    'submit.ward': 'Ward',
    'submit.select_ward': 'Select Ward',
    'submit.nature': 'Nature of Grievance',
    'submit.general': 'General Complaint',
    'submit.service': 'Service Delay',
    'submit.corruption': 'Corruption / Integrity Issue',
    'submit.gbv': 'Gender Based Violence (GBV)',
    'submit.emergency': 'Emergency',
    'submit.compliment': 'Compliment / Appreciation',
    'submit.suggestion': 'Suggestion',
    'submit.desc_label': 'Brief Description of the Incident/Issue',
    'submit.desc_hint': 'What happened, where, and who was involved?',
    'submit.prev_action': 'Previous Action Taken (Optional)',
    'submit.prev_hint': 'Have you reported this elsewhere? If yes, which office and what was the outcome?',
    'submit.submit_btn': 'Submit securely',
    'submit.get_advice': 'Get Advice Before Submitting',
    'submit.success': 'Grievance Submitted Successfully',
    'submit.success_desc': 'Your voice has been heard. We are committed to a 5-day resolution for standard queries.',
    'submit.tracking_no': 'Your Tracking Number',
    'submit.save_tracking': 'Please save this tracking number. You will need it to track the resolution progress of your submission.',
    'submit.track_btn': 'Track this Grievance',
    'track.title': 'Track Resolution Status',
    'track.subtitle': 'Enter your unique TT-GRM Tracking Number to monitor the investigation progress and official resolution.',
    'track.placeholder': 'e.g. TT-GRM-2026-0001, John Doe, or 0712345678',
    'track.button': 'Track',
    'track.no_records': 'No Records Found',
    'track.no_records_desc': 'We could not find any grievance matching your search. Please check your details and try again.'
  },
  sw: {
    'app.title': 'GRM ya Kaunti ya Taita Taveta',
    'app.subtitle': 'Mfumo wa Kutatua Malalamiko',
    'nav.log': 'Wasilisha Maoni',
    'nav.track': 'Fuatilia Uamuzi',
    'nav.admin': 'Orodha ya Wafanyakazi',
    'nav.logout': 'Ondoka',
    'submit.title': 'Wasilisha Lalamiko (Fomu TT-GRM-01)',
    'submit.subtitle': 'Mawasilisho yote yanashughulikiwa kwa usawa, siri, na uwazi.',
    'submit.anonymous': 'Wasilisha Bila Jina',
    'submit.anonymous_desc': 'Ikiwa imechaguliwa, huhitaji kutoa maelezo yako ya kibinafsi. Hata hivyo, ufuatiliaji unaweza kuhitaji uhifadhi namba yako maalum ya kufuatilia kwa usalama.',
    'submit.complainant': 'Maelezo ya Mlalamikaji',
    'submit.name': 'Jina Kamili',
    'submit.id': 'Nambari ya Kitambulisho',
    'submit.phone': 'Nambari ya Simu',
    'submit.gender': 'Jinsia',
    'submit.select_gender': 'Chagua Jinsia',
    'submit.male': 'Mwanamume',
    'submit.female': 'Mwanamke',
    'submit.other': 'Nyingine',
    'submit.details': 'Maelezo ya Lalamiko',
    'submit.ward': 'Wadi',
    'submit.select_ward': 'Chagua Wadi',
    'submit.nature': 'Aina ya Lalamiko',
    'submit.general': 'Lalamiko la Kawaida',
    'submit.service': 'Ucheleweshaji wa Huduma',
    'submit.corruption': 'Ufisadi / Suala la Uadilifu',
    'submit.gbv': 'Ukatili wa Kijinsia (GBV)',
    'submit.emergency': 'Dharura',
    'submit.compliment': 'Pongezi / Shukrani',
    'submit.suggestion': 'Pendekezo',
    'submit.desc_label': 'Maelezo Fupi ya Tukio/Suala',
    'submit.desc_hint': 'Nini kilitokea, wapi, na nani alihusika?',
    'submit.prev_action': 'Hatua Zilizochukuliwa Awali (Sio Lazima)',
    'submit.prev_hint': 'Je, umeripoti hili kwingineko? Kama ndiyo, ofisi gani na matokeo yalikuwa nini?',
    'submit.submit_btn': 'Wasilisha kwa usalama',
    'submit.get_advice': 'Pata Ushauri Kabla ya Kuwasilisha',
    'submit.success': 'Lalamiko Limewasilishwa Kikamilifu',
    'submit.success_desc': 'Sauti yako imesikika. Tumejitolea kutoa uamuzi ndani ya siku 5 kwa maswali ya kawaida.',
    'submit.tracking_no': 'Nambari Yako ya Kufuatilia',
    'submit.save_tracking': 'Tafadhali hifadhi nambari hii ya kufuatilia. Utaihitaji ili kufuatilia maendeleo ya uamuzi wa lalamiko lako.',
    'submit.track_btn': 'Fuatilia Lalamiko Hili',
    'track.title': 'Fuatilia Hali ya Uamuzi',
    'track.subtitle': 'Weka Nambari yako maalum ya Kufuatilia ya TT-GRM ili kufuatilia maendeleo ya uchunguzi na uamuzi rasmi.',
    'track.placeholder': 'mf. TT-GRM-2026-0001, John Doe, au 0712345678',
    'track.button': 'Fuatilia',
    'track.no_records': 'Hakuna Rekodi Zilizopatikana',
    'track.no_records_desc': 'Hatujaweza kupata lalamiko lolote linalofanana na utafutaji wako. Tafadhali angalia maelezo yako na ujaribu tena.'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return (translations[language] as any)[key] || (translations['en'] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
