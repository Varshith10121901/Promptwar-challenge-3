/**
 * Emission factors (kg CO2e per unit) based on EPA, DEFRA, and IPPC standards
 */
const EMISSION_FACTORS = {
  transport: {
    // Unit is per km
    car_petrol: 0.18,
    car_diesel: 0.17,
    car_hybrid: 0.11,
    car_electric: 0.05, // Grid mix average
    motorbike: 0.10,
    bus: 0.08,
    train: 0.04,
    flight_short: 0.25, // Short haul flights have higher take-off/landing impact per km
    flight_long: 0.15,
    bicycle: 0,
    walk: 0
  },
  energy: {
    // Unit is per kWh, except heating oil (per liter) and coal (per kg)
    electricity_grid: 0.45,
    electricity_renewable: 0.02, // Lifecycle emissions
    natural_gas: 0.18, // per kWh
    heating_oil: 2.68, // per liter
    coal: 2.42 // per kg
  },
  food: {
    // Unit is per kg of food consumed (rough estimates of lifecycle emissions)
    beef: 36.0,
    pork: 7.6,
    poultry: 6.9,
    fish: 5.4,
    dairy: 3.2,
    vegetables: 0.8,
    grains: 0.9,
    fruit: 0.6,
    vegan_meal: 0.5, // per meal fallback
    vegetarian_meal: 1.2, // per meal fallback
    meat_meal: 3.5 // per meal fallback
  },
  consumption: {
    // Unit is per item or per kg
    clothing_item: 12.5, // average per new garment
    electronics_phone: 70.0,
    electronics_laptop: 200.0,
    general_waste: 0.95, // per kg sent to landfill
    recycled_waste: -0.35 // recycling credit per kg
  }
};

const DEFAULT_GOALS = {
  transport: 150.0, // kg CO2 per month
  energy: 200.0,
  food: 120.0,
  consumption: 50.0,
  total: 520.0
};

module.exports = {
  EMISSION_FACTORS,
  DEFAULT_GOALS
};
