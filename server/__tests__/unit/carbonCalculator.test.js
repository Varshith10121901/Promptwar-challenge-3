/**
 * Unit tests for carbon calculator service
 */
const calculator = require('../../services/carbonCalculator');

describe('Carbon Calculator Unit Tests', () => {
  describe('calculateEmissions', () => {
    test('should calculate transport emissions correctly', () => {
      // Petrol car (0.18 kg CO2/km) for 100km
      const emissions = calculator.calculateEmissions('transport', 'car_petrol', 100);
      expect(emissions).toBe(18.0);
    });

    test('should calculate electric car emissions correctly', () => {
      // Electric car (0.05 kg CO2/km) for 100km
      const emissions = calculator.calculateEmissions('transport', 'car_electric', 100);
      expect(emissions).toBe(5.0);
    });

    test('should calculate food emissions correctly', () => {
      // Beef (36 kg CO2/kg) for 0.5kg
      const emissions = calculator.calculateEmissions('food', 'beef', 0.5);
      expect(emissions).toBe(18.0);
    });

    test('should calculate consumption emissions correctly (including negative credit for recycling)', () => {
      // Recycled waste (-0.35 kg CO2/kg) for 10kg
      const emissions = calculator.calculateEmissions('consumption', 'recycled_waste', 10);
      expect(emissions).toBe(-3.5);
    });

    test('should throw error for invalid categories and subcategories', () => {
      expect(() => calculator.calculateEmissions('invalid_cat', 'car_petrol', 10)).toThrow();
      expect(() => calculator.calculateEmissions('transport', 'invalid_sub', 10)).toThrow();
    });

    test('should throw error for negative values', () => {
      expect(() => calculator.calculateEmissions('transport', 'car_petrol', -10)).toThrow();
    });
  });

  describe('getEquivalents', () => {
    test('should calculate correct equivalents for a given carbon footprint', () => {
      const equiv = calculator.getEquivalents(18); // 18 kg CO2
      
      // Car: 18 / 0.18 = 100 km
      expect(equiv.carKm).toBe(100);
      
      // Phone: 18 / 0.0083 = 2169 charges
      expect(equiv.phoneCharges).toBe(2169);
      
      // Tree: 18 / 0.06 = 300 tree days
      expect(equiv.treeDays).toBe(300);
    });

    test('should return zeros for zero or negative values', () => {
      const equiv = calculator.getEquivalents(0);
      expect(equiv).toEqual({ carKm: 0, phoneCharges: 0, treeDays: 0 });
    });
  });

  describe('getMetadata', () => {
    test('should return formatted options map', () => {
      const meta = calculator.getMetadata();
      expect(meta).toHaveProperty('transport');
      expect(meta).toHaveProperty('energy');
      expect(meta).toHaveProperty('food');
      expect(meta).toHaveProperty('consumption');
      expect(meta.transport.car_petrol.unit).toBe('km');
    });
  });
});
