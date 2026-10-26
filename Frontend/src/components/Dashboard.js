import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { DevDashboardLogo, DevSarimaIcon, DevLstmIcon, DevHybridIcon, DevHeroBadge } from './DevIcons';
import { AnimatedVegetableImage, VegetableImageModal } from './AnimatedVegetable';
import { 
  getSavedDatasetCrops, 
  clearDatasetCrops,
  isDatasetCropsCleared
} from '../utils/cropDatasetParser';
import { getVegetableFunFact } from '../utils/vegetableFunFacts';
import { API_URL } from '../utils/apiConfig';
import { calculateCropHarvestInfo } from '../utils/harvestWeatherAlerts';
import { 
  dispatchHarvestAndClimateAlerts, 
  sendTestAlertToPhone 
} from '../utils/mobileNotificationService';
import './Dashboard.css';

const STAGE_STEPS = [
  { num: 1, id: 'seedling', icon: '🌱', shortEn: 'Seedling', shortFil: 'Punla', titleEn: 'Seedling / Emergence', titleFil: 'Pagpupunla at Pagsibol' },
  { num: 2, id: 'vegetative', icon: '🌿', shortEn: 'Vegetative', shortFil: 'Paglaki', titleEn: 'Vegetative Foliage Growth', titleFil: 'Paglaki ng Dahon at Tangkay' },
  { num: 3, id: 'flowering', icon: '🌸', shortEn: 'Flowering', shortFil: 'Bulaklak', titleEn: 'Flowering & Budding', titleFil: 'Pamumulaklak' },
  { num: 4, id: 'fruiting', icon: '🍅', shortEn: 'Fruiting', shortFil: 'Bunga', titleEn: 'Fruit / Bulb Development', titleFil: 'Paglaki ng Bunga' },
  { num: 5, id: 'harvest', icon: '🧺', shortEn: 'Harvest', shortFil: 'Pag-ani', titleEn: 'Ready for Harvest', titleFil: 'Handa nang Anihin' }
];

const EMOJI_OPTIONS = ['🥬', '🥗', '🌿', '🥒', '🫛', '🌱', '🍅', '🍆', '🌶️', '🥕', '🫑'];

const TAGALOG_TO_ENGLISH_MAP = {
  pechay: { en: 'Pechay / Bok Choy', icon: '🥬', key: 'pechay' },
  'pechay tagalog': { en: 'Native Pechay', icon: '🥬', key: 'pechay_native' },
  mustasa: { en: 'Mustard Greens', icon: '🥬', key: 'mustasa' },
  kangkong: { en: 'Water Spinach', icon: '🌿', key: 'kangkong' },
  letsugas: { en: 'Lettuce', icon: '🥗', key: 'lettuce' },
  lettuce: { en: 'Lettuce', icon: '🥗', key: 'lettuce' },
  labanos: { en: 'White Radish', icon: '🥕', key: 'radish' },
  pipino: { en: 'Cucumber', icon: '🥒', key: 'cucumber' },
  sitaw: { en: 'String Beans', icon: '🫛', key: 'sitao' },
  sitao: { en: 'String Beans', icon: '🫛', key: 'sitao' },
  okra: { en: 'Okra', icon: '🌱', key: 'okra' },
  kamatis: { en: 'Tomato', icon: '🍅', key: 'tomato' },
  talong: { en: 'Eggplant', icon: '🍆', key: 'eggplant' },
  sili: { en: 'Chili Pepper', icon: '🌶️', key: 'pepper' },
  'siling haba': { en: 'Finger Pepper', icon: '🌶️', key: 'finger_pepper' },
  'siling atsara': { en: 'Bell Pepper', icon: '🫑', key: 'bell_pepper' },
  ampalaya: { en: 'Bitter Gourd', icon: '🥒', key: 'ampalaya' },
  kalabasa: { en: 'Squash', icon: '🎃', key: 'squash' },
  patola: { en: 'Sponge Gourd', icon: '🥒', key: 'patola' },
  upo: { en: 'Bottle Gourd', icon: '🥒', key: 'upo' },
  sayote: { en: 'Chayote', icon: '🍐', key: 'sayote' },
  alugbati: { en: 'Malabar Spinach', icon: '🌿', key: 'alugbati' },
  asparagus: { en: 'Asparagus', icon: '🌱', key: 'asparagus' },
  balanoy: { en: 'Basil', icon: '🌿', key: 'basil' },
  remolatsa: { en: 'Beets', icon: '🥔', key: 'beets' },
  brokoli: { en: 'Broccoli', icon: '🥦', key: 'broccoli' },
  repolyo: { en: 'Cabbage', icon: '🥬', key: 'cabbage' },
  karot: { en: 'Carrot', icon: '🥕', key: 'carrot' },
  koliplor: { en: 'Cauliflower', icon: '🥦', key: 'cauliflower' },
  kintsay: { en: 'Celery', icon: '🌿', key: 'celery' },
  seleri: { en: 'Celery', icon: '🌿', key: 'celery' },
  kutsay: { en: 'Chives', icon: '🌱', key: 'chives' },
  wansoy: { en: 'Coriander', icon: '🌿', key: 'coriander' },
  paayap: { en: 'Cowpea', icon: '🫛', key: 'cowpea' },
  gisantes: { en: 'Garden Pea', icon: '🫛', key: 'gisantes' },
  habitchuelas: { en: 'Snap Beans', icon: '🫛', key: 'habitchuelas' },
  kulitis: { en: 'Amaranth Greens', icon: '🌿', key: 'kulitis' },
  saluyot: { en: 'Jute Mallow', icon: '🌿', key: 'saluyot' },
  sigarilyas: { en: 'Winged Beans', icon: '🫛', key: 'sigarilyas' },
  singkamas: { en: 'Jicama', icon: '🥔', key: 'singkamas' },
  espinaka: { en: 'Spinach', icon: '🥬', key: 'spinach' },
  sitsaro: { en: 'Sweet Peas', icon: '🫛', key: 'sweet_peas' },
  talinum: { en: 'Philippine Spinach', icon: '🌿', key: 'talinum' },
  'batang mais': { en: 'Baby Corn', icon: '🌽', key: 'young_corn' },
  zucchini: { en: 'Zucchini', icon: '🥒', key: 'zucchini' },
  watercress: { en: 'Watercress', icon: '🌿', key: 'watercress' },
  bawang: { en: 'Garlic', icon: '🧄', key: 'bawang' },
  sibuyas: { en: 'Onion', icon: '🧅', key: 'sibuyas' },
  luya: { en: 'Ginger', icon: '🫚', key: 'luya' },
  malunggay: { en: 'Moringa', icon: '🌿', key: 'malunggay' }
};

const ENGLISH_TO_TAGALOG_MAP = {
  alugbati: { fil: 'Alugbati', icon: '🌿', key: 'alugbati' },
  'malabar spinach': { fil: 'Alugbati', icon: '🌿', key: 'alugbati' },
  ampalaya: { fil: 'Ampalaya', icon: '🥒', key: 'ampalaya' },
  'bitter gourd': { fil: 'Ampalaya', icon: '🥒', key: 'ampalaya' },
  'bitter melon': { fil: 'Ampalaya', icon: '🥒', key: 'ampalaya' },
  asparagus: { fil: 'Asparagus', icon: '🌱', key: 'asparagus' },
  basil: { fil: 'Balanoy', icon: '🌿', key: 'basil' },
  beets: { fil: 'Remolatsa', icon: '🥔', key: 'beets' },
  beet: { fil: 'Remolatsa', icon: '🥔', key: 'beets' },
  beetroot: { fil: 'Remolatsa', icon: '🥔', key: 'beets' },
  broccoli: { fil: 'Brokoli', icon: '🥦', key: 'broccoli' },
  cabbage: { fil: 'Repolyo', icon: '🥬', key: 'cabbage' },
  carrot: { fil: 'Karot', icon: '🥕', key: 'carrot' },
  cauliflower: { fil: 'Koliplor', icon: '🥦', key: 'cauliflower' },
  celery: { fil: 'Kintsay', icon: '🌿', key: 'celery' },
  'chinese cabbage': { fil: 'Pechay Baguio', icon: '🥬', key: 'chinese_cabbage' },
  wongbok: { fil: 'Pechay Baguio', icon: '🥬', key: 'chinese_cabbage' },
  'pechay baguio': { fil: 'Pechay Baguio', icon: '🥬', key: 'chinese_cabbage' },
  'napa cabbage': { fil: 'Pechay Baguio', icon: '🥬', key: 'chinese_cabbage' },
  chives: { fil: 'Kutsay', icon: '🌱', key: 'chives' },
  coriander: { fil: 'Wansoy', icon: '🌿', key: 'coriander' },
  cilantro: { fil: 'Wansoy', icon: '🌿', key: 'coriander' },
  cowpea: { fil: 'Paayap', icon: '🫛', key: 'cowpea' },
  'cowpea, green': { fil: 'Paayap', icon: '🫛', key: 'cowpea' },
  cucumber: { fil: 'Pipino', icon: '🥒', key: 'cucumber' },
  eggplant: { fil: 'Talong', icon: '🍆', key: 'eggplant' },
  gisantes: { fil: 'Gisantes', icon: '🫛', key: 'gisantes' },
  'garden pea': { fil: 'Gisantes', icon: '🫛', key: 'gisantes' },
  habitchuelas: { fil: 'Habitchuelas', icon: '🫛', key: 'habitchuelas' },
  'snap beans': { fil: 'Habitchuelas', icon: '🫛', key: 'habitchuelas' },
  'baguio beans': { fil: 'Habitchuelas', icon: '🫛', key: 'habitchuelas' },
  kangkong: { fil: 'Kangkong', icon: '🌿', key: 'kangkong' },
  'water spinach': { fil: 'Kangkong', icon: '🌿', key: 'kangkong' },
  kinchay: { fil: 'Kinchay', icon: '🌿', key: 'kinchay' },
  'chinese celery': { fil: 'Kinchay', icon: '🌿', key: 'kinchay' },
  kulitis: { fil: 'Kulitis', icon: '🌿', key: 'kulitis' },
  amaranth: { fil: 'Kulitis', icon: '🌿', key: 'kulitis' },
  lettuce: { fil: 'Letsugas', icon: '🥗', key: 'lettuce' },
  mustard: { fil: 'Mustasa', icon: '🥬', key: 'mustasa' },
  'mustard greens': { fil: 'Mustasa', icon: '🥬', key: 'mustasa' },
  mustasa: { fil: 'Mustasa', icon: '🥬', key: 'mustasa' },
  okra: { fil: 'Okra', icon: '🌱', key: 'okra' },
  'onion leeks': { fil: 'Dahon ng Sibuyas', icon: '🌱', key: 'onion_leeks' },
  leeks: { fil: 'Dahon ng Sibuyas', icon: '🌱', key: 'onion_leeks' },
  parsley: { fil: 'Pasli', icon: '🌿', key: 'parsley' },
  patola: { fil: 'Patola', icon: '🥒', key: 'patola' },
  'sponge gourd': { fil: 'Patola', icon: '🥒', key: 'patola' },
  pechay: { fil: 'Pechay', icon: '🥬', key: 'pechay' },
  'bok choy': { fil: 'Pechay', icon: '🥬', key: 'pechay' },
  'pechay native': { fil: 'Pechay Tagalog', icon: '🥬', key: 'pechay_native' },
  'pechay, native': { fil: 'Pechay Tagalog', icon: '🥬', key: 'pechay_native' },
  'native pechay': { fil: 'Pechay Tagalog', icon: '🥬', key: 'pechay_native' },
  pepper: { fil: 'Sili', icon: '🌶️', key: 'pepper' },
  'bell pepper': { fil: 'Siling Atsara', icon: '🫑', key: 'bell_pepper' },
  'pepper, bell': { fil: 'Siling Atsara', icon: '🫑', key: 'bell_pepper' },
  'sweet pepper': { fil: 'Siling Atsara', icon: '🫑', key: 'bell_pepper' },
  'finger pepper': { fil: 'Siling Haba', icon: '🌶️', key: 'finger_pepper' },
  'pepper, finger': { fil: 'Siling Haba', icon: '🌶️', key: 'finger_pepper' },
  radish: { fil: 'Labanos', icon: '🥕', key: 'radish' },
  'white radish': { fil: 'Labanos', icon: '🥕', key: 'radish' },
  saluyot: { fil: 'Saluyot', icon: '🌿', key: 'saluyot' },
  'jute mallow': { fil: 'Saluyot', icon: '🌿', key: 'saluyot' },
  sigarilyas: { fil: 'Sigarilyas', icon: '🫛', key: 'sigarilyas' },
  'winged beans': { fil: 'Sigarilyas', icon: '🫛', key: 'sigarilyas' },
  singkamas: { fil: 'Singkamas', icon: '🥔', key: 'singkamas' },
  turnip: { fil: 'Singkamas', icon: '🥔', key: 'singkamas' },
  jicama: { fil: 'Singkamas', icon: '🥔', key: 'singkamas' },
  sitao: { fil: 'Sitaw', icon: '🫛', key: 'sitao' },
  'string beans': { fil: 'Sitaw', icon: '🫛', key: 'sitao' },
  spinach: { fil: 'Espinaka', icon: '🥬', key: 'spinach' },
  'spring onion': { fil: 'Dahon ng Sibuyas', icon: '🌱', key: 'spring_onion' },
  scallion: { fil: 'Dahon ng Sibuyas', icon: '🌱', key: 'spring_onion' },
  squash: { fil: 'Kalabasa', icon: '🎃', key: 'squash' },
  'squash fruit': { fil: 'Kalabasa', icon: '🎃', key: 'squash' },
  'sweet peas': { fil: 'Sitsaro', icon: '🫛', key: 'sweet_peas' },
  'snow peas': { fil: 'Sitsaro', icon: '🫛', key: 'sweet_peas' },
  talinum: { fil: 'Talinum', icon: '🌿', key: 'talinum' },
  tomato: { fil: 'Kamatis', icon: '🍅', key: 'tomato' },
  upo: { fil: 'Upo', icon: '🥒', key: 'upo' },
  'bottle gourd': { fil: 'Upo', icon: '🥒', key: 'upo' },
  watercress: { fil: 'Kress', icon: '🌿', key: 'watercress' },
  'young corn': { fil: 'Batang Mais', icon: '🌽', key: 'young_corn' },
  'baby corn': { fil: 'Batang Mais', icon: '🌽', key: 'young_corn' },
  zucchini: { fil: 'Kalabasang Zucchini', icon: '🥒', key: 'zucchini' },
  chayote: { fil: 'Sayote', icon: '🍐', key: 'sayote' },
  sayote: { fil: 'Sayote', icon: '🍐', key: 'sayote' },
  moringa: { fil: 'Malunggay', icon: '🌿', key: 'malunggay' },
  malunggay: { fil: 'Malunggay', icon: '🌿', key: 'malunggay' },
  garlic: { fil: 'Bawang', icon: '🧄', key: 'bawang' },
  bawang: { fil: 'Bawang', icon: '🧄', key: 'bawang' },
  onion: { fil: 'Sibuyas', icon: '🧅', key: 'sibuyas' },
  sibuyas: { fil: 'Sibuyas', icon: '🧅', key: 'sibuyas' },
  ginger: { fil: 'Luya', icon: '🫚', key: 'luya' },
  luya: { fil: 'Luya', icon: '🫚', key: 'luya' }
};

// Strips extra parenthesized/slash metadata so Tagalog names stay clean & natural
export const cleanTagalogWord = (raw) => {
  if (!raw) return '';
  return String(raw)
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\/.*$/, '')
    .trim();
};

export const getCropFilipinoName = (crop) => {
  if (!crop) return 'Gulay';
  const cleanId = String(crop.id || '').toLowerCase().trim();
  const cleanName = String(crop.name || '').toLowerCase().trim();
  const rawFil = String(crop.filipinoName || '').trim();

  // 1. Direct dictionary match by ID
  if (ENGLISH_TO_TAGALOG_MAP[cleanId]?.fil) {
    return ENGLISH_TO_TAGALOG_MAP[cleanId].fil;
  }
  // 2. Direct dictionary match by English Name
  if (ENGLISH_TO_TAGALOG_MAP[cleanName]?.fil) {
    return ENGLISH_TO_TAGALOG_MAP[cleanName].fil;
  }
  // 3. Substring match against dictionary keys
  for (const [key, val] of Object.entries(ENGLISH_TO_TAGALOG_MAP)) {
    if (cleanName === key || cleanId === key) {
      return val.fil;
    }
  }
  for (const [key, val] of Object.entries(ENGLISH_TO_TAGALOG_MAP)) {
    if (cleanName.includes(key) || cleanId.includes(key) || key.includes(cleanName)) {
      return val.fil;
    }
  }
  // 4. Sanitize existing filipinoName if present
  if (rawFil) {
    const cleaned = cleanTagalogWord(rawFil);
    if (cleaned) return cleaned;
  }
  return cleanTagalogWord(crop.filipinoName || crop.name) || 'Gulay';
};

export const getCropEnglishName = (crop) => {
  if (!crop) return 'Vegetable';
  const cleanId = String(crop.id || '').toLowerCase().trim();
  const cleanFil = cleanTagalogWord(crop.filipinoName || crop.name || '').toLowerCase();
  const rawName = String(crop.name || '').trim();

  // 1. Direct dictionary match by ID
  if (TAGALOG_TO_ENGLISH_MAP[cleanId]?.en) {
    return TAGALOG_TO_ENGLISH_MAP[cleanId].en;
  }
  // 2. Direct dictionary match by cleaned Tagalog Name
  if (TAGALOG_TO_ENGLISH_MAP[cleanFil]?.en) {
    return TAGALOG_TO_ENGLISH_MAP[cleanFil].en;
  }
  // 3. Substring match
  for (const [key, val] of Object.entries(TAGALOG_TO_ENGLISH_MAP)) {
    if (cleanFil === key || cleanId === key) {
      return val.en;
    }
  }
  for (const [key, val] of Object.entries(TAGALOG_TO_ENGLISH_MAP)) {
    if (cleanFil.includes(key) || cleanId.includes(key) || key.includes(cleanFil)) {
      return val.en;
    }
  }
  // 4. Return clean English name
  if (rawName && rawName.toLowerCase() !== cleanFil) {
    return cleanTagalogWord(rawName);
  }
  return crop.name || crop.filipinoName || 'Vegetable';
};

const STAGE_DAYS_MAP = {
  pechay: {
    1: { fil: '5–7 araw', en: '5–7 days' },
    2: { fil: '12–15 araw', en: '12–15 days' },
    3: { fil: '18–22 araw', en: '18–22 days' },
    4: { fil: '22–26 araw', en: '22–26 days' },
    5: { fil: '25–30 araw', en: '25–30 days' }
  },
  mustasa: {
    1: { fil: '5–7 araw', en: '5–7 days' },
    2: { fil: '12–16 araw', en: '12–16 days' },
    3: { fil: '18–22 araw', en: '18–22 days' },
    4: { fil: '22–26 araw', en: '22–26 days' },
    5: { fil: '25–32 araw', en: '25–32 days' }
  },
  kangkong: {
    1: { fil: '4–6 araw', en: '4–6 days' },
    2: { fil: '10–14 araw', en: '10–14 days' },
    3: { fil: '15–18 araw', en: '15–18 days' },
    4: { fil: '18–22 araw', en: '18–22 days' },
    5: { fil: '20–25 araw', en: '20–25 days' }
  },
  letsugas: {
    1: { fil: '6–8 araw', en: '6–8 days' },
    2: { fil: '14–18 araw', en: '14–18 days' },
    3: { fil: '20–24 araw', en: '20–24 days' },
    4: { fil: '25–28 araw', en: '25–28 days' },
    5: { fil: '28–35 araw', en: '28–35 days' }
  },
  labanos: {
    1: { fil: '5–7 araw', en: '5–7 days' },
    2: { fil: '12–16 araw', en: '12–16 days' },
    3: { fil: '18–22 araw', en: '18–22 days' },
    4: { fil: '24–28 araw', en: '24–28 days' },
    5: { fil: '30–35 araw', en: '30–35 days' }
  },
  pipino: {
    1: { fil: '7–10 araw', en: '7–10 days' },
    2: { fil: '18–22 araw', en: '18–22 days' },
    3: { fil: '28–32 araw', en: '28–32 days' },
    4: { fil: '38–42 araw', en: '38–42 days' },
    5: { fil: '45–50 araw', en: '45–50 days' }
  },
  sitaw: {
    1: { fil: '7–10 araw', en: '7–10 days' },
    2: { fil: '20–25 araw', en: '20–25 days' },
    3: { fil: '30–35 araw', en: '30–35 days' },
    4: { fil: '40–45 araw', en: '40–45 days' },
    5: { fil: '45–55 araw', en: '45–55 days' }
  },
  okra: {
    1: { fil: '7–10 araw', en: '7–10 days' },
    2: { fil: '18–22 araw', en: '18–22 days' },
    3: { fil: '30–35 araw', en: '30–35 days' },
    4: { fil: '38–42 araw', en: '38–42 days' },
    5: { fil: '45–50 araw', en: '45–50 days' }
  },
  kamatis: {
    1: { fil: '10–14 araw', en: '10–14 days' },
    2: { fil: '25–30 araw', en: '25–30 days' },
    3: { fil: '40–45 araw', en: '40–45 days' },
    4: { fil: '50–58 araw', en: '50–58 days' },
    5: { fil: '60–70 araw', en: '60–70 days' }
  },
  talong: {
    1: { fil: '10–14 araw', en: '10–14 days' },
    2: { fil: '25–32 araw', en: '25–32 days' },
    3: { fil: '40–48 araw', en: '40–48 days' },
    4: { fil: '52–62 araw', en: '52–62 days' },
    5: { fil: '65–75 araw', en: '65–75 days' }
  },
  sili: {
    1: { fil: '10–14 araw', en: '10–14 days' },
    2: { fil: '22–28 araw', en: '22–28 days' },
    3: { fil: '38–45 araw', en: '38–45 days' },
    4: { fil: '48–56 araw', en: '48–56 days' },
    5: { fil: '60–70 araw', en: '60–70 days' }
  }
};

const getDaysForStage = (filName, engName, stageNum, isFil = true) => {
  const normFil = (filName || '').toLowerCase().trim();
  const normEn = (engName || '').toLowerCase().trim();

  let matchedKey = Object.keys(STAGE_DAYS_MAP).find(k => 
    normFil.includes(k) || normEn.includes(k)
  );

  if (matchedKey && STAGE_DAYS_MAP[matchedKey][stageNum]) {
    return isFil ? STAGE_DAYS_MAP[matchedKey][stageNum].fil : STAGE_DAYS_MAP[matchedKey][stageNum].en;
  }

  const fallbacks = {
    1: isFil ? '5–7 araw' : '5–7 days',
    2: isFil ? '15–20 araw' : '15–20 days',
    3: isFil ? '25–30 araw' : '25–30 days',
    4: isFil ? '35–45 araw' : '35–45 days',
    5: isFil ? '45–60 araw' : '45–60 days'
  };
  return fallbacks[stageNum] || (isFil ? '25–30 araw' : '25–30 days');
};

const VEGETABLE_PRESETS = [
  {
    filipinoName: 'Pechay',
    name: 'Pechay',
    icon: '🥬',
    daysToGrow: '25–30',
    stageStep: 2,
    stageDescEn: 'Tender broad green leaves are expanding rapidly.',
    stageDescFil: 'Mabilis na lumalapad at lumalaki ang mga sariwang berdeng dahon.'
  },
  {
    filipinoName: 'Mustasa',
    name: 'Mustard Greens',
    icon: '🥬',
    daysToGrow: '25–32',
    stageStep: 4,
    stageDescEn: 'Crisp, pungent leaves nearing full mature rosette.',
    stageDescFil: 'Malalapad at malulutong na maanghang na dahon; napakalapit nang anihin.'
  },
  {
    filipinoName: 'Kangkong',
    name: 'Water Spinach',
    icon: '🌿',
    daysToGrow: '20–25',
    stageStep: 2,
    stageDescEn: 'Rapid tender shoot and leaf elongation.',
    stageDescFil: 'Mabilis na paghaba ng mga bagong tangkay at talbos.'
  },
  {
    filipinoName: 'Letsugas',
    name: 'Lettuce',
    icon: '🥗',
    daysToGrow: '25–35',
    stageStep: 3,
    stageDescEn: 'Forming tight, crisp heads with tender sweet foliage.',
    stageDescFil: 'Bumubuo ng makakapal at malulutong na kumpol ng dahon.'
  },
  {
    filipinoName: 'Labanos',
    name: 'White Radish',
    icon: '🥕',
    daysToGrow: '30–35',
    stageStep: 3,
    stageDescEn: 'Crisp white root core thickening rapidly in loose soil.',
    stageDescFil: 'Bumubuo at kumakapal ang puting ugat sa malambot na lupa.'
  },
  {
    filipinoName: 'Pipino',
    name: 'Cucumber',
    icon: '🥒',
    daysToGrow: '45–50',
    stageStep: 4,
    stageDescEn: 'Crisp dark green fruits sizing up evenly along trellises.',
    stageDescFil: 'Tuwid, malulutong, at madilim na berdeng pipino sa balag.'
  },
  {
    filipinoName: 'Sitaw',
    name: 'String Beans',
    icon: '🫛',
    daysToGrow: '45–55',
    stageStep: 4,
    stageDescEn: 'Long slender pods developing crisp tenderness along trellises.',
    stageDescFil: 'Humahaba at lumalambot ang mga pod ng sitaw sa balag.'
  },
  {
    filipinoName: 'Okra',
    name: 'Okra',
    icon: '🌱',
    daysToGrow: '45–50',
    stageStep: 3,
    stageDescEn: 'Blossoms setting tender green pods that grow rapidly.',
    stageDescFil: 'Namumulaklak at lumalabas ang malalambot na daliri ng okra.'
  },
  {
    filipinoName: 'Kamatis',
    name: 'Tomato',
    icon: '🍅',
    daysToGrow: '60–70',
    stageStep: 4,
    stageDescEn: 'Fruits sizing up and firming before color break.',
    stageDescFil: 'Lumalaki at tumitigas ang mga bunga; malapit nang mamula.'
  },
  {
    filipinoName: 'Talong',
    name: 'Eggplant',
    icon: '🍆',
    daysToGrow: '65–75',
    stageStep: 2,
    stageDescEn: 'Vigorous shoot growth and strong stalk establishment.',
    stageDescFil: 'Mabilis na paghaba ng sangay at pagtibay ng ugat bago mamulaklak.'
  },
  {
    filipinoName: 'Sili',
    name: 'Chili Pepper',
    icon: '🌶️',
    daysToGrow: '60–70',
    stageStep: 3,
    stageDescEn: 'Abundant blossoms and glossy young peppers developing.',
    stageDescFil: 'Bukas na ang mga bulaklak at may maliliit nang bunga ng sili.'
  }
];

// eslint-disable-next-line no-unused-vars
const CROPS_DATA = [
  {
    id: 'pechay',
    name: 'Pechay',
    filipinoName: 'Pechay',
    icon: '🥬',
    daysToGrowEn: '25–30 days',
    daysToGrowFil: '25–30 araw',
    stageEn: 'Vegetative Foliage Growth',
    stageFil: 'Paglaki ng Dahon at Tangkay',
    stageStep: 2,
    progressPercent: 40,
    stageDescEn: 'Broad crisp green leaves are expanding rapidly in garden beds.',
    stageDescFil: 'Mabilis na lumalapad at lumalaki ang mga sariwang berdeng dahon.'
  },
  {
    id: 'mustasa',
    name: 'Mustard Greens',
    filipinoName: 'Mustasa',
    icon: '🥬',
    daysToGrowEn: '25–32 days',
    daysToGrowFil: '25–32 araw',
    stageEn: 'Ready for Harvest',
    stageFil: 'Handa nang Anihin',
    stageStep: 5,
    progressPercent: 100,
    stageDescEn: 'Crisp mature leaves reaching optimal tenderness for morning harvest.',
    stageDescFil: 'Ganap nang malaki at malutong; handa nang anihin ngayong umaga.'
  },
  {
    id: 'kangkong',
    name: 'Water Spinach',
    filipinoName: 'Kangkong',
    icon: '🌿',
    daysToGrowEn: '20–25 days',
    daysToGrowFil: '20–25 araw',
    stageEn: 'Vegetative Shoot Growth',
    stageFil: 'Paglaki ng Dahon at Tangkay',
    stageStep: 2,
    progressPercent: 45,
    stageDescEn: 'Rapid tender shoots branching out profusely.',
    stageDescFil: 'Mabilis na sumasanga ang mga malalambot na usbong at talbos.'
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    filipinoName: 'Pipino',
    icon: '🥒',
    daysToGrowEn: '45–50 days',
    daysToGrowFil: '45–50 araw',
    stageEn: 'Fruit Development',
    stageFil: 'Paglaki ng Bunga',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Trellised vines setting straight, dark green crisp fruits.',
    stageDescFil: 'Tuwid at malulutong na berdeng pipino sa balag.'
  },
  {
    id: 'sitaw',
    name: 'String Beans',
    filipinoName: 'Sitaw',
    icon: '🫛',
    daysToGrowEn: '45–55 days',
    daysToGrowFil: '45–55 araw',
    stageEn: 'Pod Development',
    stageFil: 'Paglaki ng Pod',
    stageStep: 4,
    progressPercent: 80,
    stageDescEn: 'Long slender pods developing crisp tenderness along trellises.',
    stageDescFil: 'Humahaba at lumalambot ang mga pod ng sitaw sa balag.'
  },
  {
    id: 'tomato',
    name: 'Tomato',
    filipinoName: 'Kamatis',
    icon: '🍅',
    daysToGrowEn: '60–70 days',
    daysToGrowFil: '60–70 araw',
    stageEn: 'Fruit Development',
    stageFil: 'Lumalaking Bunga',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Firm fruits sizing up and beginning color break.',
    stageDescFil: 'Lumalaki at tumitigas ang mga bunga; malapit nang mamula.'
  }
];

// Actionable Farming Recommendations with Slide-in Action Steps
const RECOMMENDATIONS_DATA = [
  {
    id: 'irrigation',
    cardClass: 'rec-irrigation',
    icon: '💧',
    titleFil: 'Patubig at Paglilinis ng Kanal',
    titleEn: 'Irrigation & Drainage Management',
    descFil: 'Mataas ang humidity sa Quezon City. Panatilihing malinis ang mga kanal para hindi mabaha o mabulok ang ugat ng kamatis at talong.',
    descEn: 'Quezon City weather indicates elevated atmospheric humidity (90%+). Maintain furrow clearing to prevent water stagnation around tomato and eggplant root zones.',
    scheduleFil: 'Dalas: 2x isang linggo (6:00 AM – 7:00 AM)',
    scheduleEn: 'Schedule: 2x weekly (6:00 AM – 7:00 AM)',
    stepsFil: [
      'Alisin ang bara sa kanal upang malayang umagos ang tubig-ulan.',
      'Diligin ang ugat lamang; iwasang mabasa ang dahon para di magka-amag.',
      'Maglagay ng dayami o mulch para mapanatili ang tamang basa ng lupa.'
    ],
    stepsEn: [
      'Clear furrow debris to ensure rapid runoff after monsoon showers.',
      'Direct water strictly to soil root zone; avoid wetting foliage.',
      'Apply organic rice straw mulch to stabilize root zone moisture.'
    ],
    tipFil: 'Bawas sa panganib ng bacterial wilt at pagkabulok ng ugat.',
    tipEn: 'Reduces bacterial wilt and root rot vulnerability by up to 40%.'
  },
  {
    id: 'nutrition',
    cardClass: 'rec-nutrition',
    icon: '🌾',
    titleFil: 'Abono at Pagpapataba sa Pananim',
    titleEn: 'Crop Nutrition & Side-Dressing',
    descFil: 'Maglagay ng calcium-boron foliar ngayong linggo para tumibay ang balat ng bunga at hindi mabulok kapag basa ang gabi.',
    descEn: 'Apply organic calcium-boron foliar amendment this week to strengthen fruit cell walls and reduce susceptibility to blossom-end rot during humid evenings.',
    scheduleFil: 'Dalas: Tuwing 7 araw (4:30 PM – 5:30 PM)',
    scheduleEn: 'Schedule: Every 7 days (4:30 PM – 5:30 PM)',
    stepsFil: [
      'Ihalo ang 15ml calcium-boron foliar sa 16L na sprayer.',
      'I-spray sa ilalim ng dahon at sa mga bagong usbong na bulaklak.',
      'Mag-side dress ng vermicast compost 5cm ang layo sa puno.'
    ],
    stepsEn: [
      'Dilute 15ml organic calcium-boron foliar in 16L sprayer.',
      'Mist leaf undersides and early bloom clusters evenly.',
      'Side-dress with vermicast compost 5cm away from plant stems.'
    ],
    tipFil: 'Tumitigas ang balat ng bunga at naiiwasan ang pagputok.',
    tipEn: 'Strengthens fruit cuticle and prevents blossom-end rot.'
  },
  {
    id: 'pest',
    cardClass: 'rec-pest',
    icon: '🛡️',
    titleFil: 'Bantay sa Peste at Sakit',
    titleEn: 'Integrated Pest Watch (IPM)',
    descFil: 'Suriin ang ilalim ng dahon ng pechay kung may uod o amag. Mag-spray ng organikong neem spray sa umaga kung tuyo ang panahon.',
    descEn: 'Inspect pechay undersides for flea beetles and downy mildew. Apply organic neem spray or bio-fungicide during dry morning windows.',
    scheduleFil: 'Dalas: Suriin araw-araw; spray tuwing 5 araw',
    scheduleEn: 'Schedule: Daily inspection; spray every 5 days',
    stepsFil: [
      'Magtayo ng yellow sticky traps sa bawat kama ng gulay.',
      'Gamitin ang 5ml neem oil + 2ml mild soap bawat litro ng tubig.',
      'Pitasin agad at ibaon ang mga dahong may amag o uod.'
    ],
    stepsEn: [
      'Deploy yellow sticky insect traps along vegetable bed edges.',
      'Spray organic neem solution (5ml neem + 2ml soap per liter) at dawn.',
      'Prune and safely bury leaves showing fungal mildew spores.'
    ],
    tipFil: 'Ligtas at natural; walang kemikal na lason bago anihin.',
    tipEn: '100% bio-safe; leaves zero synthetic chemical residue on leaves.'
  },
  {
    id: 'harvest',
    cardClass: 'rec-harvest',
    icon: '🚜',
    titleFil: 'Oras ng Pag-ani',
    titleEn: 'Harvest Scheduling Window',
    descFil: 'Pwede nang anihin ang pechay. Mag-ani bandang 5:30 AM hanggang 7:30 AM ng umaga para hindi malanta sa init at sariwa papuntang palengke.',
    descEn: 'Pechay plots are approaching peak market tenderness. Harvesting between 5:30 AM – 7:30 AM minimizes post-harvest moisture loss and extends shelf life.',
    scheduleFil: 'Oras: 5:30 AM – 7:30 AM ng madaling araw',
    scheduleEn: 'Timing: 5:30 AM – 7:30 AM early morning',
    stepsFil: [
      'Gupitin nang maingat 2cm mula sa ugat gamit ang kutsilyo.',
      'Ipatong sa basket na may basang tela upang sariwa papuntang bagsakan.',
      'Ihiwalay ang Grade A para maibenta sa mas mataas na presyo.'
    ],
    stepsEn: [
      'Cut cleanly 2cm above root zone using sanitized shears.',
      'Stack in shallow crates lined with damp cloth to preserve turgor.',
      'Grade immediately for higher wholesale price realization.'
    ],
    tipFil: 'Mas malutong at 15–20% mas mataas ang benta sa palengke.',
    tipEn: 'Maximizes leaf crispness and commands 15–20% price premium.'
  }
];

// Farming Insights with Slide-in Detailed Breakdown
const INSIGHTS_DATA = [
  {
    id: 'calendar',
    badgeClass: 'badge-calendar',
    badgeIcon: '📅',
    badgeFil: 'Panahon ng Pagtatanim',
    badgeEn: 'Seasonal Calendar',
    titleFil: 'Pagtatanim ngayong Setyembre - Oktubre',
    titleEn: 'September - October Cultivation Window',
    descFil: 'Maganda ang temperatura (24°C - 33°C) para sa mga gulay na mabilis anihin. Magtanim ng pechay at mustasa ngayon para makapag-ani bago ang malalakas na ulan.',
    descEn: 'Current atmospheric temperatures (24°C - 33°C) provide the optimal biological window for rapid short-cycle crop turnover. Sowing fast-turnaround leafy brassicas now maximizes output prior to late-monsoon weather patterns.',
    detailsTitleFil: 'Agro-Klima sa Quezon City',
    detailsTitleEn: 'Quezon City Agro-Climatic Window',
    highlightsFil: [
      '🌡️ Temperatura: 24°C hanggang 33°C (tamang init para sa mabilis na paglaki).',
      '🌱 Bagay na Itanim: Pechay (Black Behi), Mustasa (Monteverde), Kangkong.',
      '☔ Paalala: Maghanda ng 15cm raised beds para sa biglaang buhos ng ulan.'
    ],
    highlightsEn: [
      '🌡️ Temperature: 24°C to 33°C (ideal for rapid vegetative leaf expansion).',
      '🌱 Recommended Crops: Pechay (Black Behi), Mustard Greens, Upland Kangkong.',
      '☔ Drainage: Construct 15cm raised beds to withstand tropical rain bursts.'
    ],
    tipFil: 'Mabilis na ani sa loob ng 25–30 araw lamang mula sa pagpunla.',
    tipEn: 'Harvestable cycle within 25–30 days from initial seed emergence.'
  },
  {
    id: 'climate',
    badgeClass: 'badge-climate',
    badgeIcon: '📊',
    badgeFil: 'AI Hybrid Model',
    badgeEn: 'AI Hybrid Model Insight',
    titleFil: 'Mas Siguradong Ani gamit ang SARIMA–LSTM',
    titleEn: 'SARIMA–LSTM Instability Reduction',
    descFil: 'Pinag-aaralan ng AI model ang takbo ng ulan at init upang maiwasan ang biglaang pagbagsak ng ani, kaya mas may tiwala ang magsasaka sa kanyang tanim.',
    descEn: 'By capturing both seasonal rainfall oscillations (SARIMA) and nonlinear temperature volatility (LSTM), the hybrid model achieves a 28% reduction in yield instability forecast error, helping farmers plant with confidence.',
    detailsTitleFil: 'Paano Tumutulong ang AI Model',
    detailsTitleEn: 'How the Hybrid Model Operates',
    highlightsFil: [
      '🎯 94.2% Katumpakan (R²) sa historical agro-meteorological data sa Quezon City.',
      '🌦️ SARIMA Layer: Sinusubaybayan ang pana-panahong siklo ng ulan at tag-init.',
      '🧠 LSTM Neural Net: Hinuhulaan ang biglaang pagbabago ng temperatura at init.'
    ],
    highlightsEn: [
      '🎯 94.2% R² accuracy on Quezon City agro-meteorological historical series.',
      '🌦️ SARIMA Layer: Models periodic monsoon precipitation oscillations.',
      '🧠 LSTM Layer: Learns complex non-linear heat and humidity fluctuations.'
    ],
    tipFil: '28% bawas sa panganib ng pagkalugi at pagkasayang ng puhunan.',
    tipEn: '28% reduction in crop yield forecasting uncertainty and investment loss.'
  },
  {
    id: 'companion',
    badgeClass: 'badge-companion',
    badgeIcon: '🌿',
    badgeFil: 'Natural na Pagsasaka',
    badgeEn: 'Agro-Ecology & Soil',
    titleFil: 'Katabing Halaman Panlaban sa Peste',
    titleEn: 'Companion Planting Defense',
    descFil: 'Ang pagtatanim ng basil o marigold sa tabi ng pechay ay natural na nagtataboy sa mga uod at insekto nang hindi kailangan ng matapang na kemikal.',
    descEn: 'Intercropping pechay alongside sweet basil or French marigolds naturally repels diamondback moths and leafminers, reducing pest-related damage by up to 35% without synthetic chemical pesticides.',
    detailsTitleFil: 'Mga Mabisang Katabing Halaman',
    detailsTitleEn: 'Proven Companion Planting Pairs',
    highlightsFil: [
      '🌼 Marigold: Nagtataboy ng nematodes at aphid sa paligid ng ugat.',
      '🌿 Sweet Basil: Natural na amoy na panlaban sa thrips at tomato hornworms.',
      '🧅 Sibuyas / Kutsay: Mabisang panangga sa uod ng repolyo at pechay.'
    ],
    highlightsEn: [
      '🌼 French Marigolds: Root exudates suppress plant-parasitic nematodes.',
      '🌿 Sweet Basil: Aromatic volatile oils deter thrips and leaf-chewing worms.',
      '🧅 Alliums / Chives: Mask brassica scent from diamondback moths.'
    ],
    tipFil: 'Hanggang 35% kabawasan sa pinsala ng insekto nang walang lason.',
    tipEn: 'Reduces pest damage by up to 35% without synthetic spray applications.'
  },
  {
    id: 'market',
    badgeClass: 'badge-market',
    badgeIcon: '💰',
    badgeFil: 'Presyo sa Palengke',
    badgeEn: 'Market Opportunity',
    titleFil: 'Magandang Presyo sa Bagsakan sa Metro Manila',
    titleEn: 'Metro Manila Market Pricing Advantage',
    descFil: 'Mataas ang bilihan ng sariwang gulay sa Balintawak at Mega Q-Mart tuwing Huwebes hanggang Sabado. Mag-ani bago mag-weekend para makakuha ng mas mataas na presyo.',
    descEn: 'Fresh vegetable demand in nearby trading centers (Balintawak, Mega Q-Mart) peaks Thursday through Saturday. Scheduling harvests 24 hours ahead of weekend peaks yields up to 18% higher farmgate prices.',
    detailsTitleFil: 'Gabay sa Pagbebenta at Bagsakan',
    detailsTitleEn: 'Market Timing & Wholesale Channels',
    highlightsFil: [
      '🏬 Bagsakan Centers: Balintawak Market, Mega Q-Mart, Novaliches Market.',
      '⏰ Pinakamainam na Oras: Huwebes 8:00 PM hanggang Sabado 4:00 AM.',
      '💵 Dagdag-Kita: ₱10 – ₱15 bawat kilo kapag Grade A at sariwang-sariwa.'
    ],
    highlightsEn: [
      '🏬 Wholesale Hubs: Balintawak Market, Mega Q-Mart, Novaliches Market.',
      '⏰ Peak Window: Thursday 8:00 PM to Saturday 4:00 AM.',
      '💵 Margin Premium: ₱10 – ₱15 per kg for crisp, Grade-A morning harvests.'
    ],
    tipFil: 'Direktang pagbenta sa bagsakan para maiwasan ang kaltas ng komisyoner.',
    tipEn: 'Direct farm-to-hub delivery captures maximum grower farmgate margin.'
  }
];

function Dashboard({ 
  userRole = 'farmer', 
  user = null, 
  systemStatus = {}, 
  hasWeatherDataset: hasWeatherProp,
  hasCropDataset: hasCropProp,
  isLstmTrained: isLstmTrainedProp = false,
  isCropModelTrained: isCropModelTrainedProp = false,
  setActiveTab, 
  onRefresh, 
  lang = 'en' 
}) {
  const isFil = lang === 'fil';
  const [flippedCrops, setFlippedCrops] = useState({});
  const [slidRecs, setSlidRecs] = useState({});
  const [slidInsights, setSlidInsights] = useState({});
  const [inspectingCrop, setInspectingCrop] = useState(null);

  const [liveWeather, setLiveWeather] = useState({
    temp: 29,
    humidity: 84,
    precipitation: 0.8,
    weatherCode: 53, // Drizzle detection ready
    condition: 'Drizzle'
  });

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=14.6760&longitude=121.0437&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=Asia/Manila')
      .then(r => r.json())
      .then(d => {
        if (d?.current) {
          setLiveWeather({
            temp: Math.round(d.current.temperature_2m),
            humidity: Math.round(d.current.relative_humidity_2m),
            precipitation: Number(d.current.precipitation) || 0,
            weatherCode: Number(d.current.weather_code) || 2,
            condition: (d.current.weather_code >= 51 && d.current.weather_code <= 57) 
              ? 'Drizzle' 
              : (d.current.precipitation > 0 ? 'Rain' : 'Partly Cloudy')
          });
        }
      })
      .catch(() => {});
  }, []);

  const hasWeather = hasWeatherProp !== undefined 
    ? hasWeatherProp 
    : Boolean(systemStatus?.weatherDatasetLoaded || (systemStatus?.weatherCount && systemStatus.weatherCount > 0));

  const hasCrops = hasCropProp !== undefined 
    ? hasCropProp 
    : Boolean(
        (systemStatus?.cropDatasetLoaded || (systemStatus?.cropCount && systemStatus.cropCount > 0)) && 
        (systemStatus?.detectedCrops && systemStatus.detectedCrops.length > 0)
      );

  const hasAnyDataset = hasWeather || hasCrops;

  // LSTM AI Model Training Status Detection
  const [lstmReady, setLstmReady] = useState(() => {
    if (isLstmTrainedProp !== undefined) return Boolean(isLstmTrainedProp);
    if (systemStatus?.trainingStatus?.lstm === 'Trained' || systemStatus?.trainingStatus?.hybrid === 'Trained') return true;
    if (systemStatus?.trainingStatus?.lstm === 'Not Trained' && systemStatus?.trainingStatus?.hybrid === 'Not Trained') return false;
    try {
      return localStorage.getItem('climayield_lstm_trained') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isLstmTrainedProp !== undefined) {
      setLstmReady(Boolean(isLstmTrainedProp));
    } else if (systemStatus?.trainingStatus?.lstm === 'Trained' || systemStatus?.trainingStatus?.hybrid === 'Trained') {
      setLstmReady(true);
    } else if (
      systemStatus &&
      systemStatus?.trainingStatus?.lstm === 'Not Trained' &&
      systemStatus?.trainingStatus?.hybrid === 'Not Trained'
    ) {
      setLstmReady(false);
    }
  }, [isLstmTrainedProp, systemStatus]);

  // Helper to compute projected yield directly from trained LSTM model records
  const computeProjectedYieldFromStorage = () => {
    try {
      // Must only produce yield if LSTM or Hybrid model is actually trained!
      const isTrained = 
        (systemStatus?.trainingStatus?.lstm === 'Trained' || systemStatus?.trainingStatus?.hybrid === 'Trained') ||
        (systemStatus?.trainingStatus?.lstm !== 'Not Trained' && localStorage.getItem('climayield_lstm_trained') === 'true');
      
      if (!isTrained) return null;

      const allForecasts = JSON.parse(localStorage.getItem('climayield_ai_forecasts') || '{}');
      const latestTraining = JSON.parse(localStorage.getItem('climayield_latest_training') || 'null');
      const yieldRecord = allForecasts.Crop_Yield || allForecasts.El_Nino_Yield || allForecasts.La_Nina_Yield || 
        (latestTraining && ((latestTraining.target || '').includes('Yield') || (latestTraining.target || '').includes('Crop') || (latestTraining.modelType || '').toUpperCase().includes('LSTM') || (latestTraining.modelType || '').toUpperCase().includes('HYBRID')) ? latestTraining : null) ||
        (allForecasts._latest && (allForecasts._latest.target?.includes('Yield') || allForecasts._latest.target?.includes('Crop') || allForecasts._latest.unit === 'tons/ha') ? allForecasts._latest : null);

      if (yieldRecord) {
        // Must be from an LSTM or Hybrid run, NEVER SARIMA alone
        const mType = (yieldRecord.modelType || '').toUpperCase();
        const isLstm = mType.includes('LSTM') || mType.includes('HYBRID');
        if (!isLstm) return null;

        let avg = null;
        if (typeof yieldRecord.averageProjected === 'number') {
          avg = yieldRecord.averageProjected;
        } else if (typeof yieldRecord.statistics?.mean === 'number') {
          avg = yieldRecord.statistics.mean;
        } else if (typeof yieldRecord.statisticalDecomposition?.mean === 'number') {
          avg = yieldRecord.statisticalDecomposition.mean;
        } else if (Array.isArray(yieldRecord.forecast) && yieldRecord.forecast.length > 0) {
          avg = yieldRecord.forecast.reduce((a, b) => a + b, 0) / yieldRecord.forecast.length;
        } else if (Array.isArray(yieldRecord.rawForecast) && yieldRecord.rawForecast.length > 0) {
          avg = yieldRecord.rawForecast.reduce((a, b) => a + b, 0) / yieldRecord.rawForecast.length;
        }

        if (avg !== null && !isNaN(avg) && avg > 0) {
          let diffPct = null;
          if (yieldRecord.percentageVsBaseline !== undefined && yieldRecord.percentageVsBaseline !== null) {
            diffPct = Number(yieldRecord.percentageVsBaseline);
          } else {
            const rawBase = yieldRecord.historicalBaseline || yieldRecord.statistics?.historicalBaseline || yieldRecord.statisticalDecomposition?.historicalBaseline;
            const baseline = (rawBase && !isNaN(rawBase) && rawBase > 0)
              ? Number(rawBase)
              : 5.92;
            diffPct = ((avg - baseline) / baseline) * 100;
          }

          return {
            avg: Math.round(avg * 10) / 10,
            diffPct: Math.round(Math.abs(diffPct) * 10) / 10,
            isHigher: diffPct >= 0
          };
        }
      }

      const latestStr = localStorage.getItem('climayield_latest_training');
      if (latestStr) {
        const latest = JSON.parse(latestStr);
        const mType = (latest.modelType || '').toUpperCase();
        const isLstm = mType.includes('LSTM') || mType.includes('HYBRID');
        if (isLstm && (latest.target?.includes('Yield') || latest.unit === 'tons/ha')) {
          let avg = null;
          if (typeof latest.averageProjected === 'number') {
            avg = latest.averageProjected;
          } else if (typeof latest.statistics?.mean === 'number') {
            avg = latest.statistics.mean;
          } else if (Array.isArray(latest.forecast) && latest.forecast.length > 0) {
            avg = latest.forecast.reduce((a, b) => a + b, 0) / latest.forecast.length;
          }
          if (avg !== null && !isNaN(avg) && avg > 0) {
            let diffPct = null;
            if (latest.percentageVsBaseline !== undefined && latest.percentageVsBaseline !== null) {
              diffPct = Number(latest.percentageVsBaseline);
            } else {
              const rawBase = latest.historicalBaseline || latest.statistics?.historicalBaseline;
              const baseline = (rawBase && !isNaN(rawBase) && rawBase > 0)
                ? Number(rawBase)
                : 5.92;
              diffPct = ((avg - baseline) / baseline) * 100;
            }
            return {
              avg: Math.round(avg * 10) / 10,
              diffPct: Math.round(Math.abs(diffPct) * 10) / 10,
              isHigher: diffPct >= 0
            };
          }
        }
      }
    } catch {}
    return null;
  };

  const [projectedYieldData, setProjectedYieldData] = useState(() => computeProjectedYieldFromStorage());

  useEffect(() => {
    const syncYield = (e) => {
      if (e?.detail?.trained === false) {
        setLstmReady(false);
        setProjectedYieldData(null);
        return;
      }
      const payload = e?.detail?.payload || e?.detail;
      const mType = (payload?.modelType || '').toUpperCase();
      // Only process LSTM or Hybrid payloads for projected yield
      if (mType && !mType.includes('LSTM') && !mType.includes('HYBRID')) {
        return;
      }
      setLstmReady(true);
      const avg = payload?.averageProjected || payload?.statistics?.mean || payload?.statisticalDecomposition?.mean;
      if (typeof avg === 'number' && !isNaN(avg)) {
        let diffPct = null;
        if (payload?.percentageVsBaseline !== undefined && payload?.percentageVsBaseline !== null) {
          diffPct = Number(payload.percentageVsBaseline);
        } else {
          const rawBase = payload?.historicalBaseline || payload?.statistics?.historicalBaseline;
          const baseline = (rawBase && !isNaN(rawBase) && rawBase > 0)
            ? Number(rawBase)
            : 5.92;
          diffPct = ((avg - baseline) / baseline) * 100;
        }
        setProjectedYieldData({
          avg: Math.round(avg * 10) / 10,
          diffPct: Math.round(Math.abs(diffPct) * 10) / 10,
          isHigher: diffPct >= 0
        });
      } else {
        const data = computeProjectedYieldFromStorage();
        setProjectedYieldData(data);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'climayield_ai_forecasts' || e.key === 'climayield_latest_training' || e.key === 'climayield_lstm_trained') {
        if (localStorage.getItem('climayield_lstm_trained') !== 'true') {
          setLstmReady(false);
          setProjectedYieldData(null);
        } else {
          const data = computeProjectedYieldFromStorage();
          setProjectedYieldData(data);
        }
      }
    };

    window.addEventListener('lstmTrainingUpdated', syncYield);
    window.addEventListener('aiTrainingCompleted', syncYield);
    window.addEventListener('storage', handleStorageChange);

    fetch(`${API_URL}/training/latest`)
      .then(r => r.json())
      .then(res => {
        if (res?.success) {
          const isLstmBackendTrained = 
            res.trainingStatus?.lstm === 'Trained' || 
            res.trainingStatus?.hybrid === 'Trained';
          if (!isLstmBackendTrained) {
            setProjectedYieldData(null);
            return;
          }
          const yf = res.allForecasts?.Crop_Yield || (res.latest?.target?.includes('Yield') ? res.latest : null);
          const mType = (yf?.modelType || '').toUpperCase();
          const isLstmRecord = mType.includes('LSTM') || mType.includes('HYBRID');
          if (isLstmRecord && yf?.forecast && yf.forecast.length > 0) {
            const avg = yf.averageProjected || (yf.forecast.reduce((a, b) => a + b, 0) / yf.forecast.length);
            let diffPct = null;
            if (yf.percentageVsBaseline !== undefined && yf.percentageVsBaseline !== null) {
              diffPct = Number(yf.percentageVsBaseline);
            } else {
              const rawBase = yf.historicalBaseline;
              const baseline = (rawBase && !isNaN(rawBase) && rawBase > 0)
                ? Number(rawBase)
                : 5.92;
              diffPct = ((avg - baseline) / baseline) * 100;
            }
            setProjectedYieldData({
              avg: Math.round(avg * 10) / 10,
              diffPct: Math.round(Math.abs(diffPct) * 10) / 10,
              isHigher: diffPct >= 0
            });
          }
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('lstmTrainingUpdated', syncYield);
      window.removeEventListener('aiTrainingCompleted', syncYield);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemStatus]);

  // Crop AI Model Training Status Detection
  const [isCropModelTrained, setIsCropModelTrained] = useState(() => {
    if (isCropModelTrainedProp) return true;
    if (systemStatus?.trainingStatus?.cropModelTrained === true) return true;
    try {
      return localStorage.getItem('climayield_crop_model_trained') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isCropModelTrainedProp) {
      setIsCropModelTrained(true);
    } else if (systemStatus?.trainingStatus?.cropModelTrained === true) {
      setIsCropModelTrained(true);
    } else if (
      systemStatus &&
      systemStatus?.trainingStatus?.cropModelTrained === false &&
      localStorage.getItem('climayield_crop_model_trained') !== 'true'
    ) {
      setIsCropModelTrained(false);
    }
  }, [isCropModelTrainedProp, systemStatus]);

  useEffect(() => {
    const handleCropModel = (e) => setIsCropModelTrained(!!e.detail?.trained);
    const handleStorage = (e) => {
      if (e.key === 'climayield_crop_model_trained') setIsCropModelTrained(e.newValue === 'true');
    };
    window.addEventListener('cropModelTrainedUpdated', handleCropModel);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('cropModelTrainedUpdated', handleCropModel);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Crops loaded from inputted dataset (empty initially; automatically populated from Dev Side Data Management)
  const [datasetCrops, setDatasetCrops] = useState(() => {
    return getSavedDatasetCrops();
  });

  // Custom added vegetables from farmer
  const [customCrops, setCustomCrops] = useState(() => {
    try {
      const saved = localStorage.getItem('climayield_custom_crops');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync automatically whenever the Developer Side uploads or updates a crop dataset
  useEffect(() => {
    const handleCropDatasetUpdate = (e) => {
      setDatasetCrops(e.detail || []);
    };
    const handleStorageUpdate = (e) => {
      if (e.key === 'climayield_dataset_crops') {
        try {
          setDatasetCrops(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {}
      }
    };
    window.addEventListener('cropDatasetUpdated', handleCropDatasetUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('cropDatasetUpdated', handleCropDatasetUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Sync if backend reports detected crops, or automatically wipe if dataset was removed
  useEffect(() => {
    if (!hasCrops) {
      if (datasetCrops.length > 0) {
        setDatasetCrops([]);
      }
      return;
    }
    if (isDatasetCropsCleared()) return;
    if (systemStatus?.detectedCrops && systemStatus.detectedCrops.length > 0) {
      if (datasetCrops.length === 0 || systemStatus.detectedCrops.length > datasetCrops.length) {
        setDatasetCrops(systemStatus.detectedCrops);
        try {
          localStorage.setItem('climayield_dataset_crops', JSON.stringify(systemStatus.detectedCrops));
        } catch {}
      }
    }
  }, [hasCrops, systemStatus, datasetCrops.length]);

  // When crop AI model is trained, restore crops from the uploaded dataset only (no built-in defaults)
  useEffect(() => {
    if (!hasCrops) return;
    if (isCropModelTrained && !isDatasetCropsCleared()) {
      if (systemStatus?.detectedCrops && systemStatus.detectedCrops.length > 0) {
        setDatasetCrops(systemStatus.detectedCrops);
      } else if (datasetCrops.length === 0) {
        const saved = getSavedDatasetCrops();
        if (saved && saved.length > 0) {
          setDatasetCrops(saved);
        }
      }
    }
  }, [hasCrops, isCropModelTrained, datasetCrops.length, systemStatus]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCropForm, setNewCropForm] = useState({
    filipinoName: 'Pechay',
    name: 'Pechay',
    icon: '🥬',
    daysToGrow: isFil ? '5–7 araw' : '5–7 days',
    stageStep: 1,
    stageDesc: ''
  });

  // All active vegetables: crops only appear when uploaded from Dev side + custom added
  const allCrops = useMemo(() => [...datasetCrops, ...customCrops], [datasetCrops, customCrops]);

  // Automated mobile push notification dispatch for harvest & weather alerts
  useEffect(() => {
    if (allCrops && allCrops.length > 0) {
      dispatchHarvestAndClimateAlerts(allCrops, liveWeather, isFil, false);
    }
  }, [allCrops, liveWeather, isFil]);

  const handleTriggerMobileAlerts = async () => {
    const res = await sendTestAlertToPhone(isFil);
    if (res.success) {
      toast.success(
        isFil 
          ? '🔔 Aktibo na ang Mobile Alerts sa iyong cellphone! May darating na notification kapag may anihin o ambon.' 
          : '🔔 Mobile Alerts activated! You will receive phone notifications for harvest readiness and weather advisories.'
      );
      dispatchHarvestAndClimateAlerts(allCrops, liveWeather, isFil, true);
    } else if (res.reason === 'denied') {
      toast.warn(
        isFil 
          ? 'Naka-block ang notifications sa browser. Paki-pindot ang lock icon sa browser at i-allow ang Notifications.' 
          : 'Notifications are blocked. Please tap the lock icon in your browser address bar and select Allow Notifications.'
      );
    } else if (res.reason === 'unsupported') {
      toast.info(
        isFil
          ? 'Buksan ang app sa Google Chrome o Safari sa cellphone upang makatanggap ng phone alerts.'
          : 'Open the app in Chrome or Safari on your mobile phone to receive push notifications.'
      );
    }
  };

  // Remove all vegetables from the dashboard
  const handleClearAllVegetables = () => {
    if (window.confirm(isFil ? 'Alisin ang lahat ng gulay sa dashboard?' : 'Remove all vegetables from the dashboard?')) {
      clearDatasetCrops();
      setDatasetCrops([]);
      setCustomCrops([]);
      try {
        localStorage.removeItem('climayield_custom_crops');
      } catch {}
      toast.info(isFil ? 'Naalis na ang lahat ng gulay sa dashboard.' : 'All vegetables removed from the dashboard.');
    }
  };

  const handleCardFlip = (cropId) => {
    setFlippedCrops(prev => ({
      ...prev,
      [cropId]: !prev[cropId]
    }));
  };

  const handleRecSlide = (recId) => {
    setSlidRecs(prev => ({
      ...prev,
      [recId]: !prev[recId]
    }));
  };

  const handleInsightSlide = (insightId) => {
    setSlidInsights(prev => ({
      ...prev,
      [insightId]: !prev[insightId]
    }));
  };

  const allFlipped = allCrops.length > 0 && allCrops.every(c => !!flippedCrops[c.id]);

  const toggleFlipAll = () => {
    if (allFlipped) {
      setFlippedCrops({});
    } else {
      const allTrue = {};
      allCrops.forEach(c => {
        allTrue[c.id] = true;
      });
      setFlippedCrops(allTrue);
    }
  };

  // Find match in Tagalog -> English dictionary
  const findEnglishMatch = (val) => {
    if (!val) return null;
    const clean = val.toLowerCase().trim();
    if (TAGALOG_TO_ENGLISH_MAP[clean]) {
      return TAGALOG_TO_ENGLISH_MAP[clean];
    }
    for (const [key, data] of Object.entries(TAGALOG_TO_ENGLISH_MAP)) {
      if (clean === key || clean.startsWith(key) || key.startsWith(clean)) {
        return data;
      }
    }
    return null;
  };

  // Find match in English -> Tagalog dictionary
  const findTagalogMatch = (val) => {
    if (!val) return null;
    const clean = val.toLowerCase().trim();
    if (ENGLISH_TO_TAGALOG_MAP[clean]) {
      return ENGLISH_TO_TAGALOG_MAP[clean];
    }
    for (const [key, data] of Object.entries(ENGLISH_TO_TAGALOG_MAP)) {
      if (clean === key || clean.startsWith(key) || key.startsWith(clean)) {
        return data;
      }
    }
    return null;
  };

  // When farmer selects a vegetable preset chip
  const handlePresetSelect = (preset) => {
    const stageNum = newCropForm.stageStep || preset.stageStep || 1;
    const autoDays = getDaysForStage(preset.filipinoName, preset.name, stageNum, isFil);

    setNewCropForm(prev => ({
      ...prev,
      filipinoName: preset.filipinoName,
      name: preset.name,
      icon: preset.icon,
      daysToGrow: autoDays,
      stageStep: stageNum,
      stageDesc: isFil ? preset.stageDescFil : preset.stageDescEn
    }));
  };

  // When farmer types or chooses a Tagalog vegetable name -> Auto English, Auto Icon, Auto Days
  const handleFilipinoNameChange = (val) => {
    const match = findEnglishMatch(val);
    const matchedEn = match ? match.en : '';
    const matchedIcon = match ? match.icon : '';
    const stageNum = newCropForm.stageStep || 1;
    const autoDays = getDaysForStage(val, matchedEn || newCropForm.name, stageNum, isFil);

    setNewCropForm(prev => ({
      ...prev,
      filipinoName: val,
      name: matchedEn || prev.name,
      icon: matchedIcon || prev.icon,
      daysToGrow: autoDays
    }));
  };

  // When farmer types or chooses an English vegetable name -> Auto Tagalog, Auto Icon, Auto Days
  const handleEnglishNameChange = (val) => {
    const match = findTagalogMatch(val);
    const matchedFil = match ? match.fil : '';
    const matchedIcon = match ? match.icon : '';
    const stageNum = newCropForm.stageStep || 1;
    const autoDays = getDaysForStage(matchedFil || newCropForm.filipinoName, val, stageNum, isFil);

    setNewCropForm(prev => ({
      ...prev,
      name: val,
      filipinoName: matchedFil || prev.filipinoName,
      icon: matchedIcon || prev.icon,
      daysToGrow: autoDays
    }));
  };

  // When farmer clicks any Plant Development Stage (P1..P5) -> Automatically calculate Days to Grow!
  const handleStageSelect = (stepNum) => {
    const stepObj = STAGE_STEPS.find(s => s.num === stepNum) || STAGE_STEPS[0];
    const autoDays = getDaysForStage(newCropForm.filipinoName, newCropForm.name, stepNum, isFil);

    setNewCropForm(prev => ({
      ...prev,
      stageStep: stepNum,
      daysToGrow: autoDays,
      stageDesc: isFil ? stepObj.titleFil : stepObj.titleEn
    }));
  };

  const handleAddCropSubmit = (e) => {
    e.preventDefault();
    if (!newCropForm.filipinoName.trim() && !newCropForm.name.trim()) {
      toast.warning(isFil ? 'Pakiusap ilagay ang pangalan ng gulay.' : 'Please enter a vegetable name.');
      return;
    }

    const stepObj = STAGE_STEPS.find(s => s.num === Number(newCropForm.stageStep)) || STAGE_STEPS[0];
    const pct = stepObj.num === 1 ? 20 : stepObj.num === 2 ? 40 : stepObj.num === 3 ? 60 : stepObj.num === 4 ? 80 : 100;

    const filName = newCropForm.filipinoName.trim() || newCropForm.name.trim();
    const engName = newCropForm.name.trim() || filName;

    const rawDays = String(newCropForm.daysToGrow || getDaysForStage(filName, engName, stepObj.num, isFil)).replace(/(days|araw)/gi, '').trim();
    const daysEn = `${rawDays} days`;
    const daysFil = `${rawDays} araw`;

    const cropObj = {
      id: `custom_${Date.now()}`,
      isCustom: true,
      name: engName,
      filipinoName: filName,
      icon: newCropForm.icon || '🥬',
      daysToGrowEn: daysEn,
      daysToGrowFil: daysFil,
      stageStep: stepObj.num,
      stageEn: stepObj.titleEn,
      stageFil: stepObj.titleFil,
      progressPercent: pct,
      stageDescEn: newCropForm.stageDesc || stepObj.titleEn,
      stageDescFil: newCropForm.stageDesc || stepObj.titleFil
    };

    const updated = [cropObj, ...customCrops];
    setCustomCrops(updated);
    try {
      localStorage.setItem('climayield_custom_crops', JSON.stringify(updated));
    } catch {}

    toast.success(isFil ? `🌱 Naidagdag na ang ${cropObj.filipinoName} sa listahan!` : `🌱 ${cropObj.name} added successfully!`);
    setShowAddModal(false);
    setNewCropForm({
      filipinoName: 'Pechay',
      name: 'Pechay',
      icon: '🥬',
      daysToGrow: isFil ? '5–7 araw' : '5–7 days',
      stageStep: 1,
      stageDesc: ''
    });
  };

  const handleDeleteCrop = (cropId) => {
    const cropToDelete = allCrops.find(c => c.id === cropId) || customCrops.find(c => c.id === cropId);
    const cropName = isFil 
      ? cropToDelete?.filipinoName || cropToDelete?.name 
      : cropToDelete?.name || cropToDelete?.filipinoName;
    const confirmMsg = isFil
      ? `Sigurado ka bang nais mong tanggalin ang "${cropName || 'gulay na ito'}"?`
      : `Are you sure you want to delete "${cropName || 'this vegetable'}"?`;

    if (window.confirm(confirmMsg)) {
      const updated = customCrops.filter(c => c.id !== cropId);
      setCustomCrops(updated);
      try {
        localStorage.setItem('climayield_custom_crops', JSON.stringify(updated));
      } catch {}

      if (datasetCrops.some(c => c.id === cropId)) {
        const updatedDataset = datasetCrops.filter(c => c.id !== cropId);
        setDatasetCrops(updatedDataset);
        try {
          localStorage.setItem('climayield_dataset_crops', JSON.stringify(updatedDataset));
        } catch {}
      }

      toast.info(isFil ? `🗑️ Natanggal na ang ${cropName || 'gulay'}.` : `🗑️ ${cropName || 'Vegetable'} deleted.`);
    }
  };

  const navigateTab = (tab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      document.querySelector(`[data-tab="${tab}"]`)?.click();
    }
  };

  // =========================================================================
  // 🧑‍🌾 1. FARMER SIDE DASHBOARD: Predictions + Recommendations + Insights
  // =========================================================================
  if (userRole === 'farmer') {
    return (
      <div className="fd-container">
        {/* Welcome Banner */}
        <div className="fd-hero-card">
          <div className="fd-hero-text">
            <h2>
              <span>🧑‍🌾</span>
              <span>Kamusta, {user?.name || (isFil ? 'Magsasaka' : 'Farmer')}!</span>
            </h2>
            <p>
              {isFil
                ? 'Pagtataya ng Ani sa Quezon City • Alerto at Gabay para sa Magsasaka'
                : 'Quezon City Short-Cycle Crop Forecasting • Yield Instability Monitoring & Decision Support'}
            </p>
          </div>
          <div className="fd-hero-badge-group">
            <div className="fd-hero-badge">
              <div className="title">{isFil ? 'Lokasyon ng Bukid' : 'Farm Location'}</div>
              <div className="val">📍 Quezon City, PH</div>
            </div>
            <button
              type="button"
              className="fd-mobile-alerts-trigger"
              onClick={handleTriggerMobileAlerts}
              title={isFil ? 'Paganahin o i-test ang alerto sa cellphone' : 'Enable or test mobile phone notifications'}
            >
              <span className="fd-mobile-bell-icon">🔔</span>
              <span>{isFil ? 'Mobile Phone Alerts' : 'Mobile Phone Alerts'}</span>
            </button>
          </div>
        </div>

        {/* If no datasets exist from the Developer side, show nothing except the dedicated awaiting state */}
        {!hasAnyDataset ? (
          <div className="fd-empty-crops-card fd-no-datasets-global-card">
            <div className="fd-empty-crops-icon-wrap" style={{ background: '#ecfdf5', borderColor: '#10b981' }}>
              <span className="fd-empty-crops-icon">🌾</span>
            </div>
            <h3 className="fd-empty-crops-title">
              {isFil 
                ? 'Walang Aktibong Dataset mula sa Developer Side' 
                : 'No Active Datasets from Developer Side'}
            </h3>
            <p className="fd-empty-crops-desc">
              {isFil
                ? 'Awtomatikong nakatago ang lahat ng impormasyon, pananim, at payo sa bukid dahil wala pang inilalagay na dataset ang developer sa Data Management o inalis ang mga ito. Kapag nag-upload o nag-load ng bagong dataset ang developer, awtomatikong lilitaw dito ang lahat ng datos.'
                : 'All farm forecasts, vegetable development cards, and agricultural recommendations are hidden because no datasets have been uploaded on the Developer side (Data Management), or existing datasets were cleared. Once the developer loads a dataset, the dashboard will automatically populate.'}
            </p>
            <div className="fd-empty-crops-badge-row">
              <div className="fd-dev-managed-badge">
                <span>⚙️</span>
                <span>
                  {isFil
                    ? 'Pinamamahalaan ang mga dataset sa Dev Side (Data Management)'
                    : 'Datasets are managed exclusively on the Dev side (Data Management)'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Summary Highlights */}
            <div className="fd-summary-grid">
              <div className="fd-summary-card">
                <div className="fd-summary-icon">🌾</div>
                <div className="fd-summary-info">
                  <div className="fd-summary-label">
                    {isFil ? 'Inaasahang Ani' : 'Average Projected Yield'}
                  </div>
                  <div className="fd-summary-value">
                    {lstmReady && projectedYieldData ? (
                      <>{projectedYieldData.avg.toFixed(1)} <span style={{ fontSize: '0.9rem' }}>tons/ha</span></>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '1.6rem', fontWeight: 600 }}>—</span>
                    )}
                  </div>
                  <div className="fd-summary-sub">
                    {lstmReady && projectedYieldData ? (
                      isFil
                        ? `${projectedYieldData.isHigher ? '↑' : '↓'} ${projectedYieldData.diffPct}% ${projectedYieldData.isHigher ? 'mas mataas kaysa karaniwan' : 'mas mababa kaysa karaniwan'}`
                        : `${projectedYieldData.isHigher ? '↑' : '↓'} ${projectedYieldData.diffPct}% ${projectedYieldData.isHigher ? 'higher' : 'lower'} than seasonal baseline`
                    ) : (
                      <span style={{ color: '#94a3b8' }}>
                        {isFil ? 'Awtomatikong lalabas kapag sinanay ang LSTM' : 'Calibrated once LSTM is trained'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="fd-summary-card">
                <div className="fd-summary-icon">⚖️</div>
                <div className="fd-summary-info">
                  <div className="fd-summary-label">
                    {isFil ? 'Panganib sa Ani' : 'Yield Instability Risk'}
                  </div>
                  <div className="fd-summary-value" style={{ color: lstmReady ? '#16a34a' : '#f59e0b' }}>
                    {lstmReady 
                      ? (isFil ? 'Mababang Panganib' : 'Low Risk')
                      : (isFil ? 'Naghihintay ng LSTM' : 'Pending LSTM')}
                  </div>
                  <div className="fd-summary-sub">
                    {lstmReady 
                      ? (isFil ? 'Maayos ang lagay ng panahon' : 'Stable climate conditions projected')
                      : (isFil ? 'Sanayin muna ang LSTM model sa Dev side' : 'Train LSTM model on Dev side')}
                  </div>
                </div>
              </div>

              <div className="fd-summary-card">
                <div className="fd-summary-icon">🌦️</div>
                <div className="fd-summary-info">
                  <div className="fd-summary-label">
                    {isFil ? 'Kondisyon sa Pagtatanim' : 'Growing Environment'}
                  </div>
                  <div className="fd-summary-value">
                    {hasWeather ? (isFil ? 'Maayos' : 'Optimal') : (isFil ? 'Naghihintay ng Datos' : 'Awaiting Data')}
                  </div>
                  <div className="fd-summary-sub">
                    {hasWeather 
                      ? (isFil ? 'Sapat ang ulan at maayos ang panahon' : 'Adequate rainfall & balanced humidity')
                      : (isFil ? 'Naghihintay ng weather dataset sa Dev side' : 'Awaiting weather dataset on Dev side')}
                  </div>
                </div>
              </div>
            </div>

        {/* SECTION 1: CROP PREDICTIONS & VEGETABLE DEVELOPMENT */}
        <div className="fd-section">
          <div className="fd-section-header">
            <div className="fd-section-title">
              <span>📈</span>
              <span>
                {isFil
                  ? 'Mga Pananim na Mabilis Anihin at Yugto ng Paglaki'
                  : 'Short-Cycle Vegetable Crops & Growth Development'}
              </span>
            </div>
            <div className="fd-section-actions">
              {isCropModelTrained && (
                <button 
                  type="button"
                  className="fd-add-crop-btn"
                  onClick={() => setShowAddModal(true)}
                  title={isFil ? 'Magdagdag ng bagong gulay sa listahan' : 'Add a new vegetable to list'}
                >
                  <span className="btn-icon">➕</span>
                  <span>{isFil ? 'Magdagdag ng Gulay' : 'Add Vegetable'}</span>
                </button>
              )}
              {isCropModelTrained && customCrops.length > 0 && (
                <button
                  type="button"
                  className="fd-clear-crops-btn fd-clear-custom-btn"
                  onClick={() => {
                    const confirmMsg = isFil
                      ? 'Sigurado ka bang nais mong alisin ang lahat ng mano-manong naidagdag na gulay?'
                      : 'Are you sure you want to delete all manually added vegetables?';
                    if (window.confirm(confirmMsg)) {
                      setCustomCrops([]);
                      try {
                        localStorage.removeItem('climayield_custom_crops');
                      } catch {}
                      toast.info(isFil ? '🗑️ Naalis na ang lahat ng mano-manong gulay.' : '🗑️ All manually added vegetables removed.');
                    }
                  }}
                  title={isFil ? 'Alisin ang mga mano-manong naidagdag na gulay' : 'Delete all manually added vegetables'}
                >
                  <span>🗑️</span>
                  <span>{isFil ? `Tanggalin Mano-mano (${customCrops.length})` : `Delete Manual (${customCrops.length})`}</span>
                </button>
              )}
              {isCropModelTrained && allCrops.length > 0 && (
                <>
                  <button 
                    type="button"
                    className="fd-clear-crops-btn"
                    onClick={handleClearAllVegetables}
                    title={isFil ? 'Alisin ang lahat ng gulay sa dashboard' : 'Clear all vegetables from dashboard'}
                  >
                    <span>🗑️</span>
                    <span>{isFil ? 'Alisin Lahat' : 'Clear All'}</span>
                  </button>
                  <button 
                    className="fd-toggle-all-btn"
                    onClick={toggleFlipAll}
                    title={isFil ? 'I-flip ang lahat ng card nang sabay-sabay' : 'Flip all cards simultaneously'}
                  >
                    🔄 {allFlipped ? (isFil ? 'I-flip Lahat Pabalik' : 'Flip All to Front') : (isFil ? 'I-flip Lahat ng Card' : 'Flip All Cards')}
                  </button>
                </>
              )}
              <button 
                className="fd-section-btn"
                onClick={() => navigateTab('predictions')}
              >
                {isCropModelTrained 
                  ? (isFil ? 'Tingnan Lahat ng Ani →' : 'View Full Predictions →')
                  : (isFil ? 'Predictions (Naghihintay ng AI Model) →' : 'Predictions (Awaiting AI Model) →')}
              </button>
            </div>
          </div>

          {/* If crop AI model is not trained yet, hide all vegetables and show awaiting training state */}
          {!isCropModelTrained ? (
            <div className="fd-empty-crops-card">
              <div className="fd-empty-crops-icon-wrap" style={{ background: '#ecfdf5', borderColor: '#10b981' }}>
                <span className="fd-empty-crops-icon">🤖</span>
              </div>
              <h3 className="fd-empty-crops-title">
                {isFil 
                  ? 'Naghihintay ng Pagsasanay ng AI Model para sa Pananim' 
                  : 'Awaiting AI Model Training for Crops'}
              </h3>
              <p className="fd-empty-crops-desc">
                {isFil
                  ? 'Ang lahat ng gulay, bilang ng araw ng paglaki, at yugto ng pananim ay lilitaw lamang dito kapag nasanay na ang AI model para sa mga pananim (SARIMA / LSTM / Hybrid) sa Model Training tab.'
                  : 'All vegetables, growth days, and developmental stages will only appear here once you train the AI model for crops (SARIMA / LSTM / Hybrid) in the Model Training tab.'}
              </p>
              <div className="fd-empty-crops-badge-row">
                <div className="fd-dev-managed-badge">
                  <span>🧠</span>
                  <span>
                    {isFil
                      ? 'Sanayin ang Crop Yield model sa Dev Side (Model Training)'
                      : 'Train the Crop Yield model on Dev Side (Model Training)'}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="fd-empty-cta-btn"
                  onClick={() => navigateTab('training')}
                >
                  <span>🚀</span>
                  <span>{isFil ? 'Magsanay ng AI Model para sa Pananim →' : 'Train AI Model for Crops →'}</span>
                </button>
              </div>
            </div>
          ) : allCrops.length === 0 ? (
            <div className="fd-empty-crops-card">
              <div className="fd-empty-crops-icon-wrap">
                <span className="fd-empty-crops-icon">🌱</span>
              </div>
              <h3 className="fd-empty-crops-title">
                {isFil ? 'Naghihintay ng Dataset ng Pananim' : 'Awaiting Crop Dataset from Developer'}
              </h3>
              <p className="fd-empty-crops-desc">
                {isFil
                  ? 'Wala pang aktibong pananim sa dashboard. Kapag nag-upload o nag-load ng crop dataset sa Developer side (Data Management), awtomatikong lilitaw dito ang lahat ng gulay at yugto ng kanilang paglaki.'
                  : 'No crops are currently loaded. Once a crop dataset is uploaded or activated on the Developer side (Data Management), all corresponding vegetables and growth stages will automatically appear here.'}
              </p>
              <div className="fd-empty-crops-badge-row">
                <div className="fd-dev-managed-badge">
                  <span>⚙️</span>
                  <span>
                    {isFil
                      ? 'Ang mga dataset ay pinamamahalaan sa Dev Side (Data Management)'
                      : 'Datasets are managed exclusively on the Dev side (Data Management)'}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="fd-empty-cta-btn outline"
                  onClick={() => setShowAddModal(true)}
                >
                  <span>➕</span>
                  <span>{isFil ? 'Mano-manong Magdagdag ng Gulay' : 'Add Vegetable Manually'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Interactive Hint */}
              <div className="fd-interactive-hint">
                <span>💡</span>
                <span>
                  {isFil
                    ? 'I-click ang alinmang card upang i-flip at basahin ang nakakatuwang fun facts ng bawat pananim.'
                    : 'Click any card to flip and discover fun facts about each vegetable.'}
                </span>
              </div>

              {/* 3D Flip Crop Cards Grid */}
              <div className="fd-crops-grid">
            {allCrops.map(crop => {
              const isFlipped = !!flippedCrops[crop.id];
              const filName = getCropFilipinoName(crop);
              const engName = getCropEnglishName(crop);
              const primaryName = isFil ? filName : engName;
              const secondaryName = isFil
                ? (engName.toLowerCase() !== filName.toLowerCase() ? engName : null)
                : (filName.toLowerCase() !== engName.toLowerCase() ? filName : null);
              const funFactText = getVegetableFunFact(crop, lang);
              const cropHarvest = calculateCropHarvestInfo(crop, lang);

              return (
                <div
                  key={crop.id}
                  className={`fd-flip-card ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => handleCardFlip(crop.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardFlip(crop.id);
                    }
                  }}
                  title={
                    isFil
                      ? isFlipped
                        ? `I-click para i-flip pabalik ang ${primaryName}`
                        : `I-click upang basahin ang fun facts ng ${primaryName}`
                      : isFlipped
                      ? `Click to flip back ${primaryName}`
                      : `Click to read fun facts of ${primaryName}`
                  }
                >
                  <div className="fd-flip-card-inner">
                    {/* HARAP NG CARD (FRONT) */}
                    <div className="fd-flip-card-front">
                      <div className="fd-card-top-bar">
                        <div className="fd-card-identity">
                          <div className="fd-card-icon-bubble">{crop.icon}</div>
                          <div className="fd-card-name-group">
                            <div className="fd-crop-name">
                              {primaryName}
                            </div>
                            {secondaryName && (
                              <div className="fd-crop-tagalog-badge">
                                <span className={`fd-tagalog-pill ${isFil ? 'alt' : ''}`} title={isFil ? 'Pangalan sa Ingles' : 'Pangalan sa Tagalog / Filipino'}>
                                  {isFil ? `(${secondaryName})` : `🇵🇭 ${secondaryName}`}
                                </span>
                              </div>
                            )}
                            <div className="fd-crop-shortcycle-badge">
                              ⚡ {isFil ? 'Mabilis Anihin (Short-Cycle)' : 'Short-Cycle Vegetable'}
                            </div>
                          </div>
                        </div>
                        {crop.isCustom && (
                          <button
                            type="button"
                            className="fd-crop-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCrop(crop.id);
                            }}
                            title={isFil ? `Tanggalin ang ${primaryName}` : `Delete ${primaryName}`}
                          >
                            <span className="btn-icon">🗑️</span>
                            <span className="btn-label">{isFil ? 'Tanggalin' : 'Delete'}</span>
                          </button>
                        )}
                      </div>

                      {/* Dynamic Harvest Countdown & Readiness Badge */}
                      <div className="fd-card-harvest-badge-row">
                        <div className={`fd-harvest-status-pill ${cropHarvest.status} ${cropHarvest.isReady ? 'ready' : ''}`}>
                          <span className="harvest-badge-icon">{cropHarvest.badgeIcon}</span>
                          <span className="harvest-badge-text">{cropHarvest.badgeText}</span>
                        </div>
                      </div>

                      <div className="fd-card-front-center">
                        <div 
                          className="fd-card-hero-3d-box"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <AnimatedVegetableImage
                            crop={{ ...crop, filipinoName: filName, name: engName }}
                            height={132}
                            lang={lang}
                          />
                        </div>
                      </div>

                      <div className="fd-card-flip-prompt">
                        <span className="fd-flip-icon">🔄</span>
                        <span>
                          {isFil
                            ? 'I-click para makita ang fun facts ng halaman'
                            : 'Click to see plant fun facts'}
                        </span>
                      </div>
                    </div>

                    {/* LIKOD NG CARD (BACK - ROTATED 180 DEG) */}
                    <div className="fd-flip-card-back">
                      <div className="fd-back-header">
                        <div className="fd-back-title">
                          <span className="icon">{crop.icon}</span>
                          <div>
                            <div className="name">
                              {primaryName}
                            </div>
                            {secondaryName && (
                              <div className="fd-back-subname">
                                {isFil ? `Ingles: ${secondaryName}` : `Tagalog: ${secondaryName}`}
                              </div>
                            )}
                            <div className="variety">
                              ⚡ {isFil ? 'Mabilis Anihin' : 'Short-Cycle'}
                              {crop.isCustom && ` • ${isFil ? 'Mano-mano' : 'Manual'}`}
                            </div>
                          </div>
                        </div>
                        <div className="fd-back-header-actions">
                          {crop.isCustom && (
                            <button
                              type="button"
                              className="fd-crop-delete-btn back"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCrop(crop.id);
                              }}
                              title={isFil ? `Tanggalin ang ${crop.filipinoName || crop.name}` : `Delete ${crop.name || crop.filipinoName}`}
                            >
                              <span>🗑️</span>
                              <span>{isFil ? 'Tanggalin' : 'Delete'}</span>
                            </button>
                          )}
                          <span className="fd-back-flip-badge">
                            🔄 {isFil ? 'Pabalik' : 'Flip Back'}
                          </span>
                        </div>
                      </div>

                      {/* Harvest Readiness & Growth Window */}
                      <div className="fd-back-harvest-info-card" style={{
                        margin: '6px 0 10px 0',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        background: cropHarvest.isReady ? '#ecfdf5' : '#f8fafc',
                        border: `1.5px solid ${cropHarvest.isReady ? '#6ee7b7' : '#e2e8f0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        <span style={{ color: cropHarvest.isReady ? '#15803d' : '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{cropHarvest.badgeIcon}</span>
                          <span>{cropHarvest.badgeText}</span>
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                          🧺 {cropHarvest.harvestWindow}
                        </span>
                      </div>

                      {/* Full-Card Fun Fact Only */}
                      <div className="fd-back-funfact-card">
                        <div className="fd-funfact-badge-row">
                          <div className="fd-funfact-pill">
                            <span className="fd-funfact-sparkle">💡</span>
                            <span className="fd-funfact-pill-text">
                              {isFil ? 'ALAM MO BA?' : 'FUN FACT'}
                            </span>
                          </div>
                        </div>

                        <div className="fd-funfact-content">
                          <span className="fd-funfact-quote-glyph">“</span>
                          <p className="fd-funfact-main-text">
                            {funFactText}
                          </p>
                        </div>

                        <div className="fd-funfact-card-footer">
                          <span className="fd-funfact-veg-name">🌱 {primaryName}</span>
                          <span className="fd-funfact-veg-badge">⚡ {isFil ? 'Mabilis Anihin' : 'Short-Cycle'}</span>
                        </div>
                      </div>

                      <div className="fd-back-footer-hint">
                        ↩️ {isFil ? 'I-click para i-flip pabalik' : 'Click anywhere to flip back'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>

        {/* SECTION 2: RECOMMENDATIONS */}
        <div className="fd-section">
          <div className="fd-section-header">
            <div className="fd-section-title">
              <span>💡</span>
              <span>
                {isFil ? 'Mga Payo at Gabay sa Bukid' : 'Actionable Farming Recommendations'}
              </span>
            </div>
            {hasWeather && (
              <button 
                className="fd-section-btn"
                onClick={() => navigateTab('recommendations')}
              >
                {isFil ? 'Lahat ng Payo →' : 'All Recommendations →'}
              </button>
            )}
          </div>

          {!hasWeather ? (
            <div className="fd-empty-crops-card" style={{ padding: '36px 20px' }}>
              <span style={{ fontSize: '2rem', marginBottom: '10px' }}>🌦️</span>
              <h4 style={{ margin: '0 0 6px 0', color: '#166534', fontSize: '1.1rem' }}>
                {isFil ? 'Naghihintay ng Dataset ng Panahon mula sa Developer' : 'Awaiting Weather Dataset from Developer'}
              </h4>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem', maxWidth: '520px' }}>
                {isFil 
                  ? 'Awtomatikong lilitaw ang mga payo at gabay sa bukid kapag nag-upload o nag-load ng weather dataset ang developer sa Data Management.'
                  : 'Farming recommendations will automatically appear once a weather dataset is uploaded or activated on the Developer side.'}
              </p>
            </div>
          ) : (
            <div className="fd-recs-grid">
            {RECOMMENDATIONS_DATA.map(rec => {
              const isSlid = !!slidRecs[rec.id];

              return (
                <div
                  key={rec.id}
                  className={`fd-slide-card fd-rec-card ${rec.cardClass} ${isSlid ? 'slid' : ''}`}
                  onClick={() => handleRecSlide(rec.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRecSlide(rec.id);
                    }
                  }}
                  title={
                    isFil
                      ? isSlid
                        ? 'I-click para mag-slide pabalik'
                        : 'I-click para mag-slide ang mga detalyadong hakbang'
                      : isSlid
                      ? 'Click to slide back to summary'
                      : 'Click to slide for detailed action steps'
                  }
                >
                  <div className="fd-slider-track">
                    {/* SLIDE 1: SUMMARY / FRONT */}
                    <div className="fd-slide-panel slide-front">
                      <div>
                        <div className="fd-rec-header">
                          <span>{rec.icon}</span>
                          <span>{isFil ? rec.titleFil : rec.titleEn}</span>
                        </div>
                        <div className="fd-rec-desc">
                          {isFil ? rec.descFil : rec.descEn}
                        </div>
                      </div>

                      <div className="fd-slide-prompt">
                        <span>{isFil ? '👉 I-click para mag-slide ang mga hakbang' : '👉 Click to slide for action steps'}</span>
                        <span className="fd-slide-arrow">➔</span>
                      </div>
                    </div>

                    {/* SLIDE 2: ACTION STEPS / DETAILS */}
                    <div className="fd-slide-panel slide-details">
                      <div className="fd-slide-details-header">
                        <div className="fd-slide-details-title">
                          <span>{rec.icon}</span>
                          <span>{isFil ? rec.titleFil : rec.titleEn}</span>
                        </div>
                        <span className="fd-slide-back-badge">
                          ⬅️ {isFil ? 'Pabalik' : 'Slide Back'}
                        </span>
                      </div>

                      <div className="fd-slide-schedule-pill">
                        ⏰ {isFil ? rec.scheduleFil : rec.scheduleEn}
                      </div>

                      <div className="fd-slide-steps-list">
                        {(isFil ? rec.stepsFil : rec.stepsEn).map((step, idx) => (
                          <div key={idx} className="fd-slide-step-item">
                            <span className="num">{idx + 1}</span>
                            <span className="text">{step}</span>
                          </div>
                        ))}
                      </div>

                      <div className="fd-slide-tip">
                        💡 {isFil ? rec.tipFil : rec.tipEn}
                      </div>

                      <div className="fd-slide-footer-hint">
                        ↩️ {isFil ? 'I-click kahit saan para mag-slide pabalik' : 'Click anywhere to slide back'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* SECTION 3: FARMING INSIGHTS */}
        <div className="fd-section">
          <div className="fd-section-header">
            <div className="fd-section-title">
              <span>🌱</span>
              <span>
                {isFil
                  ? 'Mahalagang Kaalaman sa Pagtatanim sa Quezon City'
                  : 'Farming Insights for Quezon City Vegetable Growers'}
              </span>
            </div>
          </div>

          {!hasWeather ? (
            <div className="fd-empty-crops-card" style={{ padding: '36px 20px' }}>
              <span style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</span>
              <h4 style={{ margin: '0 0 6px 0', color: '#166534', fontSize: '1.1rem' }}>
                {isFil ? 'Naghihintay ng Datos mula sa Developer' : 'Awaiting Data from Developer'}
              </h4>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem', maxWidth: '520px' }}>
                {isFil
                  ? 'Ang mga kaalaman at pananaw sa pagsasaka ay nakabatay sa mga dataset na inilalagay ng developer sa Data Management.'
                  : 'Farming insights are generated from active datasets managed on the Developer side.'}
              </p>
            </div>
          ) : (
            <div className="fd-insights-grid">
            {INSIGHTS_DATA.map(insight => {
              const isSlid = !!slidInsights[insight.id];

              return (
                <div
                  key={insight.id}
                  className={`fd-slide-card fd-insight-card ${isSlid ? 'slid' : ''}`}
                  onClick={() => handleInsightSlide(insight.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleInsightSlide(insight.id);
                    }
                  }}
                  title={
                    isFil
                      ? isSlid
                        ? 'I-click para mag-slide pabalik'
                        : 'I-click para mag-slide ang mga detalye'
                      : isSlid
                      ? 'Click to slide back'
                      : 'Click to slide for detailed insight breakdown'
                  }
                >
                  <div className="fd-slider-track">
                    {/* SLIDE 1: FRONT */}
                    <div className="fd-slide-panel slide-front">
                      <div>
                        <div className={`fd-insight-badge ${insight.badgeClass}`}>
                          <span>{insight.badgeIcon}</span> {isFil ? insight.badgeFil : insight.badgeEn}
                        </div>
                        <div className="fd-insight-title">
                          {isFil ? insight.titleFil : insight.titleEn}
                        </div>
                        <div className="fd-insight-text">
                          {isFil ? insight.descFil : insight.descEn}
                        </div>
                      </div>

                      <div className="fd-slide-prompt">
                        <span>{isFil ? '👉 I-click para mag-slide ang detalye' : '👉 Click to slide for details'}</span>
                        <span className="fd-slide-arrow">➔</span>
                      </div>
                    </div>

                    {/* SLIDE 2: DETAILS */}
                    <div className="fd-slide-panel slide-details">
                      <div className="fd-slide-details-header">
                        <div className={`fd-insight-badge ${insight.badgeClass}`} style={{ margin: 0 }}>
                          <span>{insight.badgeIcon}</span> {isFil ? insight.detailsTitleFil : insight.detailsTitleEn}
                        </div>
                        <span className="fd-slide-back-badge">
                          ⬅️ {isFil ? 'Pabalik' : 'Slide Back'}
                        </span>
                      </div>

                      <div className="fd-slide-highlights-list">
                        {(isFil ? insight.highlightsFil : insight.highlightsEn).map((hl, idx) => (
                          <div key={idx} className="fd-slide-highlight-item">
                            {hl}
                          </div>
                        ))}
                      </div>

                      <div className="fd-slide-tip">
                        ✨ {isFil ? insight.tipFil : insight.tipEn}
                      </div>

                      <div className="fd-slide-footer-hint">
                        ↩️ {isFil ? 'I-click kahit saan para mag-slide pabalik' : 'Click anywhere to slide back'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </>
    )}

        {/* ADD VEGETABLE MODAL */}
        {showAddModal && (
          <div className="fd-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="fd-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="fd-modal-header">
                <div className="fd-modal-title">
                  <span className="icon">🌱</span>
                  <div>
                    <h3>{isFil ? 'Magdagdag ng Bagong Gulay (Short-Cycle)' : 'Add New Vegetable (Short-Cycle)'}</h3>
                    <p>{isFil ? 'Araw ng paglaki at kasalukuyang yugto ng pananim' : 'Days to grow & current plant development stage'}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="fd-modal-close-btn"
                  onClick={() => setShowAddModal(false)}
                  title={isFil ? 'Isara' : 'Close'}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCropSubmit} className="fd-modal-form">
                <div className="fd-modal-body">
                  {/* Manually Added Vegetables Management & Delete List */}
                  {customCrops.length > 0 && (
                    <div className="fd-modal-custom-manager">
                      <div className="fd-modal-custom-manager-head">
                        <div className="title">
                          <span className="badge-icon">📋</span>
                          <span className="badge-text">
                            {isFil
                              ? `Mga Mano-manong Naidagdag na Gulay (${customCrops.length})`
                              : `Manually Added Vegetables (${customCrops.length})`}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="fd-modal-clear-all-custom-btn"
                          onClick={() => {
                            const confirmMsg = isFil
                              ? 'Sigurado ka bang nais mong alisin ang lahat ng mano-manong naidagdag na gulay?'
                              : 'Are you sure you want to delete all manually added vegetables?';
                            if (window.confirm(confirmMsg)) {
                              setCustomCrops([]);
                              try {
                                localStorage.removeItem('climayield_custom_crops');
                              } catch {}
                              toast.info(isFil ? '🗑️ Naalis na ang lahat ng mano-manong gulay.' : '🗑️ All manual vegetables removed.');
                            }
                          }}
                        >
                          🗑️ {isFil ? 'Alisin Lahat' : 'Delete All'}
                        </button>
                      </div>
                      <div className="fd-modal-custom-crop-list">
                        {customCrops.map((c) => (
                          <div key={c.id} className="fd-modal-custom-crop-row">
                            <div className="crop-meta">
                              <span className="crop-emoji">{c.icon}</span>
                              <div className="crop-text">
                                <span className="crop-title">
                                  {isFil ? (c.filipinoName || c.name) : (c.name || c.filipinoName)}
                                </span>
                                <span className="crop-sub">
                                  ⏱️ {isFil ? (c.daysToGrowFil || c.daysToGrowEn) : (c.daysToGrowEn || c.daysToGrowFil)} • 🌱 {isFil ? c.stageFil : c.stageEn}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="fd-modal-delete-item-btn"
                              onClick={() => handleDeleteCrop(c.id)}
                              title={isFil ? `Tanggalin ang ${c.filipinoName || c.name}` : `Delete ${c.name || c.filipinoName}`}
                            >
                              <span>🗑️</span>
                              <span>{isFil ? 'Tanggalin' : 'Delete'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preset Shortcuts */}
                  <div className="fd-form-group">
                    <label className="fd-form-label">
                      <span>⚡</span>
                      <span>{isFil ? 'Pumili sa Mabilis Anihin na Gulay (Tagalog):' : 'Select Short-Cycle Vegetable:'}</span>
                    </label>
                    <div className="fd-preset-chips">
                      {VEGETABLE_PRESETS.map((p, idx) => {
                        const isSelected = isFil
                          ? newCropForm.filipinoName.toLowerCase() === p.filipinoName.toLowerCase()
                          : newCropForm.name.toLowerCase() === p.name.toLowerCase();
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`fd-preset-chip ${isSelected ? 'selected' : ''}`}
                            onClick={() => handlePresetSelect(p)}
                          >
                            <span>{p.icon}</span>
                            <strong>{isFil ? p.filipinoName : p.name}</strong>
                            {p.name.toLowerCase() !== p.filipinoName.toLowerCase() && (
                              <span className="preset-english-sub">
                                ({isFil ? p.name : p.filipinoName})
                              </span>
                            )}
                            <span className="fd-preset-days-badge">{p.daysToGrow}d</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-time Animated Vegetable Image Preview in Add Modal */}
                  <div style={{
                    marginBottom: '14px',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    background: 'radial-gradient(circle at 50% 50%, #f0fdf4 0%, #ffffff 100%)',
                    border: '1.5px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <div style={{ width: '110px', height: '90px', flexShrink: 0 }}>
                      <AnimatedVegetableImage
                        crop={{ name: newCropForm.name, filipinoName: newCropForm.filipinoName, id: newCropForm.name.toLowerCase() }}
                        height={85}
                        showBadge={false}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#14532d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✨</span>
                        <span>{isFil ? 'Tunay na Larawan ng Gulay' : 'Actual Vegetable Preview'}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '3px' }}>
                        {isFil 
                          ? 'Awtomatikong ipinapakita ang tunay na larawan at animation ng napiling gulay.' 
                          : 'High-definition animated photo automatically updates as you select a vegetable.'}
                      </div>
                    </div>
                  </div>

                  {/* Icon Selector */}
                  <div className="fd-form-group">
                    <label className="fd-form-label">
                      <span>🎨</span>
                      <span>{isFil ? 'Icon / Simbolo ng Gulay:' : 'Vegetable Emoji Icon:'}</span>
                    </label>
                    <div className="fd-emoji-grid">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={`fd-emoji-btn ${newCropForm.icon === emoji ? 'active' : ''}`}
                          onClick={() => setNewCropForm({ ...newCropForm, icon: emoji })}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Names Row: English First when in English, Tagalog First when in Tagalog */}
                  <div className="fd-form-row">
                    {isFil ? (
                      <>
                        <div className="fd-form-group">
                          <label className="fd-form-label">
                            <span>🇵🇭</span>
                            <span>Pangalan ng Gulay sa Filipino / Tagalog: *</span>
                          </label>
                          <input
                            type="text"
                            required
                            list="tagalog-vegetables-list"
                            className="fd-form-input fd-tagalog-input"
                            placeholder="Hal. Pechay, Mustasa, Kangkong, Kamatis"
                            value={newCropForm.filipinoName}
                            onChange={(e) => handleFilipinoNameChange(e.target.value)}
                          />
                          <datalist id="tagalog-vegetables-list">
                            {Object.keys(TAGALOG_TO_ENGLISH_MAP).map((k) => (
                              <option key={k} value={k.charAt(0).toUpperCase() + k.slice(1)} />
                            ))}
                          </datalist>
                          <div className="fd-input-subtext">
                            👉 Pangunahing pangalan sa Tagalog
                          </div>
                        </div>

                        <div className="fd-form-group">
                          <label className="fd-form-label">
                            <span>🌐</span>
                            <span>Pangalan sa English (Awtomatiko):</span>
                          </label>
                          <input
                            type="text"
                            list="english-vegetables-list"
                            className="fd-form-input fd-english-input"
                            placeholder="Hal. Tomato, Eggplant, Mustard"
                            value={newCropForm.name}
                            onChange={(e) => handleEnglishNameChange(e.target.value)}
                          />
                          <datalist id="english-vegetables-list">
                            {Object.values(TAGALOG_TO_ENGLISH_MAP).map((entry, idx) => (
                              <option key={idx} value={entry.en} />
                            ))}
                          </datalist>
                          <div className="fd-input-subtext fd-auto-subtext">
                            ⚡ Kusang nag-a-update ayon sa Tagalog
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="fd-form-group">
                          <label className="fd-form-label">
                            <span>🌐</span>
                            <span>Vegetable Name (English): *</span>
                          </label>
                          <input
                            type="text"
                            required
                            list="english-vegetables-list"
                            className="fd-form-input fd-english-input"
                            placeholder="e.g. Tomato, Cucumber, Mustard Greens"
                            value={newCropForm.name}
                            onChange={(e) => handleEnglishNameChange(e.target.value)}
                          />
                          <datalist id="english-vegetables-list">
                            {Object.values(TAGALOG_TO_ENGLISH_MAP).map((entry, idx) => (
                              <option key={idx} value={entry.en} />
                            ))}
                          </datalist>
                          <div className="fd-input-subtext">
                            👉 Primary English name
                          </div>
                        </div>

                        <div className="fd-form-group">
                          <label className="fd-form-label">
                            <span>🇵🇭</span>
                            <span>Tagalog / Filipino Name (Auto-filled):</span>
                          </label>
                          <input
                            type="text"
                            list="tagalog-vegetables-list"
                            className="fd-form-input fd-tagalog-input"
                            placeholder="e.g. Kamatis, Pipino, Mustasa"
                            value={newCropForm.filipinoName}
                            onChange={(e) => handleFilipinoNameChange(e.target.value)}
                          />
                          <datalist id="tagalog-vegetables-list">
                            {Object.keys(TAGALOG_TO_ENGLISH_MAP).map((k) => (
                              <option key={k} value={k.charAt(0).toUpperCase() + k.slice(1)} />
                            ))}
                          </datalist>
                          <div className="fd-input-subtext fd-auto-subtext">
                            ⚡ Auto-updates from English
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Days to Grow - Auto calculated from Stage */}
                  <div className="fd-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="fd-form-label">
                        <span>⏱️</span>
                        <span>{isFil ? 'Araw ng Paglaki (Days to Grow):' : 'Days to Grow:'} *</span>
                      </label>
                      <span className="fd-auto-pill">
                        ⚡ {isFil ? 'Awtomatiko ayon sa Yugto' : 'Auto-calculated from Stage'}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      className="fd-form-input fd-days-input"
                      placeholder={isFil ? 'Hal. 5–7 araw' : 'e.g. 5–7 days'}
                      value={newCropForm.daysToGrow}
                      onChange={(e) => setNewCropForm({ ...newCropForm, daysToGrow: e.target.value })}
                    />
                    <div className="fd-input-subtext">
                      {isFil
                        ? '💡 Kusang nagbabago ang bilang ng araw kapag pinindot ang Yugto ng Paglaki sa ibaba'
                        : '💡 Automatically updates days whenever you click a Growth Stage below'}
                    </div>
                  </div>

                  {/* Plant Development Stage Selector */}
                  <div className="fd-form-group">
                    <label className="fd-form-label">
                      <span>🌱</span>
                      <span>{isFil ? 'Kasalukuyang Yugto ng Paglaki (Pindutin para mag-auto ang Araw):' : 'Current Plant Development Stage (Click to auto-set Days):'}</span>
                    </label>
                    <div className="fd-stage-selector">
                      {STAGE_STEPS.map((step) => {
                        const isActive = Number(newCropForm.stageStep) === step.num;
                        return (
                          <button
                            key={step.num}
                            type="button"
                            className={`fd-stage-btn ${isActive ? 'active' : ''}`}
                            onClick={() => handleStageSelect(step.num)}
                          >
                            <span className="stage-icon">{step.icon}</span>
                            <span className="stage-title">{isFil ? step.shortFil : step.shortEn}</span>
                            <span className="stage-num">P{step.num}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="fd-modal-footer">
                  <button
                    type="button"
                    className="fd-modal-btn reset"
                    onClick={() => {
                      setNewCropForm({
                        filipinoName: '',
                        name: '',
                        icon: '🥬',
                        daysToGrow: '',
                        stageStep: 1,
                        stageDesc: ''
                      });
                      toast.info(isFil ? 'Nalinis na ang form.' : 'Form cleared.');
                    }}
                    title={isFil ? 'Linisin ang nilagay sa form' : 'Clear form fields'}
                  >
                    <span>🗑️</span>
                    <span>{isFil ? 'Linisin ang Form' : 'Clear Form'}</span>
                  </button>
                  <button
                    type="button"
                    className="fd-modal-btn cancel"
                    onClick={() => setShowAddModal(false)}
                  >
                    {isFil ? 'Kanselahin' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="fd-modal-btn submit"
                  >
                    <span>💾</span>
                    <span>{isFil ? 'I-save ang Gulay' : 'Save Vegetable'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Full Interactive Vegetable Inspection & Agronomic Guide Modal */}
        {inspectingCrop && (
          <VegetableImageModal
            crop={inspectingCrop}
            isOpen={!!inspectingCrop}
            onClose={() => setInspectingCrop(null)}
            lang={lang}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 💻 2. DEVELOPER SIDE DASHBOARD: Exclusively Trained AI Models
  // =========================================================================
  const sarimaStatus = systemStatus?.trainingStatus?.sarima || 'Not Trained';
  const lstmStatus = systemStatus?.trainingStatus?.lstm || 'Not Trained';
  const hybridStatus = systemStatus?.trainingStatus?.hybrid || 'Not Trained';

  const isSarimaTrained = sarimaStatus === 'Trained';
  const isLstmTrained = lstmStatus === 'Trained';
  const isHybridTrained = hybridStatus === 'Trained';

  const totalTrainedCount = [isSarimaTrained, isLstmTrained, isHybridTrained].filter(Boolean).length;

  return (
    <div className="dev-dashboard">
      {/* Dev Hero Banner */}
      <div className="dev-hero-card">
        <div className="dev-hero-text">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DevHeroBadge gradient="cyan">
              <DevDashboardLogo size={24} isActive={false} />
            </DevHeroBadge>
            <span>Trained AI Models Dashboard</span>
          </h2>
          <p>
            Machine Learning & Deep Learning architectures powering ClimaYield-X short-cycle vegetable yield instability forecasting in Quezon City.
          </p>
        </div>

        <div className="dev-hero-actions">
          {onRefresh && (
            <button 
              className="dev-hero-btn secondary"
              onClick={onRefresh}
              title="Refresh models training status from backend"
            >
              🔄 Refresh Status
            </button>
          )}
          <button 
            className="dev-hero-btn primary"
            onClick={() => navigateTab('training')}
          >
            🤖 Open Model Training Pipeline →
          </button>
        </div>
      </div>

      {/* Trained AI Models Grid */}
      <div className="dev-models-grid">
        {/* Model 1: SARIMA */}
        <div className="dev-model-card card-sarima">
          <div>
            <div className="dev-model-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="dev-model-icon-box">
                  <DevSarimaIcon size={30} />
                </div>
                <div className="dev-model-title-box">
                  <h3>SARIMA Model</h3>
                  <div className="dev-model-type-tag">Statistical Time Series</div>
                </div>
              </div>
              <span className={`dev-status-badge ${isSarimaTrained ? 'status-trained' : 'status-not-trained'}`}>
                {isSarimaTrained ? '✅ Trained' : '⏳ Not Trained'}
              </span>
            </div>

            <p className="dev-model-desc">
              Seasonal Autoregressive Integrated Moving Average model designed to extract linear trends, seasonal precipitation oscillations, and periodic monsoon cycles.
            </p>

            <div className="dev-specs-list">
              <div className="dev-spec-item">
                <span className="dev-spec-key">Model Order (p, d, q):</span>
                <span className="dev-spec-val">(1, 1, 1)</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Seasonal Order (P, D, Q, s):</span>
                <span className="dev-spec-val">(1, 1, 1, 12)</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Primary Target:</span>
                <span className="dev-spec-val">Rainfall & Seasonal Cycles</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Estimation Method:</span>
                <span className="dev-spec-val">Max Likelihood (MLE)</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Pipeline Role:</span>
                <span className="dev-spec-val">Linear Seasonal Baseline</span>
              </div>
            </div>
          </div>

          <button 
            className={`dev-model-btn ${isSarimaTrained ? 'trained' : 'not-trained'}`}
            onClick={() => navigateTab('training')}
          >
            {isSarimaTrained ? '🔄 Retune SARIMA Model' : '⚡ Train SARIMA Model'}
          </button>
        </div>

        {/* Model 2: LSTM Neural Network */}
        <div className="dev-model-card card-lstm">
          <div>
            <div className="dev-model-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="dev-model-icon-box">
                  <DevLstmIcon size={30} />
                </div>
                <div className="dev-model-title-box">
                  <h3>LSTM Neural Network</h3>
                  <div className="dev-model-type-tag">Deep Learning (RNN)</div>
                </div>
              </div>
              <span className={`dev-status-badge ${isLstmTrained ? 'status-trained' : 'status-not-trained'}`}>
                {isLstmTrained ? '✅ Trained' : '⏳ Not Trained'}
              </span>
            </div>

            <p className="dev-model-desc">
              Long Short-Term Memory recurrent neural network capturing non-linear weather shocks, abrupt temperature extremes, humidity anomalies, and crop yield volatility.
            </p>

            <div className="dev-specs-list">
              <div className="dev-spec-item">
                <span className="dev-spec-key">Network Architecture:</span>
                <span className="dev-spec-val">LSTM (50 units) → Dense (1)</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Sequence Lookback:</span>
                <span className="dev-spec-val">15–30 Days Temporal Window</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Dropout Regularization:</span>
                <span className="dev-spec-val">0.20 (Anti-Overfitting)</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Optimizer & Loss:</span>
                <span className="dev-spec-val">Adam (lr=0.001) • MSE</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Pipeline Role:</span>
                <span className="dev-spec-val">Nonlinear Residual Learning</span>
              </div>
            </div>
          </div>

          <button 
            className={`dev-model-btn ${isLstmTrained ? 'trained' : 'not-trained'}`}
            onClick={() => navigateTab('training')}
          >
            {isLstmTrained ? '🔄 Retune LSTM Model' : '⚡ Train LSTM Model'}
          </button>
        </div>

        {/* Model 3: SARIMA–LSTM Hybrid */}
        <div className="dev-model-card card-hybrid">
          <div>
            <div className="dev-model-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="dev-model-icon-box">
                  <DevHybridIcon size={30} />
                </div>
                <div className="dev-model-title-box">
                  <h3>SARIMA–LSTM Hybrid</h3>
                  <div className="dev-model-type-tag">Ensemble Architecture</div>
                </div>
              </div>
              <span className={`dev-status-badge ${isHybridTrained ? 'status-trained' : 'status-not-trained'}`}>
                {isHybridTrained ? '✅ Trained' : '⏳ Not Trained'}
              </span>
            </div>

            <p className="dev-model-desc">
              Core production ensemble forecasting framework integrating SARIMA macro seasonal trend modeling with LSTM micro-climate non-linear residual error compensation.
            </p>

            <div className="dev-specs-list">
              <div className="dev-spec-item">
                <span className="dev-spec-key">Decomposition Equation:</span>
                <span className="dev-spec-val">Ŷ(t) = L(t) + N(t)</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Residual Coupling:</span>
                <span className="dev-spec-val">LSTM on SARIMA Error (e_t)</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Supported Crops:</span>
                <span className="dev-spec-val">6 Short-Cycle Vegetables</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Performance Benefit:</span>
                <span className="dev-spec-val">~28.4% MAPE Error Reduction</span>
              </div>
              <div className="dev-spec-item">
                <span className="dev-spec-key">Pipeline Role:</span>
                <span className="dev-spec-val">Production Forecasting Engine</span>
              </div>
            </div>
          </div>

          <button 
            className={`dev-model-btn ${isHybridTrained ? 'trained' : 'not-trained'}`}
            onClick={() => navigateTab('training')}
          >
            {isHybridTrained ? '🔄 Retune Hybrid Model' : '⚡ Train Hybrid Model'}
          </button>
        </div>
      </div>

      {/* Model Technical Architecture & Comparison Matrix */}
      <div className="dev-matrix-card">
        <h3>
          <span>📐</span>
          <span>Trained AI Models Technical Architecture Matrix</span>
        </h3>
        <p className="dev-matrix-sub">
          Cross-model comparative specifications and operational roles for short-cycle crop yield forecasting.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="dev-matrix-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Category</th>
                <th>Core Modeling Role</th>
                <th>Seasonality Handling</th>
                <th>Non-Linear Sensitivity</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>📈 SARIMA</strong>
                </td>
                <td>Statistical Time Series</td>
                <td>Captures recurring seasonal baseline & rainfall trends</td>
                <td><span style={{ color: '#16a34a', fontWeight: 600 }}>High (Parametric)</span></td>
                <td><span style={{ color: '#64748b' }}>Low (Linear Only)</span></td>
                <td>
                  <span className={`dev-status-badge ${isSarimaTrained ? 'status-trained' : 'status-not-trained'}`}>
                    {isSarimaTrained ? '✅ Trained' : '⏳ Not Trained'}
                  </span>
                </td>
                <td>
                  <button 
                    className="dev-hero-btn secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ffffff', borderColor: '#38bdf8' }}
                    onClick={() => navigateTab('training')}
                  >
                    Configure
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>🧠 LSTM</strong>
                </td>
                <td>Deep Neural Network (RNN)</td>
                <td>Learns non-linear climate volatility & temperature shocks</td>
                <td><span style={{ color: '#0284c7', fontWeight: 600 }}>Learned (Temporal)</span></td>
                <td><span style={{ color: '#16a34a', fontWeight: 600 }}>High (Deep Gated)</span></td>
                <td>
                  <span className={`dev-status-badge ${isLstmTrained ? 'status-trained' : 'status-not-trained'}`}>
                    {isLstmTrained ? '✅ Trained' : '⏳ Not Trained'}
                  </span>
                </td>
                <td>
                  <button 
                    className="dev-hero-btn secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ffffff', borderColor: '#38bdf8' }}
                    onClick={() => navigateTab('training')}
                  >
                    Configure
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>🔀 SARIMA–LSTM Hybrid</strong>
                </td>
                <td>Dual-Engine Ensemble</td>
                <td>Synergizes linear macro seasonal baseline with non-linear error correction</td>
                <td><span style={{ color: '#16a34a', fontWeight: 600 }}>Optimal (Hybrid)</span></td>
                <td><span style={{ color: '#16a34a', fontWeight: 600 }}>Optimal (Residual Net)</span></td>
                <td>
                  <span className={`dev-status-badge ${isHybridTrained ? 'status-trained' : 'status-not-trained'}`}>
                    {isHybridTrained ? '✅ Trained' : '⏳ Not Trained'}
                  </span>
                </td>
                <td>
                  <button 
                    className="dev-hero-btn primary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => navigateTab('training')}
                  >
                    Train Pipeline
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dataset Readiness Note */}
        <div style={{
          marginTop: '20px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: systemStatus?.datasetLoaded ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          border: `1.5px solid ${systemStatus?.datasetLoaded ? 'rgba(52, 211, 153, 0.45)' : 'rgba(251, 191, 36, 0.45)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.88rem'
        }}>
          <div>
            <strong style={{ color: systemStatus?.datasetLoaded ? '#34d399' : '#fbbf24', fontSize: '0.92rem' }}>
              {systemStatus?.datasetLoaded ? '📁 Dataset Status: Ready' : '⚠️ Dataset Status: Not Loaded'}
            </strong>
            <span style={{ marginLeft: '10px', color: '#cbd5e1', lineHeight: '1.45' }}>
              {systemStatus?.datasetLoaded 
                ? `Active training dataset loaded (${systemStatus?.datasetShape?.rows || 0} historical records available for model fitting). Fleet status: ${totalTrainedCount}/3 models trained.`
                : 'Upload or import training data before fitting SARIMA and LSTM models.'}
            </span>
          </div>
          {!systemStatus?.datasetLoaded && (
            <button 
              className="dev-hero-btn secondary"
              style={{ padding: '7px 16px', fontSize: '0.82rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.6)' }}
              onClick={() => navigateTab('data')}
            >
              Go to Data Management →
            </button>
          )}
        </div>

        {/* Model Results Ready Banner */}
        {totalTrainedCount > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '18px 22px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(139, 92, 246, 0.14) 100%)',
            border: '1.5px solid rgba(6, 182, 212, 0.45)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DevDashboardLogo size={22} isActive={false} />
                <span>AI Training Results Dashboard Ready ({totalTrainedCount}/3 Models Evaluated)</span>
              </div>
              <div style={{ fontSize: '0.86rem', color: '#94a3b8', marginTop: '4px' }}>
                SARIMA Hyperparameter AIC Search and Model Registry Benchmark tables are calibrated with SARIMA-LSTM Hybrid Model evaluations.
              </div>
            </div>
            <button
              className="dev-hero-btn primary"
              style={{ padding: '9px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => navigateTab('training')}
            >
              <span>📈</span> View Result Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;