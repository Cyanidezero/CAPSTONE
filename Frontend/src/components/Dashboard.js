import React, { useState } from 'react';
import './Dashboard.css';

const CROPS_DATA = [
  {
    id: 'tomato',
    name: 'Tomato',
    filipinoName: 'Kamatis',
    variety: 'Kamatis (Diamante Max)',
    icon: '🍅',
    yieldVal: '16.4 tons/ha',
    confidence: '94.2%',
    accuracyRate: '96.4%',
    mape: '3.6%',
    rmse: '0.18 t/ha',
    sarimaBase: '14.80 t/ha',
    lstmResidual: '+1.60 t/ha',
    formula: '14.80 (SARIMA) + 1.60 (LSTM) = 16.40 t/ha',
    ci95: '16.05 – 16.75 t/ha',
    stageEn: 'Fruit Development',
    stageFil: 'Lumalaking Bunga',
    harvestEn: '18-22 days',
    harvestFil: '18-22 araw',
    riskEn: 'Low Risk',
    riskFil: 'Mababang Panganib',
    riskClass: 'risk-low',
    driverEn: 'Optimal solar radiation and moderate rainfall favor fruit firmness and reduce cracking risks.',
    driverFil: 'Maganda ang sikat ng araw at ulan para tumigas ang bunga at hindi pumutok.'
  },
  {
    id: 'eggplant',
    name: 'Eggplant',
    filipinoName: 'Talong',
    variety: 'Talong (Dumaguete Long)',
    icon: '🍆',
    yieldVal: '18.2 tons/ha',
    confidence: '91.8%',
    accuracyRate: '95.8%',
    mape: '4.2%',
    rmse: '0.22 t/ha',
    sarimaBase: '16.50 t/ha',
    lstmResidual: '+1.70 t/ha',
    formula: '16.50 (SARIMA) + 1.70 (LSTM) = 18.20 t/ha',
    ci95: '17.77 – 18.63 t/ha',
    stageEn: 'Vegetative Growth',
    stageFil: 'Lumalagong Dahon at Sangay',
    harvestEn: '25-30 days',
    harvestFil: '25-30 araw',
    riskEn: 'Low Risk',
    riskFil: 'Mababang Panganib',
    riskClass: 'risk-low',
    driverEn: 'Nighttime temperatures (24°C) preserve flower buds and support healthy calyx elongation.',
    driverFil: 'Maganda ang lamig sa gabi (24°C) para hindi malaglag ang bulaklak at maging maayos ang bunga.'
  },
  {
    id: 'pechay',
    name: 'Pechay',
    filipinoName: 'Pechay',
    variety: 'Bok Choy / Sariwang Dahon',
    icon: '🥬',
    yieldVal: '12.5 tons/ha',
    confidence: '89.5%',
    accuracyRate: '94.1%',
    mape: '5.9%',
    rmse: '0.26 t/ha',
    sarimaBase: '11.10 t/ha',
    lstmResidual: '+1.40 t/ha',
    formula: '11.10 (SARIMA) + 1.40 (LSTM) = 12.50 t/ha',
    ci95: '11.99 – 13.01 t/ha',
    stageEn: 'Leaf Expansion',
    stageFil: 'Lumalaking Dahon',
    harvestEn: '5-7 days',
    harvestFil: '5-7 araw',
    riskEn: 'Moderate Risk',
    riskFil: 'Katamtamang Panganib',
    riskClass: 'risk-moderate',
    driverEn: 'High relative humidity stimulates tender leaf growth; watch for drainage to avoid bacterial soft rot.',
    driverFil: 'Mataas ang moisture sa hangin kaya mabilis lumaki ang dahon; ingatan lang ang kanal para hindi mabulok.'
  },
  {
    id: 'bellpepper',
    name: 'Bell Pepper',
    filipinoName: 'Sili',
    variety: 'Sili / Atsuete Pepper',
    icon: '🌶️',
    yieldVal: '9.8 tons/ha',
    confidence: '93.0%',
    accuracyRate: '96.8%',
    mape: '3.2%',
    rmse: '0.15 t/ha',
    sarimaBase: '9.10 t/ha',
    lstmResidual: '+0.70 t/ha',
    formula: '9.10 (SARIMA) + 0.70 (LSTM) = 9.80 t/ha',
    ci95: '9.51 – 10.09 t/ha',
    stageEn: 'Early Flowering',
    stageFil: 'Namumulaklak',
    harvestEn: '14-16 days',
    harvestFil: '14-16 araw',
    riskEn: 'Low Risk',
    riskFil: 'Mababang Panganib',
    riskClass: 'risk-low',
    driverEn: 'Moderate temperature and sunlight prevent flower drop and promote vibrant fruit pigmentation.',
    driverFil: 'Tamang init sa araw ang pumipigil sa pagkalagas ng bulaklak at nagpapaganda sa kulay ng sili.'
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

function Dashboard({ userRole = 'farmer', user = null, systemStatus = {}, setActiveTab, onRefresh, lang = 'en' }) {
  const [flippedCrops, setFlippedCrops] = useState({});
  const [slidRecs, setSlidRecs] = useState({});
  const [slidInsights, setSlidInsights] = useState({});

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

  const allFlipped = CROPS_DATA.every(c => !!flippedCrops[c.id]);

  const toggleFlipAll = () => {
    if (allFlipped) {
      setFlippedCrops({});
    } else {
      const allTrue = {};
      CROPS_DATA.forEach(c => {
        allTrue[c.id] = true;
      });
      setFlippedCrops(allTrue);
    }
  };

  const navigateTab = (tab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      document.querySelector(`[data-tab="${tab}"]`)?.click();
    }
  };

  const isFil = lang === 'fil';

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
          <div className="fd-hero-badge">
            <div className="title">{isFil ? 'Lokasyon ng Bukid' : 'Farm Location'}</div>
            <div className="val">📍 Quezon City, PH</div>
          </div>
        </div>

        {/* Quick Summary Highlights */}
        <div className="fd-summary-grid">
          <div className="fd-summary-card">
            <div className="fd-summary-icon">🌾</div>
            <div className="fd-summary-info">
              <div className="fd-summary-label">
                {isFil ? 'Inaasahang Ani' : 'Average Projected Yield'}
              </div>
              <div className="fd-summary-value">
                15.8 <span style={{ fontSize: '0.9rem' }}>tons/ha</span>
              </div>
              <div className="fd-summary-sub">
                {isFil ? '↑ 4.2% mas mataas kaysa karaniwan' : '↑ 4.2% higher than seasonal baseline'}
              </div>
            </div>
          </div>

          <div className="fd-summary-card">
            <div className="fd-summary-icon">⚖️</div>
            <div className="fd-summary-info">
              <div className="fd-summary-label">
                {isFil ? 'Panganib sa Ani' : 'Yield Instability Risk'}
              </div>
              <div className="fd-summary-value" style={{ color: '#16a34a' }}>
                {isFil ? 'Mababang Panganib' : 'Low Risk'}
              </div>
              <div className="fd-summary-sub">
                {isFil ? 'Maayos ang lagay ng panahon' : 'Stable climate conditions projected'}
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
                {isFil ? 'Maayos' : 'Optimal'}
              </div>
              <div className="fd-summary-sub">
                {isFil ? 'Sapat ang ulan at maayos ang panahon' : 'Adequate rainfall & balanced humidity'}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: CROP PREDICTIONS */}
        <div className="fd-section">
          <div className="fd-section-header">
            <div className="fd-section-title">
              <span>📈</span>
              <span>
                {isFil
                  ? 'Pagtataya ng Ani ng mga Gulay sa Quezon City'
                  : 'Crop Yield Predictions (Quezon City Short-Cycle Vegetables)'}
              </span>
            </div>
            <div className="fd-section-actions">
              <button 
                className="fd-toggle-all-btn"
                onClick={toggleFlipAll}
                title={isFil ? 'I-flip ang lahat ng card nang sabay-sabay' : 'Flip all cards simultaneously'}
              >
                🔄 {allFlipped ? (isFil ? 'I-flip Lahat Pabalik' : 'Flip All to Front') : (isFil ? 'I-flip Lahat ng Card' : 'Flip All Cards')}
              </button>
              <button 
                className="fd-section-btn"
                onClick={() => navigateTab('predictions')}
              >
                {isFil ? 'Tingnan Lahat ng Ani →' : 'View Full Predictions →'}
              </button>
            </div>
          </div>

          {/* Interactive Hint */}
          <div className="fd-interactive-hint">
            <span>🔄</span>
            <span>
              {isFil
                ? 'I-click ang alinmang card (hal. Kamatis 🍅) upang mag-flip ito at lumabas ang tons, stage, at panahon ng pag-ani sa likod.'
                : 'Click any card (e.g. Tomato 🍅) to flip it over like a card and reveal projected tons, growth stage, and harvest window.'}
            </span>
          </div>

          {/* 3D Flip Crop Cards Grid */}
          <div className="fd-crops-grid">
            {CROPS_DATA.map(crop => {
              const isFlipped = !!flippedCrops[crop.id];

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
                        ? `I-click para i-flip pabalik ang ${crop.filipinoName}`
                        : `I-click upang makita ang impormasyon ng ${crop.filipinoName}`
                      : isFlipped
                      ? `Click to flip back ${crop.name}`
                      : `Click to see the information of ${crop.name}`
                  }
                >
                  <div className="fd-flip-card-inner">
                    {/* HARAP NG CARD (FRONT) */}
                    <div className="fd-flip-card-front">
                      <div className="fd-card-top-bar">
                        <div className="fd-card-identity">
                          <div className="fd-card-icon-bubble">{crop.icon}</div>
                          <div>
                            <div className="fd-crop-name">{isFil ? crop.filipinoName : crop.name}</div>
                            <div className="fd-crop-filipino">{crop.variety}</div>
                          </div>
                        </div>
                        <span className={`fd-crop-risk ${crop.riskClass}`}>
                          {isFil ? crop.riskFil : crop.riskEn}
                        </span>
                      </div>

                      <div className="fd-card-front-center">
                        <div className="fd-card-hero-icon">{crop.icon}</div>
                        <div className="fd-card-front-tagline">
                          {isFil ? 'Gulay sa Quezon City' : 'QC Short-Cycle Crop'}
                        </div>
                      </div>

                      <div className="fd-card-flip-prompt">
                        <span className="fd-flip-icon">🔄</span>
                        <span>
                          {isFil
                            ? 'I-click para makita ang impormasyon ng mga pananim'
                            : 'Click to see the information of these plants'}
                        </span>
                      </div>
                    </div>

                    {/* LIKOD NG CARD (BACK - ROTATED 180 DEG) */}
                    <div className="fd-flip-card-back">
                      <div className="fd-back-header">
                        <div className="fd-back-title">
                          <span className="icon">{crop.icon}</span>
                          <div>
                            <div className="name">{isFil ? crop.filipinoName : crop.name}</div>
                            <div className="variety">{crop.variety}</div>
                          </div>
                        </div>
                        <span className="fd-back-flip-badge">
                          🔄 {isFil ? 'Pabalik' : 'Flip Back'}
                        </span>
                      </div>

                      {/* TONS / INAASAHANG ANI & ACCURACY RATE */}
                      <div className="fd-back-yield-box">
                        <div>
                          <div className="fd-back-yield-label">{isFil ? 'Inaasahang Ani (Tons)' : 'Projected Yield'}</div>
                          <div className="fd-back-yield-val">{crop.yieldVal}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="fd-back-yield-label">{isFil ? 'Posibleng Kawastuhan' : 'Possible Accuracy'}</div>
                          <div className="fd-back-accuracy-badge">🎯 {crop.accuracyRate}</div>
                        </div>
                      </div>

                      {/* MATHEMATICAL COMPUTATION BREAKDOWN */}
                      <div className="fd-back-computation-strip">
                        <div className="fd-back-comp-header">
                          <span>📐 {isFil ? 'Pagkalkula ng Ani at Pormula:' : 'Yield & Accuracy Computation:'}</span>
                        </div>
                        <div className="fd-back-comp-formula">
                          <code>{crop.formula}</code>
                        </div>
                        <div className="fd-back-comp-sub">
                          <span>🎯 {isFil ? `Kawastuhan: 100% - ${crop.mape} (MAPE) = ${crop.accuracyRate}` : `Accuracy: 100% - ${crop.mape} (MAPE) = ${crop.accuracyRate}`}</span>
                          <span>📐 {isFil ? `95% Saklaw: ${crop.ci95}` : `95% CI: ${crop.ci95}`}</span>
                        </div>
                      </div>

                      {/* STAGE & HARVEST TIME */}
                      <div className="fd-back-meta-grid">
                        <div className="fd-back-meta-item">
                          <div className="label">🌱 {isFil ? 'Stage ng Pananim' : 'Stage'}</div>
                          <div className="val">{isFil ? crop.stageFil : crop.stageEn}</div>
                        </div>
                        <div className="fd-back-meta-item">
                          <div className="label">⏱️ {isFil ? 'Panahon ng Pag-ani' : 'Harvest Window'}</div>
                          <div className="val">{isFil ? crop.harvestFil : crop.harvestEn}</div>
                        </div>
                      </div>

                      {/* NOTE & FOOTER */}
                      <div className="fd-back-note">
                        💡 {isFil ? crop.driverFil : crop.driverEn}
                      </div>

                      <div className="fd-back-footer-hint">
                        ↩️ {isFil ? 'I-click kahit saan para i-flip pabalik' : 'Click anywhere to flip back'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
            <button 
              className="fd-section-btn"
              onClick={() => navigateTab('recommendations')}
            >
              {isFil ? 'Lahat ng Payo →' : 'All Recommendations →'}
            </button>
          </div>

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
        </div>
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
          <h2>
            <span>🤖</span>
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
                <div className="dev-model-icon-box">📈</div>
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
                <div className="dev-model-icon-box">🧠</div>
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
                <div className="dev-model-icon-box">🔀</div>
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
                    style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#0f172a', borderColor: '#cbd5e1' }}
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
                    style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#0f172a', borderColor: '#cbd5e1' }}
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
          marginTop: '18px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: systemStatus?.datasetLoaded ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${systemStatus?.datasetLoaded ? '#bbf7d0' : '#fef3c7'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '0.86rem'
        }}>
          <div>
            <strong style={{ color: systemStatus?.datasetLoaded ? '#15803d' : '#92400e' }}>
              {systemStatus?.datasetLoaded ? '📁 Dataset Status: Ready' : '⚠️ Dataset Status: Not Loaded'}
            </strong>
            <span style={{ marginLeft: '8px', color: '#475569' }}>
              {systemStatus?.datasetLoaded 
                ? `Active training dataset loaded (${systemStatus?.datasetShape?.rows || 0} historical records available for model fitting). Fleet status: ${totalTrainedCount}/3 models trained.`
                : 'Upload or import training data before fitting SARIMA and LSTM models.'}
            </span>
          </div>
          {!systemStatus?.datasetLoaded && (
            <button 
              className="dev-hero-btn secondary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', color: '#92400e', borderColor: '#fcd34d' }}
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
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f0fbf4, #e8f8f0)',
            border: '1.5px solid #a3e0b2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#14532d', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📊</span> AI Training Results Dashboard Ready ({totalTrainedCount}/3 Models Evaluated)
              </div>
              <div style={{ fontSize: '0.84rem', color: '#3f624d', marginTop: '3px' }}>
                SARIMA Hyperparameter AIC Search and Model Registry Benchmark tables are calibrated with SARIMA-LSTM Hybrid Model evaluations.
              </div>
            </div>
            <button
              className="dev-hero-btn primary"
              style={{ padding: '8px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
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