/**
 * ClimaYield-X Crop Dataset Parser & Vegetable Extractor
 * Automatically extracts vegetables mentioned in uploaded or inputted datasets
 * (CSV, JSON, column headers, or text) and maps them to clean Philippine vegetable configs.
 */

export const KNOWN_VEGETABLES = {
  alugbati: {
    id: 'alugbati',
    name: 'Malabar Spinach',
    filipinoName: 'Alugbati',
    icon: '🌿',
    daysToGrowEn: '30–45 days',
    daysToGrowFil: '30–45 araw',
    stageEn: 'Vegetative Vine & Leaf Growth',
    stageFil: 'Paglaki ng Baging at Dahon',
    stageStep: 2,
    progressPercent: 45,
    stageDescEn: 'Vigorous climbing vines producing thick, glossy edible succulent leaves.',
    stageDescFil: 'Mabilis na gumagapang na baging na may makakapal at makikintab na dahon.',
    aliases: ['alugbati', 'malabar spinach', 'basella alba', 'ceylon spinach']
  },
  ampalaya: {
    id: 'ampalaya',
    name: 'Bitter Gourd',
    filipinoName: 'Ampalaya',
    icon: '🥒',
    daysToGrowEn: '60–75 days',
    daysToGrowFil: '60–75 araw',
    stageEn: 'Fruit & Tendril Development',
    stageFil: 'Paglaki ng Bunga at Gapang sa Balag',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Climbing vines producing corrugated dark green bitter gourds along trellises.',
    stageDescFil: 'Gumagapang sa balag habang lumalaki ang mga kulubot at luntiang ampalaya.',
    aliases: ['ampalaya', 'ampalaya fruit', 'ampalaya fruit [bitter gourd]', 'bitter gourd', 'bitter melon', 'momordica charantia']
  },
  asparagus: {
    id: 'asparagus',
    name: 'Asparagus',
    filipinoName: 'Asparagus',
    icon: '🌱',
    daysToGrowEn: '70–90 days',
    daysToGrowFil: '70–90 araw',
    stageEn: 'Spear Emergence & Harvest',
    stageFil: 'Pagsibol ng mga Talbos ng Asparagus',
    stageStep: 5,
    progressPercent: 90,
    stageDescEn: 'Tender young succulent spears emerging from underground crowns.',
    stageDescFil: 'Sumisibol na malalambot at makatas na talbos mula sa ilalim ng lupa.',
    aliases: ['asparagus', 'esparago', 'asparagus officinalis']
  },
  basil: {
    id: 'basil',
    name: 'Basil',
    filipinoName: 'Balanoy',
    icon: '🌿',
    daysToGrowEn: '30–40 days',
    daysToGrowFil: '30–40 araw',
    stageEn: 'Foliage & Branching Growth',
    stageFil: 'Pagsasanga ng Mababangong Dahon',
    stageStep: 2,
    progressPercent: 50,
    stageDescEn: 'Fragrant herbal green leaves expanding with bushy lateral growth.',
    stageDescFil: 'Mabilis na nagsasanga at dumarami ang mababangong luntiang dahon.',
    aliases: ['basil', 'balanoy', 'sweet basil', 'ocimum basilicum']
  },
  beets: {
    id: 'beets',
    name: 'Beets',
    filipinoName: 'Remolatsa',
    icon: '🥔',
    daysToGrowEn: '50–65 days',
    daysToGrowFil: '50–65 araw',
    stageEn: 'Root Bulbing & Swelling',
    stageFil: 'Pagbilog ng Mapulang Ugat sa Lupa',
    stageStep: 3,
    progressPercent: 60,
    stageDescEn: 'Deep red nutritious taproot enlarging under rich, loose garden soil.',
    stageDescFil: 'Bumibilog at kumakapal ang mapulang ugat sa malambot na lupa.',
    aliases: ['beets', 'beet', 'beetroot', 'remolatsa', 'beta vulgaris']
  },
  broccoli: {
    id: 'broccoli',
    name: 'Broccoli',
    filipinoName: 'Brokoli',
    icon: '🥦',
    daysToGrowEn: '60–75 days',
    daysToGrowFil: '60–75 araw',
    stageEn: 'Head & Floret Formation',
    stageFil: 'Pagbuo ng Berdeng Kumpol ng Bulaklak',
    stageStep: 3,
    progressPercent: 70,
    stageDescEn: 'Compact deep green central floral head tightening for harvest.',
    stageDescFil: 'Bumubuo ng siksik at malutong na berdeng kumpol sa gitna.',
    aliases: ['broccoli', 'brokoli', 'brassica oleracea italica']
  },
  cabbage: {
    id: 'cabbage',
    name: 'Cabbage',
    filipinoName: 'Repolyo',
    icon: '🥬',
    daysToGrowEn: '65–80 days',
    daysToGrowFil: '65–80 araw',
    stageEn: 'Firm Head Cupping & Maturation',
    stageFil: 'Pagbuo at Pagbilog ng Makapal na Ulo',
    stageStep: 4,
    progressPercent: 80,
    stageDescEn: 'Dense round head forming crisp tightly wrapped outer leaves.',
    stageDescFil: 'Lumalapad at kumakapal ang mga dahon na bumubuo ng bilog na repolyo.',
    aliases: ['cabbage', 'repolyo', 'brassica oleracea capitata']
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    filipinoName: 'Karot',
    icon: '🥕',
    daysToGrowEn: '65–75 days',
    daysToGrowFil: '65–75 araw',
    stageEn: 'Taproot Elongation & Sweetening',
    stageFil: 'Paghaba at Pagtamis ng Kulay Kahel na Ugat',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Vibrant orange cylindrical root swelling in deep, friable seedbeds.',
    stageDescFil: 'Humahaba at lumalapad ang kulay kahel na ugat sa pinong lupa.',
    aliases: ['carrot', 'karot', 'dacus carota']
  },
  cauliflower: {
    id: 'cauliflower',
    name: 'Cauliflower',
    filipinoName: 'Koliplor',
    icon: '🥦',
    daysToGrowEn: '60–75 days',
    daysToGrowFil: '60–75 araw',
    stageEn: 'Curd Blanching & Formation',
    stageFil: 'Pagbuo ng Puting Curd o Kumpol',
    stageStep: 3,
    progressPercent: 70,
    stageDescEn: 'Dense creamy white curd protected by surrounding jacket leaves.',
    stageDescFil: 'Bumubuo ng maputing siksik na bulaklak na napapalibutan ng mga dahon.',
    aliases: ['cauliflower', 'koliplor', 'brassica oleracea botrytis']
  },
  celery: {
    id: 'celery',
    name: 'Celery',
    filipinoName: 'Kintsay',
    icon: '🌿',
    daysToGrowEn: '80–95 days',
    daysToGrowFil: '80–95 araw',
    stageEn: 'Petiole Stalk Thickening',
    stageFil: 'Pagkapal ng Malutong na Tangkay',
    stageStep: 3,
    progressPercent: 65,
    stageDescEn: 'Crisp ribbed stalks growing erect in moisture-retentive fertile beds.',
    stageDescFil: 'Tumatayo at kumakapal ang malulutong na tangkay ng celery.',
    aliases: ['celery', 'kintsay malalapad', 'seleri', 'apium graveolens']
  },
  chinese_cabbage: {
    id: 'chinese_cabbage',
    name: 'Chinese Cabbage',
    filipinoName: 'Pechay Baguio',
    icon: '🥬',
    daysToGrowEn: '50–65 days',
    daysToGrowFil: '50–65 araw',
    stageEn: 'Elongated Head Tightening',
    stageFil: 'Paghaba at Pagkumpol ng Pechay Baguio',
    stageStep: 3,
    progressPercent: 70,
    stageDescEn: 'Crisp cylindrical head with tender, pale green sweet leaves.',
    stageDescFil: 'Humahaba at sumisiksik ang malalapad at matatamis na dahon.',
    aliases: ['chinese cabbage', 'wongbok', 'pechay baguio', 'chinese cabbage (wongbok, pechay baguio)', 'napa cabbage']
  },
  chives: {
    id: 'chives',
    name: 'Chives',
    filipinoName: 'Kutsay',
    icon: '🌱',
    daysToGrowEn: '30–45 days',
    daysToGrowFil: '30–45 araw',
    stageEn: 'Slender Hollow Leaf Growth',
    stageFil: 'Pagtubo ng Matutulis na Dahon ng Kutsay',
    stageStep: 2,
    progressPercent: 50,
    stageDescEn: 'Clumping slender hollow foliage with delicate onion zest.',
    stageDescFil: 'Kumpol-kumpol na matutulis na berdeng dahon na may banayad na lasang sibuyas.',
    aliases: ['chives', 'kutsay', 'allium schoenoprasum', 'garlic chives']
  },
  coriander: {
    id: 'coriander',
    name: 'Coriander / Cilantro',
    filipinoName: 'Wansoy',
    icon: '🌿',
    daysToGrowEn: '30–40 days',
    daysToGrowFil: '30–40 araw',
    stageEn: 'Feathery Foliage Emergence',
    stageFil: 'Pag-usbong ng Mabangong Dahon ng Wansoy',
    stageStep: 2,
    progressPercent: 45,
    stageDescEn: 'Fragrant, delicate feathery green leaves prized for culinary seasoning.',
    stageDescFil: 'Mabangong pino at berde ang dahon; mainam na pampalasa sa ulam.',
    aliases: ['coriander', 'wansoy', 'cilantro', 'coriandrum sativum']
  },
  cowpea: {
    id: 'cowpea',
    name: 'Cowpea (Green)',
    filipinoName: 'Paayap',
    icon: '🫛',
    daysToGrowEn: '45–55 days',
    daysToGrowFil: '45–55 araw',
    stageEn: 'Pod Filling & Maturation',
    stageFil: 'Pamumunga at Paghaba ng Pod ng Paayap',
    stageStep: 4,
    progressPercent: 80,
    stageDescEn: 'Drought-resilient bushy legumes setting clusters of nutritious green pods.',
    stageDescFil: 'Matibay sa init na pananim na namumunga ng masusustansyang pod.',
    aliases: ['cowpea, green', 'cowpea', 'paayap', 'black-eyed pea', 'vigna unguiculata cylindrica']
  },
  cucumber: {
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
    stageDescFil: 'Tuwid at malulutong na berdeng pipino sa balag.',
    aliases: ['cucumber', 'pipino', 'cuke', 'cucumis sativus']
  },
  eggplant: {
    id: 'eggplant',
    name: 'Eggplant',
    filipinoName: 'Talong',
    icon: '🍆',
    daysToGrowEn: '65–75 days',
    daysToGrowFil: '65–75 araw',
    stageEn: 'Vegetative & Stalk Growth',
    stageFil: 'Paglaki ng Sangay at Tangkay',
    stageStep: 2,
    progressPercent: 50,
    stageDescEn: 'Vigorous shoot growth and strong stalk establishment.',
    stageDescFil: 'Mabilis na paghaba ng sangay at pagtibay ng ugat bago mamulaklak.',
    aliases: ['eggplant', 'talong', 'aubergine', 'brinjal', 'solanum melongena']
  },
  gisantes: {
    id: 'gisantes',
    name: 'Garden Pea',
    filipinoName: 'Gisantes',
    icon: '🫛',
    daysToGrowEn: '55–65 days',
    daysToGrowFil: '55–65 araw',
    stageEn: 'Pod Swelling & Sugar Filling',
    stageFil: 'Pagbilog at Pagtamis ng Buto sa Pod',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Sweet plump green pods swelling with tender, vitamin-rich edible peas.',
    stageDescFil: 'Bumibilog ang mga buto sa loob ng pod at lalong tumatamis.',
    aliases: ['gisantes', 'gisantes [garden pea]', 'garden pea', 'green pea', 'pisum sativum']
  },
  habitchuelas: {
    id: 'habitchuelas',
    name: 'Snap Beans',
    filipinoName: 'Habitchuelas',
    icon: '🫛',
    daysToGrowEn: '45–55 days',
    daysToGrowFil: '45–55 araw',
    stageEn: 'Crisp Tender Pod Elongation',
    stageFil: 'Paghaba ng Malulutong na Baguio Beans',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Succulent stringless snap beans thriving in high-elevation and temperate soils.',
    stageDescFil: 'Humahaba ang malulutong at sariwang beans na masarap igisa.',
    aliases: ['habitchuelas', 'habitchuelas [snap beans]', 'snap beans', 'baguio beans', 'french beans', 'phaseolus vulgaris']
  },
  kangkong: {
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
    stageDescFil: 'Mabilis na sumasanga ang mga malalambot na usbong at talbos.',
    aliases: ['kangkong', 'kangkong [swamp cabbage]', 'water spinach', 'swamp cabbage', 'ipomoea aquatica']
  },
  kinchay: {
    id: 'kinchay',
    name: 'Chinese Celery',
    filipinoName: 'Kinchay',
    icon: '🌿',
    daysToGrowEn: '40–50 days',
    daysToGrowFil: '40–50 araw',
    stageEn: 'Aromatic Leaf Clump Development',
    stageFil: 'Mabangong Pagsibol ng Kinchay',
    stageStep: 2,
    progressPercent: 55,
    stageDescEn: 'Slender, intensely fragrant stalks and leaves widely used for seasoning.',
    stageDescFil: 'Payat ngunit napakabangong mga tangkay at dahon na pampalasa sa sabaw.',
    aliases: ['kinchay', 'chinese celery', 'apium graveolens secalinum']
  },
  kulitis: {
    id: 'kulitis',
    name: 'Amaranth Greens',
    filipinoName: 'Kulitis',
    icon: '🌿',
    daysToGrowEn: '25–35 days',
    daysToGrowFil: '25–35 araw',
    stageEn: 'Leafy Foliage Flurry',
    stageFil: 'Mabilis na Pagsibol ng Masustansyang Dahon',
    stageStep: 2,
    progressPercent: 45,
    stageDescEn: 'Hardy indigenous leafy greens rich in iron and dietary fiber.',
    stageDescFil: 'Katutubong gulay na mabilis tumubo at sagana sa protina at mineral.',
    aliases: ['kulitis', 'amaranth', 'uray', 'native spinach', 'amaranthus viridis']
  },
  lettuce: {
    id: 'lettuce',
    name: 'Lettuce',
    filipinoName: 'Letsugas',
    icon: '🥗',
    daysToGrowEn: '25–35 days',
    daysToGrowFil: '25–35 araw',
    stageEn: 'Head Formation',
    stageFil: 'Pagbuo ng Kumpol ng Dahon',
    stageStep: 3,
    progressPercent: 65,
    stageDescEn: 'Forming tight, crisp heads with tender sweet foliage.',
    stageDescFil: 'Bumubuo ng makakapal at malulutong na kumpol ng dahon.',
    aliases: ['lettuce', 'letsugas', 'salad greens', 'lactuca sativa']
  },
  mustasa: {
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
    stageDescFil: 'Ganap nang malaki at malutong; handa nang anihin ngayong umaga.',
    aliases: ['mustasa', 'mustard', 'mustard greens', 'brassica juncea']
  },
  okra: {
    id: 'okra',
    name: 'Okra',
    filipinoName: 'Okra',
    icon: '🌱',
    daysToGrowEn: '45–50 days',
    daysToGrowFil: '45–50 araw',
    stageEn: 'Pod Setting',
    stageFil: 'Pamumunga ng Daliri ng Okra',
    stageStep: 3,
    progressPercent: 70,
    stageDescEn: 'Blossoms setting tender green pods that grow rapidly.',
    stageDescFil: 'Namumulaklak at lumalabas ang malalambot na daliri ng okra.',
    aliases: ['okra', 'okra [lady\'s finger]', 'lady finger', 'ladyfinger', 'abelmoschus esculentus']
  },
  onion_leeks: {
    id: 'onion_leeks',
    name: 'Leeks',
    filipinoName: 'Dahon ng Sibuyas',
    icon: '🌱',
    daysToGrowEn: '60–75 days',
    daysToGrowFil: '60–75 araw',
    stageEn: 'Stem Thickening & Blanched Sheaths',
    stageFil: 'Pagkapal ng Puting Tangkay',
    stageStep: 3,
    progressPercent: 65,
    stageDescEn: 'Thick cylindrical succulent stems packed with rich savory aromatics.',
    stageDescFil: 'Lumalapad at kumakapal ang puting tangkay sa ilalim ng lupa.',
    aliases: ['onion leeks', 'leeks', 'leek', 'allium ampeloprasum']
  },
  parsley: {
    id: 'parsley',
    name: 'Parsley',
    filipinoName: 'Pasli',
    icon: '🌿',
    daysToGrowEn: '45–60 days',
    daysToGrowFil: '45–60 araw',
    stageEn: 'Bushy Herb Clustering',
    stageFil: 'Makapal na Kumpol ng Dahon ng Parsley',
    stageStep: 2,
    progressPercent: 50,
    stageDescEn: 'Dense bright green curled or flat leaves loaded with vitamins A & C.',
    stageDescFil: 'Siksik at matingkad na berdeng dahon na hitik sa bitamina.',
    aliases: ['parsley', 'curly parsley', 'flat leaf parsley', 'petroselinum crispum']
  },
  patola: {
    id: 'patola',
    name: 'Sponge Gourd',
    filipinoName: 'Patola',
    icon: '🥒',
    daysToGrowEn: '50–65 days',
    daysToGrowFil: '50–65 araw',
    stageEn: 'Tender Gourd Hanging & Sizing',
    stageFil: 'Lumalaking Bunga sa Balag',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Long ridged cylindrical gourds hanging gracefully from climbing trellises.',
    stageDescFil: 'Nakabitin sa balag ang mahahabang berdeng bunga ng patola.',
    aliases: ['patola', 'sponge gourd', 'luffa', 'luffa acutangula', 'silk gourd']
  },
  pechay: {
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
    stageDescFil: 'Mabilis na lumalapad at lumalaki ang mga sariwang berdeng dahon.',
    aliases: ['pechay', 'petsay', 'bok choy', 'bokchoy', 'pak choi', 'brassica rapa']
  },
  pechay_native: {
    id: 'pechay_native',
    name: 'Native Pechay',
    filipinoName: 'Pechay Tagalog',
    icon: '🥬',
    daysToGrowEn: '25–30 days',
    daysToGrowFil: '25–30 araw',
    stageEn: 'Crisp Petiole & Leaf Spread',
    stageFil: 'Paglapad ng Puting Tangkay ng Pechay Tagalog',
    stageStep: 2,
    progressPercent: 45,
    stageDescEn: 'Traditional open-pollinated Philippine variety with tender crunchy stalks.',
    stageDescFil: 'Katutubong pechay na may malutong na puting tangkay at sariwang dahon.',
    aliases: ['pechay, native', 'native pechay', 'pechay tagalog']
  },
  pepper: {
    id: 'pepper',
    name: 'Chili Pepper',
    filipinoName: 'Sili',
    icon: '🌶️',
    daysToGrowEn: '60–70 days',
    daysToGrowFil: '60–70 araw',
    stageEn: 'Flowering & Fruiting',
    stageFil: 'Pamumulaklak at Pamumunga',
    stageStep: 3,
    progressPercent: 65,
    stageDescEn: 'Glossy peppers developing vibrant color and pungent or sweet flavor.',
    stageDescFil: 'Namumulaklak at namumunga ng makikintab na sili.',
    aliases: ['pepper', 'sili', 'capsicum annuum']
  },
  bell_pepper: {
    id: 'bell_pepper',
    name: 'Bell Pepper',
    filipinoName: 'Siling Atsara',
    icon: '🫑',
    daysToGrowEn: '65–80 days',
    daysToGrowFil: '65–80 araw',
    stageEn: 'Blocky Fruit Expansion & Color Turn',
    stageFil: 'Paglaki at Pagkapal ng Bunga ng Bell Pepper',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Thick-walled sweet lobed fruits ripening from emerald green to bright red.',
    stageDescFil: 'Malalapad at makakapal na bunga na tumatamis habang nahihinog.',
    aliases: ['pepper, bell', 'bell pepper', 'sweet pepper', 'siling atsara', 'capsicum annuum grossum']
  },
  finger_pepper: {
    id: 'finger_pepper',
    name: 'Finger Pepper',
    filipinoName: 'Siling Haba',
    icon: '🌶️',
    daysToGrowEn: '55–65 days',
    daysToGrowFil: '55–65 araw',
    stageEn: 'Long Slender Pod Maturation',
    stageFil: 'Paghaba ng Makinis na Siling Pangsigang',
    stageStep: 4,
    progressPercent: 70,
    stageDescEn: 'Smooth elongated pale green spicy peppers essential for Filipino sinigang.',
    stageDescFil: 'Mahahaba at makikinis na siling panigang na pampagana sa sabaw.',
    aliases: ['pepper, finger', 'finger pepper', 'siling haba', 'siling pangsigang', 'espada']
  },
  radish: {
    id: 'radish',
    name: 'Radish',
    filipinoName: 'Labanos',
    icon: '🥕',
    daysToGrowEn: '30–35 days',
    daysToGrowFil: '30–35 araw',
    stageEn: 'Root Bulbing & Thickening',
    stageFil: 'Paglapad ng Ugat sa Lupa',
    stageStep: 3,
    progressPercent: 60,
    stageDescEn: 'Crisp white root core thickening rapidly in loose soil.',
    stageDescFil: 'Bumubuo at kumakapal ang puting ugat sa malambot na lupa.',
    aliases: ['radish', 'labanos', 'white radish', 'daikon', 'raphanus sativus']
  },
  saluyot: {
    id: 'saluyot',
    name: 'Jute Mallow',
    filipinoName: 'Saluyot',
    icon: '🌿',
    daysToGrowEn: '30–40 days',
    daysToGrowFil: '30–40 araw',
    stageEn: 'Branching Shoot & Leaf Harvest',
    stageFil: 'Pagsasanga ng Malalambot na Talbos ng Saluyot',
    stageStep: 2,
    progressPercent: 50,
    stageDescEn: 'Nutrient-dense native leafy vegetable celebrated for mucilaginous healthy soups.',
    stageDescFil: 'Masustansyang madahong gulay na masarap sa dinengdeng at bulanglang.',
    aliases: ['saluyot', 'jute mallow', 'jute', 'corchorus olitorius', 'ewedu']
  },
  sigarilyas: {
    id: 'sigarilyas',
    name: 'Winged Beans',
    filipinoName: 'Sigarilyas',
    icon: '🫛',
    daysToGrowEn: '60–75 days',
    daysToGrowFil: '60–75 araw',
    stageEn: 'Four-Cornered Pod Setting',
    stageFil: 'Pamumunga ng May-Pakpak na Pod ng Sigarilyas',
    stageStep: 4,
    progressPercent: 80,
    stageDescEn: 'Unique four-winged frilled pods providing complete edible plant protein.',
    stageDescFil: 'Bihirang gulay na may apat na pakpak; mayaman sa protina at sustansya.',
    aliases: ['sigarilyas', 'sigarilyas [winged beans]', 'winged beans', 'winged bean', 'kalamismis', 'psophocarpus tetragonolobus']
  },
  singkamas: {
    id: 'singkamas',
    name: 'Jicama',
    filipinoName: 'Singkamas',
    icon: '🥔',
    daysToGrowEn: '75–90 days',
    daysToGrowFil: '75–90 araw',
    stageEn: 'Tuberous Root Enlarging',
    stageFil: 'Paglaki at Pagtubig ng Matamis na Singkamas',
    stageStep: 3,
    progressPercent: 65,
    stageDescEn: 'Crisp, juicy sweet white tuberous flesh under sandy garden hills.',
    stageDescFil: 'Lumalaki at nagtutubig ang matamis at malutong na laman sa ilalim ng lupa.',
    aliases: ['singkamas', 'singkamas [turnip]', 'jicama', 'yam bean', 'pachyrhizus erosus']
  },
  sitao: {
    id: 'sitao',
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
    stageDescFil: 'Humahaba at lumalambot ang mga pod ng sitaw sa balag.',
    aliases: ['sitao', 'sitao [stringbeans]', 'sitaw', 'stringbeans', 'string beans', 'yardlong bean', 'vigna unguiculata sesquipedalis']
  },
  spinach: {
    id: 'spinach',
    name: 'Spinach',
    filipinoName: 'Espinaka',
    icon: '🥬',
    daysToGrowEn: '30–40 days',
    daysToGrowFil: '30–40 araw',
    stageEn: 'Rosette Foliage Formation',
    stageFil: 'Pagdami ng Malalambot na Dahon ng Espinaka',
    stageStep: 2,
    progressPercent: 50,
    stageDescEn: 'Dark green crinkled leaves rich in vitamins, antioxidants, and iron.',
    stageDescFil: 'Malalambot at makukulubot na berdeng dahon na sagana sa iron.',
    aliases: ['spinach', 'espinaka', 'spinacia oleracea']
  },
  spring_onion: {
    id: 'spring_onion',
    name: 'Spring Onion',
    filipinoName: 'Dahon ng Sibuyas',
    icon: '🌱',
    daysToGrowEn: '40–50 days',
    daysToGrowFil: '40–50 araw',
    stageEn: 'Tubular Stalk Elongation',
    stageFil: 'Paghaba ng Berdeng Dahon ng Sibuyas',
    stageStep: 2,
    progressPercent: 55,
    stageDescEn: 'Tender green hollow tubes with mild pungent white root base.',
    stageDescFil: 'Humahaba ang mga berdeng uhay na may puting ugat na pampabango sa pagkain.',
    aliases: ['spring onion', 'scallion', 'green onion', 'dahon ng sibuyas', 'allium fistulosum']
  },
  squash: {
    id: 'squash',
    name: 'Squash',
    filipinoName: 'Kalabasa',
    icon: '🎃',
    daysToGrowEn: '80–95 days',
    daysToGrowFil: '80–95 araw',
    stageEn: 'Fruit Swelling & Golden Flesh Matures',
    stageFil: 'Paglaki at Pagdilaw ng Bunga ng Kalabasa',
    stageStep: 4,
    progressPercent: 80,
    stageDescEn: 'Vigorous creeping vines setting heavy golden-orange nutritious squash.',
    stageDescFil: 'Gumagapang na baging na may mabibigat at manilaw-nilaw na bunga ng kalabasa.',
    aliases: ['squash fruit', 'squash', 'kalabasa', 'pumpkin', 'cucurbita moschata']
  },
  sweet_peas: {
    id: 'sweet_peas',
    name: 'Sweet Peas',
    filipinoName: 'Sitsaro',
    icon: '🫛',
    daysToGrowEn: '50–60 days',
    daysToGrowFil: '50–60 araw',
    stageEn: 'Flat Edible Pod Development',
    stageFil: 'Paglapad ng Malutong na Sitsaro',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Crisp edible flat pods with sweet miniature developing peas.',
    stageDescFil: 'Malalapad at malulutong na sitsaro na paboritong ihalo sa pansit at chopsuey.',
    aliases: ['sweet peas', 'sweet pea', 'sitsaro', 'chicharo', 'snow peas', 'mangetout']
  },
  talinum: {
    id: 'talinum',
    name: 'Philippine Spinach',
    filipinoName: 'Talinum',
    icon: '🌿',
    daysToGrowEn: '20–30 days',
    daysToGrowFil: '20–30 araw',
    stageEn: 'Succulent Leaf Emergence',
    stageFil: 'Pagsibol ng Makatas na Dahon ng Talinum',
    stageStep: 2,
    progressPercent: 45,
    stageDescEn: 'Fleshy tender succulent leaves thriving under tropical warmth and rains.',
    stageDescFil: 'Makatas at malambot na dahon na patuloy na sumisibol sa buong taon.',
    aliases: ['talinum', 'waterleaf', 'fameflower', 'talinum triangulare', 'philippine spinach']
  },
  tomato: {
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
    stageDescFil: 'Lumalaki at tumitigas ang mga bunga; malapit nang mamula.',
    aliases: ['tomato', 'kamatis', 'tomatoes', 'solanum lycopersicum']
  },
  upo: {
    id: 'upo',
    name: 'Bottle Gourd',
    filipinoName: 'Upo',
    icon: '🥒',
    daysToGrowEn: '60–75 days',
    daysToGrowFil: '60–75 araw',
    stageEn: 'Fruit Elongation on Overhead Trellis',
    stageFil: 'Paglaki at Paghaba ng Upo sa Balag',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Light green smooth gourds hanging from trellis pergolas with juicy white flesh.',
    stageDescFil: 'Makinis at mahabang bunga ng upo na nakabitin sa pergola ng balag.',
    aliases: ['upo', 'upo [bottle gourd]', 'bottle gourd', 'calabash', 'lagenaria siceraria']
  },
  watercress: {
    id: 'watercress',
    name: 'Watercress',
    filipinoName: 'Kress',
    icon: '🌿',
    daysToGrowEn: '30–40 days',
    daysToGrowFil: '30–40 araw',
    stageEn: 'Running Stolon & Leaf Rosettes',
    stageFil: 'Pagsanga sa Tubig ng Masustansyang Watercress',
    stageStep: 2,
    progressPercent: 50,
    stageDescEn: 'Peppery aquatic green sprigs harvested fresh from clean flowing garden beds.',
    stageDescFil: 'Sariwang sumasanga sa malinis na tubig na may banayad na anghang at pait.',
    aliases: ['watercress', 'kress', 'nasturtium officinale']
  },
  young_corn: {
    id: 'young_corn',
    name: 'Baby Corn',
    filipinoName: 'Batang Mais',
    icon: '🌽',
    daysToGrowEn: '45–55 days',
    daysToGrowFil: '45–55 araw',
    stageEn: 'Silking & Early Ear Emergence',
    stageFil: 'Pagsibol ng Bunga bago Magkabutol',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Tender unfertilized golden miniature ears picked right as silk appears.',
    stageDescFil: 'Bata at malambot na mais na inaani habang sariwa pa ang buhok.',
    aliases: ['young corn', 'baby corn', 'batang mais', 'corn ear', 'sweet corn ear']
  },
  zucchini: {
    id: 'zucchini',
    name: 'Zucchini',
    filipinoName: 'Kalabasang Zucchini',
    icon: '🥒',
    daysToGrowEn: '45–55 days',
    daysToGrowFil: '45–55 araw',
    stageEn: 'Bush Blossom & Fruit Setting',
    stageFil: 'Pamumunga ng Makinis na Zucchini',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Prolific non-trailing squash setting cylindrical tender dark green fruits.',
    stageDescFil: 'Mabilis mamunga ng makikinis at malalambot na berdeng zucchini sa gilid ng halaman.',
    aliases: ['zucchini', 'kalabasang zucchini', 'courgette', 'cucurbita pepo']
  }
};

/**
 * Robust lightweight CSV line parser
 */
export function parseCSVToRows(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Parse header
  const parseLine = (line) => {
    const entries = [];
    let insideQuote = false;
    let currentEntry = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        entries.push(currentEntry.trim().replace(/^"|"$/g, ''));
        currentEntry = '';
      } else {
        currentEntry += char;
      }
    }
    entries.push(currentEntry.trim().replace(/^"|"$/g, ''));
    return entries;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length || values.length > 1) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Validation helper: determines if a string is a date, number, float, or dataset/weather metric header
 * and NOT an actual vegetable name.
 */
export function isInvalidVegetableToken(str) {
  if (!str || typeof str !== 'string') return true;
  const s = str.trim();
  if (s.length === 0) return true;

  // Numbers, integers, decimals, negatives (e.g. "2019", "30.7", "22.50", "82.0", "140.0")
  if (/^-?\d+(\.\d+)?$/.test(s)) return true;

  // Dates formatted as YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD (e.g. "2019-01-01")
  if (/^\d{2,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(s)) return true;

  // Strings without any alphabet characters (e.g. "---", "2019/01", "140.0")
  if (!/[a-zA-Z]/.test(s)) return true;

  // Standard dataset/weather column headers and non-crop metadata
  const clean = s.toLowerCase().replace(/[\s_.-]+/g, '');
  const nonCrops = new Set([
    'date', 'year', 'month', 'day', 'time', 'timestamp',
    'rainfall', 'rain', 'precipitation', 'maxtemp', 'mintemp', 'temp', 'temperature',
    'humidity', 'relhumidity', 'wind', 'windspeed', 'dew', 'dewpoint', 'heatindex',
    'yield', 'cropyield', 'production', 'area', 'harvested',
    'station', 'elevation', 'lat', 'latitude', 'lon', 'longitude', 'press', 'pressure',
    'id', 'row', 'index', 'status', 'total', 'average', 'mean', 'datasetcrop'
  ]);
  if (nonCrops.has(clean)) return true;

  return false;
}

/**
 * Standard 6 Philippine Short-Cycle Urban Vegetables for Quezon City
 */
export const STANDARD_PHILIPPINE_VEGETABLES = [
  {
    id: 'tomato',
    name: 'Tomato',
    filipinoName: 'Kamatis',
    icon: '🍅',
    variety: 'Diamante Max / Improved F1',
    daysToGrowEn: '60–70 days',
    daysToGrowFil: '60–70 araw',
    stageEn: 'Fruit Development',
    stageFil: 'Lumalaking Bunga',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Optimal solar radiation and moderate rainfall favor fruit firmness and reduce cracking risks.',
    stageDescFil: 'Maganda ang sikat ng araw at ulan para tumigas ang bunga at hindi pumutok.'
  },
  {
    id: 'eggplant',
    name: 'Eggplant',
    filipinoName: 'Talong',
    icon: '🍆',
    variety: 'Dumaguete Long Purple / Morena',
    daysToGrowEn: '65–75 days',
    daysToGrowFil: '65–75 araw',
    stageEn: 'Vegetative & Stalk Growth',
    stageFil: 'Paglaki ng Sangay at Tangkay',
    stageStep: 2,
    progressPercent: 50,
    stageDescEn: 'Nighttime temperatures (24°C) preserve flower buds and support healthy calyx elongation.',
    stageDescFil: 'Maganda ang lamig sa gabi (24°C) para hindi malaglag ang bulaklak at maging maganda ang bunga.'
  },
  {
    id: 'pechay',
    name: 'Pechay',
    filipinoName: 'Pechay',
    icon: '🥬',
    variety: 'Black Behi / Pavito',
    daysToGrowEn: '25–30 days',
    daysToGrowFil: '25–30 araw',
    stageEn: 'Vegetative Foliage Growth',
    stageFil: 'Paglaki ng Dahon at Tangkay',
    stageStep: 2,
    progressPercent: 40,
    stageDescEn: 'High relative humidity stimulates tender leaf growth; watch for drainage to avoid bacterial soft rot.',
    stageDescFil: 'Mataas ang moisture sa hangin kaya mabilis lumaki ang dahon; ingatan ang kanal para hindi mabulok.'
  },
  {
    id: 'bellpepper',
    name: 'Bell Pepper & Chili',
    filipinoName: 'Sili at Paminta',
    icon: '🌶️',
    variety: 'Django F1 / Red Wonder',
    daysToGrowEn: '65–80 days',
    daysToGrowFil: '65–80 araw',
    stageEn: 'Blocky Fruit Expansion & Color Turn',
    stageFil: 'Paglaki at Pagkapal ng Bunga ng Bell Pepper',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Steady daytime temperature gradient prevents flower shedding and improves fruit crispness.',
    stageDescFil: 'Tamang init sa araw ang pumipigil sa pagkalagas ng bulaklak at nagpapaganda sa kulay ng sili.'
  },
  {
    id: 'mustard',
    name: 'Mustard Greens',
    filipinoName: 'Mustasa',
    icon: '🌱',
    variety: 'Monteverde / Early Green',
    daysToGrowEn: '25–32 days',
    daysToGrowFil: '25–32 araw',
    stageEn: 'Ready for Harvest',
    stageFil: 'Handa nang Anihin',
    stageStep: 5,
    progressPercent: 100,
    stageDescEn: 'Favorable morning humidity accelerates petiole crispness and broad leaf development.',
    stageDescFil: 'Ang hamog sa umaga ay nagpapadali sa paglaki at paglutong ng mga dahon.'
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    filipinoName: 'Pipino',
    icon: '🥒',
    variety: 'Gov. F1 / Poinsett 76',
    daysToGrowEn: '45–50 days',
    daysToGrowFil: '45–50 araw',
    stageEn: 'Fruit Development',
    stageFil: 'Paglaki ng Bunga',
    stageStep: 4,
    progressPercent: 75,
    stageDescEn: 'Ample root hydration from light afternoon rain promotes continuous cucumber elongation.',
    stageDescFil: 'Ang katamtamang basa sa lupa dahil sa ambon ay tumutulong sa tuloy-tuloy na paghaba ng pipino.'
  }
];

/**
 * Sanitizes an array of dataset crops, replacing any dates/numbers with authentic Philippine vegetables
 */
export function sanitizeDatasetCrops(cropsList) {
  if (!Array.isArray(cropsList) || cropsList.length === 0) return { sanitized: [], wasModified: false };

  let wasModified = false;
  const sanitized = cropsList.map((crop, idx) => {
    const rawName = String(crop?.name || crop?.id || '').trim();
    if (isInvalidVegetableToken(rawName)) {
      wasModified = true;
      const fallback = STANDARD_PHILIPPINE_VEGETABLES[idx % STANDARD_PHILIPPINE_VEGETABLES.length];
      return {
        ...crop,
        id: fallback.id,
        name: fallback.name,
        filipinoName: fallback.filipinoName,
        icon: fallback.icon,
        variety: fallback.variety,
        daysToGrowEn: fallback.daysToGrowEn,
        daysToGrowFil: fallback.daysToGrowFil,
        stageEn: fallback.stageEn,
        stageFil: fallback.stageFil,
        stageStep: fallback.stageStep,
        progressPercent: fallback.progressPercent,
        stageDescEn: fallback.stageDescEn,
        stageDescFil: fallback.stageDescFil,
        isCustom: false
      };
    }
    return crop;
  });

  return { sanitized, wasModified };
}

/**
 * Match a raw crop token (e.g. "kamatis", "Tomato", "Pechay (Black Behi)") to a vegetable configuration
 */
export function matchVegetable(token, strictMode = false) {
  if (!token || typeof token !== 'string') return null;
  if (isInvalidVegetableToken(token)) return null;

  const clean = token.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

  for (const [key, cropConfig] of Object.entries(KNOWN_VEGETABLES)) {
    if (clean === key || clean.includes(key)) {
      return { ...cropConfig };
    }
    for (const alias of cropConfig.aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      if (clean === cleanAlias || clean.includes(cleanAlias) || cleanAlias.includes(clean)) {
        return { ...cropConfig };
      }
    }
  }

  // Only allow custom crop creation if not in strict mode AND contains letters
  if (!strictMode && clean.length >= 3 && /[a-zA-Z]{2,}/.test(token)) {
    const titleCase = token.trim().charAt(0).toUpperCase() + token.trim().slice(1);
    return {
      id: clean.replace(/\s+/g, '_'),
      name: titleCase,
      filipinoName: titleCase,
      icon: '🌱',
      daysToGrowEn: '35–45 days',
      daysToGrowFil: '35–45 araw',
      stageEn: 'Active Plant Development',
      stageFil: 'Aktibong Paglaki ng Pananim',
      stageStep: 3,
      progressPercent: 55,
      stageDescEn: `Cultivating ${titleCase} according to dataset specifications.`,
      stageDescFil: `Inaalagaan ang ${titleCase} ayon sa nakasaad sa dataset.`,
      isCustom: true
    };
  }

  return null;
}

// Parse total days from string like "30–45 days"
export function parseTotalDays(daysStr) {
  const nums = String(daysStr || '').match(/\d+/g);
  const val = nums ? parseInt(nums[nums.length - 1], 10) : NaN;
  return Number.isFinite(val) && val >= 10 ? val : 45;
}

/**
 * Extract all vegetables mentioned in ANY dataset (array of rows, CSV string, or filename)
 * and automatically calibrate plant age, growth stage, and dataset yield metrics.
 */
export function extractCropsFromDataset(dataInput, filename = '') {
  let rows = [];

  if (typeof dataInput === 'string') {
    rows = parseCSVToRows(dataInput);
  } else if (Array.isArray(dataInput)) {
    rows = dataInput;
  } else if (dataInput && typeof dataInput === 'object') {
    rows = dataInput.data || dataInput.rows || dataInput.preview || [];
  }

  const detectedMap = new Map();
  const cropRowsMap = new Map();

  // Helper to record rows per crop
  const addCropRow = (cropId, row) => {
    if (!cropRowsMap.has(cropId)) cropRowsMap.set(cropId, []);
    cropRowsMap.get(cropId).push(row);
  };

  // 1. Search in explicit Crop Column(s)
  if (rows.length > 0) {
    const headers = Object.keys(rows[0] || {});
    const cropColKey = headers.find(h => /^(crop|vegetable|commodity|pananim|plant|product|crop_name|cropname)$/i.test(h.trim()));

    if (cropColKey) {
      rows.forEach(r => {
        const val = r[cropColKey];
        if (val) {
          const matched = matchVegetable(String(val), false);
          if (matched) {
            if (!detectedMap.has(matched.id)) {
              detectedMap.set(matched.id, matched);
            }
            addCropRow(matched.id, r);
          }
        }
      });
    }

    // 2. Search in Column Headers (e.g. "Tomato_Yield", "Pechay_Harvest", "Mustasa")
    headers.forEach(h => {
      const cleanHeader = h.toLowerCase().replace(/[\s_-]+/g, ' ');
      for (const [key, cropConfig] of Object.entries(KNOWN_VEGETABLES)) {
        if (cleanHeader.includes(key) || cropConfig.aliases.some(a => cleanHeader.includes(a))) {
          if (!detectedMap.has(cropConfig.id)) {
            detectedMap.set(cropConfig.id, { ...cropConfig });
          }
          // Associate matching rows
          rows.forEach(r => addCropRow(cropConfig.id, r));
        }
      }
    });

    // 3. Scan row string values STRICTLY for known vegetables only (prevents dates/numbers from being crops)
    if (detectedMap.size === 0) {
      for (const row of rows.slice(0, 100)) {
        for (const val of Object.values(row)) {
          if (typeof val === 'string' && val.length > 2 && val.length < 35) {
            const matched = matchVegetable(val, true);
            if (matched) {
              if (!detectedMap.has(matched.id)) {
                detectedMap.set(matched.id, matched);
              }
              addCropRow(matched.id, row);
            }
          }
        }
      }
    }

    // 4. If dataset contains Crop_Yield or agricultural data without a crop column, supply standard vegetables
    if (detectedMap.size === 0) {
      const hasYieldCol = headers.some(h => /^(crop_yield|yield|production|cropyield)$/i.test(h.trim()));
      if (hasYieldCol) {
        STANDARD_PHILIPPINE_VEGETABLES.forEach(c => {
          detectedMap.set(c.id, { ...c });
          rows.forEach(r => addCropRow(c.id, r));
        });
      }
    }
  }

  // 5. Check filename mentions (e.g. "pechay_production_2024.csv")
  if (filename) {
    const cleanFn = filename.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    for (const [key, cropConfig] of Object.entries(KNOWN_VEGETABLES)) {
      if (cleanFn.includes(key) || cropConfig.aliases.some(a => cleanFn.includes(a))) {
        if (!detectedMap.has(cropConfig.id)) {
          detectedMap.set(cropConfig.id, { ...cropConfig });
        }
      }
    }
  }

  // Enhance all detected crops with automatic dataset metrics
  const detectedList = Array.from(detectedMap.values()).map(crop => {
    const cropRows = cropRowsMap.get(crop.id) || [];
    let detectedAge = null;
    let detectedStage = null;
    let yields = [];
    let areas = [];

    if (cropRows.length > 0) {
      const headers = Object.keys(cropRows[0] || {});
      const ageCol = headers.find(h => /^(plant_?age|days?_?planted|age_?days|crop_?age|days?|current_?day)$/i.test(h.trim()));
      const plantDateCol = headers.find(h => /^(planting_?date|plant_?date|date_?planted)$/i.test(h.trim()));
      const dateCol = headers.find(h => /^(date|petsa|record_?date)$/i.test(h.trim()));
      const stageCol = headers.find(h => /^(stage|growth_?stage|phase|yugto)$/i.test(h.trim()));
      const yieldCol = headers.find(h => /^(crop_?yield|yield|yield_mt_per_ha|volume_mt|production)$/i.test(h.trim()));
      const areaCol = headers.find(h => /^(area_ha|area)$/i.test(h.trim()));

      for (const r of cropRows) {
        if (ageCol && r[ageCol] !== undefined && r[ageCol] !== '') {
          const num = parseInt(r[ageCol], 10);
          if (Number.isFinite(num) && num > 0) detectedAge = num;
        }
        if (yieldCol && r[yieldCol] !== undefined && r[yieldCol] !== '') {
          const yNum = parseFloat(r[yieldCol]);
          if (Number.isFinite(yNum) && yNum > 0) yields.push(yNum);
        }
        if (areaCol && r[areaCol] !== undefined && r[areaCol] !== '') {
          const aNum = parseFloat(r[areaCol]);
          if (Number.isFinite(aNum) && aNum > 0) areas.push(aNum);
        }
        if (stageCol && r[stageCol]) {
          detectedStage = String(r[stageCol]).trim();
        }
      }

      // If planting date and current/dataset date exist, compute elapsed days
      if (!detectedAge && plantDateCol && dateCol) {
        try {
          const dates = cropRows.map(r => new Date(r[dateCol])).filter(d => !isNaN(d.getTime()));
          const pDate = new Date(cropRows[0][plantDateCol]);
          if (!isNaN(pDate.getTime()) && dates.length > 0) {
            const maxDate = new Date(Math.max(...dates));
            const diffDays = Math.round((maxDate - pDate) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) detectedAge = diffDays;
          }
        } catch {}
      }
    }

    const totalDays = parseTotalDays(crop.daysToGrowEn);
    // Automatic plant age: uses explicit dataset age if provided, else authentic calibrated age based on crop progressPercent
    const calibratedAge = detectedAge || 
      Math.max(1, Math.min(totalDays, Math.round(totalDays * ((crop.progressPercent || 50) / 100))));

    return {
      ...crop,
      plantAgeDays: calibratedAge,
      totalDays,
      datasetYield: yields.length > 0 ? (yields.reduce((a, b) => a + b, 0) / yields.length).toFixed(2) : null,
      datasetArea: areas.length > 0 ? (areas.reduce((a, b) => a + b, 0) / areas.length).toFixed(2) : null,
      datasetStage: detectedStage || crop.stageEn,
      isAutoCalibrated: true
    };
  });

  return detectedList;
}

/**
 * Storage helpers for reactive synchronization across components
 */
export const STORAGE_KEY_DATASET_CROPS = 'climayield_dataset_crops';

// One-time reset: remove all previously stored vegetables so the dashboards start empty
// until the developer uploads a new crop dataset.
const ONE_TIME_CROP_RESET_KEY = 'climayield_crops_reset_v1';
try {
  if (typeof window !== 'undefined' && !localStorage.getItem(ONE_TIME_CROP_RESET_KEY)) {
    localStorage.removeItem(STORAGE_KEY_DATASET_CROPS);
    localStorage.removeItem('climayield_custom_crops');
    localStorage.setItem('climayield_dataset_crops_cleared', 'true');
    localStorage.setItem(ONE_TIME_CROP_RESET_KEY, 'done');
  }
} catch {}

export function getSavedDatasetCrops() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DATASET_CROPS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Automatically sanitize any existing items containing numeric/date tokens
        const { sanitized, wasModified } = sanitizeDatasetCrops(parsed);
        let updatedFil = false;
        const refreshed = sanitized.map(c => {
          const matched = matchVegetable(c.id || c.name || '', true);
          if (matched && matched.filipinoName && c.filipinoName !== matched.filipinoName) {
            updatedFil = true;
            return {
              ...c,
              filipinoName: matched.filipinoName,
              daysToGrowFil: matched.daysToGrowFil || c.daysToGrowFil,
              stageFil: matched.stageFil || c.stageFil,
              stageDescFil: matched.stageDescFil || c.stageDescFil
            };
          }
          return c;
        });
        if (wasModified || updatedFil) {
          try {
            localStorage.setItem(STORAGE_KEY_DATASET_CROPS, JSON.stringify(refreshed));
          } catch {}
        }
        return refreshed;
      }
    }
  } catch (err) {
    console.warn('Error reading saved dataset crops:', err);
  }
  return [];
}

export const STORAGE_KEY_CROPS_CLEARED = 'climayield_dataset_crops_cleared';

export function isDatasetCropsCleared() {
  try {
    return localStorage.getItem(STORAGE_KEY_CROPS_CLEARED) === 'true';
  } catch {
    return false;
  }
}

export function saveDatasetCrops(crops) {
  try {
    localStorage.setItem(STORAGE_KEY_DATASET_CROPS, JSON.stringify(crops || []));
    // A fresh dataset upload re-enables crop syncing
    localStorage.removeItem(STORAGE_KEY_CROPS_CLEARED);
    window.dispatchEvent(new CustomEvent('cropDatasetUpdated', { detail: crops || [] }));
  } catch (err) {
    console.error('Failed to save dataset crops:', err);
  }
}

export function clearDatasetCrops() {
  try {
    localStorage.removeItem(STORAGE_KEY_DATASET_CROPS);
    localStorage.removeItem('climayield_crop_daily_tracking');
    localStorage.removeItem('climayield_crop_day_offset');
    localStorage.removeItem('climayield_crop_last_seen_date');
    // Remember that crops were cleared so backend auto-sync does not re-add them
    localStorage.setItem(STORAGE_KEY_CROPS_CLEARED, 'true');
    window.dispatchEvent(new CustomEvent('cropDatasetUpdated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('cropDailyTrackingUpdated', { detail: { cleared: true } }));
  } catch (err) {
    console.error('Failed to clear dataset crops:', err);
  }
}

/**
 * Pre-packaged Datasets for Testing & Demonstration
 */
export const PRESET_DATASETS = [
  {
    id: 'philippine_national_crops',
    titleEn: 'Philippine National Crop Statistics (47 Crops)',
    titleFil: 'Pambansang Estadistika ng mga Pananim sa Pilipinas (47 Gulay)',
    descEn: 'Alugbati, Ampalaya, Cabbage, Carrot, Eggplant, Pechay, Tomato, Sitaw, and 39 more Philippine crops',
    descFil: 'Alugbati, Ampalaya, Repolyo, Karot, Talong, Pechay, Kamatis, Sitaw, at 39 pang gulay sa Pilipinas',
    badge: '🇵🇭 Official Crops',
    crops: Object.keys(KNOWN_VEGETABLES),
    csvContent: `crop,parent_crop,crop_level,year,period_type,period_no,period,area_ha,volume_mt,yield_mt_per_ha
Alugbati,,0,2024,Annual,,2024_Annual,2003.56,24269.51,12.11
Ampalaya fruit [Bitter gourd],,0,2024,Annual,,2024_Annual,9659.76,85276.29,8.83
Asparagus,,0,2024,Annual,,2024_Annual,47.41,404.4,8.53
Basil,,0,2024,Annual,,2024_Annual,9.39,13.85,1.47
Beets,,0,2024,Annual,,2024_Annual,9.7,46.66,4.81
Broccoli,,0,2024,Annual,,2024_Annual,870.36,12209.97,14.03
Cabbage,,0,2024,Annual,,2024_Annual,8888.24,135151.9,15.21
Carrot,,0,2024,Annual,,2024_Annual,4460.96,60645.75,13.59
Cauliflower,,0,2024,Annual,,2024_Annual,1324.92,13886.92,10.48
Celery,,0,2024,Annual,,2024_Annual,282.84,2815.33,9.95
"Chinese cabbage (Wongbok, Pechay Baguio)",Pechay,1,2024,Annual,,2024_Annual,4212.33,64126.05,15.22
Chives,,0,2024,Annual,,2024_Annual,7.48,27.64,3.7
Coriander,,0,2024,Annual,,2024_Annual,12.17,13.98,1.15
"Cowpea, green",Cowpea,1,2024,Annual,,2024_Annual,507.4,1652.01,3.26
Cucumber,,0,2024,Annual,,2024_Annual,2425.5,18483.67,7.62
Eggplant,,0,2024,Annual,,2024_Annual,20564.37,228262.64,11.1
Gisantes [Garden pea],,0,2024,Annual,,2024_Annual,12.42,87.26,7.03
Habitchuelas [Snap beans],,0,2024,Annual,,2024_Annual,2755.25,17234.47,6.26
Kangkong [Swamp cabbage],,0,2024,Annual,,2024_Annual,5750.99,60950.68,10.6
Kinchay,,0,2024,Annual,,2024_Annual,61.11,126.22,2.07
Kulitis,,0,2024,Annual,,2024_Annual,56.0,244.12,4.36
Lettuce,,0,2024,Annual,,2024_Annual,1048.15,8316.66,7.93
Mustard,,0,2024,Annual,,2024_Annual,701.48,2044.03,2.91
Okra [Lady's finger],,0,2024,Annual,,2024_Annual,4360.75,32504.42,7.45
Onion leeks,,0,2024,Annual,,2024_Annual,1262.27,4267.95,3.38
Parsley,,0,2024,Annual,,2024_Annual,3.5,10.11,2.89
Patola,,0,2024,Annual,,2024_Annual,2474.59,13033.51,5.27
Pechay,,0,2024,Annual,,2024_Annual,10133.21,99036.86,9.77
"Pechay, native",Pechay,1,2024,Annual,,2024_Annual,5920.88,34910.81,5.9
Pepper,,0,2024,Annual,,2024_Annual,4220.0,25186.94,5.97
"Pepper, bell",Pepper,1,2024,Annual,,2024_Annual,2180.18,17302.12,7.94
"Pepper, finger",Pepper,1,2024,Annual,,2024_Annual,2039.82,7884.83,3.87
Radish,,0,2024,Annual,,2024_Annual,1476.06,9221.0,6.25
Saluyot,,0,2024,Annual,,2024_Annual,773.84,3144.83,4.06
Sigarilyas [Winged beans],,0,2024,Annual,,2024_Annual,558.38,1383.02,2.48
Singkamas [Turnip],,0,2024,Annual,,2024_Annual,1215.14,8716.78,7.17
Sitao [Stringbeans],,0,2024,Annual,,2024_Annual,12921.88,101325.41,7.84
Spinach,,0,2024,Annual,,2024_Annual,248.23,494.75,1.99
Spring onion,,0,2024,Annual,,2024_Annual,931.34,4761.87,5.11
Squash fruit,,0,2024,Annual,,2024_Annual,12874.11,178644.47,13.88
Sweet peas,,0,2024,Annual,,2024_Annual,1093.66,5899.03,5.39
Talinum,,0,2024,Annual,,2024_Annual,6.12,8.1,1.32
Tomato,,0,2024,Annual,,2024_Annual,14047.64,210341.75,14.97
Upo [Bottle gourd],,0,2024,Annual,,2024_Annual,6387.69,66458.77,10.4
Watercress,,0,2024,Annual,,2024_Annual,30.97,135.42,4.37
Young corn,,0,2024,Annual,,2024_Annual,209.25,271.41,1.3
Zucchini,,0,2024,Annual,,2024_Annual,19.75,161.98,8.2`
  },
  {
    id: 'multi_crop',
    titleEn: 'Multi-Vegetable Farm Dataset (6 Crops)',
    titleFil: 'Sari-saring Gulay sa Bukid (6 na Gulay)',
    descEn: 'Pechay, Mustard Greens, Water Spinach, Cucumber, String Beans, Tomato',
    descFil: 'Pechay, Mustasa, Kangkong, Pipino, Sitaw, Kamatis',
    badge: '🌾 Comprehensive',
    crops: ['pechay', 'mustasa', 'kangkong', 'cucumber', 'sitaw', 'tomato'],
    csvContent: `Date,Crop,Rainfall,Max_Temp,Min_Temp,Humidity,Crop_Yield
2024-01-01,Pechay,12.5,28.3,22.1,65,4.2
2024-01-02,Mustard Greens,8.2,29.1,23.4,58,4.5
2024-01-03,Water Spinach,0.0,31.2,24.8,45,4.8
2024-01-04,Cucumber,15.8,27.5,21.9,72,3.9
2024-01-05,String Beans,5.3,30.4,23.7,55,4.6
2024-01-06,Tomato,2.1,32.0,25.1,48,4.9
2024-01-07,Pechay,0.0,33.1,25.5,42,5.1
2024-01-08,Mustard Greens,18.4,26.8,21.2,78,3.8
2024-01-09,Water Spinach,10.2,28.0,22.5,68,4.3
2024-01-10,Cucumber,4.5,29.5,23.0,60,4.7
2024-01-11,String Beans,0.0,31.8,24.2,50,4.9
2024-01-12,Tomato,7.6,28.9,22.8,62,4.4`
  },
  {
    id: 'solanaceous_drought',
    titleEn: 'El Niño Heat-Resilient Dataset (Tomato, Eggplant, Chili, Okra)',
    titleFil: 'El Niño Panlaban sa Tagtuyot (Kamatis, Talong, Sili, Okra)',
    descEn: 'Tomato, Eggplant, Chili Pepper, Okra',
    descFil: 'Kamatis, Talong, Sili, Okra',
    badge: '☀️ Drought Stress',
    crops: ['tomato', 'talong', 'sili', 'okra'],
    csvContent: `Date,Crop,Rainfall,Max_Temp,Min_Temp,Humidity,Crop_Yield
2024-03-01,Tomato,0.0,35.8,26.5,43,2.7
2024-03-02,Eggplant,0.0,36.2,27.1,39,2.5
2024-03-03,Chili Pepper,0.0,36.8,27.5,41,2.4
2024-03-04,Okra,0.0,35.9,26.9,44,2.6
2024-03-05,Tomato,0.0,36.5,27.3,38,2.4
2024-03-06,Eggplant,0.0,37.1,27.8,36,2.3
2024-03-07,Chili Pepper,0.0,36.4,27.0,40,2.5
2024-03-08,Okra,0.0,35.7,26.7,42,2.6`
  },
  {
    id: 'leafy_monsoon',
    titleEn: 'La Niña High-Moisture Leafy Greens (Kangkong, Pechay, Mustasa, Lettuce)',
    titleFil: 'La Niña Masaganang Dahon (Kangkong, Pechay, Mustasa, Letsugas)',
    descEn: 'Water Spinach, Pechay, Mustard Greens, Lettuce, White Radish',
    descFil: 'Kangkong, Pechay, Mustasa, Letsugas, Labanos',
    badge: '🌧️ Monsoon Deluge',
    crops: ['kangkong', 'pechay', 'mustasa', 'lettuce', 'labanos'],
    csvContent: `Date,Crop,Rainfall,Max_Temp,Min_Temp,Humidity,Crop_Yield
2024-08-01,Water Spinach,42.5,28.1,23.5,89,3.4
2024-08-02,Pechay,68.0,27.4,23.0,94,3.1
2024-08-03,Mustard Greens,85.2,26.8,22.8,96,2.8
2024-08-04,Lettuce,54.6,27.6,23.2,92,3.2
2024-08-05,White Radish,92.4,26.5,22.5,98,2.7
2024-08-06,Water Spinach,78.1,27.0,22.9,95,2.9
2024-08-07,Pechay,64.7,27.2,23.1,93,3.0`
  },
  {
    id: 'trellis_vines',
    titleEn: 'Trellis & Climber Crops (Cucumber, String Beans)',
    titleFil: 'Mga Pananim sa Balag (Pipino, Sitaw)',
    descEn: 'Cucumber, String Beans',
    descFil: 'Pipino, Sitaw',
    badge: '🥒 Trellis Vines',
    crops: ['cucumber', 'sitaw'],
    csvContent: `Date,Crop,Rainfall,Max_Temp,Min_Temp,Humidity,Crop_Yield
2024-05-01,Cucumber,14.2,29.8,24.0,75,4.3
2024-05-02,String Beans,8.5,30.5,24.5,70,4.6
2024-05-03,Cucumber,18.0,28.9,23.5,80,4.0
2024-05-04,String Beans,12.0,29.4,23.8,76,4.4`
  }
];
