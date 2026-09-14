import axios from "axios";
import offlineTranslationService from "./offlineTranslationService";
import { ghanaianLanguages } from "../data/ghanaianLanguages";
import { GHANA_REGIONS } from "../data/ghanaCodes";
import API_CONFIG from "../config/apiConfig";

// Google Translate language code mapping for Ghanaian languages
const GOOGLE_LANG_MAP = {
  en: 'en', tw: 'ak', ee: 'ee', gaa: 'gaa', dag: 'dag',
  ha: 'ha', fat: 'ak', nzi: 'ak', ki: 'ki',
};

const TRANSLATION_CACHE_KEY = 'agromet_translations_v8';
const TRANSLATION_BATCH_SEPARATOR = '|||AGROMET_TRANSLATION_BREAK|||';
const TRANSLATION_BATCH_ITEM_LIMIT = 25;
const TRANSLATION_BATCH_CHAR_LIMIT = 3500;
const TRANSLATION_BACKEND_TIMEOUT_MS = 8000;
const TRANSLATION_BATCH_BACKEND_TIMEOUT_MS = 12000;
const LEGACY_TRANSLATION_CACHE_KEYS = [
  'agromet_translations_v1',
  'agromet_translations_v2',
  'agromet_translations_v3',
  'agromet_translations_v4',
  'agromet_translations_v5',
  'agromet_translations_v6',
  'agromet_translations_v7',
];

const BASE_LOCATION_NAMES = [
  'Accra',
  'Kumasi',
  'Tamale',
  'Wa',
  'Bolgatanga',
  'Koforidua',
  'Cape Coast',
  'Ho',
  'Takoradi',
  'Bole',
  'Tema',
  'Obuasi',
  'Tarkwa',
  'Techiman',
  'Navrongo',
  'Sunyani',
  'Sekondi',
  'Kasoa',
  'Madina',
  'Ashaiman',
  'Axim',
  'Yendi',
  'Damongo',
  'Nalerigu',
  'Goaso',
  'Dambai',
  'Sefwi Wiawso',
];
const BASE_LOCATION_NAME_LOOKUP = new Set(
  BASE_LOCATION_NAMES.map((name) => name.toLowerCase())
);

const LOCATION_ADMIN_SUFFIX_PATTERN =
  /\s+(Region|Metropolitan|Municipal|Municipality|District|Assembly|Metropolis)$/i;
const NON_TRANSLATABLE_TERMS = new Set([
  'GMet',
  'Min',
  'Max',
  'km/h',
  'mm',
  'cm',
  'm',
  'kg',
  'ha',
  'pH',
  'API',
  'SMS',
  'ID',
  '%',
  'C',
  'F',
]);

const UNIT_OR_SYMBOL_PATTERN =
  /^(\d+(\.\d+)?\s*)?([%°]|°[CF]|mm|cm|m|km\/h|kg|ha|pH)$/i;
const CODE_LIKE_PATTERN = /^(?=.*[0-9./&-])[A-Za-z0-9./&-]{2,}$/;

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeLocationName = (value) =>
  String(value || '').replace(/\s+/g, ' ').trim();

const stripLocationQualifier = (value) =>
  normalizeLocationName(value).replace(LOCATION_ADMIN_SUFFIX_PATTERN, '').trim();

const addLocationName = (names, value) => {
  const name = normalizeLocationName(value);
  if (!name || name.length < 2) return;

  names.add(name);

  const stripped = stripLocationQualifier(name);
  const isRegionName = /\s+Region$/i.test(name);
  const shouldAddStrippedName =
    !isRegionName ||
    stripped.includes(' ') ||
    BASE_LOCATION_NAME_LOOKUP.has(stripped.toLowerCase());

  if (stripped && stripped !== name && stripped.length >= 2 && shouldAddStrippedName) {
    names.add(stripped);
  }
};

const buildLocationNames = () => {
  const names = new Set(BASE_LOCATION_NAMES);

  Object.values(GHANA_REGIONS).forEach((region) => {
    addLocationName(names, region.name);
    Object.values(region.districts || {}).forEach((districtName) => {
      addLocationName(names, districtName);
    });
  });

  return [...names].sort((a, b) => b.length - a.length);
};

const LOCATION_NAMES = buildLocationNames();
const LOCATION_NAME_LOOKUP = new Set(
  LOCATION_NAMES.map((name) => name.toLowerCase())
);

const normalizeExactLocationCandidate = (value) =>
  normalizeLocationName(value).replace(/^[\s"']+|[\s"',.:;!?]+$/g, '');

const isProtectedLocationName = (value) => {
  const candidate = normalizeExactLocationCandidate(value);
  return Boolean(candidate) && LOCATION_NAME_LOOKUP.has(candidate.toLowerCase());
};

const getLocationPlaceholder = (index) => `[[[~${index}~]]]`;

const restoreProtectedLocationNames = (text, replacements) => {
  let restored = String(text || '');

  replacements.forEach(({ placeholder, value }) => {
    restored = restored.replace(new RegExp(escapeRegExp(placeholder), 'g'), value);
  });

  return restored;
};

const protectLocationNames = (text) => {
  const sourceText = String(text || '');
  const replacements = [];
  let protectedText = sourceText;

  LOCATION_NAMES.forEach((name) => {
    const flags = name.length <= 2 ? 'gu' : 'giu';
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}])(${escapeRegExp(name)})(?=$|[^\\p{L}\\p{N}])`,
      flags
    );

    protectedText = protectedText.replace(pattern, (match, prefix, matchedName) => {
      const placeholder = getLocationPlaceholder(replacements.length);
      replacements.push({ placeholder, value: matchedName });
      return `${prefix}${placeholder}`;
    });
  });

  return {
    text: protectedText,
    restore: (translatedText) =>
      normalizeTranslationText(
        restoreProtectedLocationNames(translatedText, replacements)
      ),
  };
};

const normalizeTranslationText = (text) =>
  String(text || '').replace(/\s+/g, ' ').trim();

const isNonTranslatableText = (value) => {
  const text = normalizeTranslationText(value);
  if (!text) return true;
  if (NON_TRANSLATABLE_TERMS.has(text)) return true;
  if (UNIT_OR_SYMBOL_PATTERN.test(text)) return true;
  if (CODE_LIKE_PATTERN.test(text)) return true;
  return false;
};

const isUsableTranslation = (value, sourceText) => {
  const normalizedValue = normalizeTranslationText(value);
  const normalizedSource = normalizeTranslationText(sourceText);

  return Boolean(normalizedValue) && normalizedValue.toLowerCase() !== normalizedSource.toLowerCase();
};

const extractTranslatedText = (data) => {
  if (typeof data === 'string') {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const candidateKeys = ['out', 'translation', 'translatedText', 'text', 'result'];
  for (const key of candidateKeys) {
    if (typeof data[key] === 'string') {
      return data[key];
    }
  }

  return null;
};

const extractBatchTranslations = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const candidateKeys = ['translations', 'results', 'out'];
  for (const key of candidateKeys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  return null;
};

const LOCAL_TRANSLATION_OVERRIDES = {
  en: {
    tw: {
      'Home': 'Fie',
      'Agromet Advisory': 'Kuadwuma wim tebea ho afotu',
      'Diagnose': 'Hwehwɛ yare',
      'Market': 'Gua',
      'Weather': 'Wim tebea',
      'Agriculture': 'Kuadwuma',
      'Admin': 'Ɔhwɛfo',
      'Crop Diagnose': 'Hwehwɛ nnɔbae yare',
      'Dashboard Time': 'Bere',
      'Immediate Actions': 'Nneyɛe a ɛsɛ sɛ woyɛ ntɛm',
      'Quick tools': 'Nnwinnade a wɔde yɛ adwuma ntɛm',
      'Featured forecast': 'Wim tebea ho nkɔmhyɛ titiriw',
      'Min': 'Nea ɛba fam',
      'Max': 'Nea ɛkorɔn',
      'Feels': 'Sɛnea ɛte',
      'Feels like': 'Ɛte sɛ',
      'Search local weather': 'Hwehwɛ wo mpɔtam wim tebea',
      'Enter location, e.g. Accra': 'Kyerɛw beae, sɛ nhwɛso Accra',
      'Search': 'Hwehwɛ',
      'Location Check': 'Hwɛ beae',
      'Check Forecast': 'Hwɛ wim tebea nkɔmhyɛ',
      '7-day outlook.': 'Nnanson nkɔmhyɛ.',
      'Crop guidance.': 'Nnɔbae ho akwankyerɛ.',
      'Diagnose Crop': 'Hwehwɛ nnɔbae yare',
      'Check crop stress.': 'Hwɛ ɔhaw a ɛwɔ nnɔbae so.',
      'Market Prices': 'Gua so nneɛma bo',
      'Commodity signals.': 'Gua so nsɛnkyerɛnne.',
      'Weather for': 'Wim tebea ma',
      'Major Ghana cities.': 'Ghana nkurow akɛse.',
      'Local weather': 'Mpɔtam wim tebea',
      'Condition': 'Tebea',
      'Temperature': 'Ɔhyew',
      'Rain': 'Osu',
      'Humidity': 'Mframa mu nsu',
      'Wind': 'Mframa',
      'Visibility': 'Anihu',
      'Forecast': 'Nkɔmhyɛ',
      'Updated': 'Wɔayɛ no foforo',
      'Alert Status': 'Kɔkɔbɔ tebea',
      'No active severe weather alerts': 'Wim tebea bɔne ho kɔkɔbɔ biara nni hɔ',
      'Severity': 'Nea emu yɛ den',
      'Normal': 'Ɛyɛ daa',
      'Risk Window': 'Bere a asiane wɔ mu',
      'Today': 'Ɛnnɛ',
      'Current location': 'Beae a wowɔ seesei',
      'Detecting your location...': 'Yɛrehwehwɛ beae a wowɔ...',
      'Farm weather at a glance': 'Kuadwuma wim tebea',
      'Create Your Farm Profile': 'Yɛ wo Kuadwuma ho nsɛm',
      'Create farm profile': 'Yɛ Kuadwuma ho nsɛm',
      'View farm profile': 'Hwɛ Kuadwuma ho nsɛm',
      'Farm Details': 'Kuadwuma ho nsɛm',
      'Farm Size': 'Kuadwuma kɛse',
      'Farm size must be greater than 0': 'Kuadwuma kɛseɛ no ɛsɛ sɛ ɛboro 0',
      'On-farm storage': 'Kuadwuma so adekora',
      'Your farming assistant': 'Wo kuadwuma boafo',
    },
    gaa: {
      'Home': 'Shia',
      'Agromet Advisory': 'Okwaayeli kɛ wɛ he ŋaawoo',
      'Diagnose': 'Hela mli kwɛmɔ',
      'Market': 'Gua',
      'Weather': 'Wɛ',
      'Agriculture': 'Okwaayeli',
      'Admin': 'Nɔkwɛmɔlɔ',
      'Crop Diagnose': 'Ŋmɔshinii hela mli kwɛmɔ',
      'Dashboard Time': 'Saha',
      'Immediate Actions': 'Nifeemɔi ni ehe hia amrɔ nɔŋŋ',
      'Quick tools': 'Niiŋmaa ni akɛtsu nii amrɔ nɔŋŋ',
      'Featured forecast': 'Wɛ he nɔkwɛmɔ titiri',
      'Min': 'Nɔ ni baa shishi',
      'Max': 'Nɔ ni baa nyɛŋ',
      'Feels': 'Bɔ ni ekɛji',
      'Feels like': 'Ekɛji akɛ',
      'Search local weather': 'Hela omanyɛ mli wɛ',
      'Enter location, e.g. Accra': 'Ŋma he, nɔkwɛmɔ Accra',
      'Search': 'Hela',
      'Location Check': 'He kwɛmɔ',
      'Check Forecast': 'Kwɛmɔ wɛ he nɔkwɛmɔ',
      '7-day outlook.': 'Gbi enyɔŋma nɔkwɛmɔ.',
      'Crop guidance.': 'Ŋmɔshinii he ŋaawoo.',
      'Diagnose Crop': 'Kwɛmɔ ŋmɔshinii hela',
      'Check crop stress.': 'Kwɛmɔ ŋmɔshinii he naagba.',
      'Market Prices': 'Gua nii agbɛi',
      'Commodity signals.': 'Gua he kɛkɛbɔɔ.',
      'Weather for': 'Wɛ kɛha',
      'Major Ghana cities.': 'Ghana manbii kaklakakla.',
      'Local weather': 'Omanyɛ mli wɛ',
      'Condition': 'Nɔnɔme',
      'Temperature': 'Gbiɛmɔ',
      'Rain': 'Nugbɔ',
      'Humidity': 'Mli nugbɔ',
      'Wind': 'Fɔɔ',
      'Visibility': 'Nɔna',
      'Forecast': 'Nɔkwɛmɔ',
      'Updated': 'Atsake',
      'Alert Status': 'Kɛkɛbɔɔ nɔnɔme',
      'No active severe weather alerts': 'Wɛ he kɛkɛbɔɔ kpakpa ko bɛ amrɔ nɛɛ',
      'Severity': 'Bɔ ni ekɛse',
      'Normal': 'Mli hi',
      'Risk Window': 'Gbeyei be',
      'Today': 'Nɛɛ',
      'Current location': 'He ni oyɛ amrɔ nɛɛ',
      'Detecting your location...': 'Wɔkwɛ he ni oyɛ...',
      'Farm weather at a glance': 'Okwaa ni ayeɔ kɛji akwɛ',
      'Create Your Farm Profile': 'Bɔɔ Okwaayeli he saji',
      'Create farm profile': 'Bɔɔ ŋmɔ mli saji',
      'View farm profile': 'Kwɛmɔ ŋmɔ lɛ he saji',
      'Farm Details': 'Okwaayeli he saji fitsofitso',
      'Farm Size': 'Okwaayeli Dalɛ',
      'Farm size must be greater than 0': 'Esa akɛ ŋmɔ lɛ dalɛ afee nɔ ni fe 0',
      'On-farm storage': 'Nibii ni akɛtoɔ yɛ ŋmɔ mli',
      'Your farming assistant': 'Okwaayeli he yelikɛbualɔ',
    },
    ee: {
      'Home': 'Aƒeme',
      'Agromet Advisory': 'Agbledede kple yame ŋuti aɖaŋu',
      'Diagnose': 'De dɔléle dzesi',
      'Market': 'Asime',
      'Weather': 'Yame ƒe nɔnɔme',
      'Agriculture': 'Agbledede',
      'Admin': 'Dɔdzikpɔla',
      'Crop Diagnose': 'De agblemenuku ƒe dɔléle dzesi',
      'Dashboard Time': 'Ɣeyiɣi',
      'Immediate Actions': 'Nusiwo wòawɔ enumake',
      'Quick tools': 'Dɔwɔnu siwo wòazã enumake',
      'Featured forecast': 'Yame ƒe nɔnɔme si wotia',
      'Min': 'Baxɔxɔ suetɔ',
      'Max': 'Baxɔxɔ gãtɔ',
      'Feels': 'Alesi wòesena',
      'Feels like': 'Wòesena abe',
      'Search local weather': 'Di yame ƒe nɔnɔme le wò nutoa me',
      'Enter location, e.g. Accra': 'Ŋlɔ teƒe, le kpɔɖeŋu me Accra',
      'Search': 'Di',
      'Location Check': 'Teƒe me dzodzro',
      'Check Forecast': 'Kpɔ yame ƒe nɔnɔme',
      '7-day outlook.': 'Ŋkeke adre ƒe nukpɔkpɔ.',
      'Crop guidance.': 'Agblemenukuwo ŋuti mɔfiame.',
      'Diagnose Crop': 'De agblemenuku ƒe dɔléle dzesi',
      'Check crop stress.': 'Kpɔ dzesi siwo le agblemenuku ŋu.',
      'Market Prices': 'Asime ƒe asiwo',
      'Commodity signals.': 'Asime ƒe dzesiwo.',
      'Weather for': 'Yame ƒe nɔnɔme na',
      'Major Ghana cities.': 'Ghana du gãwo.',
      'Local weather': 'Nutoa me yame ƒe nɔnɔme',
      'Condition': 'Nɔnɔme',
      'Temperature': 'Mɔxexe',
      'Rain': 'Tsidzadza',
      'Humidity': 'Yame me tsi',
      'Wind': 'Ya',
      'Visibility': 'Nukpɔkpɔ',
      'Forecast': 'Nukpɔkpɔ',
      'Updated': 'Wotrɔ asi le eŋu',
      'Alert Status': 'Nuxlɔ̃ame ƒe nɔnɔme',
      'No active severe weather alerts': 'Yame ƒe nɔnɔme sesẽ ŋuti nuxlɔ̃ame aɖeke mele dɔ wɔm o',
      'Severity': 'Alesi wòsesẽe',
      'Normal': 'Le blibo me',
      'Risk Window': 'Afɔku ƒe ɣeyiɣi',
      'Today': 'Egbe',
      'Current location': 'Teƒe si nèle fifia',
      'Detecting your location...': 'Míele teƒe si nèle dim...',
      'Farm weather at a glance': 'Agbledede ƒe yame ƒe nɔnɔme le ŋkubiãnya me',
      'Create Your Farm Profile': 'Wɔ Wò Agbledede Ŋuti Nyatakaka',
      'Create farm profile': 'Wɔ agbledeƒe ƒe nɔnɔmetata',
      'View farm profile': 'Kpɔ agbledede ƒe nɔnɔmetata',
      'Farm Details': 'Agbledede Ŋuti Nyatakakawo',
      'Farm Size': 'Agbledede ƒe Agbɔsɔsɔme',
      'Farm size must be greater than 0': 'Ele be agbledede ƒe lolome nalolo wu 0',
      'On-farm storage': 'Nudzraɖoƒe si le agble dzi',
      'Your farming assistant': 'Miaƒe agbledede ƒe kpeɖeŋutɔ',
    },
    dag: {
      'Home': 'Kuliga',
      'Agromet Advisory': 'Ŋmɛlim kpamli',
      'Diagnose': 'Ʒiŋmabo',
      'Market': 'Daa',
      'Weather': 'Wɛi',
      'Agriculture': 'Tiŋgbani ŋɔ ni wurim',
      'Admin': 'Zaŋmaribaŋda',
      'Crop Diagnose': 'Kpɛm bindira',
      'Dashboard Time': 'Ŋariŋga saha',
      'Immediate Actions': 'Tuun yomyom tuma',
      'Quick tools': 'Nɛma din yɛla biŋkumda pam',
      'Featured forecast': 'Saha biɛɣu pahiri',
      'Min': 'Biɛla',
      'Max': 'Pam',
      'Feels': 'Biɛhigu',
      'Feels like': 'Lala biɛrigu maa biɛhigu',
      'Minimum temperature': 'Biliɛɣu din balli biɛla',
      'Maximum temperature': 'Biliɛɣu pam',
      'Search local weather': 'Bom palo miri saha',
      'Enter location, e.g. Accra': 'Doliya luɣ shɛli, sɛ Accra',
      'Search': 'Bɔmiya',
      'Location Check': 'Luɣu vihigu',
      'Alert Status': 'Siɣa zali',
      'No active severe weather alerts': 'Saha siɣa kpiɔŋ bi be',
      'No warnings are active. New alerts appear here first.': 'Saɣisigu bi tuhi. Siɣa palli yirila kpe',
      'Severity': 'Kpiɔŋ shee',
      'Normal': 'Baɣayulilana',
      'Risk Window': 'Barina takɔro',
      'Today': 'Zuŋo',
      'Current location': 'Luɣu shɛli a be pumpɔŋɔ',
      'Detecting your location...': 'Ti vihiri luɣu shɛli a be...',
      'Checked': 'Vihigu',
      'Updated': 'Yaha n-nabi',
      'Check Forecast': 'Kpahimmiya saha biɛɣu',
      '7-day outlook.': 'Yini 7 ni nyaŋ shɛm',
      'Crop guidance.': 'Bindirigu gbinni.',
      'Diagnose Crop': 'Ʒiŋmabo bindirigu',
      'Check crop stress.': 'Kpahimmiya bindirigu tɔŋ.',
      'Bindirigu guidance.': 'Bindirigu gbinni',
      'Diagnose Bindirigu': 'Ʒiŋmabo bindirigu',
      'Check Bindirigu stress.': 'Kpahimmiya bindirigu tɔŋ',
      'Market Prices': 'Daa mali liɣiri',
      'Commodity signals.': 'Daa ni noli',
      'Weather for': 'Saha biɛɣu n-ti',
      'Major Ghana cities.': 'Ghana tinsi gari',
      'Major Ghana cities': 'Ghana tinsi gari',
      'Local weather': 'Sɔli miri saha',
      'advisories': 'Saawarimaaniba',
      'prices': 'Daa mali liɣiri',
      'map access': 'Yɛlimuɣisira nyɛbu',
      'in one place': 'luɣ yini',
      'Alerts, local weather, advisories, prices, and map access in one place.': 'Siɣa, palo miri saha, saawarimaaniba, liɣiri, mini yɛlimuɣisira nyɛbu be luɣ yini.',
      'Quick town check before forecasts or the map.': 'Tiŋ yomyom vihigu zaŋ kpɛ saha biɛɣu bee map zuɣu.',
      'Slightly warmer than yesterday, partly cloudy now, 0mm rain.': 'Biɛlabiɛla n-gari saa, ka miri paai pumpɔŋɔ, saa 0mm.',
      'Condition': 'Saliŋ lɔŋ',
      'Temperature': 'Tulim',
      'Rain': 'Saa',
      'Humidity': 'Ninsala malibu',
      'Wind': 'Pɔhim',
      'Visibility': 'Nyaanzum',
      'Forecast': 'Ʒiɛmani ŋɔ',
      'Farm weather at a glance': 'Kpukpuɣibo yuŋ lihiri.',
      'Create Your Farm Profile': 'Malimi a puu alikauli.',
      'Create farm profile': 'Nahim puu alikauli.',
      'View farm profile': 'Nyamiya puu alikauli.',
      'Farm Details': 'Pukpara kpalim wuhiya.',
      'Farm Size': 'Bɔrɔbɔro Blibu.',
      'Farm size must be greater than 0': 'Pukpara mi ti gari pia.',
      'On-farm storage': 'Ʒiɛmbu shee.',
      'Your farming assistant': 'A kɔbu nyaanzaana.',
    },
  },
};

const getLocalTranslationOverride = (text, sourceLang, targetLang) => {
  const normalizedText = normalizeTranslationText(text);
  return LOCAL_TRANSLATION_OVERRIDES[sourceLang]?.[targetLang]?.[normalizedText] || null;
};

async function googleTranslateFallback(text, sourceLang, targetLang) {
  const sl = GOOGLE_LANG_MAP[sourceLang] || sourceLang;
  const tl = GOOGLE_LANG_MAP[targetLang] || targetLang;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0].map(s => s[0]).join('');
  }
  throw new Error('Invalid Google Translate response');
}

async function googleTranslateBatchFallback(texts, sourceLang, targetLang) {
  const translations = [];

  for (const text of texts) {
    translations.push(await googleTranslateFallback(text, sourceLang, targetLang));
  }

  return translations;
}

// Browser translation service with offline fallback
class TranslationService {
  constructor() {
    this.baseUrl = API_CONFIG.TRANSLATION_BASE_URL;
    this.ttsUrl = API_CONFIG.TTS_BASE_URL;
    this.useBackendTranslation = true;
    this.useBackendTts = false;

    console.log('[TranslationService] INIT — baseUrl:', this.baseUrl, '| BACKEND_BASE_URL:', API_CONFIG.BACKEND_BASE_URL);

    // Circuit breaker for API health tracking
    this.apiHealthStatus = {
      translation: { isHealthy: true, lastFailure: null, failureCount: 0 },
      tts: { isHealthy: true, lastFailure: null, failureCount: 0 }
    };
    this.circuitBreakerThreshold = 5; // Fail after 5 consecutive errors
    this.circuitBreakerTimeout = 120000; // Reset after 2 minutes

    // Use comprehensive language data
    this.languages = ghanaianLanguages.languages;

    // Translation cache to reduce API calls — hydrated from localStorage
    this.cache = new Map();
    this._hydrateCache();
    this._persistTimer = null;

    // Track online/offline status
    this.isOnline = navigator.onLine;
    window.addEventListener("online", () => (this.isOnline = true));
    window.addEventListener("offline", () => (this.isOnline = false));
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.languages;
  }

  // Get user's preferred language from localStorage or browser
  getUserLanguage() {
    const stored = localStorage.getItem("preferredLanguage");
    if (stored && this.languages[stored]) {
      return stored;
    }

    // Try to detect from browser
    const browserLang = navigator.language.split("-")[0];
    return this.languages[browserLang] ? browserLang : "en";
  }

  // Set user's preferred language
  setUserLanguage(langCode) {
    if (this.languages[langCode]) {
      localStorage.setItem("preferredLanguage", langCode);
      return true;
    }
    return false;
  }

  getTranslationOverride(text, targetLang = "tw", sourceLang = "en") {
    return getLocalTranslationOverride(text, sourceLang, targetLang);
  }

  isProtectedLocationName(text) {
    return isProtectedLocationName(text);
  }

  shouldTranslateText(text, targetLang = "tw", sourceLang = "en") {
    const normalizedText = normalizeTranslationText(text);
    return Boolean(normalizedText)
      && targetLang !== sourceLang
      && !this.isProtectedLocationName(normalizedText)
      && !isNonTranslatableText(normalizedText);
  }

  async translateViaBackend(text, sourceLang, targetLang) {
    text = normalizeTranslationText(text);

    if (!this.shouldTranslateText(text, targetLang, sourceLang)) {
      return text;
    }

    const protectedTranslation = protectLocationNames(text);
    const response = await axios.post(
      this.baseUrl,
      {
        in: protectedTranslation.text,
        lang: `${sourceLang}-${targetLang}`,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: TRANSLATION_BACKEND_TIMEOUT_MS,
      }
    );

    return protectedTranslation.restore(extractTranslatedText(response.data));
  }

  async translateManyViaBackend(texts, sourceLang, targetLang) {
    const response = await axios.post(
      `${this.baseUrl}/batch`,
      {
        texts,
        lang: `${sourceLang}-${targetLang}`,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: TRANSLATION_BATCH_BACKEND_TIMEOUT_MS,
      }
    );

    const translations = extractBatchTranslations(response.data);
    if (!Array.isArray(translations) || translations.length !== texts.length) {
      throw new Error('Invalid response format from batch translation API');
    }

    return translations.map((translation) => normalizeTranslationText(translation));
  }

  // Hydrate translation cache from localStorage, purging stale entries
  _hydrateCache() {
    try {
      LEGACY_TRANSLATION_CACHE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });

      const raw = localStorage.getItem(TRANSLATION_CACHE_KEY);
      if (raw) {
        const entries = JSON.parse(raw);
        let purged = false;
        for (const [k, v] of entries) {
          // Cache key format: "sourceText_sourceLang_targetLang"
          // Skip entries where the "translation" is just the original English text
          const lastUs = k.lastIndexOf('_');
          const secondLastUs = k.lastIndexOf('_', lastUs - 1);
          if (secondLastUs > 0) {
            const sourceText = k.substring(0, secondLastUs);
            if (!isUsableTranslation(v, sourceText)) {
              purged = true;
              continue; // Don't load poisoned cache entries
            }
          }
          this.cache.set(k, v);
        }
        if (purged) {
          this._persistCache(); // Re-persist cleaned cache
        }
      }
    } catch {
      // Corrupted cache — ignore
    }
  }

  // Persist translation cache to localStorage (debounced)
  _persistCache() {
    if (this._persistTimer) return;
    this._persistTimer = setTimeout(() => {
      this._persistTimer = null;
      try {
        let entries = [...this.cache.entries()];
        // Cap at 10,000 entries — keep newest
        if (entries.length > 10000) {
          entries = entries.slice(entries.length - 10000);
          this.cache = new Map(entries);
        }
        localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(entries));
      } catch {
        // localStorage full or unavailable — ignore
      }
    }, 1000);
  }

  // Check if API should be used based on circuit breaker
  shouldUseApi(apiType) {
    const status = this.apiHealthStatus[apiType];
    if (!status.isHealthy) {
      const timeSinceFailure = Date.now() - status.lastFailure;
      if (timeSinceFailure > this.circuitBreakerTimeout) {
        // Reset circuit breaker after timeout
        status.isHealthy = true;
        status.failureCount = 0;
        console.log(`🔄 Circuit breaker reset for ${apiType} API`);
        return true;
      }
      console.log(`🚫 Circuit breaker open for ${apiType} API - using fallback`);
      return false;
    }
    return true;
  }

  // Record API failure
  recordApiFailure(apiType, error) {
    const status = this.apiHealthStatus[apiType];
    status.failureCount++;
    status.lastFailure = Date.now();
    
    // Check if we should open circuit breaker
    if (status.failureCount >= this.circuitBreakerThreshold && status.isHealthy) {
      status.isHealthy = false;
      console.warn(`🚨 Circuit breaker opened for ${apiType} API after ${status.failureCount} failures`);
    }
    
    // Log the specific error type
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.warn(`⏰ ${apiType} API timeout - server may be down`);
    }
  }

  // Reset the translation circuit breaker (e.g., when user switches language)
  resetTranslationCircuitBreaker() {
    this.apiHealthStatus.translation.isHealthy = true;
    this.apiHealthStatus.translation.failureCount = 0;
    this.apiHealthStatus.translation.lastFailure = null;
    console.log('🔄 Translation circuit breaker reset');
  }

  // Purge stale cache entries for a given target language (where value === source text)
  purgeStaleEntries(targetLang) {
    let purged = 0;
    for (const [key, value] of this.cache.entries()) {
      if (key.endsWith(`_${targetLang}`)) {
        const lastUs = key.lastIndexOf('_');
        const secondLastUs = key.lastIndexOf('_', lastUs - 1);
        if (secondLastUs > 0) {
          const sourceText = key.substring(0, secondLastUs);
          if (!isUsableTranslation(value, sourceText)) {
            this.cache.delete(key);
            purged++;
          }
        }
      }
    }
    if (purged > 0) {
      console.log(`🧹 Purged ${purged} stale cache entries for ${targetLang}`);
      this._persistCache();
    }
  }

  clearLanguageCache(targetLang) {
    let purged = 0;
    for (const key of this.cache.keys()) {
      if (key.endsWith(`_${targetLang}`)) {
        this.cache.delete(key);
        purged++;
      }
    }

    if (purged > 0) {
      this._persistCache();
    }
  }

  // Translate text with offline fallback
  async translate(text, targetLang = "tw", sourceLang = "en") {
    text = normalizeTranslationText(text);

    if (!this.shouldTranslateText(text, targetLang, sourceLang)) {
      return text;
    }

    const localOverride = this.getTranslationOverride(text, targetLang, sourceLang);
    if (localOverride) {
      const cacheKey = `${text}_${sourceLang}_${targetLang}`;
      this.cache.set(cacheKey, localOverride);
      this._persistCache();
      return localOverride;
    }

    const protectedTranslation = protectLocationNames(text);

    // Check cache first
    const cacheKey = `${text}_${sourceLang}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && isUsableTranslation(cached, text)) {
        return cached;
      }
      this.cache.delete(cacheKey);
    }

    // UI translation must be fast. Try the client-side translator before the
    // optional backend path, then fall back to offline terms.
    let browserTranslationAttempted = false;
    if (this.isOnline) {
      browserTranslationAttempted = true;
      try {
        const googleResult = protectedTranslation.restore(
          await googleTranslateFallback(protectedTranslation.text, sourceLang, targetLang)
        );
        if (isUsableTranslation(googleResult, text)) {
          const normalizedResult = normalizeTranslationText(googleResult);
          this.cache.set(cacheKey, normalizedResult);
          this._persistCache();
          return normalizedResult;
        }
      } catch (googleError) {
        console.warn("Fast translation fallback failed:", googleError.message);
      }
    }

    if (!this.useBackendTranslation || !this.isOnline || !this.shouldUseApi('translation')) {
      try {
        if (browserTranslationAttempted) {
          throw new Error('Browser translation already attempted');
        }
        const googleResult = protectedTranslation.restore(
          await googleTranslateFallback(protectedTranslation.text, sourceLang, targetLang)
        );
        if (isUsableTranslation(googleResult, text)) {
          const normalizedResult = normalizeTranslationText(googleResult);
          this.cache.set(cacheKey, normalizedResult);
          this._persistCache();
          return normalizedResult;
        }
      } catch {
        // Google also failed — try offline
      }
      const offlineTranslation = protectedTranslation.restore(
        offlineTranslationService.translateOffline(
          protectedTranslation.text,
          sourceLang,
          targetLang
        )
      );
      if (isUsableTranslation(offlineTranslation, text)) {
        const normalizedResult = normalizeTranslationText(offlineTranslation);
        this.cache.set(cacheKey, normalizedResult);
        this._persistCache();
        return normalizedResult;
      }
      throw new Error('All translation methods unavailable');
    }

    try {
      console.log(`🔄 Translating: "${text}" from ${sourceLang} to ${targetLang} → URL: ${this.baseUrl}`);

      const response = await axios.post(
        this.baseUrl,
        {
          in: protectedTranslation.text,
          lang: `${sourceLang}-${targetLang}`,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: TRANSLATION_BACKEND_TIMEOUT_MS,
        }
      );
      
      console.log('✅ Translation API Response:', response.data);

      const translatedText = protectedTranslation.restore(
        extractTranslatedText(response.data)
      );
      if (!isUsableTranslation(translatedText, text)) {
        throw new Error('Invalid response format from translation API');
      }

      console.log(`✅ Translation result: "${translatedText}"`);
      this.cache.set(cacheKey, translatedText);
      this._persistCache();
      return translatedText;
    } catch (error) {
      console.error("❌ Backend translation error:", error.message);
      this.recordApiFailure('translation', error);
    }

    // Fallback: call Google Translate directly from browser (no backend needed)
    try {
      if (browserTranslationAttempted) {
        throw new Error('Browser translation already attempted');
      }
      console.log(`🔄 Trying Google Translate fallback for "${text}"`);
      const googleResult = protectedTranslation.restore(
        await googleTranslateFallback(protectedTranslation.text, sourceLang, targetLang)
      );
      if (isUsableTranslation(googleResult, text)) {
        const normalizedResult = normalizeTranslationText(googleResult);
        console.log(`✅ Google Translate result: "${googleResult}"`);
        this.cache.set(cacheKey, normalizedResult);
        this._persistCache();
        return normalizedResult;
      }
    } catch (googleError) {
      if (!browserTranslationAttempted) {
        console.error("❌ Google Translate fallback error:", googleError.message);
      }
    }

    // Last resort: offline translation
    const offlineTranslation = protectedTranslation.restore(
      offlineTranslationService.translateOffline(
        protectedTranslation.text,
        sourceLang,
        targetLang
      )
    );
    if (isUsableTranslation(offlineTranslation, text)) {
      const normalizedResult = normalizeTranslationText(offlineTranslation);
      this.cache.set(cacheKey, normalizedResult);
      this._persistCache();
      return normalizedResult;
    }
    throw new Error(`All translation methods failed for "${text}"`);
  }

  async translateMany(values, targetLang = "tw", sourceLang = "en") {
    const results = new Map();
    const pending = [];

    values.forEach((value) => {
      const text = normalizeTranslationText(value);
      if (!this.shouldTranslateText(text, targetLang, sourceLang)) {
        results.set(value, text);
        results.set(text, text);
        return;
      }

      const cacheKey = `${text}_${sourceLang}_${targetLang}`;
      const localOverride = this.getTranslationOverride(text, targetLang, sourceLang);
      if (localOverride) {
        this.cache.set(cacheKey, localOverride);
        results.set(value, localOverride);
        results.set(text, localOverride);
        return;
      }

      const cached = this.cache.get(cacheKey);
      if (cached && isUsableTranslation(cached, text)) {
        results.set(value, cached);
        return;
      }

      if (cached === text) {
        this.cache.delete(cacheKey);
      }

      const protectedTranslation = protectLocationNames(text);
      pending.push({
        original: value,
        text,
        textForTranslation: protectedTranslation.text,
        restoreTranslation: protectedTranslation.restore,
        cacheKey,
      });
    });

    const commit = (item, translated) => {
      const restoredTranslation = item.restoreTranslation
        ? item.restoreTranslation(translated)
        : normalizeTranslationText(translated);

      if (isUsableTranslation(restoredTranslation, item.text)) {
        const normalizedResult = normalizeTranslationText(restoredTranslation);
        this.cache.set(item.cacheKey, normalizedResult);
        results.set(item.original, normalizedResult);
        results.set(item.text, normalizedResult);
        return true;
      }
      return false;
    };

    for (let index = 0; index < pending.length;) {
      const chunk = [];
      let charCount = 0;

      while (index < pending.length && chunk.length < TRANSLATION_BATCH_ITEM_LIMIT) {
        const next = pending[index];
        const nextSize = next.textForTranslation.length + TRANSLATION_BATCH_SEPARATOR.length + 2;
        if (chunk.length > 0 && charCount + nextSize > TRANSLATION_BATCH_CHAR_LIMIT) {
          break;
        }
        chunk.push(next);
        charCount += nextSize;
        index += 1;
      }

      let fallbackItems = chunk;
      if (this.isOnline && chunk.length > 0) {
        const chunkTexts = chunk.map((item) => item.textForTranslation);
        try {
          let batchResults = null;

          try {
            batchResults = await googleTranslateBatchFallback(
              chunkTexts,
              sourceLang,
              targetLang
            );
          } catch (browserBatchError) {
            console.warn("Browser batch translation failed:", browserBatchError.message);
          }

          if (!batchResults && this.useBackendTranslation && this.shouldUseApi('translation')) {
            try {
              batchResults = await this.translateManyViaBackend(
                chunkTexts,
                sourceLang,
                targetLang
              );
            } catch (backendBatchError) {
              console.warn("Backend batch translation failed:", backendBatchError.message);
              this.recordApiFailure('translation', backendBatchError);
            }
          }

          if (!batchResults) {
            throw new Error('No batch translation provider available');
          }

          fallbackItems = chunk.filter((item, itemIndex) =>
            !commit(item, batchResults[itemIndex])
          );
        } catch (batchError) {
          console.warn("Batch translation failed, falling back to individual translations:", batchError.message);
        }
      }

      if (fallbackItems.length > 0) {
        const individualResults = await Promise.allSettled(
          fallbackItems.map((item) => this.translate(item.text, targetLang, sourceLang))
        );

        individualResults.forEach((result, itemIndex) => {
          const item = fallbackItems[itemIndex];
          if (result.status === 'fulfilled' && commit(item, result.value)) {
            return;
          }

          const offlineTranslation = offlineTranslationService.translateOffline(
            item.textForTranslation,
            sourceLang,
            targetLang
          );
          if (!commit(item, offlineTranslation)) {
            results.delete(item.original);
          }
        });
      }
    }

    if (pending.length > 0) {
      this._persistCache();
    }

    return results;
  }

  // Translate disease detection results with offline fallback
  async translateDiseaseResults(results, targetLang) {
    if (targetLang === "en") {
      return results;
    }

    console.log(`🩺 Translating disease results to ${targetLang}:`, results);

    // If offline, use offline translation service
    if (!this.isOnline) {
      const offlineResults =
        offlineTranslationService.translateDiseaseResultsOffline(
          results,
          targetLang
        );
      return {
        ...results,
        ...offlineResults,
        originalLanguage: "en",
        translatedLanguage: targetLang,
      };
    }

    try {
      // Break down remedy into smaller chunks for better translation
      const remedy = results.remedy || "No remedy available";
      const remedySentences = remedy.split('. ').filter(s => s.trim());
      
      console.log(`🔄 Breaking remedy into ${remedySentences.length} sentences for translation`);
      
      // Translate each field individually with better error handling
      const baseTranslations = await Promise.allSettled([
        this.translate(results.plant || "Unknown", targetLang, "en"),
        this.translate(results.disease || "No disease detected", targetLang, "en"),
      ]);
      
      // Translate remedy sentences individually
      const remedyTranslations = await Promise.allSettled(
        remedySentences.map(sentence => 
          this.translate(sentence.trim() + '.', targetLang, "en")
        )
      );
      
      const [plantResult, diseaseResult] = baseTranslations;
      
      // Combine translated remedy sentences
      const translatedRemedySentences = remedyTranslations
        .map(result => result.status === 'fulfilled' ? result.value : '')
        .filter(sentence => sentence.trim())
        .join(' ');

      const translatedResults = {
        ...results,
        plant: plantResult.status === 'fulfilled' ? plantResult.value : results.plant,
        disease: diseaseResult.status === 'fulfilled' ? diseaseResult.value : results.disease,
        remedy: translatedRemedySentences || results.remedy,
        originalLanguage: "en",
        translatedLanguage: targetLang,
        translationType: "online",
      };

      console.log('✅ Disease translation completed:', translatedResults);
      return translatedResults;

    } catch (error) {
      console.error(
        "Disease results translation error, using offline fallback:",
        error
      );
      const offlineResults =
        offlineTranslationService.translateDiseaseResultsOffline(
          results,
          targetLang
        );
      return {
        ...results,
        ...offlineResults,
        originalLanguage: "en",
        translatedLanguage: targetLang,
      };
    }
  }

  // Text to speech with optional backend fallback
  async textToSpeech(text, language = "en") {
    // Check circuit breaker before attempting TTS API
    if (this.useBackendTts && this.isOnline && this.shouldUseApi('tts')) {
      try {
        console.log(`🔊 Attempting backend TTS for language: ${language}`);
        
        // Map language codes to backend format
        const langMapping = {
          "tw": "tw", // Twi
          "ee": "ee", // Ewe
          "ki": "ki", // Kikuyu
          "en": "en"  // English (may not be supported)
        };
        
        const nlpLanguage = langMapping[language] || "tw"; // Default to Twi
        const speaker = this.getVoiceForLanguage(language);
        
        console.log(`🎤 Using speaker: ${speaker} for language: ${nlpLanguage}`);

        // Try multiple TTS endpoints for better compatibility
        const endpoints = ["/api/tts/tts", "/api/tts/synthesize"];
        let response = null;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying TTS endpoint: ${endpoint}`);
            
            response = await axios.post(
              `${API_CONFIG.BACKEND_BASE_URL}${endpoint}`,
              {
                text: text,
                language: nlpLanguage,
                voice: speaker
              },
              {
                headers: { "Content-Type": "application/json" },
                responseType: "blob",
                timeout: 8000, // 8 second timeout for TTS
              }
            );
            
            console.log(`✅ TTS endpoint ${endpoint} successful`);
            break; // Success, exit loop
            
          } catch (endpointError) {
            console.warn(`⚠️ TTS endpoint ${endpoint} failed:`, endpointError.response?.status);
            if (endpoint === endpoints[endpoints.length - 1]) {
              // If this is the last endpoint, throw the error
              throw endpointError;
            }
          }
        }

        console.log("✅ Backend TTS response received");

        // Create audio URL from blob
        const audioBlob = new Blob([response.data], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);

        return { url: audioUrl, type: "api" };
      } catch (error) {
        console.error(
          "❌ Backend TTS error, falling back to browser TTS:",
          error.response?.status,
          error.response?.data || error.message
        );
        
        // Record TTS failure for circuit breaker
        this.recordApiFailure('tts', error);
      }
    } else {
      console.log("📵 Offline - using browser TTS fallback");
    }

    // Fallback to browser's built-in TTS
    if ("speechSynthesis" in window) {
      try {
        console.log(`🌐 Using browser TTS fallback for language: ${language}`);
        
        // Create a promise-based wrapper for speechSynthesis
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);

          // Set language based on our language code
          const langMap = {
            en: "en-US",
            tw: "en-GH", // Use Ghanaian English as fallback for Twi
            ee: "en-GH",
            gaa: "en-GH",
            dag: "en-GH",
            ha: "ha-NG", // Hausa (Nigeria)
            fat: "en-GH",
            nzi: "en-GH",
            ki: "en-KE", // Kenyan English for Kikuyu
          };

          const targetLang = langMap[language] || "en-US";
          utterance.lang = targetLang;
          utterance.rate = 0.8; // Slower for better pronunciation
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          console.log(`🔊 Browser TTS configured: ${targetLang}`);

          // Return a function that will speak when called
          resolve({
            speak: ({ onEnd, onError } = {}) => {
              utterance.onend = onEnd;
              utterance.onerror = onError;
              console.log("🎵 Starting browser TTS playback");
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(utterance);
            },
            cancel: () => window.speechSynthesis.cancel(),
            type: "browser",
            language: targetLang,
            fallback: true
          });
        });
      } catch (error) {
        console.error("❌ Browser TTS error:", error);
        return null;
      }
    }

    return null;
  }

  // Get greeting in different languages
  getGreeting(langCode) {
    const greetings = {
      en: "Good morning",
      tw: "Maakye",
      ee: "Ŋdi",
      gaa: "Ojekoo",
      dag: "Dasuba",
      nzi: "Maakye",
      fat: "Maakye",
      ha: "Ina kwana",
    };

    return greetings[langCode] || greetings.en;
  }

  // Get common agricultural terms translations
  getAgriculturalTerms(langCode) {
    const terms = {
      en: {
        plant: "Plant",
        disease: "Disease",
        treatment: "Treatment",
        healthy: "Healthy",
        infected: "Infected",
        prevention: "Prevention",
        farmer: "Farmer",
        crop: "Crop",
        harvest: "Harvest",
        pesticide: "Pesticide",
      },
      tw: {
        plant: "Afifide",
        disease: "Yare",
        treatment: "Ayaresa",
        healthy: "Apɔmuden",
        infected: "Yare aka no",
        prevention: "Siw",
        farmer: "Okuani",
        crop: "Nnɔbae",
        harvest: "Twabere",
        pesticide: "Nnwurammoa aduru",
      },
      // Add more languages as needed
    };

    return terms[langCode] || terms.en;
  }

  // Get voice name for language
  getVoiceForLanguage(language) {
    // Legacy backend speaker ids retained for compatibility if backend TTS is re-enabled.
    const voiceMap = {
      en: "twi_speaker_4", // Fallback to Twi
      tw: "twi_speaker_5", // Using Twi speaker 5 for variety
      ee: "ewe_speaker_4", // Using Ewe speaker 4
      gaa: "twi_speaker_6", // Fallback to Twi speaker 6 for Ga
      dag: "twi_speaker_7", // Fallback to Twi speaker 7 for Dagbani
      ha: "twi_speaker_8", // Fallback to Twi speaker 8 for Hausa
      fat: "twi_speaker_9", // Fallback to Twi speaker 9 for Fante (most similar)
      nzi: "twi_speaker_4", // Fallback to Twi speaker 4 for Nzema
      ki: "kikuyu_speaker_5" // Kikuyu speaker 5
    };
    return voiceMap[language] || voiceMap.tw; // Default to Twi speaker
  }

  // Get random voice for variety (optional enhancement)
  getRandomVoiceForLanguage(language) {
    const voiceOptions = {
      tw: ["twi_speaker_4", "twi_speaker_5", "twi_speaker_6", "twi_speaker_7", "twi_speaker_8", "twi_speaker_9"],
      ee: ["ewe_speaker_3", "ewe_speaker_4"],
      ki: ["kikuyu_speaker_1", "kikuyu_speaker_5"]
    };
    
    const options = voiceOptions[language];
    if (options && options.length > 0) {
      const randomIndex = Math.floor(Math.random() * options.length);
      return options[randomIndex];
    }
    
    return this.getVoiceForLanguage(language);
  }

  // Get available TTS languages
  async getAvailableTTSLanguages() {
    return Object.entries(this.languages).map(([code, language]) => ({
      code,
      language: code,
      name: language.name,
      source: "browser",
    }));
  }

  // Get available TTS speakers
  async getAvailableTTSSpeakers() {
    if (!("speechSynthesis" in window)) {
      return [];
    }

    return window.speechSynthesis.getVoices().map((voice) => ({
      id: voice.voiceURI || voice.name,
      name: voice.name,
      language: voice.lang,
      localService: voice.localService,
      source: "browser",
    }));
  }

  // Clear translation cache
  clearCache() {
    this.cache.clear();
    this._persistCache();
  }
}

export default new TranslationService();
