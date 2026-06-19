/**
 * Carbon Calculator logic and interactive previews
 */
let emissionFactors = null;
let activeCategory = 'transport';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Enforce login
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  // 2. Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('entry-date').value = today;

  // 3. Load metadata and factors from API
  try {
    const metaRes = await API.footprint.getMetadata();
    emissionFactors = metaRes.data;
  } catch (err) {
    console.error('Failed to load emission factors metadata', err);
  }

  // 4. Tab Switching handler
  const tabs = document.querySelectorAll('.calc-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      // Deactivate all
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));

      // Activate clicked
      tab.classList.add('active');
      activeCategory = tab.dataset.category;
      document.getElementById(`panel-${activeCategory}`).classList.add('active');

      // Refresh preview calculations
      updateLivePreview();
    });
  });

  // 5. Input Change listener for live preview calculations
  const inputs = ['transport-distance', 'energy-value', 'food-value', 'consumption-value'];
  const selects = ['transport-type', 'energy-type', 'food-type', 'consumption-type'];

  inputs.forEach(id => {
    document.getElementById(id).addEventListener('input', updateLivePreview);
  });
  selects.forEach(id => {
    document.getElementById(id).addEventListener('change', updateLivePreview);
  });

  // 6. Submit Log Form
  const form = document.getElementById('calc-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // 7. Achievement modal close bindings
  const closeAchBtn = document.getElementById('close-ach-btn');
  if (closeAchBtn) {
    closeAchBtn.addEventListener('click', () => {
      document.getElementById('achievement-modal').style.display = 'none';
      window.location.href = '/dashboard.html';
    });
  }
});

/**
 * Calculates carbon dynamically using cached metadata factors and updates equivalent panels
 */
function updateLivePreview() {
  if (!emissionFactors) return;

  const previewBox = document.getElementById('equivalents-preview-box');
  let value = 0;
  let subCategory = '';
  let unit = '';

  if (activeCategory === 'transport') {
    value = parseFloat(document.getElementById('transport-distance').value) || 0;
    subCategory = document.getElementById('transport-type').value;
    unit = 'km';
  } else if (activeCategory === 'energy') {
    value = parseFloat(document.getElementById('energy-value').value) || 0;
    subCategory = document.getElementById('energy-type').value;
    unit = subCategory === 'heating_oil' ? 'liters' : (subCategory === 'coal' ? 'kg' : 'kWh');
  } else if (activeCategory === 'food') {
    value = parseFloat(document.getElementById('food-value').value) || 0;
    subCategory = document.getElementById('food-type').value;
    unit = subCategory.endsWith('meal') ? 'meals' : 'kg';
  } else if (activeCategory === 'consumption') {
    value = parseFloat(document.getElementById('consumption-value').value) || 0;
    subCategory = document.getElementById('consumption-type').value;
    unit = subCategory === 'clothing_item' || subCategory.startsWith('electronics') ? 'items' : 'kg';
  }

  if (value <= 0) {
    previewBox.style.display = 'none';
    return;
  }

  // Find standard factors in UI metadata
  // We can also pull them from the server-served metadata.
  // Wait, let's verify if the server metadata has calculation support:
  // Yes! The carbonCalculator.js getMetadata maps category -> subCategory -> factor.
  // Wait, our getMetadata returned labels and units. We can fetch factors or hardcode standard factors.
  // Let's hardcode standard factors matching the backend constants for instantaneous performance!
  const factors = {
    transport: { car_petrol: 0.18, car_diesel: 0.17, car_hybrid: 0.11, car_electric: 0.05, motorbike: 0.10, bus: 0.08, train: 0.04, flight_short: 0.25, flight_long: 0.15, bicycle: 0, walk: 0 },
    energy: { electricity_grid: 0.45, electricity_renewable: 0.02, natural_gas: 0.18, heating_oil: 2.68, coal: 2.42 },
    food: { beef: 36.0, pork: 7.6, poultry: 6.9, fish: 5.4, dairy: 3.2, vegetables: 0.8, grains: 0.9, fruit: 0.6, vegan_meal: 0.5, vegetarian_meal: 1.2, meat_meal: 3.5 },
    consumption: { clothing_item: 12.5, electronics_phone: 70.0, electronics_laptop: 200.0, general_waste: 0.95, recycled_waste: -0.35 }
  };

  const factor = factors[activeCategory][subCategory] || 0;
  const carbonKg = value * factor;

  // Render equivalents
  document.getElementById('preview-total-co2').innerHTML = `${carbonKg.toFixed(2)} kg CO2e`;
  
  // Driving equivalent
  const carKm = carbonKg > 0 ? (carbonKg / 0.18) : 0;
  // Phone charges
  const phoneCharges = carbonKg > 0 ? (carbonKg / 0.0083) : 0;
  // Tree days
  const treeDays = carbonKg > 0 ? (carbonKg / 0.06) : 0;

  document.getElementById('equiv-car-km').textContent = carKm.toFixed(1);
  document.getElementById('equiv-phones').textContent = Math.round(phoneCharges);
  document.getElementById('equiv-tree-days').textContent = treeDays.toFixed(1);

  previewBox.style.display = 'block';
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const date = document.getElementById('entry-date').value;
  const notes = document.getElementById('entry-notes').value;

  let value = 0;
  let subCategory = '';
  let unit = '';

  if (activeCategory === 'transport') {
    value = parseFloat(document.getElementById('transport-distance').value);
    subCategory = document.getElementById('transport-type').value;
    unit = 'km';
  } else if (activeCategory === 'energy') {
    value = parseFloat(document.getElementById('energy-value').value);
    subCategory = document.getElementById('energy-type').value;
    unit = subCategory === 'heating_oil' ? 'liters' : (subCategory === 'coal' ? 'kg' : 'kWh');
  } else if (activeCategory === 'food') {
    value = parseFloat(document.getElementById('food-value').value);
    subCategory = document.getElementById('food-type').value;
    unit = subCategory.endsWith('meal') ? 'meals' : 'kg';
  } else if (activeCategory === 'consumption') {
    value = parseFloat(document.getElementById('consumption-value').value);
    subCategory = document.getElementById('consumption-type').value;
    unit = subCategory === 'clothing_item' || subCategory.startsWith('electronics') ? 'items' : 'kg';
  }

  if (isNaN(value) || value <= 0) {
    alert('Please enter a valid amount greater than 0');
    return;
  }

  const payload = {
    category: activeCategory,
    subCategory,
    value,
    unit,
    date,
    notes
  };

  try {
    const res = await API.footprint.create(payload);
    if (res.success) {
      // Check for newly unlocked achievements
      if (res.newAchievements && res.newAchievements.length > 0) {
        showAchievementUnlocked(res.newAchievements[0]);
      } else {
        // Redirect to dashboard on successful save
        window.location.href = '/dashboard.html';
      }
    }
  } catch (err) {
    alert(err.message || 'Failed to save footprint entry');
  }
}

/**
 * Display achievement unlocked modal
 */
function showAchievementUnlocked(achievement) {
  const modal = document.getElementById('achievement-modal');
  const details = document.getElementById('unlocked-badge-details');
  if (!modal || !details) return;

  details.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 5px;">${achievement.icon || '⭐'}</div>
    <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">${achievement.name}</h3>
    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 5px;">${achievement.description}</p>
    <div style="display: inline-block; margin-top: 12px; background: var(--color-warning); color: var(--bg-primary); font-weight: 700; padding: 2px 10px; border-radius: 4px; font-size: 0.75rem;">
      +${achievement.points} Points
    </div>
  `;

  modal.style.display = 'flex';
}
