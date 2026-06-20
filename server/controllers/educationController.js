/**
 * Education Controller provides curated carbon literacy resources
 */
/**
 * Retrieve curated educational carbon literacy articles and quick facts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing articles and facts
 */
const getResources = (req, res) => {
  const articles = [
    {
      id: 'edu_diet_carbon',
      category: 'food',
      title: 'The Carbon Cost of Dinner',
      summary: 'Understand why livestock farming generates 14.5% of global greenhouse gases and how simple dietary swaps can make a big difference.',
      content: `Dietary choices play an outsized role in our carbon footprint. Producing one kilogram of beef generates approximately 36 kilograms of CO2 equivalents, due to methane emissions from enteric fermentation, land clearing for pasture, and fertilizer use.

In comparison, poultry produces about 6.9 kg CO2e, and plant-based foods like vegetables and grains generate less than 1 kg CO2e per kilogram. By adopting a flexitarian diet or implementing 'Meat-free Mondays', you can reduce your personal food emissions by up to 30%. Buying local also reduces transport emissions ('food miles'), but the type of food you eat has a far larger impact than where it was transported from.`,
      readTime: '3 min read',
      difficulty: 'Beginner'
    },
    {
      id: 'edu_phantom_loads',
      category: 'energy',
      title: 'Vampire Draw and Energy Efficiency at Home',
      summary: 'Learn about stand-by power consumption and how idle appliances quietly run up your carbon emissions and electricity bill.',
      content: `Many electrical appliances continue to draw power even when turned off. This is known as standby power, 'vampire draw', or phantom loads. In the average household, vampire draw accounts for 5% to 10% of total residential electricity usage.

Typical culprits include televisions, chargers left plugged in, desktop computers, and microwave clocks. Switching off appliances at the wall outlet or utilizing smart power strips that cut off power to multiple idle devices can save the average household up to 100 kg of CO2e per year, while lowering utility bills.`,
      readTime: '2 min read',
      difficulty: 'Beginner'
    },
    {
      id: 'edu_active_transit',
      category: 'transport',
      title: 'Active Commuting and Health Co-Benefits',
      summary: 'Ditching the car for short trips does wonders for both the atmosphere and your cardiovascular health.',
      content: `Over 50% of urban car trips are shorter than 5 kilometers. For these distances, passenger cars operate inefficiently, burning more fuel per kilometer as engines warm up.

Choosing active transport (walking, running, or cycling) generates zero carbon emissions. Additionally, walking or cycling for 30 minutes a day meets the recommended guidelines for physical activity, significantly reducing risks of cardiovascular disease, obesity, and mental stress. When active transport isn't feasible, using public transit (bus or train) reduces emissions per passenger-kilometer by up to 70% compared to single-occupant vehicles.`,
      readTime: '4 min read',
      difficulty: 'Intermediate'
    },
    {
      id: 'edu_circular_fashion',
      category: 'consumption',
      title: 'The Hidden Impact of Fast Fashion',
      summary: 'How globalized production and synthetics turn our closets into a major source of carbon emissions and microplastics.',
      content: `The fashion industry is responsible for 8-10% of global carbon emissions—more than all international flights and maritime shipping combined. The rise of 'fast fashion' has led to a doubling of clothing production since 2000, with clothes worn fewer times before disposal.

Synthetic fibers like polyester are derived from fossil fuels and require energy-intensive manufacturing processes, while cotton cultivation consumes vast amounts of water and pesticides. To mitigate this:
1. Buy less and choose durable quality.
2. Care for garments at lower temperatures.
3. Repair clothes instead of discarding.
4. Purchase second-hand or participate in clothing swaps.`,
      readTime: '3 min read',
      difficulty: 'Intermediate'
    }
  ];

  const facts = [
    'A single mature tree absorbs approximately 22 kg of CO2 from the atmosphere per year.',
    'LED light bulbs use up to 80% less energy than traditional incandescent bulbs and last 25 times longer.',
    'Food waste accounts for nearly 8% of global greenhouse gas emissions. If it were a country, it would be the third-largest emitter.',
    'Recycling aluminium saves 95% of the energy required to make it from raw materials.'
  ];

  return res.json({
    success: true,
    articles,
    facts
  });
};

module.exports = {
  getResources
};
