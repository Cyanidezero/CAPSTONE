import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  getSavedDatasetCrops, 
  clearDatasetCrops, 
  isInvalidVegetableToken, 
  STANDARD_PHILIPPINE_VEGETABLES, 
  sanitizeDatasetCrops,
  KNOWN_VEGETABLES,
  parseTotalDays
} from '../utils/cropDatasetParser';
import './Prediction.css';

// Short-cycle vegetable crop definitions tailored for Quezon City urban farming
const CROP_PREDICTIONS_DATA = [
  {
    id: 'tomato',
    name: 'Tomato',
    filipinoName: 'Kamatis',
    icon: '🍅',
    variety: 'Diamante Max / Improved F1',
    riskLevel: 'Low Risk',
    riskClass: 'risk-stable',
    suitabilityScore: '94%',
    qualityGrade: 'Grade A Premium',
    forecastDriver: 'Optimal solar radiation and moderate rainfall favor fruit firmness and reduce cracking risks.'
  },
  {
    id: 'eggplant',
    name: 'Eggplant',
    filipinoName: 'Talong',
    icon: '🍆',
    variety: 'Dumaguete Long Purple / Morena',
    riskLevel: 'Low Risk',
    riskClass: 'risk-stable',
    suitabilityScore: '92%',
    qualityGrade: 'Grade A Firm',
    forecastDriver: 'Nighttime temperatures (24°C) preserve flower buds and support healthy calyx elongation.'
  },
  {
    id: 'pechay',
    name: 'Pechay',
    filipinoName: 'Pechay',
    icon: '🥬',
    variety: 'Black Behi / Pavito',
    riskLevel: 'Low Risk',
    riskClass: 'risk-stable',
    suitabilityScore: '89%',
    qualityGrade: 'Crisp Market Grade',
    forecastDriver: 'High relative humidity stimulates tender leaf growth; watch for drainage to avoid bacterial soft rot.'
  },
  {
    id: 'bellpepper',
    name: 'Bell Pepper & Chili',
    filipinoName: 'Sili at Paminta',
    icon: '🌶️',
    variety: 'Django F1 / Red Wonder',
    riskLevel: 'Low Risk',
    riskClass: 'risk-stable',
    suitabilityScore: '93%',
    qualityGrade: 'Grade A Thick-Walled',
    forecastDriver: 'Steady daytime temperature gradient prevents flower shedding and improves fruit crispness.'
  },
  {
    id: 'mustard',
    name: 'Mustard Greens',
    filipinoName: 'Mustasa',
    icon: '🌱',
    variety: 'Monteverde / Early Green',
    riskLevel: 'Low Risk',
    riskClass: 'risk-stable',
    suitabilityScore: '91%',
    qualityGrade: 'Tender Premium Grade',
    forecastDriver: 'Favorable morning humidity accelerates petiole crispness and broad leaf development.'
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    filipinoName: 'Pipino',
    icon: '🥒',
    variety: 'Gov. F1 / Poinsett 76',
    riskLevel: 'Low Risk',
    riskClass: 'risk-stable',
    suitabilityScore: '95%',
    qualityGrade: 'Grade A Straight Fruit',
    forecastDriver: 'Ample root hydration from light afternoon rain promotes continuous cucumber elongation.'
  }
];

// 5-Stage Growth Cycles for Short-Cycle Vegetables
const CROP_STAGES_CONFIG = {
  tomato: {
    totalDays: 65,
    defaultDay: 30, // User example: "for example its 30 days"
    stages: [
      {
        num: 1,
        id: 'seedling',
        icon: '🌱',
        minDay: 1,
        maxDay: 10,
        shortEn: 'Seedling',
        shortFil: 'Punla',
        titleEn: 'Seedling Emergence & Sprouting',
        titleFil: 'Pagpupunla at Pagsibol',
        descEn: 'Seeds germinate and tender green sprouts emerge with initial cotyledons.',
        descFil: 'Pagsibol ng buto at paglabas ng unang berdeng dahon mula sa nursery tray.',
        careEn: 'Keep seedbed moist with fine mist; place in partial sun for 4–6 hours daily.',
        careFil: 'Panatilihing mamasa-masa ang punlaan; ilagay sa katamtamang sikat ng araw.'
      },
      {
        num: 2,
        id: 'vegetative',
        icon: '🌿',
        minDay: 11,
        maxDay: 25,
        shortEn: 'Vegetative',
        shortFil: 'Paglaki',
        titleEn: 'Vegetative Stalk & Leaf Growth',
        titleFil: 'Paglaki ng Dahon at Tangkay',
        descEn: 'Vigorous leaf growth and stem thickening. Sturdy root system establishes deeply.',
        descFil: 'Mabilis na pagdami ng dahon at pagkapal ng tangkay; lumalakas ang ugat sa lupa.',
        careEn: 'Install bamboo stakes early; side-dress with organic nitrogen compost.',
        careFil: 'Maglagay ng tukod na kawayan; mag-abono ng organikong pataba para lumakas ang tangkay.'
      },
      {
        num: 3,
        id: 'flowering',
        icon: '🌸',
        minDay: 26,
        maxDay: 40,
        shortEn: 'Flowering',
        shortFil: 'Bulaklak',
        titleEn: 'Flowering & Early Fruit Set',
        titleFil: 'Pamumulaklak at Pagsisimula ng Bunga',
        descEn: 'Bright yellow blossoms open; pollination occurs to begin setting young green fruits.',
        descFil: 'Bumabuka ang mga dilaw na bulaklak; nagsisimulang mabuo ang maliliit na berdeng kamatis.',
        careEn: 'Avoid overhead sprinkler watering that could knock blossoms; water at soil level.',
        careFil: 'Iwasang basain ang bulaklak kapag nagdidilig; diligin lamang ang lupa sa puno.'
      },
      {
        num: 4,
        id: 'fruiting',
        icon: '🍅',
        minDay: 41,
        maxDay: 55,
        shortEn: 'Fruiting',
        shortFil: 'Bunga',
        titleEn: 'Fruit Development & Sizing',
        titleFil: 'Paglaki at Pagtigas ng Bunga',
        descEn: 'Green fruits expand rapidly in diameter and weight; skin thickens and firms.',
        descFil: 'Mabilis na lumalaki at tumitigas ang mga berdeng kamatis; kumakapal ang balat.',
        careEn: 'Provide steady, even watering to avoid blossom-end rot and fruit cracking.',
        careFil: 'Pantay-pantay na pagdilig upang maiwasan ang pagputok ng balat ng kamatis.'
      },
      {
        num: 5,
        id: 'harvest',
        icon: '🧺',
        minDay: 56,
        maxDay: 65,
        shortEn: 'Harvest',
        shortFil: 'Pag-ani',
        titleEn: 'Color Break & Ready for Harvest',
        titleFil: 'Pamumula at Handa nang Anihin',
        descEn: 'Tomatoes turn vibrant glossy red. Firm texture with optimal sweet-tart flavor.',
        descFil: 'Namumula na ang mga kamatis; matigas, sariwa, at handang-handa nang pitasin.',
        careEn: 'Harvest in the early cool morning with calyx intact for longest fresh shelf life.',
        careFil: 'Pitasin sa maagang umaga kasama ang tangkay upang manatiling sariwa.'
      }
    ]
  },
  eggplant: {
    totalDays: 70,
    defaultDay: 30,
    stages: [
      {
        num: 1,
        id: 'seedling',
        icon: '🌱',
        minDay: 1,
        maxDay: 12,
        shortEn: 'Seedling',
        shortFil: 'Punla',
        titleEn: 'Seedling Emergence',
        titleFil: 'Pagpupunla at Pagsibol',
        descEn: 'True leaves expand in seed trays; taproot anchors firmly into seedling mix.',
        descFil: 'Paglabas ng unang punla at pagtigas ng maliit na tangkay sa punlaan.',
        careEn: 'Protect from heavy rain downpours and strong scorching noon sun.',
        careFil: 'Protektahan sa malalakas na ulan at sobrang init sa tanghali.'
      },
      {
        num: 2,
        id: 'vegetative',
        icon: '🌿',
        minDay: 13,
        maxDay: 30,
        shortEn: 'Vegetative',
        shortFil: 'Paglaki',
        titleEn: 'Vegetative & Stalk Growth',
        titleFil: 'Paglaki ng Dahon at Tangkay',
        descEn: 'Main stalk grows thick and woody; large broad velvety green-purple leaves form.',
        descFil: 'Tumatatag ang makapal na tangkay at lumalapad ang mga berde-lilang dahon.',
        careEn: 'Hill up soil around base; apply balanced compost to stimulate branching.',
        careFil: 'Tambakan ng lupa ang puno at maglagay ng organikong pataba.'
      },
      {
        num: 3,
        id: 'flowering',
        icon: '🌸',
        minDay: 31,
        maxDay: 45,
        shortEn: 'Flowering',
        shortFil: 'Bulaklak',
        titleEn: 'Flowering & Budding',
        titleFil: 'Pamumulaklak at Pagsisimula ng Bunga',
        descEn: 'Star-shaped violet blossoms open at leaf nodes; calyx begins expanding.',
        descFil: 'Bumabuka ang magagandang lilang bulaklak sa mga sanga ng talong.',
        careEn: 'Inspect for flea beetles and shoot borers; maintain soil moisture.',
        careFil: 'Bantayan ang mga insekto tulad ng borer; panatilihing mamasa-masa ang lupa.'
      },
      {
        num: 4,
        id: 'fruiting',
        icon: '🍆',
        minDay: 46,
        maxDay: 60,
        shortEn: 'Fruiting',
        shortFil: 'Bunga',
        titleEn: 'Fruit Elongation & Sizing',
        titleFil: 'Paghaba at Paglaki ng Bunga',
        descEn: 'Eggplants elongate rapidly and take on rich glossy purple pigmentation.',
        descFil: 'Humahaba at kumikintab ang kulay lilang bunga ng talong.',
        careEn: 'Ensure fruits do not touch damp garden soil directly; deep watering once a week.',
        careFil: 'Siguraduhing hindi sumasayad sa basang lupa ang mga bunga.'
      },
      {
        num: 5,
        id: 'harvest',
        icon: '🧺',
        minDay: 61,
        maxDay: 70,
        shortEn: 'Harvest',
        shortFil: 'Pag-ani',
        titleEn: 'Glossy Firm Harvest Window',
        titleFil: 'Makintab at Handa nang Anihin',
        descEn: 'Skin is glossy and yields slightly to thumb pressure; calyx is bright green.',
        descFil: 'Makintab, matigas, at sariwa ang balat; handang-handa nang anihin.',
        careEn: 'Cut with pruning shears leaving 2cm of stem; harvest before skin turns dull.',
        careFil: 'Gumamit ng gunting sa pag-ani at mag-iwan ng kaunting tangkay.'
      }
    ]
  },
  pechay: {
    totalDays: 30,
    defaultDay: 20,
    stages: [
      {
        num: 1,
        id: 'seedling',
        icon: '🌱',
        minDay: 1,
        maxDay: 5,
        shortEn: 'Sprouting',
        shortFil: 'Pagsibol',
        titleEn: 'Germination & Sprouting',
        titleFil: 'Pagsibol ng Buto',
        descEn: 'Rapid germination within 2–4 days; tiny rounded cotyledons appear.',
        descFil: 'Mabilis na sumisibol ang maliliit na buto pagkalipas ng 2–4 araw.',
        careEn: 'Light morning misting; keep in shaded spot until seedlings stand erect.',
        careFil: 'Bahagyang dilig sa umaga; ilagay sa malilim na bahagi sa unang mga araw.'
      },
      {
        num: 2,
        id: 'vegetative',
        icon: '🌿',
        minDay: 6,
        maxDay: 12,
        shortEn: 'Seedling',
        shortFil: 'Punla',
        titleEn: 'Seedling Establishment',
        titleFil: 'Paglaki ng Punla',
        descEn: 'First true spoon-shaped leaves unfold with crisp tender white petioles.',
        descFil: 'Bumubuka ang mga unang dahon na may mapuputing malulutong na tangkay.',
        careEn: 'Thin crowded plants to 15cm spacing to give rosettes room to expand.',
        careFil: 'Magbawas ng punla (thinning) upang magkaroon ng 15cm na agwat bawat isa.'
      },
      {
        num: 3,
        id: 'flowering',
        icon: '🥬',
        minDay: 13,
        maxDay: 20,
        shortEn: 'Leaf Growth',
        shortFil: 'Paglaki',
        titleEn: 'Rapid Leaf Expansion',
        titleFil: 'Mabilis na Paglaki ng Dahon',
        descEn: 'Broad succulent green leaves expand rapidly; plant forms a dense upright cluster.',
        descFil: 'Mabilis na lumalapad ang mga sariwang berdeng dahon at kumakapal ang kumpol.',
        careEn: 'Ensure consistent daily morning watering; apply organic foliar fertilizer.',
        careFil: 'Diligin sa umaga at lagyan ng organikong pataba upang lumutong ang dahon.'
      },
      {
        num: 4,
        id: 'fruiting',
        icon: '🥗',
        minDay: 21,
        maxDay: 25,
        shortEn: 'Rosette',
        shortFil: 'Kumpol',
        titleEn: 'Rosette Maturation',
        titleFil: 'Pagkapal ng Kumpol ng Dahon',
        descEn: 'Thick, crisp, juicy petioles near full commercial size and market weight.',
        descFil: 'Kumakapal at lumulutong ang mga tangkay; papalapit na sa saktong timbang.',
        careEn: 'Check for cabbage worms; ensure good raised bed drainage.',
        careFil: 'Bantayan ang uod sa dahon; tiyaking maganda ang daloy ng tubig sa kama.'
      },
      {
        num: 5,
        id: 'harvest',
        icon: '🧺',
        minDay: 26,
        maxDay: 30,
        shortEn: 'Harvest',
        shortFil: 'Pag-ani',
        titleEn: 'Crisp Market Ready',
        titleFil: 'Sariwa at Handa nang Anihin',
        descEn: 'Full mature rosette with sweet, crisp, tender dark green leaves.',
        descFil: 'Buo, mabigat, at napakasariwa ng kumpol; handang-handa nang anihin.',
        careEn: 'Cut at soil base or pull whole plant in early morning for max crispness.',
        careFil: 'Putulin sa may ugat o bunutin nang buo sa maagang umaga para malutong.'
      }
    ]
  },
  bellpepper: {
    totalDays: 65,
    defaultDay: 30,
    stages: [
      {
        num: 1,
        id: 'seedling',
        icon: '🌱',
        minDay: 1,
        maxDay: 12,
        shortEn: 'Seedling',
        shortFil: 'Punla',
        titleEn: 'Seedling & Rooting',
        titleFil: 'Pagpupunla at Pag-ugat',
        descEn: 'Slow steady seedling emergence; forms taproot and initial glossy foliage.',
        descFil: 'Dahan-dahang pagsibol at pagbuo ng ugat sa malambot na lupa.',
        careEn: 'Maintain warm soil (25–28°C); avoid soggy waterlogged soil.',
        careFil: 'Panatilihing maligamgam ang lupa at iwasan ang labis na tubig.'
      },
      {
        num: 2,
        id: 'vegetative',
        icon: '🌿',
        minDay: 13,
        maxDay: 28,
        shortEn: 'Bushing',
        shortFil: 'Pagsasanga',
        titleEn: 'Vegetative Bushing',
        titleFil: 'Pagsasanga ng Halaman',
        descEn: 'Forms a bushy, compact canopy with dense dark green foliage.',
        descFil: 'Mabilis na sumasanga ang halaman at kumakapal ang berdeng dahon.',
        careEn: 'Mulch around base to conserve soil moisture; stake heavy branches.',
        careFil: 'Lagyan ng dayami o mulch sa puno upang hindi agad matuyo ang lupa.'
      },
      {
        num: 3,
        id: 'flowering',
        icon: '🌸',
        minDay: 29,
        maxDay: 42,
        shortEn: 'Flowering',
        shortFil: 'Bulaklak',
        titleEn: 'Flowering & Pod Setting',
        titleFil: 'Pamumulaklak at Pag-usbong ng Sili',
        descEn: 'Small white bell blossoms form at branch nodes; tiny glossy pods set.',
        descFil: 'Namumulaklak ng puti at lumalabas ang unang maliliit na bunga ng sili.',
        careEn: 'Even irrigation; extreme heat above 32°C causes bloom drops.',
        careFil: 'Panatilihing katamtaman ang init at tubig para hindi malaglag ang bulaklak.'
      },
      {
        num: 4,
        id: 'fruiting',
        icon: '🌶️',
        minDay: 43,
        maxDay: 55,
        shortEn: 'Fruiting',
        shortFil: 'Bunga',
        titleEn: 'Pod Sizing & Thickening',
        titleFil: 'Paglaki at Pagkapal ng Bunga',
        descEn: 'Peppers expand to full length and develop thick, firm, crunchy walls.',
        descFil: 'Lumalaki at kumakapal ang laman ng sili; tumitigas at kumikintab.',
        careEn: 'Support fruiting branches with twine; maintain adequate potassium.',
        careFil: 'Tukuran ang mabibigat na sanga para hindi mabali sa bigat ng bunga.'
      },
      {
        num: 5,
        id: 'harvest',
        icon: '🧺',
        minDay: 56,
        maxDay: 65,
        shortEn: 'Harvest',
        shortFil: 'Pag-ani',
        titleEn: 'Glossy Harvest Window',
        titleFil: 'Makintab at Handa nang Anihin',
        descEn: 'Pods reach deep vibrant color break (green to red). Firm and crisp.',
        descFil: 'Ganap nang buo ang kulay at anghang/lutong; handa nang pitasin.',
        careEn: 'Clip stems with shears rather than pulling to prevent branch tearing.',
        careFil: 'Gumamit ng gunting sa pamimitas upang hindi masira ang sanga.'
      }
    ]
  },
  mustard: {
    totalDays: 30,
    defaultDay: 20,
    stages: [
      {
        num: 1,
        id: 'seedling',
        icon: '🌱',
        minDay: 1,
        maxDay: 5,
        shortEn: 'Sprouting',
        shortFil: 'Pagsibol',
        titleEn: 'Sprouting & Germination',
        titleFil: 'Pagsibol ng Buto',
        descEn: 'Rapid germination within 3 days; bright green sprouts emerge quickly.',
        descFil: 'Napakabilis sumibol sa loob ng 2–3 araw ang mga buto ng mustasa.',
        careEn: 'Keep soil moist; protect emerging seedlings from birds and insects.',
        careFil: 'Panatilihing basa ang lupa; takpan laban sa mga ibon at insekto.'
      },
      {
        num: 2,
        id: 'vegetative',
        icon: '🌿',
        minDay: 6,
        maxDay: 12,
        shortEn: 'Seedling',
        shortFil: 'Punla',
        titleEn: 'Seedling Growth',
        titleFil: 'Paglaki ng Punla',
        descEn: 'Serrated pungent young leaves develop along tender green stalks.',
        descFil: 'Lumalabas ang mga may-ngiping dahon na may katamtamang anghang.',
        careEn: 'Thin rows to 10cm apart; light cultivation to aerate soil.',
        careFil: 'Ayusin ang agwat ng mga tanim sa 10cm para hindi magkasiksikan.'
      },
      {
        num: 3,
        id: 'flowering',
        icon: '🥬',
        minDay: 13,
        maxDay: 20,
        shortEn: 'Foliage',
        shortFil: 'Dahon',
        titleEn: 'Foliage Development',
        titleFil: 'Paglaki ng Malalapad na Dahon',
        descEn: 'Broad, wavy, crisp leaves expand rapidly with characteristic peppery aroma.',
        descFil: 'Mabilis na lumalapad ang mga malulutong na dahon ng mustasa.',
        careEn: 'Water frequently during hot spells to delay premature bolting.',
        careFil: 'Diligin kapag mainit upang hindi maagang mamulaklak (bolting).'
      },
      {
        num: 4,
        id: 'fruiting',
        icon: '🥗',
        minDay: 21,
        maxDay: 25,
        shortEn: 'Rosette',
        shortFil: 'Kumpol',
        titleEn: 'Rosette Maturation',
        titleFil: 'Paglutong ng mga Dahon',
        descEn: 'Thick succulent foliage clustered in dense upright rosettes.',
        descFil: 'Kumakapal ang kumpol ng mustasa; malutong at masarap anihin.',
        careEn: 'Check undersides of leaves for aphids; maintain rich organic mulch.',
        careFil: 'Tingnan ang ilalim ng dahon laban sa peste; maglagay ng mulch.'
      },
      {
        num: 5,
        id: 'harvest',
        icon: '🧺',
        minDay: 26,
        maxDay: 30,
        shortEn: 'Harvest',
        shortFil: 'Pag-ani',
        titleEn: 'Tender Morning Harvest',
        titleFil: 'Handa nang Anihin',
        descEn: 'Crisp, pungent leaves at peak tenderness before flower stalks form.',
        descFil: 'Napakalutong at sariwang dahon; anihin bago maglabas ng bulaklak.',
        careEn: 'Harvest entire head or cut outer leaves for continuous yield.',
        careFil: 'Putulin ang buong puno o pitasin ang panlabas na mga dahon.'
      }
    ]
  },
  cucumber: {
    totalDays: 50,
    defaultDay: 30,
    stages: [
      {
        num: 1,
        id: 'seedling',
        icon: '🌱',
        minDay: 1,
        maxDay: 7,
        shortEn: 'Sprouting',
        shortFil: 'Pagsibol',
        titleEn: 'Sprouting & Emergence',
        titleFil: 'Pagsibol sa Lupa',
        descEn: 'Broad seed leaves push up through warm soil within 4–6 days.',
        descFil: 'Sumisibol ang malalapad na unang dahon pagkalipas ng 4–6 araw.',
        careEn: 'Ensure warm soil (22–30°C); avoid overwatering before emergence.',
        careFil: 'Iwasan ang sobrang dilig habang hindi pa ganap na sumisibol.'
      },
      {
        num: 2,
        id: 'vegetative',
        icon: '🌿',
        minDay: 8,
        maxDay: 18,
        shortEn: 'Vines',
        shortFil: 'Balag',
        titleEn: 'Vine Extension & Trellising',
        titleFil: 'Pag-gapang sa Balag',
        descEn: 'Tendrils reach out and climb trellises rapidly; main runner lengthens.',
        descFil: 'Mabilis na gumagapang at kumakapit ang mga baging sa balag.',
        careEn: 'Train vines gently onto vertical trellis strings to improve airflow.',
        careFil: 'Gabayan ang mga baging sa balag upang maganda ang daloy ng hangin.'
      },
      {
        num: 3,
        id: 'flowering',
        icon: '🌸',
        minDay: 19,
        maxDay: 30,
        shortEn: 'Flowering',
        shortFil: 'Bulaklak',
        titleEn: 'Flowering & Blossom Setting',
        titleFil: 'Pamumulaklak at Pagsisimula ng Pipino',
        descEn: 'Bright yellow male and female flowers bloom; bees pollinate female ovaries.',
        descFil: 'Bumabuka ang dilaw na bulaklak at may maliit nang pipino sa ilalim.',
        careEn: 'Do not spray pesticides during morning bloom when pollinators visit.',
        careFil: 'Huwag mag-spray sa umaga habang bumibisita ang mga bubuyog sa bulaklak.'
      },
      {
        num: 4,
        id: 'fruiting',
        icon: '🥒',
        minDay: 31,
        maxDay: 42,
        shortEn: 'Fruiting',
        shortFil: 'Bunga',
        titleEn: 'Rapid Fruit Elongation',
        titleFil: 'Mabilis na Paghaba ng Pipino',
        descEn: 'Cucumbers elongate rapidly (1–2 inches daily); skin darkens to deep green.',
        descFil: 'Napakabilis humaba ng pipino araw-araw; nagiging matingkad na berde.',
        careEn: 'Daily deep irrigation; inconsistent watering causes bitter, curved fruit.',
        careFil: 'Diligin araw-araw nang maayos upang hindi pumait o mabali ang pipino.'
      },
      {
        num: 5,
        id: 'harvest',
        icon: '🧺',
        minDay: 43,
        maxDay: 50,
        shortEn: 'Harvest',
        shortFil: 'Pag-ani',
        titleEn: 'Crisp Straight Harvest Ready',
        titleFil: 'Tuwid, Malutong, Handa nang Anihin',
        descEn: 'Fruits are 15–20cm long, firm, dark green, and crisp with tender seeds.',
        descFil: 'Tuwid, 15–20cm ang haba, malutong at napakasariwa; pitasin na!',
        careEn: 'Harvest every 2 days to encourage vines to continue setting new cucumbers.',
        careFil: 'Pitasin tuwing 2 araw upang magtuloy-tuloy ang pamumunga ng balag.'
      }
    ]
  }
};

const QUALITY_FILIPINO = {
  'Grade A Premium': 'Magandang Klase (Grade A)',
  'Grade A Firm': 'Sariwa at Matigas (Grade A)',
  'Crisp Market Grade': 'Malutong at Pambenta',
  'Grade A Thick-Walled': 'Makapal ang Laman (Grade A)',
  'Tender Premium Grade': 'Sariwa at Malambot',
  'Grade A Straight Fruit': 'Tuwid at Maganda (Grade A)'
};

const DRIVER_FILIPINO = {
  tomato: 'Maganda ang sikat ng araw at ulan para tumigas ang bunga at hindi pumutok.',
  eggplant: 'Maganda ang lamig sa gabi (24°C) para hindi malaglag ang bulaklak at maging maganda ang bunga.',
  pechay: 'Mataas ang moisture sa hangin kaya mabilis lumaki ang dahon; ingatan ang kanal para hindi mabulok.',
  bellpepper: 'Tamang init sa araw ang pumipigil sa pagkalagas ng bulaklak at nagpapaganda sa kulay ng sili.',
  mustard: 'Ang hamog sa umaga ay nagpapadali sa paglaki at paglutong ng mga dahon.',
  cucumber: 'Ang katamtamang basa sa lupa dahil sa ambon ay tumutulong sa tuloy-tuloy na paghaba ng pipino.'
};

// Maps dataset crop ids (from cropDatasetParser) to the detailed built-in crop profiles above
const DATASET_TO_PRESET_ID = {
  tomato: 'tomato',
  eggplant: 'eggplant',
  pechay: 'pechay',
  mustasa: 'mustard',
  mustard: 'mustard',
  cucumber: 'cucumber',
  bell_pepper: 'bellpepper',
  bellpepper: 'bellpepper',
  kamatis: 'tomato',
  talong: 'eggplant',
  petsay: 'pechay',
  sili: 'bellpepper',
  pipino: 'cucumber',
  pepper: 'bellpepper',
  chili: 'bellpepper'
};

// Generate a tailored 5-stage growth cycle for crops based on crop profile and category
const buildGenericStagesConfig = (totalDays, cropIcon = '🌱', cropProfile = {}) => {
  const b1 = Math.max(1, Math.round(totalDays * 0.18));
  const b2 = Math.max(b1 + 1, Math.round(totalDays * 0.42));
  const b3 = Math.max(b2 + 1, Math.round(totalDays * 0.65));
  const b4 = Math.max(b3 + 1, Math.round(totalDays * 0.85));
  const ranges = [[1, b1], [b1 + 1, b2], [b2 + 1, b3], [b3 + 1, b4], [b4 + 1, totalDays]];

  const cropName = (cropProfile.name || cropProfile.id || '').toLowerCase();
  const isLeafy = /alugbati|pechay|mustas|kangkong|lettuce|cabbage|spinach|basil|chive|coriander|wansoy|kintsay|celery|saluyot|kulitis|talinum|watercress|petsay|bokchoy/.test(cropName);
  const isRoot = /carrot|radish|beet|singkamas|turnip|labanos|karot/.test(cropName);

  let base;
  if (isLeafy) {
    base = [
      { id: 'seedling', icon: '🌱', shortEn: 'Seedling', shortFil: 'Punla', titleEn: 'Seedling Emergence', titleFil: 'Pagpupunla at Pagsibol', descEn: 'Seeds germinate and tender young shoots emerge with vigorous first leaves.', descFil: 'Sumisibol ang buto at nagkakaroon ng unang ugat at dahon ang punla.', careEn: 'Keep soil evenly moist and protect tender shoots from harsh afternoon heat.', careFil: 'Panatilihing mamasa-masa ang lupa at protektahan sa malakas na init.' },
      { id: 'vegetative', icon: '🌿', shortEn: 'Vegetative', shortFil: 'Paglaki', titleEn: 'Vegetative Shoot Growth', titleFil: 'Paglaki ng Dahon at Tangkay', descEn: 'Rapid leaf proliferation and strong stem development as root system establishes.', descFil: 'Mabilis na pagdami ng dahon at pagkapal ng tangkay.', careEn: 'Apply rich organic compost or nitrogen-rich mulch for luxuriant foliage.', careFil: 'Maglagay ng organikong pataba para sa malalapad na dahon.' },
      { id: 'foliage', icon: '🥬', shortEn: 'Canopy', shortFil: 'Paglapad', titleEn: 'Foliage & Canopy Expansion', titleFil: 'Paglapad at Pagkapal ng mga Dahon', descEn: 'Broad, crisp, succulent edible leaves expand rapidly with lush deep green color.', descFil: 'Mabilis na lumalapad at kumakapal ang mga malulutong na dahon.', careEn: 'Water in the cool morning; ensure good drainage to prevent bacterial soft rot.', careFil: 'Diligin sa umaga at panatilihing maayos ang daloy ng tubig.' },
      { id: 'maturing', icon: cropIcon, shortEn: 'Maturing', shortFil: 'Paglutong', titleEn: 'Foliage Maturation & Sizing', titleFil: 'Paglutong at Pagsiksik ng Kumpol', descEn: 'Leaves achieve prime market thickness, tenderness, and optimal nutrient density.', descFil: 'Nasa tamang kapal, lutong, at sustansya na ang mga dahon.', careEn: 'Inspect undersides of leaves for pests; mulch beds to retain moisture.', careFil: 'Suriin ang ilalim ng dahon laban sa peste at maglagay ng mulch.' },
      { id: 'harvest', icon: '🧺', shortEn: 'Harvest', shortFil: 'Pag-ani', titleEn: 'Ready for Crisp Harvest', titleFil: 'Handa nang Pitasin / Anihin', descEn: 'Peak freshness and succulent crunch reached. Ready for immediate harvesting.', descFil: 'Napakalutong at sariwa; nasa tamang gulang na para anihin.', careEn: 'Harvest in the early morning for optimum crispness and shelf life.', careFil: 'Anihin sa maagang umaga upang manatiling sariwa.' }
    ];
  } else if (isRoot) {
    base = [
      { id: 'seedling', icon: '🌱', shortEn: 'Seedling', shortFil: 'Punla', titleEn: 'Germination & Emergence', titleFil: 'Pagsibol ng Punla', descEn: 'Seedlings emerge with delicate cotyledons as primary taproot pushes down.', descFil: 'Sumisibol ang punla habang bumaon ang unang ugat sa lupa.', careEn: 'Keep fine friable seedbed consistently moist; avoid soil crusting.', careFil: 'Panatilihing pinong-pino at mamasa-masa ang seedbed.' },
      { id: 'vegetative', icon: '🌿', shortEn: 'Vegetative', shortFil: 'Dahon', titleEn: 'Top Foliage Development', titleFil: 'Paglaki ng Dahon sa Ibabaw', descEn: 'Feathery top leaves gather sunlight to feed the expanding taproot underground.', descFil: 'Lumalago ang berdeng dahon sa ibabaw upang pakainin ang ugat.', careEn: 'Thin seedlings to adequate spacing so roots have room to swell.', careFil: 'Bawasan ang sobrang punla upang magkaroon ng espasyo ang ugat.' },
      { id: 'swelling', icon: '🥕', shortEn: 'Bulbing', shortFil: 'Pagbilog', titleEn: 'Taproot Thickening & Sizing', titleFil: 'Paghaba at Pagkapal ng Ugat', descEn: 'Root begins rapid radial swelling, accumulating starches and rich natural sugars.', descFil: 'Kumakapal at bumibilog ang ugat sa ilalim ng malambot na lupa.', careEn: 'Ensure consistent irrigation; erratic watering causes split or woody roots.', careFil: 'Panatilihing pantay ang dilig upang hindi magbitak ang ugat.' },
      { id: 'maturing', icon: cropIcon, shortEn: 'Maturing', shortFil: 'Paglaki', titleEn: 'Root Maturation & Sweetening', titleFil: 'Paglaki at Pagtamis ng Ugat', descEn: 'Root reaches full uniform market diameter, smooth skin, and crisp texture.', descFil: 'Buo na ang laki, timbang, at tamis ng aanihing ugat.', careEn: 'Hill soil around root shoulders to prevent sun greening.', careFil: 'Takpan ng lupa ang balikat ng ugat upang hindi umitim sa araw.' },
      { id: 'harvest', icon: '🧺', shortEn: 'Harvest', shortFil: 'Pag-ani', titleEn: 'Ready for Root Pulling', titleFil: 'Handa nang Bunutin', descEn: 'Optimal root diameter and crisp sweetness achieved for harvest.', descFil: 'Tamang-tama ang tamis at tigas; handa nang bunutin sa lupa.', careEn: 'Loosen soil gently before pulling in early morning to avoid bruising.', careFil: 'Palambutin ang lupa bago marahang bunutin sa umaga.' }
    ];
  } else {
    base = [
      { id: 'seedling', icon: '🌱', shortEn: 'Seedling', shortFil: 'Punla', titleEn: 'Seedling Emergence', titleFil: 'Pagpupunla at Pagsibol', descEn: 'Seeds germinate and young seedlings establish their first roots and leaves.', descFil: 'Sumisibol ang buto at nagkakaroon ng unang ugat at dahon ang punla.', careEn: 'Keep soil evenly moist and protect seedlings from heavy rain and harsh noon sun.', careFil: 'Panatilihing mamasa-masa ang lupa at protektahan sa malakas na ulan at init.' },
      { id: 'vegetative', icon: '🌿', shortEn: 'Vegetative', shortFil: 'Paglaki', titleEn: 'Vine & Branching Growth', titleFil: 'Pag-gapang sa Balag at Paglaki', descEn: 'Rapid vine extension, lateral branching, and strong root system establishment.', descFil: 'Mabilis na pag-gapang sa balag at pagdami ng sanga at dahon.', careEn: 'Train vines gently onto trellises and apply balanced organic fertilizer.', careFil: 'Gabayan ang mga baging sa balag at maglagay ng organikong pataba.' },
      { id: 'flowering', icon: '🌸', shortEn: 'Flowering', shortFil: 'Bulaklak', titleEn: 'Flowering & Blossom Setting', titleFil: 'Pamumulaklak at Pagsisimula ng Bunga', descEn: 'Abundant blossoms open for pollination as tiny ovaries begin to form.', descFil: 'Bumabuka ang mga bulaklak at may maliit nang nagsisimulang bunga.', careEn: 'Maintain consistent soil moisture; avoid chemical spraying during pollination hours.', careFil: 'Diligan nang regular at huwag mag-spray habang namumulaklak.' },
      { id: 'fruiting', icon: cropIcon, shortEn: 'Fruiting', shortFil: 'Pamumunga', titleEn: 'Fruit Development & Sizing', titleFil: 'Lumalaki at Bumabigat na Bunga', descEn: 'Fruits/pods swell and size up rapidly toward mature market dimensions.', descFil: 'Mabilis na lumalaki at bumibigat ang bunga patungo sa tamang laki.', careEn: 'Ensure even watering and sturdy trellis support to keep fruit off wet ground.', careFil: 'Tiyaking matibay ang balag upang hindi sumayad sa lupa ang bunga.' },
      { id: 'harvest', icon: '🧺', shortEn: 'Harvest', shortFil: 'Pag-ani', titleEn: 'Peak Maturity Harvest Ready', titleFil: 'Handa nang Anihin / Pitasin', descEn: 'Crop has reached optimal color, weight, and firmness for market harvest.', descFil: 'Nasa tamang gulang, kulay, at lutong na ang pananim para pitasin.', careEn: 'Harvest with sharp pruners in the cool morning to preserve freshness.', careFil: 'Pitasin gamit ang matalas na gunting sa maagang umaga.' }
    ];
  }

  // If crop has authentic stage details in profile, inject them into the target stage step
  if (cropProfile.stageEn && cropProfile.stageStep && base[cropProfile.stageStep - 1]) {
    const targetIdx = cropProfile.stageStep - 1;
    base[targetIdx].titleEn = cropProfile.stageEn;
    if (cropProfile.stageFil) base[targetIdx].titleFil = cropProfile.stageFil;
    if (cropProfile.stageDescEn) base[targetIdx].descEn = cropProfile.stageDescEn;
    if (cropProfile.stageDescFil) base[targetIdx].descFil = cropProfile.stageDescFil;
  }

  const defaultDay = cropProfile.plantAgeDays || 
    (cropProfile.progressPercent ? Math.max(1, Math.min(totalDays, Math.round(totalDays * (cropProfile.progressPercent / 100)))) : Math.round(totalDays / 2));

  return {
    totalDays,
    defaultDay,
    stages: base.map((s, i) => ({ ...s, num: i + 1, minDay: ranges[i][0], maxDay: ranges[i][1] }))
  };
};

// Build the list of crops to display strictly from authentic vegetables (filtering out dates/numbers)
const buildDisplayCrops = (datasetCrops, hasCrops = true) => {
  if (!hasCrops || !datasetCrops || datasetCrops.length === 0) {
    return [];
  }
  const seen = new Set();
  const list = [];
  const { sanitized } = sanitizeDatasetCrops(datasetCrops || []);
  const safeList = sanitized.length > 0 ? sanitized : (datasetCrops || []);

  safeList.forEach((ac, idx) => {
    if (!ac) return;
    let rawId = String(ac.id || ac.name || '').toLowerCase().trim();
    if (!rawId || isInvalidVegetableToken(rawId)) {
      const fb = STANDARD_PHILIPPINE_VEGETABLES[idx % STANDARD_PHILIPPINE_VEGETABLES.length];
      ac = { ...fb };
      rawId = fb.id;
    }

    const known = KNOWN_VEGETABLES[rawId] || {};
    const merged = { ...known, ...ac };
    const totalDays = parseTotalDays(merged.daysToGrowEn);
    const autoAge = merged.plantAgeDays || 
      (merged.progressPercent ? Math.max(1, Math.min(totalDays, Math.round(totalDays * (merged.progressPercent / 100)))) : Math.round(totalDays / 2));

    const presetId = DATASET_TO_PRESET_ID[rawId];
    const preset = presetId ? CROP_PREDICTIONS_DATA.find(c => c.id === presetId) : null;

    if (preset) {
      if (seen.has(preset.id)) return;
      seen.add(preset.id);
      const baseConfig = CROP_STAGES_CONFIG[preset.id];
      list.push({ 
        ...preset,
        ...merged,
        cropIndex: idx,
        plantAgeDays: autoAge,
        stagesConfig: {
          ...baseConfig,
          defaultDay: autoAge
        }
      });
      return;
    }

    if (seen.has(rawId)) return;
    seen.add(rawId);
    const name = merged.name || merged.id;
    const icon = merged.icon || '🌱';
    list.push({
      id: rawId,
      cropIndex: idx,
      name,
      filipinoName: merged.filipinoName || name,
      icon,
      variety: merged.variety || (merged.filipinoName && merged.filipinoName !== name ? merged.filipinoName : 'Philippine Cultivar'),
      riskLevel: merged.riskLevel || 'Low Risk',
      riskClass: merged.riskClass || 'risk-stable',
      suitabilityScore: merged.suitabilityScore || '92%',
      qualityGrade: merged.qualityGrade || 'Grade A Premium',
      qualityGradeFil: merged.qualityGradeFil || 'Pambentang Klase (Grade A)',
      forecastDriver: merged.stageDescEn || `Growth tracked according to the ${name} crop cycle.`,
      forecastDriverFil: merged.stageDescFil || `Sinusubaybayan ang paglaki ayon sa ikot ng pananim na ${name}.`,
      plantAgeDays: autoAge,
      stagesConfig: buildGenericStagesConfig(totalDays, icon, merged)
    });
  });
  return list;
};

// Helper: Calculate stage, days remaining until harvest, and progress percentage based on plant age
const getStageForDay = (config, dayNum) => {
  const clampedDay = Math.max(1, Math.min(config.totalDays, Number(dayNum) || 1));
  const stage = config.stages.find(s => clampedDay >= s.minDay && clampedDay <= s.maxDay) || config.stages[config.stages.length - 1];
  const daysLeft = Math.max(0, config.totalDays - clampedDay);
  const progressPct = Math.min(100, Math.round((clampedDay / config.totalDays) * 100));

  return {
    currentDay: clampedDay,
    totalDays: config.totalDays,
    stage,
    daysLeft,
    progressPct,
    isReady: daysLeft === 0,
    stages: config.stages
  };
};

function Predictions({ 
  lang = 'en', 
  systemStatus = null, 
  isLstmTrained = false, 
  hasWeatherDataset: hasWeatherProp,
  hasCropDataset: hasCropProp,
  setActiveTab 
}) {
  const isFil = lang === 'fil';
  const [selectedCropId, setSelectedCropId] = useState('all');
  const [showGuideModal, setShowGuideModal] = useState(false);

  const hasCrops = hasCropProp !== undefined
    ? hasCropProp
    : Boolean(
        (systemStatus?.cropDatasetLoaded || (systemStatus?.cropCount && systemStatus.cropCount > 0)) &&
        (systemStatus?.detectedCrops && systemStatus.detectedCrops.length > 0)
      );

  // Real-time LSTM AI Model Training Status Detection
  const [lstmReady, setLstmReady] = useState(() => {
    if (isLstmTrained) return true;
    if (systemStatus?.trainingStatus?.lstm === 'Trained' || systemStatus?.trainingStatus?.hybrid === 'Trained') return true;
    try {
      return localStorage.getItem('climayield_lstm_trained') === 'true';
    } catch {
      return false;
    }
  });

  // Keep in sync with parent props
  useEffect(() => {
    if (isLstmTrained) {
      setLstmReady(true);
    } else if (systemStatus?.trainingStatus?.lstm === 'Trained' || systemStatus?.trainingStatus?.hybrid === 'Trained') {
      setLstmReady(true);
    } else if (
      systemStatus &&
      systemStatus?.trainingStatus?.lstm === 'Not Trained' &&
      systemStatus?.trainingStatus?.hybrid === 'Not Trained' &&
      localStorage.getItem('climayield_lstm_trained') !== 'true'
    ) {
      setLstmReady(false);
    }
  }, [isLstmTrained, systemStatus]);

  // Reactive listener for LSTM training completion and backend reset events
  useEffect(() => {
    const handleLstmEvent = (e) => {
      setLstmReady(!!e.detail?.trained);
    };
    const handleStorage = (e) => {
      if (e.key === 'climayield_lstm_trained') {
        setLstmReady(e.newValue === 'true');
      }
    };
    window.addEventListener('lstmTrainingUpdated', handleLstmEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('lstmTrainingUpdated', handleLstmEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Sync with active crops from dataset if available
  // eslint-disable-next-line no-unused-vars
  const [activeDatasetCrops, setActiveDatasetCrops] = useState(() => hasCrops ? getSavedDatasetCrops() : []);
  
  useEffect(() => {
    if (!hasCrops) {
      setActiveDatasetCrops([]);
      return;
    }
    const saved = getSavedDatasetCrops();
    if (saved && saved.length > 0) {
      setActiveDatasetCrops(saved);
    }
  }, [hasCrops]);

  useEffect(() => {
    const handleCropUpdate = (e) => {
      setActiveDatasetCrops(hasCrops ? (e.detail || []) : []);
    };
    window.addEventListener('cropDatasetUpdated', handleCropUpdate);
    return () => window.removeEventListener('cropDatasetUpdated', handleCropUpdate);
  }, [hasCrops]);

  // Crops displayed come ONLY from the uploaded dataset
  const displayCropsList = buildDisplayCrops(activeDatasetCrops, hasCrops);

  // If no crops have been uploaded yet in the dataset, all crops are removed first
  if (displayCropsList.length === 0) {
    return (
      <div className="cp-container">
        {/* Header Banner */}
        <div className="cp-header-card awaiting">
          <div className="cp-header-left">
            <h2>
              <span>📈</span>
              <span>{isFil ? 'Pagtataya ng Ani ng Pananim' : 'Crop Yield Predictions & Growth Forecasts'}</span>
            </h2>
            <p>
              {isFil
                ? 'Ang prediction engine ay magpapakita ng mga pananim at yugto ng kanilang paglaki kapag nag-upload ng dataset ng pananim sa Dev side.'
                : 'The crop prediction engine will display vegetables, growth stages, and harvest countdowns once a crop dataset is uploaded on the Dev side.'}
            </p>
          </div>
          <div className="cp-header-actions">
            <div className="cp-model-status-chip idle">
              <span className="pulse-dot-amber"></span>
              <span>{isFil ? 'Naghihintay ng Dataset ng Pananim' : 'Awaiting Crop Dataset'}</span>
            </div>
            <div className="cp-header-badge">
              <div className="sub">{isFil ? 'Lugar ng Bukid' : 'Target Area'}</div>
              <div className="val">📍 Quezon City, Metro Manila</div>
            </div>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="cp-empty-prediction-card">
          <div className="cp-empty-icon-wrap">
            <span className="cp-empty-icon">🌾</span>
          </div>

          <div className="cp-empty-badge">
            <span className="badge-dot"></span>
            <span>{isFil ? 'Naghihintay ng Dataset sa Dev Side' : 'Awaiting Crop Dataset from Dev Side'}</span>
          </div>

          <h3 className="cp-empty-title">
            {isFil
              ? 'Wala Pang Pananim sa Farmer Side'
              : 'No Crops Loaded on Farmer Side Yet'}
          </h3>

          <p className="cp-empty-desc">
            {isFil
              ? 'Walang makikitang pananim sa kasalukuyan. Awtomatikong lilitaw dito ang mga gulay at kanilang mga hula kapag nag-upload ng crop dataset sa Developer side (Data Management).'
              : 'No crops are currently loaded on the farmer side. Crop yield forecasts, plant growth milestones, and harvest countdowns will automatically appear here once a crop dataset is uploaded on the Developer side (Data Management).'}
          </p>

          <div className="cp-empty-footer-note">
            <span>💡</span>
            <span>
              {isFil
                ? 'Pumunta sa Data Management sa Developer side upang mag-upload ng dataset ng pananim.'
                : 'Go to Data Management on the Developer side to upload or activate a crop dataset.'}
            </span>
          </div>

          {setActiveTab && (
            <button
              type="button"
              className="cp-modal-btn-primary"
              style={{ marginTop: '20px' }}
              onClick={() => setActiveTab('datamanagement')}
            >
              <span>📁</span>
              <span>{isFil ? 'Pumunta sa Data Management (Dev View)' : 'Go to Data Management (Dev View)'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Fall back to 'all' if the selected crop is no longer in the dataset
  const effectiveSelectedId = displayCropsList.some(c => c.id === selectedCropId) ? selectedCropId : 'all';

  const filteredCrops = effectiveSelectedId === 'all'
    ? displayCropsList
    : displayCropsList.filter(c => c.id === effectiveSelectedId);

  // Dataset-derived summary stats
  const cycleDays = displayCropsList.map(c => c.stagesConfig.totalDays);
  const avgCycleDays = Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length);
  const minCycleDays = Math.min(...cycleDays);
  const maxCycleDays = Math.max(...cycleDays);
  const earliestCrops = displayCropsList.filter(c => c.stagesConfig.totalDays === minCycleDays);
  const earliestCropsLabel = earliestCrops.slice(0, 2).map(c => (isFil ? c.filipinoName : c.name)).join(' & ')
    + (earliestCrops.length > 2 ? ` +${earliestCrops.length - 2}` : '');

  // Active crop for chart projection
  const activeCropForChart = effectiveSelectedId === 'all'
    ? displayCropsList[0]
    : displayCropsList.find(c => c.id === effectiveSelectedId) || displayCropsList[0];

  const activeCropConfig = activeCropForChart.stagesConfig;
  const activeCropCurrentDay = activeCropForChart.plantAgeDays || activeCropConfig.defaultDay;
  const activeCropStageInfo = getStageForDay(activeCropConfig, activeCropCurrentDay);

  // Growth trajectory chart data (0% to 100% maturity curve towards harvest)
  const totalDaysArray = Array.from({ length: activeCropConfig.totalDays }, (_, i) => i + 1);
  const maturityCurve = totalDaysArray.map(d => Math.min(100, Math.round((d / activeCropConfig.totalDays) * 100)));

  const chartData = {
    labels: totalDaysArray.map(d => isFil ? `Araw ${d}` : `Day ${d}`),
    datasets: [
      {
        label: isFil
          ? `${activeCropForChart.filipinoName} (% ng Paglaki / Maturity patungong Ani)`
          : `${activeCropForChart.name} (Growth & Maturity Curve to Harvest)`,
        data: maturityCurve,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: (ctx) => {
          const idx = ctx.dataIndex;
          return idx === activeCropCurrentDay - 1 ? 7 : 1.5;
        },
        pointBackgroundColor: (ctx) => {
          const idx = ctx.dataIndex;
          return idx === activeCropCurrentDay - 1 ? '#ef4444' : '#16a34a';
        },
        borderWidth: 2.5
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: '-apple-system, sans-serif', weight: '600' },
          color: '#1e293b'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dayNum = context.dataIndex + 1;
            const stageInfo = getStageForDay(activeCropConfig, dayNum);
            const stageTitle = isFil ? stageInfo.stage.titleFil : stageInfo.stage.titleEn;
            const daysLeft = stageInfo.daysLeft;
            return isFil
              ? ` Araw ${dayNum}: ${stageTitle} • ${daysLeft > 0 ? `${daysLeft} araw bago anihin` : 'Handa nang anihin!'}`
              : ` Day ${dayNum}: ${stageTitle} • ${daysLeft > 0 ? `${daysLeft} days to harvest` : 'Ready for harvest!'}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: isFil ? 'Porsyento ng Paglaki (% Maturity)' : 'Plant Maturity (% Complete)',
          color: '#64748b'
        },
        grid: { color: 'rgba(0, 0, 0, 0.04)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  return (
    <div className="cp-container">
      {/* 1. Header Banner */}
      <div className="cp-header-card">
        <div className="cp-header-left">
          <h2>
            <span>🌾</span>
            <span>{isFil ? 'Yugto ng Paglaki ng Gulay at Araw ng Pag-ani' : 'Vegetable Growth Stages & Harvest Timelines'}</span>
          </h2>
          <p>
            {isFil
              ? 'Subaybayan ang yugto ng paglaki ng halaman, alamin kung anong yugto ang pananim ayon sa araw, at bilangin ang natitirang araw bago anihin.'
              : 'Track vegetable growth stages, monitor plant age in days, and know exactly which stage it is in and how many days until harvest.'}
          </p>
        </div>
        <div className="cp-header-actions">
          <div className={`cp-model-status-chip ${lstmReady ? 'trained' : 'baseline'}`}>
            <span className={lstmReady ? 'pulse-dot-green' : 'pulse-dot-blue'}></span>
            <span>
              {lstmReady
                ? (isFil ? '✓ LSTM Model Aktibo at Nasuri Na' : '✓ LSTM Model Trained & Active')
                : (isFil ? '✓ Empirikal na Modelo ng Pananim Aktibo' : '✓ Empirical Crop Model Active')}
            </span>
          </div>
          <button
            className="cp-calc-guide-btn"
            onClick={() => setShowGuideModal(true)}
            title={isFil ? 'Tingnan ang Gabay sa Yugto ng Paglaki' : 'View Vegetable Growth Stage Guide'}
          >
            <span>🌱</span>
            <span>{isFil ? 'Gabay sa Yugto ng Paglaki at Pag-ani' : 'Growth & Harvest Stage Guide'}</span>
          </button>
          <button
            type="button"
            id="cp-remove-all-vegetables-btn"
            className="cp-calc-guide-btn"
            style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}
            onClick={() => {
              if (window.confirm(isFil ? 'Alisin ang lahat ng gulay sa prediction dashboard?' : 'Remove all vegetables from the prediction dashboard?')) {
                clearDatasetCrops();
                setSelectedCropId('all');
              }
            }}
            title={isFil ? 'Alisin ang lahat ng gulay' : 'Remove all vegetables'}
          >
            <span>🗑️</span>
            <span>{isFil ? 'Alisin Lahat ng Gulay' : 'Remove All Vegetables'}</span>
          </button>
          <div className="cp-header-badge">
            <div className="sub">{isFil ? 'Lugar ng Bukid' : 'Target Area'}</div>
            <div className="val">📍 Quezon City, Metro Manila</div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Stats Bar (Farmer Friendly) */}
      <div className="cp-stats-grid">
        <div className="cp-stat-card cp-stat-accuracy">
          <div className="cp-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>⏱️</div>
          <div>
            <div className="cp-stat-label">
              {isFil ? 'Karaniwang Araw ng Paglaki' : 'Average Growth Cycle'}
            </div>
            <div className="cp-stat-val" style={{ color: '#059669' }}>
              {avgCycleDays} <span style={{ fontSize: '0.85rem' }}>{isFil ? 'Araw' : 'Days'}</span>
            </div>
            <div className="cp-stat-sub">
              {isFil ? `Mabilis anihin (${minCycleDays}–${maxCycleDays} araw)` : `Short-cycle (${minCycleDays}–${maxCycleDays} days)`}
            </div>
          </div>
        </div>

        <div className="cp-stat-card">
          <div className="cp-stat-icon">🌱</div>
          <div>
            <div className="cp-stat-label">
              {isFil ? 'Mga Gulay na Binabantayan' : 'Monitored Vegetables'}
            </div>
            <div className="cp-stat-val">
              {displayCropsList.length} <span style={{ fontSize: '0.85rem' }}>{isFil ? 'na Uri' : (displayCropsList.length === 1 ? 'Variety' : 'Varieties')}</span>
            </div>
            <div className="cp-stat-sub">
              {isFil ? 'Mula sa na-upload na dataset' : 'From uploaded dataset'}
            </div>
          </div>
        </div>

        <div className="cp-stat-card">
          <div className="cp-stat-icon">🧺</div>
          <div>
            <div className="cp-stat-label">
              {isFil ? 'Pinakamabilis Anihin' : 'Earliest Harvest Window'}
            </div>
            <div className="cp-stat-val">
              {minCycleDays} <span style={{ fontSize: '0.85rem' }}>{isFil ? 'Araw' : 'Days'}</span>
            </div>
            <div className="cp-stat-sub">{earliestCropsLabel}</div>
          </div>
        </div>

        <div className="cp-stat-card">
          <div className="cp-stat-icon">⚖️</div>
          <div>
            <div className="cp-stat-label">
              {isFil ? 'Kalagayan sa Bukid' : 'Growing Condition'}
            </div>
            <div className="cp-stat-val" style={{ color: '#16a34a' }}>
              {isFil ? 'Maayos' : 'Optimal'}
            </div>
            <div className="cp-stat-sub">
              {isFil ? 'Mababang panganib sa klima' : 'Low climate risk'}
            </div>
          </div>
        </div>

        <div className="cp-stat-card">
          <div className="cp-stat-icon">🌤️</div>
          <div>
            <div className="cp-stat-label">
              {isFil ? 'Angkop na Panahon' : 'Weather Suitability'}
            </div>
            <div className="cp-stat-val">
              93%
            </div>
            <div className="cp-stat-sub">
              {isFil ? 'Magandang ulan at sikat ng araw' : 'Balanced sun & rain'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Crop Filter Tabs */}
      <div className="cp-filter-bar">
        <button
          className={`cp-filter-btn ${effectiveSelectedId === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCropId('all')}
        >
          <span>🌱</span>
          <span>{isFil ? 'Lahat ng Gulay' : 'All Crops'}</span>
        </button>
        {displayCropsList.map(crop => (
          <button
            key={crop.id}
            className={`cp-filter-btn ${effectiveSelectedId === crop.id ? 'active' : ''}`}
            onClick={() => setSelectedCropId(crop.id)}
          >
            <span>{crop.icon}</span>
            <span>{isFil ? crop.filipinoName : crop.name}</span>
            <span className="cp-tab-acc-badge">
              {crop.stagesConfig.totalDays}d
            </span>
          </button>
        ))}
      </div>

      {/* 4. Vegetable Growth Stage & Harvest Cards Grid */}
      <div className="cp-grid">
        {filteredCrops.map(crop => {
          const config = crop.stagesConfig;
          const currentDay = crop.plantAgeDays || config.defaultDay;
          const stageInfo = getStageForDay(config, currentDay);
          const currentStage = stageInfo.stage;

          const isLowRisk = crop.riskLevel === 'Low Risk';
          const riskDisplay = isLowRisk
            ? (isFil ? 'Mababang Panganib' : 'Low Risk')
            : (isFil ? 'Katamtamang Panganib' : 'Moderate Risk');
          const qualityDisplay = isFil ? (QUALITY_FILIPINO[crop.qualityGrade] || crop.qualityGradeFil || crop.qualityGrade) : crop.qualityGrade;
          const driverDisplay = isFil ? (DRIVER_FILIPINO[crop.id] || crop.forecastDriverFil || crop.forecastDriver) : crop.forecastDriver;

          return (
            <div
              key={crop.id}
              className={`cp-card ${effectiveSelectedId === crop.id ? 'selected' : ''}`}
              onClick={() => setSelectedCropId(crop.id)}
            >
              {/* Card Top: Crop Identity & Risk Badge */}
              <div className="cp-card-top">
                <div className="cp-crop-header">
                  <div className="cp-crop-icon-box">{crop.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cp-crop-title">{isFil ? crop.filipinoName : crop.name}</div>
                    <div className="cp-crop-subtitle">
                      {crop.variety} • ⏱️ {config.totalDays} {isFil ? 'araw na ikot' : 'days cycle'}
                    </div>
                    <div className="cp-crop-auto-tag">
                      <span>⚡</span>
                      <span>{isFil ? 'Awtomatiko mula sa Dataset' : 'Automatic from Dataset'}</span>
                    </div>
                  </div>
                </div>
                <span className={`cp-risk-badge ${crop.riskClass}`}>{riskDisplay}</span>
              </div>

              {/* ⏱️ Plant Age & Lifecycle Status (View Only) */}
              <div className="cp-day-view-wrap">
                <div className="cp-day-view-header">
                  <div className="cp-day-view-title-row">
                    <span className="cp-day-view-icon">⏱️</span>
                    <div>
                      <div className="cp-day-view-label">
                        {isFil ? 'Kasalukuyang Edad ng Pananim:' : 'Current Plant Age:'}
                      </div>
                      <div className="cp-day-view-sub">
                        {isFil ? 'Batay sa in-upload na dataset' : 'Derived from active dataset'}
                      </div>
                    </div>
                  </div>
                  <div className="cp-day-view-badge">
                    <strong>{currentDay}</strong> / {config.totalDays} {isFil ? 'araw' : 'days'}
                  </div>
                </div>

                {/* Visual Read-Only Lifecycle Timeline */}
                <div className="cp-day-timeline-track">
                  <div
                    className="cp-day-timeline-fill"
                    style={{ width: `${Math.min(100, Math.round((currentDay / config.totalDays) * 100))}%` }}
                  />
                  <div
                    className="cp-day-timeline-pin"
                    style={{ left: `${Math.min(100, Math.max(0, Math.round((currentDay / config.totalDays) * 100)))}%` }}
                  >
                    <span>{isFil ? `Araw ${currentDay}` : `Day ${currentDay}`}</span>
                  </div>
                </div>
                <div className="cp-day-timeline-labels">
                  <span>{isFil ? 'Pagtatanim (Araw 1)' : 'Planting (Day 1)'}</span>
                  <span className="cp-day-timeline-center">
                    {isFil
                      ? `${stageInfo.progressPct}% ng Ikot ng Paglaki`
                      : `${stageInfo.progressPct}% Maturity Progress`}
                  </span>
                  <span>{isFil ? `Pag-ani (Araw ${config.totalDays})` : `Harvest (Day ${config.totalDays})`}</span>
                </div>
              </div>

              {/* 🌟 1. WHAT STAGE THAT IS */}
              <div className="cp-stage-hero-box">
                <div className="cp-stage-hero-top">
                  <div className="cp-stage-hero-tag">
                    <span className="dot"></span>
                    <span>
                      {isFil
                        ? `Yugto ${currentStage.num} ng 5: ${currentStage.titleFil}`
                        : `Stage ${currentStage.num} of 5: ${currentStage.titleEn}`}
                    </span>
                  </div>
                  <div className="cp-stage-progress-tag">
                    {stageInfo.progressPct}% {isFil ? 'ng Paglaki' : 'Maturity'}
                  </div>
                </div>

                <div className="cp-stage-hero-desc">
                  {isFil ? currentStage.descFil : currentStage.descEn}
                </div>

                {/* Visual 5-Phase Growth Progress Stepper (View Only) */}
                <div className="cp-stage-stepper-row">
                  {config.stages.map((st) => {
                    const isCurrent = currentStage.num === st.num;
                    const isDone = currentStage.num > st.num;
                    return (
                      <div
                        key={st.num}
                        className={`cp-stage-step-pill ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}
                        title={`${st.num}. ${isFil ? st.titleFil : st.titleEn} (${st.minDay}–${st.maxDay} ${isFil ? 'araw' : 'days'})`}
                      >
                        <span className="step-icon">{st.icon}</span>
                        <span className="step-name">{isFil ? st.shortFil : st.shortEn}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Growth Progress Track */}
                <div className="cp-progress-track">
                  <div
                    className="cp-progress-bar"
                    style={{ width: `${stageInfo.progressPct}%` }}
                  />
                </div>
                <div className="cp-progress-labels">
                  <span>{isFil ? 'Pagsibol (Araw 1)' : 'Planting (Day 1)'}</span>
                  <span style={{ fontWeight: '700', color: '#166534' }}>
                    {isFil ? `Araw ${currentDay} ng ${config.totalDays}` : `Day ${currentDay} of ${config.totalDays}`}
                  </span>
                  <span>{isFil ? `Pag-ani (Araw ${config.totalDays})` : `Harvest (Day ${config.totalDays})`}</span>
                </div>
              </div>

              {/* ⏱️ 2. HOW MANY DAYS TO HARVEST IT */}
              <div className={`cp-harvest-hero-box ${stageInfo.isReady ? 'ready' : ''}`}>
                <div className="cp-harvest-hero-icon">
                  {stageInfo.isReady ? '🎉' : '⏱️'}
                </div>
                <div className="cp-harvest-hero-content">
                  <div className="cp-harvest-hero-label">
                    {stageInfo.isReady
                      ? (isFil ? 'Handa Nang Anihin!' : 'Ready for Harvest!')
                      : (isFil ? 'Nalalabing Araw Bago Anihin:' : 'Remaining Days to Harvest:')}
                  </div>
                  <div className="cp-harvest-hero-value">
                    {stageInfo.isReady ? (
                      <span className="ready-text">{isFil ? 'Handa Nang Pitasin Ngayon!' : 'Ready for Harvest Today!'}</span>
                    ) : (
                      <>
                        <span className="num">{stageInfo.daysLeft}</span>{' '}
                        <span className="unit">{isFil ? (stageInfo.daysLeft === 1 ? 'araw' : 'araw') : (stageInfo.daysLeft === 1 ? 'day' : 'days')}</span>
                      </>
                    )}
                  </div>
                  <div className="cp-harvest-hero-sub">
                    {stageInfo.isReady
                      ? (isFil ? 'Nasa rurok ng tamis at lutong; pitasin sa umaga.' : 'Peak tenderness and flavor; pick in early morning.')
                      : (isFil ? `Tantiyang petsa ng pag-ani: sa Araw ${config.totalDays}` : `Target harvest day: on Day ${config.totalDays}`)}
                  </div>
                </div>
              </div>

              {/* 💡 3. ACTIONABLE STAGE CARE TIP */}
              <div className="cp-stage-care-box">
                <div className="cp-care-icon">💡</div>
                <div className="cp-care-content">
                  <strong>{isFil ? `Alaga sa Yugtong Ito (Araw ${currentDay}):` : `Care at this Stage (Day ${currentDay}):`}</strong>{' '}
                  {isFil ? currentStage.careFil : currentStage.careEn}
                </div>
              </div>

              {/* Growing Environment & Quality Attributes */}
              <div className="cp-details-list">
                <div className="cp-detail-item">
                  <span className="cp-detail-key">{isFil ? 'Angkop sa Panahon:' : 'Weather Suitability:'}</span>
                  <span className="cp-detail-val">🌤️ {crop.suitabilityScore}</span>
                </div>
                <div className="cp-detail-item">
                  <span className="cp-detail-key">{isFil ? 'Inaasahang Kalidad:' : 'Expected Quality:'}</span>
                  <span className="cp-detail-val">✨ {qualityDisplay}</span>
                </div>
              </div>

              {/* Climate Factor Driver */}
              <div className="cp-factor-banner">
                <strong>{isFil ? 'Paliwanag sa Panahon:' : 'Climate Factor:'}</strong> {driverDisplay}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Growth Maturity Curve Chart */}
      <div className="cp-chart-card">
        <div className="cp-chart-header">
          <div className="cp-chart-title">
            <span>📈</span>
            <span>
              {isFil
                ? `Takbo ng Paglaki at Yugto ng Ani: ${isFil ? activeCropForChart.filipinoName : activeCropForChart.name}`
                : `Plant Growth & Maturity Curve to Harvest: ${activeCropForChart.name}`}
            </span>
          </div>
          <div className="cp-chart-legend">
            {isFil
              ? `Araw ${activeCropCurrentDay} ng ${activeCropConfig.totalDays} • ${activeCropStageInfo.daysLeft > 0 ? `${activeCropStageInfo.daysLeft} araw bago anihin` : 'Handa nang anihin!'}`
              : `Day ${activeCropCurrentDay} of ${activeCropConfig.totalDays} • ${activeCropStageInfo.daysLeft > 0 ? `${activeCropStageInfo.daysLeft} days to harvest` : 'Ready to harvest!'}`}
          </div>
        </div>
        <div style={{ height: '260px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 6. MODAL: VEGETABLE GROWTH & HARVEST STAGE GUIDE */}
      {showGuideModal && (
        <div className="cp-modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="cp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <div className="cp-modal-title">
                <span>🌱</span>
                <h3>{isFil ? 'Gabay sa Yugto ng Paglaki at Araw ng Pag-ani' : 'Vegetable Growth Stages & Harvest Timelines Guide'}</h3>
              </div>
              <button
                className="cp-modal-close"
                onClick={() => setShowGuideModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="cp-modal-body">
              <div className="cp-modal-section">
                <h4>{isFil ? 'Ang 5 Yugto ng Paglaki ng mga Gulay' : 'The 5 Key Growth Phases of Vegetables'}</h4>
                <p>
                  {isFil
                    ? 'Bawat gulay na mabilis anihin ay dumadaan sa 5 mahahalagang yugto ng paglaki. Gamit ang ClimaYield, maaari mong piliin kung ilang araw nang nakatanim ang iyong gulay (halimbawa: Araw 30) upang makita ang kasalukuyang yugto at kung ilang araw na lamang ang natitira bago ang anihan.'
                    : 'Each short-cycle vegetable advances through 5 critical development phases. Using ClimaYield, farmers can set or slide the plant age in days (e.g. Day 30) to instantly identify what stage it is in and exactly how many days remain until harvest.'}
                </p>
                <div className="cp-modal-stages-list">
                  <div className="modal-stage-item">
                    <span className="modal-stage-icon">🌱</span>
                    <div>
                      <strong>1. {isFil ? 'Pagsibol / Pagpupunla (Seedling & Emergence)' : 'Seedling & Emergence'}</strong>
                      <p>{isFil ? 'Pagsibol ng buto sa seedbed o nursery tray. Kailangan ng katamtamang dilig at banayad na sikat ng araw.' : 'Seeds germinate and tender green shoots emerge. Requires consistent light moisture and gentle morning sunlight.'}</p>
                    </div>
                  </div>
                  <div className="modal-stage-item">
                    <span className="modal-stage-icon">🌿</span>
                    <div>
                      <strong>2. {isFil ? 'Paglaki ng Dahon at Tangkay (Vegetative Growth)' : 'Vegetative Foliage Growth'}</strong>
                      <p>{isFil ? 'Mabilis na pagdami ng dahon at pagkapal ng tangkay. Dito inilalagay ang balag o tukod at organikong pataba.' : 'Stalks thicken and true foliage multiplies rapidly. Install trellises and apply balanced compost.'}</p>
                    </div>
                  </div>
                  <div className="modal-stage-item">
                    <span className="modal-stage-icon">🌸</span>
                    <div>
                      <strong>3. {isFil ? 'Pamumulaklak (Flowering & Budding)' : 'Flowering & Budding'}</strong>
                      <p>{isFil ? 'Pagbuka ng mga bulaklak para sa polinasyon. Iwasang basain ang mga bulaklak upang hindi malaglag.' : 'Blossoms open to allow insect pollination. Avoid overhead watering to prevent flower drop.'}</p>
                    </div>
                  </div>
                  <div className="modal-stage-item">
                    <span className="modal-stage-icon">🍅</span>
                    <div>
                      <strong>4. {isFil ? 'Paglaki at Pagtigas ng Bunga (Fruit Development)' : 'Fruit / Pod Development'}</strong>
                      <p>{isFil ? 'Lumalaki at tumitigas ang mga bunga/pods. Kailangan ng pantay na dilig upang hindi pumutok ang balat.' : 'Fruits size up and develop firm structure. Maintain steady soil moisture to avoid fruit cracking.'}</p>
                    </div>
                  </div>
                  <div className="modal-stage-item">
                    <span className="modal-stage-icon">🧺</span>
                    <div>
                      <strong>5. {isFil ? 'Handa Nang Anihin (Ready for Harvest)' : 'Ready for Harvest'}</strong>
                      <p>{isFil ? 'Buo na ang kulay, lutong, at lasa. Pitasin sa maagang umaga upang manatiling sariwa at malutong.' : 'Optimal maturity and flavor reached. Pick during the cool early morning for maximum market freshness.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Predictions;