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
});
