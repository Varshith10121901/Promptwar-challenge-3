/**
 * Carbon calculation service
 */
const { EMISSION_FACTORS } = require('../utils/constants');

/**
 * Calculates CO2 emissions in kilograms for a given activity
 * @param {string} category - transport, energy, food, or consumption
 * @param {string} subCategory - the specific subcategory (e.g. car_petrol, beef)
 * @param {number} value - numeric input (distance, weight, kWh, items)
 * @returns {number} emissions in kg CO2e, rounded to 2 decimal places
 */
const calculateEmissions = (category, subCategory, value) => {
  if (!category || !subCategory || value === undefined || value === null) {
    throw new Error('Category, subCategory, and value are required');
  }

  const numValue = Number(value);
  if (isNaN(numValue) || numValue < 0) {
    throw new Error('Value must be a non-negative number');
  }

  const categoryFactors = EMISSION_FACTORS[category];
  if (!categoryFactors) {
    throw new Error(`Invalid category: ${category}`);
  }

  const factor = categoryFactors[subCategory];
  if (factor === undefined) {
    throw new Error(`Invalid subCategory: ${subCategory} for category: ${category}`);
  }

  // Calculate CO2e
  const emissions = numValue * factor;
  return Math.round(emissions * 100) / 100;
};

/**
 * Generates relatable comparison equivalents for a given kg CO2 amount
 * @param {number} carbonKg 
 * @returns {Object} equivalencies
 */
const getEquivalents = (carbonKg) => {
  if (carbonKg <= 0) {
    return { carKm: 0, phoneCharges: 0, treeDays: 0 };
  }

  // Equivalencies:
  // 1. Average petrol car: 0.18 kg CO2 per km
  // 2. Charging a smartphone: 0.0083 kg CO2 per charge (EPA standard)
  // 3. Tree carbon absorption: ~21.8 kg CO2 per year, which is ~0.06 kg CO2 per day
  const carKm = Math.round((carbonKg / 0.18) * 10) / 10;
  const phoneCharges = Math.round(carbonKg / 0.0083);
  const treeDays = Math.round((carbonKg / 0.06) * 10) / 10;

  return {
    carKm,
    phoneCharges,
    treeDays
  };
};

/**
 * Returns available subcategories and units for frontend usage
 * @returns {Object} units map
 */
const getMetadata = () => {
  return {
    transport: {
      car_petrol: { label: 'Petrol Car', unit: 'km' },
      car_diesel: { label: 'Diesel Car', unit: 'km' },
      car_hybrid: { label: 'Hybrid Car', unit: 'km' },
      car_electric: { label: 'Electric Car', unit: 'km' },
      motorbike: { label: 'Motorbike', unit: 'km' },
      bus: { label: 'Bus', unit: 'km' },
      train: { label: 'Train', unit: 'km' },
      flight_short: { label: 'Short-haul Flight (Domestic)', unit: 'km' },
      flight_long: { label: 'Long-haul Flight (Intl)', unit: 'km' },
      bicycle: { label: 'Bicycle', unit: 'km' },
      walk: { label: 'Walk', unit: 'km' }
    },
    energy: {
      electricity_grid: { label: 'Grid Electricity', unit: 'kWh' },
      electricity_renewable: { label: 'Renewable Electricity', unit: 'kWh' },
      natural_gas: { label: 'Natural Gas', unit: 'kWh' },
      heating_oil: { label: 'Heating Oil', unit: 'liters' },
      coal: { label: 'Coal', unit: 'kg' }
    },
    food: {
      beef: { label: 'Beef', unit: 'kg' },
      pork: { label: 'Pork', unit: 'kg' },
      poultry: { label: 'Poultry', unit: 'kg' },
      fish: { label: 'Fish', unit: 'kg' },
      dairy: { label: 'Dairy (Milk/Cheese)', unit: 'kg' },
      vegetables: { label: 'Vegetables', unit: 'kg' },
      grains: { label: 'Grains & Bread', unit: 'kg' },
      fruit: { label: 'Fruit', unit: 'kg' },
      vegan_meal: { label: 'Vegan Meal (generic)', unit: 'meals' },
      vegetarian_meal: { label: 'Vegetarian Meal (generic)', unit: 'meals' },
      meat_meal: { label: 'Meat Meal (generic)', unit: 'meals' }
    },
    consumption: {
      clothing_item: { label: 'New Clothing Item', unit: 'items' },
      electronics_phone: { label: 'New Smartphone', unit: 'items' },
      electronics_laptop: { label: 'New Laptop/PC', unit: 'items' },
      general_waste: { label: 'General Waste (Landfill)', unit: 'kg' },
      recycled_waste: { label: 'Recycled Waste', unit: 'kg' }
    }
  };
};

module.exports = {
  calculateEmissions,
  getEquivalents,
  getMetadata
};
