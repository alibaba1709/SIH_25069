// Test script for API integration
async function testBackendIntegration() {
  try {
    console.log('🧪 Testing RE-SOURCE Backend Integration...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Check:', healthData);
    } else {
      console.error('❌ Health check failed');
      return;
    }

    // Test calculation endpoint
    const testData = {
      material: 'Steel',
      quantity: 100,
      route: 'Primary',
      recycled_content_frac: 0.3,
      product_lifetime_years: 10,
      renewable_electricity_frac: 0.4,
      transport_distance_km: 150,
      reuse_potential_score: 0.5,
      repairability_score: 0.6,
      recycling_efficiency_frac: 0.85
    };

    console.log('📊 Testing MCI calculation with:', testData);
    
    const calcResponse = await fetch('http://localhost:5000/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (calcResponse.ok) {
      const result = await calcResponse.json();
      console.log('✅ MCI Calculation Result:', result);
      console.log(`🎯 MCI Score: ${result.results.mci_score}%`);
      console.log(`🌍 CO2 Emissions: ${result.results.environmental_impacts.co2_emissions} kg`);
      console.log(`⚡ Energy: ${result.results.environmental_impacts.energy_consumption} MJ`);
      console.log('💡 Recommendations:', result.results.recommendations);
    } else {
      const error = await calcResponse.text();
      console.error('❌ Calculation failed:', error);
    }

  } catch (error) {
    console.error('❌ Backend integration test failed:', error);
    console.log('📝 Make sure to:');
    console.log('1. Run start_backend.bat');
    console.log('2. Wait for server to start on port 5000');
    console.log('3. Check Python dependencies are installed');
  }
}

// Run test if in browser console
if (typeof window !== 'undefined') {
  window.testBackendIntegration = testBackendIntegration;
  console.log('🔧 Run testBackendIntegration() in console to test the API');
}
