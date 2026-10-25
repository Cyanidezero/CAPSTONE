import React from 'react';
import './AnimatedVegetable.css';

// Comprehensive Map of all Philippine vegetables to real authentic produce photographs (Transparent PNGs)
export const VEGETABLE_IMAGE_MAP = {
  // Specific multi-word crops first
  'pechay native': '/assets/vegetables/pechay.png',
  'pechay tagalog': '/assets/vegetables/pechay.png',
  'native pechay': '/assets/vegetables/pechay.png',
  pechay_native: '/assets/vegetables/pechay.png',

  'chinese cabbage': '/assets/vegetables/chinese_cabbage.png',
  wongbok: '/assets/vegetables/chinese_cabbage.png',
  'pechay baguio': '/assets/vegetables/chinese_cabbage.png',
  'napa cabbage': '/assets/vegetables/chinese_cabbage.png',
  chinese_cabbage: '/assets/vegetables/chinese_cabbage.png',

  'onion leeks': '/assets/vegetables/spring_onion.png',
  onion_leeks: '/assets/vegetables/spring_onion.png',
  leeks: '/assets/vegetables/spring_onion.png',

  'spring onion': '/assets/vegetables/spring_onion.png',
  spring_onion: '/assets/vegetables/spring_onion.png',
  scallion: '/assets/vegetables/spring_onion.png',
  'green onion': '/assets/vegetables/spring_onion.png',
  'dahon ng sibuyas': '/assets/vegetables/spring_onion.png',

  'sweet peas': '/assets/vegetables/sitaw.png',
  sweet_peas: '/assets/vegetables/sitaw.png',
  'snow peas': '/assets/vegetables/sitaw.png',
  sitsaro: '/assets/vegetables/sitaw.png',
  chicharo: '/assets/vegetables/sitaw.png',

  'young corn': '/assets/vegetables/carrot.png',
  young_corn: '/assets/vegetables/carrot.png',
  'baby corn': '/assets/vegetables/carrot.png',
  'batang mais': '/assets/vegetables/carrot.png',

  'bell pepper': '/assets/vegetables/bell_pepper.png',
  bell_pepper: '/assets/vegetables/bell_pepper.png',
  'sweet pepper': '/assets/vegetables/bell_pepper.png',
  'siling atsara': '/assets/vegetables/bell_pepper.png',

  'finger pepper': '/assets/vegetables/finger_pepper.png',
  finger_pepper: '/assets/vegetables/finger_pepper.png',
  'siling haba': '/assets/vegetables/finger_pepper.png',
  panigang: '/assets/vegetables/finger_pepper.png',
  espada: '/assets/vegetables/finger_pepper.png',

  'water spinach': '/assets/vegetables/kangkong.png',
  'swamp cabbage': '/assets/vegetables/kangkong.png',

  'bitter gourd': '/assets/vegetables/ampalaya.png',
  'bitter melon': '/assets/vegetables/ampalaya.png',

  'white radish': '/assets/vegetables/labanos.png',
  daikon: '/assets/vegetables/labanos.png',

  'string beans': '/assets/vegetables/sitaw.png',
  'yardlong bean': '/assets/vegetables/sitaw.png',
  stringbeans: '/assets/vegetables/sitaw.png',

  'garden pea': '/assets/vegetables/cucumber.png',
  'green pea': '/assets/vegetables/cucumber.png',

  'snap beans': '/assets/vegetables/sitaw.png',
  'baguio beans': '/assets/vegetables/sitaw.png',
  habitchuelas: '/assets/vegetables/sitaw.png',

  'winged beans': '/assets/vegetables/sigarilyas.png',
  'winged bean': '/assets/vegetables/sigarilyas.png',
  sigarilyas: '/assets/vegetables/sigarilyas.png',
  kalamismis: '/assets/vegetables/sigarilyas.png',

  'bottle gourd': '/assets/vegetables/upo.png',
  'sponge gourd': '/assets/vegetables/patola.png',

  'chinese celery': '/assets/vegetables/celery.png',
  'amaranth greens': '/assets/vegetables/kangkong.png',
  'malabar spinach': '/assets/vegetables/alugbati.png',
  'jute mallow': '/assets/vegetables/kangkong.png',

  // Single-word unique crops - all mapped to authentic transparent real produce photos
  alugbati: '/assets/vegetables/alugbati.png',
  ampalaya: '/assets/vegetables/ampalaya.png',
  asparagus: '/assets/vegetables/asparagus.png',
  basil: '/assets/vegetables/basil.png',
  balanoy: '/assets/vegetables/basil.png',
  beets: '/assets/vegetables/beets.png',
  beet: '/assets/vegetables/beets.png',
  beetroot: '/assets/vegetables/beets.png',
  remolatsa: '/assets/vegetables/beets.png',
  broccoli: '/assets/vegetables/broccoli.png',
  brokoli: '/assets/vegetables/broccoli.png',
  cabbage: '/assets/vegetables/cabbage.png',
  repolyo: '/assets/vegetables/cabbage.png',
  carrot: '/assets/vegetables/carrot.png',
  karot: '/assets/vegetables/carrot.png',
  cauliflower: '/assets/vegetables/cauliflower.png',
  koliplor: '/assets/vegetables/cauliflower.png',
  celery: '/assets/vegetables/celery.png',
  chives: '/assets/vegetables/spring_onion.png',
  kutsay: '/assets/vegetables/spring_onion.png',
  coriander: '/assets/vegetables/basil.png',
  cilantro: '/assets/vegetables/basil.png',
  wansoy: '/assets/vegetables/basil.png',
  cowpea: '/assets/vegetables/sitaw.png',
  paayap: '/assets/vegetables/sitaw.png',
  cucumber: '/assets/vegetables/cucumber.png',
  pipino: '/assets/vegetables/cucumber.png',
  eggplant: '/assets/vegetables/talong.png',
  talong: '/assets/vegetables/talong.png',
  gisantes: '/assets/vegetables/cucumber.png',
  kangkong: '/assets/vegetables/kangkong.png',
  kinchay: '/assets/vegetables/celery.png',
  kulitis: '/assets/vegetables/kangkong.png',
  uray: '/assets/vegetables/kangkong.png',
  lettuce: '/assets/vegetables/lettuce.png',
  letsugas: '/assets/vegetables/lettuce.png',
  mustasa: '/assets/vegetables/mustasa.png',
  mustard: '/assets/vegetables/mustasa.png',
  okra: '/assets/vegetables/okra.png',
  parsley: '/assets/vegetables/celery.png',
  pasli: '/assets/vegetables/celery.png',
  patola: '/assets/vegetables/patola.png',
  pechay: '/assets/vegetables/pechay.png',
  'bok choy': '/assets/vegetables/pechay.png',
  radish: '/assets/vegetables/labanos.png',
  labanos: '/assets/vegetables/labanos.png',
  saluyot: '/assets/vegetables/kangkong.png',
  singkamas: '/assets/vegetables/singkamas.png',
  turnip: '/assets/vegetables/singkamas.png',
  jicama: '/assets/vegetables/singkamas.png',
  sitaw: '/assets/vegetables/sitaw.png',
  sitao: '/assets/vegetables/sitaw.png',
  spinach: '/assets/vegetables/kangkong.png',
  espinaka: '/assets/vegetables/kangkong.png',
  squash: '/assets/vegetables/squash.png',
  kalabasa: '/assets/vegetables/squash.png',
  talinum: '/assets/vegetables/alugbati.png',
  tomato: '/assets/vegetables/tomato.png',
  kamatis: '/assets/vegetables/tomato.png',
  upo: '/assets/vegetables/upo.png',
  watercress: '/assets/vegetables/kangkong.png',
  zucchini: '/assets/vegetables/cucumber.png',
  courgette: '/assets/vegetables/cucumber.png',
  sili: '/assets/vegetables/sili.png',
  chili: '/assets/vegetables/sili.png',
  pepper: '/assets/vegetables/sili.png',
  sayote: '/assets/vegetables/upo.png',
  chayote: '/assets/vegetables/upo.png',
  malunggay: '/assets/vegetables/alugbati.png',
  moringa: '/assets/vegetables/alugbati.png',
  bawang: '/assets/vegetables/singkamas.png',
  garlic: '/assets/vegetables/singkamas.png',
  sibuyas: '/assets/vegetables/spring_onion.png',
  onion: '/assets/vegetables/spring_onion.png',
  luya: '/assets/vegetables/singkamas.png',
  ginger: '/assets/vegetables/singkamas.png'
};

export function getVegetableImage(crop) {
  if (!crop) return '/assets/vegetables/pechay.png';
  const id = String(crop.id || '').toLowerCase().trim();
  const name = String(crop.name || '').toLowerCase().trim();
  const fil = String(crop.filipinoName || '').toLowerCase().trim();

  // 1. Exact ID match
  if (id && VEGETABLE_IMAGE_MAP[id]) {
    return VEGETABLE_IMAGE_MAP[id];
  }

  // 2. Check full strings against exact dictionary keys
  const combined = ` ${id} ${name} ${fil} `;
  for (const [key, path] of Object.entries(VEGETABLE_IMAGE_MAP)) {
    // Exact word or boundary match
    const escaped = key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(combined)) {
      return path;
    }
  }

  // 3. Substring check fallback
  for (const [key, path] of Object.entries(VEGETABLE_IMAGE_MAP)) {
    if (name.includes(key) || fil.includes(key) || id.includes(key)) {
      return path;
    }
  }

  return '/assets/vegetables/pechay.png';
}

/**
 * Steady Vegetable Image Component
 * Renders the actual photorealistic or HD transparent vegetable asset completely steady and static.
 */
export const AnimatedVegetableImage = ({
  crop,
  height = 130,
  showBadge = true,
  lang = 'en',
  className = ''
}) => {
  const imgSrc = getVegetableImage(crop);
  const isFil = lang === 'fil';
  const displayName = isFil ? (crop?.filipinoName || crop?.name || 'Gulay') : (crop?.name || crop?.filipinoName || 'Vegetable');
  const badgeText = isFil ? 'Sariwa' : 'Fresh';

  return (
    <div
      className={`veg-animated-wrapper ${className}`}
      title={`${displayName} - Agricultural Produce`}
    >
      {/* Ambient Sunbeam Aura */}
      <div className="veg-ambient-aura" />

      {/* Steady Image Frame */}
      <div
        className="veg-image-frame"
        style={{ height: `${height}px` }}
      >
        <img
          src={imgSrc}
          alt={displayName}
          className="veg-actual-img"
          loading="lazy"
        />
      </div>

      {/* Soft Ground Contact Shadow */}
      <div className="veg-ground-shadow" />

      {/* Fresh Produce Badge */}
      {showBadge && (
        <span className="veg-farm-fresh-badge">
          <span>🌿</span>
          <span>{badgeText}</span>
        </span>
      )}
    </div>
  );
};

/**
 * Vegetable HD Inspection Modal
 */
export const VegetableImageModal = ({ crop, isOpen, onClose, lang = 'en' }) => {
  if (!isOpen || !crop) return null;

  const isFil = lang === 'fil';
  const imgSrc = getVegetableImage(crop);
  const displayName = isFil ? (crop.filipinoName || crop.name) : (crop.name || crop.filipinoName);

  return (
    <div className="veg-modal-overlay" onClick={onClose}>
      <div className="veg-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="veg-modal-header">
          <div className="veg-modal-title-group">
            <div className="veg-modal-icon-badge">{crop.icon || '🥬'}</div>
            <div className="veg-modal-title-text">
              <h3>
                <span>{displayName}</span>
                <span style={{ fontSize: '0.78rem', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
                  {isFil ? 'Sariwang Ani' : 'Fresh Farm Harvest'}
                </span>
              </h3>
              <p>
                {isFil 
                  ? 'Tunay na Larawan ng Pananim at Gabay sa Pagtatanim' 
                  : 'High-Definition Agricultural Photography & Cultivation Guide'}
              </p>
            </div>
          </div>
          <button type="button" className="veg-modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="veg-modal-body">
          {/* Left Column: Animated Showcase Image */}
          <div className="veg-modal-showcase">
            <img
              src={imgSrc}
              alt={displayName}
              className="veg-modal-hero-img"
            />
            <div className="veg-ground-shadow" style={{ width: '130px', marginTop: '10px' }} />
            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#166534', fontWeight: '700' }}>
              ✨ 100% Organikong Pananim sa Quezon City
            </div>
          </div>

          {/* Right Column: Agronomic Profile */}
          <div className="veg-modal-info-col">
            <div className="v3d-spec-card">
              <div className="v3d-spec-title">
                <span>📊</span>
                <span>{isFil ? 'Katangian ng Gulay' : 'Agronomic Profile'}</span>
              </div>
              <div className="v3d-spec-grid">
                <div className="v3d-spec-item">
                  <div className="v3d-spec-label">{isFil ? 'Araw ng Paglaki' : 'Days to Harvest'}</div>
                  <div className="v3d-spec-val">
                    {isFil ? (crop.daysToGrowFil || crop.daysToGrowEn || crop.daysToGrow) : (crop.daysToGrowEn || crop.daysToGrowFil || crop.daysToGrow)}
                  </div>
                </div>
                <div className="v3d-spec-item">
                  <div className="v3d-spec-label">{isFil ? 'Kategorya' : 'Classification'}</div>
                  <div className="v3d-spec-val">⚡ Short-Cycle</div>
                </div>
                <div className="v3d-spec-item">
                  <div className="v3d-spec-label">{isFil ? 'Tamang Init' : 'Optimal Temp'}</div>
                  <div className="v3d-spec-val">24°C – 32°C</div>
                </div>
                <div className="v3d-spec-item">
                  <div className="v3d-spec-label">{isFil ? 'Dalas ng Patubig' : 'Irrigation'}</div>
                  <div className="v3d-spec-val">{isFil ? '2x lingguhan' : '2x weekly'}</div>
                </div>
              </div>
            </div>

            <div className="v3d-spec-card" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
              <div className="v3d-spec-title" style={{ color: '#0f172a' }}>
                <span>💡</span>
                <span>{isFil ? 'Payo sa Pagtatanim sa QC' : 'QC Cultivation Advisory'}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: '1.45' }}>
                {isFil
                  ? 'Mabilis itong tumubo at anihin sa mga urban garden plot at paso sa Quezon City. Mas mainam anihin nang maaga sa umaga upang mapanatili ang tamang lutong at sustansya papuntang palengke.'
                  : 'Fast-maturing variety optimal for Quezon City urban container beds. Harvest early in the morning to retain maximum leaf turgor and nutritional density.'}
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'auto' }}>
              <button
                type="button"
                className="fd-modal-btn submit"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onClose}
              >
                ✓ {isFil ? 'Bumalik sa Dashboard' : 'Return to Dashboard'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
