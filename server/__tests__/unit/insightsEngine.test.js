/**
 * Unit tests for AI insights engine
 */
const engine = require('../../services/insightsEngine');

describe('AI Insights Engine Unit Tests', () => {
  const mockUser = {
    username: 'testuser',
    carbon_goal: 100.0
  };

  test('should return default recommendations and warnings if log list is empty', () => {
    const result = engine.generateInsights([], mockUser);
    
    expect(result.summary).toContain('Not enough data');
    expect(result.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(result.recommendations[0].id).toContain('rec_default');
  });

  test('should generate transport-specific recommendations if transport dominates carbon logs', () => {
    const entries = [
      { category: 'transport', sub_category: 'car_petrol', carbon_kg: 80, date: '2026-06-01' },
      { category: 'food', sub_category: 'vegetables', carbon_kg: 5, date: '2026-06-02' }
    ];

    const result = engine.generateInsights(entries, mockUser);
    
    expect(result.breakdown.transport).toBe(94); // 80 / 85 * 100
    const transportRecs = result.recommendations.filter(r => r.category === 'transport');
    expect(transportRecs.length).toBeGreaterThanOrEqual(1);
    expect(transportRecs[0].id).toBe('rec_transport_car');
  });

  test('should generate beef swapping food recommendations if beef logs are high', () => {
    const entries = [
      { category: 'food', sub_category: 'beef', carbon_kg: 36, date: '2026-06-01' },
      { category: 'energy', sub_category: 'electricity_renewable', carbon_kg: 2, date: '2026-06-02' }
    ];

    const result = engine.generateInsights(entries, mockUser);
    
    const foodRecs = result.recommendations.filter(r => r.category === 'food');
    expect(foodRecs.length).toBeGreaterThanOrEqual(1);
    expect(foodRecs[0].id).toBe('rec_food_beef');
  });

  test('should calculate trends correctly when comparing prior weeks logs', () => {
    const now = new Date();
    const threeDaysAgoStr = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tenDaysAgoStr = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const entries = [
      { category: 'transport', sub_category: 'car_petrol', carbon_kg: 10, date: threeDaysAgoStr },
      { category: 'transport', sub_category: 'car_petrol', carbon_kg: 50, date: tenDaysAgoStr }
    ];

    const result = engine.generateInsights(entries, mockUser);
    
    expect(result.trend.direction).toBe('down');
    expect(result.trend.percentage).toBe(80); // (50 - 10) / 50 * 100 = 80% drop
  });

  test('should generate flight recommendations if flight transport is high', () => {
    const entries = [
      { category: 'transport', sub_category: 'flight_short', carbon_kg: 200, date: '2026-06-01' },
      { category: 'food', sub_category: 'vegetables', carbon_kg: 5, date: '2026-06-02' }
    ];

    const result = engine.generateInsights(entries, mockUser);
    const flightRec = result.recommendations.find(r => r.id === 'rec_transport_flights');
    expect(flightRec).toBeDefined();
  });

  test('should generate energy efficiency recommendations if grid electricity is high', () => {
    const entries = [
      { category: 'energy', sub_category: 'electricity_grid', carbon_kg: 150, date: '2026-06-01' },
      { category: 'food', sub_category: 'vegetables', carbon_kg: 5, date: '2026-06-02' }
    ];

    const result = engine.generateInsights(entries, mockUser);
    const energyRec = result.recommendations.find(r => r.id === 'rec_energy_efficiency');
    expect(energyRec).toBeDefined();
  });

  test('should generate circular fashion recommendations if clothing consumption is high', () => {
    const entries = [
      { category: 'consumption', sub_category: 'clothing_item', carbon_kg: 100, date: '2026-06-01' },
      { category: 'food', sub_category: 'vegetables', carbon_kg: 5, date: '2026-06-02' }
    ];

    const result = engine.generateInsights(entries, mockUser);
    const fashionRec = result.recommendations.find(r => r.id === 'rec_consumption_fast_fashion');
    expect(fashionRec).toBeDefined();
  });

  test('should generate waste reduction recommendations if general waste is high', () => {
    const entries = [
      { category: 'consumption', sub_category: 'general_waste', carbon_kg: 80, date: '2026-06-01' },
      { category: 'food', sub_category: 'vegetables', carbon_kg: 5, date: '2026-06-02' }
    ];

    const result = engine.generateInsights(entries, mockUser);
    const wasteRec = result.recommendations.find(r => r.id === 'rec_consumption_compost');
    expect(wasteRec).toBeDefined();
  });

  test('should state user exceeded monthly budget if total carbon is above goal', () => {
    const entries = [
      { category: 'energy', sub_category: 'electricity_grid', carbon_kg: 120, date: '2026-06-01' }
    ];

    const result = engine.generateInsights(entries, { username: 'testuser', carbon_goal: 50.0 });
    expect(result.summary).toContain('exceeded your monthly target');
  });

  test('should handle stable or upward trend directions correctly', () => {
    const now = new Date();
    const threeDaysAgoStr = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tenDaysAgoStr = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Upward trend
    const entriesUp = [
      { category: 'transport', sub_category: 'car_petrol', carbon_kg: 50, date: threeDaysAgoStr },
      { category: 'transport', sub_category: 'car_petrol', carbon_kg: 10, date: tenDaysAgoStr }
    ];
    const resultUp = engine.generateInsights(entriesUp, mockUser);
    expect(resultUp.trend.direction).toBe('up');

    // Stable trend
    const entriesStable = [
      { category: 'transport', sub_category: 'car_petrol', carbon_kg: 20, date: threeDaysAgoStr },
      { category: 'transport', sub_category: 'car_petrol', carbon_kg: 20, date: tenDaysAgoStr }
    ];
    const resultStable = engine.generateInsights(entriesStable, mockUser);
    expect(resultStable.trend.direction).toBe('stable');
  });

  test('should generate meatless monday recommendations if food emissions are high but beef is not logged', () => {
    const entries = [
      { category: 'food', sub_category: 'pork', carbon_kg: 40, date: '2026-06-01' },
      { category: 'energy', sub_category: 'electricity_renewable', carbon_kg: 5, date: '2026-06-02' }
    ];

    const result = engine.generateInsights(entries, mockUser);
    const dietRec = result.recommendations.find(r => r.id === 'rec_food_diet');
    expect(dietRec).toBeDefined();
  });

  test('should handle totalEmissions of 0', () => {
    const entries = [
      { category: 'transport', sub_category: 'walk', carbon_kg: 0, date: '2026-06-01' }
    ];
    const result = engine.generateInsights(entries, mockUser);
    expect(result.breakdown.transport).toBe(0);
  });

  test('should handle transport category is high but dominant mode is not petrol/diesel car or flight', () => {
    const entries = [
      { category: 'transport', sub_category: 'bus', carbon_kg: 90, date: '2026-06-01' },
      { category: 'food', sub_category: 'vegetables', carbon_kg: 5, date: '2026-06-02' }
    ];
    const result = engine.generateInsights(entries, mockUser);
    expect(result.recommendations.find(r => r.id === 'rec_transport_car')).toBeUndefined();
    expect(result.recommendations.find(r => r.id === 'rec_transport_flights')).toBeUndefined();
  });

  test('should fill recommendations up to at least 3 using default options', () => {
    const entries = [
      { category: 'food', sub_category: 'beef', carbon_kg: 50, date: '2026-06-01' },
      { category: 'transport', sub_category: 'walk', carbon_kg: 0, date: '2026-06-02' }
    ];
    const result = engine.generateInsights(entries, mockUser);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(3);
  });

  test('should support diesel fuelType and fallback user goal', () => {
    const entries = [
      { category: 'transport', sub_category: 'car_diesel', carbon_kg: 90, date: '2026-06-01' }
    ];
    // Pass user without carbon_goal to trigger default 500.0 goal
    const result = engine.generateInsights(entries, { username: 'goalLessUser' });
    expect(result.summary).toContain('monthly target of 500');
    const rec = result.recommendations.find(r => r.id === 'rec_transport_car');
    expect(rec.description).toContain('diesel car emissions');
  });

  test('should handle minimal savings fallbacks for food and energy', () => {
    const entries = [
      { category: 'food', sub_category: 'beef', carbon_kg: 0.0001, date: '2026-06-01' },
      { category: 'energy', sub_category: 'electricity_grid', carbon_kg: 0.0001, date: '2026-06-02' }
    ];
    const result = engine.generateInsights(entries, mockUser);
    
    const beefRec = result.recommendations.find(r => r.id === 'rec_food_beef');
    expect(beefRec.potential_saving_kg).toBe(25.0);

    const energyRec = result.recommendations.find(r => r.id === 'rec_energy_efficiency');
    expect(energyRec.potential_saving_kg).toBe(15.0);
  });
});
