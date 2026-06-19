/**
 * AI/ML-style Personalized Insights Engine
 */
const { EMISSION_FACTORS } = require('../utils/constants');

/**
 * Analyze user's carbon entries and generate actionable, personalized recommendations.
 * @param {Array} entries - List of footprint entries for the user
 * @param {Object} user - User object containing goal and profile info
 * @returns {Object} insights including trend analysis, category breakdown, and personalized recommendations
 */
const generateInsights = (entries, user) => {
  if (!entries || entries.length === 0) {
    return {
      summary: 'Not enough data yet. Log some activities to get AI insights!',
      trend: { direction: 'stable', percentage: 0, message: 'Keep logging to see your carbon trend.' },
      breakdown: {},
      recommendations: getDefaultRecommendations()
    };
  }

  // Calculate breakdown by category
  const breakdown = { transport: 0, energy: 0, food: 0, consumption: 0 };
  const subCategoryTotals = {};
  let totalEmissions = 0;

  entries.forEach(entry => {
    const val = Number(entry.carbon_kg);
    breakdown[entry.category] = (breakdown[entry.category] || 0) + val;
    totalEmissions += val;

    const subKey = `${entry.category}:${entry.sub_category}`;
    subCategoryTotals[subKey] = (subCategoryTotals[subKey] || 0) + val;
  });

  // Calculate percentages
  const percentages = {};
  Object.keys(breakdown).forEach(cat => {
    percentages[cat] = totalEmissions > 0 ? Math.round((breakdown[cat] / totalEmissions) * 100) : 0;
  });

  // Analyze trend (split entries into recent 7 days vs previous 7 days if possible)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  let recentTotal = 0;
  let previousTotal = 0;

  entries.forEach(entry => {
    const entryDate = new Date(entry.date);
    if (entryDate >= sevenDaysAgo) {
      recentTotal += entry.carbon_kg;
    } else if (entryDate >= fourteenDaysAgo && entryDate < sevenDaysAgo) {
      previousTotal += entry.carbon_kg;
    }
  });

  let trendMessage = 'Your emissions are starting to form a baseline.';
  let trendDirection = 'stable';
  let trendPercentage = 0;

  if (previousTotal > 0) {
    const diff = recentTotal - previousTotal;
    trendPercentage = Math.round((Math.abs(diff) / previousTotal) * 100);
    
    if (diff < -5) {
      trendDirection = 'down';
      trendMessage = `Great job! Your carbon emissions are down by ${trendPercentage}% this week compared to last week.`;
    } else if (diff > 5) {
      trendDirection = 'up';
      trendMessage = `Heads up: Your carbon footprint increased by ${trendPercentage}% this week. Review your entries to see where you can save.`;
    } else {
      trendDirection = 'stable';
      trendMessage = 'Your weekly carbon footprint is holding steady.';
    }
  }

  // Generate personalized recommendations
  const recommendations = [];

  // 1. Check Transport
  if (breakdown.transport > totalEmissions * 0.25) {
    // Find dominant subcategory
    const transportKeys = Object.keys(subCategoryTotals).filter(k => k.startsWith('transport:'));
    let maxTransportSub = '';
    let maxTransportVal = 0;
    
    transportKeys.forEach(k => {
      if (subCategoryTotals[k] > maxTransportVal) {
        maxTransportVal = subCategoryTotals[k];
        maxTransportSub = k.split(':')[1];
      }
    });

    if (maxTransportSub.includes('car_petrol') || maxTransportSub.includes('car_diesel')) {
      const fuelType = maxTransportSub === 'car_petrol' ? 'petrol' : 'diesel';
      const factorDiff = EMISSION_FACTORS.transport[maxTransportSub] - EMISSION_FACTORS.transport.bus;
      const weeklySaving = Math.round(50 * factorDiff * 10) / 10; // assuming 50km saved per week

      recommendations.push({
        id: 'rec_transport_car',
        title: 'Switch Commutes to Public Transit',
        description: `Your ${fuelType} car emissions are a major contributor (${Math.round(maxTransportVal)} kg CO2e) to your footprint. Try taking the bus or train for just 2 days a week.`,
        potential_saving_kg: weeklySaving,
        difficulty: 'medium',
        category: 'transport',
        action_plan: 'Replace 50km of driving with public transit or train commutes this week.'
      });
    }

    if (maxTransportSub.includes('flight')) {
      recommendations.push({
        id: 'rec_transport_flights',
        title: 'Explore Virtual Meeting Alternatives or Train Travel',
        description: 'Flight emissions can be massive. Consider switching short-haul domestic flights to high-speed rail, or conduct business meetings virtually when possible.',
        potential_saving_kg: 75.0,
        difficulty: 'medium',
        category: 'transport',
        action_plan: 'Avoid one short-haul flight by taking a train or choosing video conferencing.'
      });
    }
  }

  // 2. Check Food
  if (breakdown.food > totalEmissions * 0.2) {
    const beefVal = subCategoryTotals['food:beef'] || 0;
    if (beefVal > 0) {
      // Replacing beef (36 kg CO2/kg) with poultry (6.9 kg CO2/kg) or vegan (0.5 kg CO2/meal)
      const saving = Math.round((36.0 - 0.5) * (beefVal / 36.0) * 10) / 10;
      recommendations.push({
        id: 'rec_food_beef',
        title: 'Swap Beef for Plant-Based Alternatives',
        description: 'Beef has a high carbon density. Swapping your beef purchases for vegetarian or vegan options could cut your food footprint substantially.',
        potential_saving_kg: saving || 25.0,
        difficulty: 'easy',
        category: 'food',
        action_plan: 'Replace at least 1 beef dish this week with a bean, lentil, or tofu-based alternative.'
      });
    } else {
      recommendations.push({
        id: 'rec_food_diet',
        title: 'Adopt Meatless Mondays',
        description: 'Reduce your meat consumption by going completely meat-free for one day per week to noticeably lower your daily food footprint.',
        potential_saving_kg: 12.0,
        difficulty: 'easy',
        category: 'food',
        action_plan: 'Eat entirely plant-based/vegetarian meals on Monday.'
      });
    }
  }

  // 3. Check Energy
  if (breakdown.energy > totalEmissions * 0.2) {
    const gridElectricityVal = subCategoryTotals['energy:electricity_grid'] || 0;
    if (gridElectricityVal > 0) {
      const saving = Math.round(gridElectricityVal * 0.2 * 10) / 10; // 20% reduction recommendation
      recommendations.push({
        id: 'rec_energy_efficiency',
        title: 'Upgrade to Energy-Efficient Devices & LED Lighting',
        description: 'Your grid electricity accounts for a high proportion of home carbon emissions. Unplugging vampire loads and switching to LEDs can reduce usage by up to 20%.',
        potential_saving_kg: saving || 15.0,
        difficulty: 'easy',
        category: 'energy',
        action_plan: 'Turn off standby mode on home appliances, or swap 3 incandescent bulbs for LEDs.'
      });
    }
  }

  // 4. Check Consumption
  if (breakdown.consumption > totalEmissions * 0.15) {
    const clothingVal = subCategoryTotals['consumption:clothing_item'] || 0;
    if (clothingVal > 0) {
      recommendations.push({
        id: 'rec_consumption_fast_fashion',
        title: 'Embrace Second-hand or Circular Fashion',
        description: 'New clothing items have a heavy manufacturing footprint. Opt for thrift stores, thrift applications, or clothing repair to extend garment lifespans.',
        potential_saving_kg: Math.round(clothingVal * 0.5 * 10) / 10,
        difficulty: 'easy',
        category: 'consumption',
        action_plan: 'Before buying a new clothing item, check if you can repair or purchase it second-hand.'
      });
    }
    
    const wasteVal = subCategoryTotals['consumption:general_waste'] || 0;
    if (wasteVal > 0) {
      recommendations.push({
        id: 'rec_consumption_compost',
        title: 'Increase Composting & Recycling',
        description: 'Organic waste in landfills decomposes anaerobically, creating methane. Composting food scraps reduces landfill waste and captures nutrients.',
        potential_saving_kg: Math.round(wasteVal * 0.3 * 10) / 10,
        difficulty: 'easy',
        category: 'consumption',
        action_plan: 'Separate your paper, metal, and compostable organic waste from general trash.'
      });
    }
  }

  // Fill up to at least 3 recommendations if list is too small
  const defaultRecs = getDefaultRecommendations();
  while (recommendations.length < 3 && defaultRecs.length > 0) {
    const nextRec = defaultRecs.shift();
    if (!recommendations.some(r => r.id === nextRec.id)) {
      recommendations.push(nextRec);
    }
  }

  // Summary message based on performance against goal
  const goal = user.carbon_goal || 500.0;
  let summary = `Your total emissions logged are ${Math.round(totalEmissions)} kg CO2e. `;
  if (totalEmissions <= goal) {
    summary += `Excellent! You are currently ${Math.round(goal - totalEmissions)} kg under your monthly target of ${goal} kg.`;
  } else {
    summary += `You have exceeded your monthly target of ${goal} kg by ${Math.round(totalEmissions - goal)} kg. Focus on reducing transport and energy consumption.`;
  }

  return {
    summary,
    trend: {
      direction: trendDirection,
      percentage: trendPercentage,
      message: trendMessage
    },
    breakdown: percentages,
    recommendations: recommendations.slice(0, 4) // Return top 4 recommendations
  };
};

/**
 * Standard fallbacks when data is limited
 */
const getDefaultRecommendations = () => {
  return [
    {
      id: 'rec_default_diet',
      title: 'Adopt Meat-Free Meals',
      description: 'Meat production accounts for double the greenhouse gas emissions of plant-based foods. Try introducing vegetarian meals to your week.',
      potential_saving_kg: 15.0,
      difficulty: 'easy',
      category: 'food',
      action_plan: 'Substitute beef or pork meals with vegetarian alternatives for 3 meals this week.'
    },
    {
      id: 'rec_default_transit',
      title: 'Walk or Cycle for Trips Under 3km',
      description: 'Short car trips have high fuel consumption ratios. Walking or cycling has zero carbon emissions and boosts cardiovascular health.',
      potential_saving_kg: 8.0,
      difficulty: 'easy',
      category: 'transport',
      action_plan: 'Choose to walk or bike instead of drive for any journey under 3 kilometers.'
    },
    {
      id: 'rec_default_energy',
      title: 'Switch Off Idle Appliances',
      description: 'Devices on standby still consume power (phantom loads). Power strips can turn off multiple appliances simultaneously to save electricity.',
      potential_saving_kg: 5.5,
      difficulty: 'easy',
      category: 'energy',
      action_plan: 'Turn off power strips before going to bed to prevent stand-by power waste.'
    }
  ];
};

module.exports = {
  generateInsights
};
