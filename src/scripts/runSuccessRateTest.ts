/**
 * Run Success Rate Simulation
 * Execute this script to test the success rate fix
 */

import SuccessRateSimulation from '../utils/successRateSimulation';

const runSimulation = async () => {
  console.log('🧪 Success Rate Simulation Starting...\n');
  
  try {
    await SuccessRateSimulation.runCompleteSimulation();
    console.log('\n✅ Simulation completed successfully!');
  } catch (error) {
    console.error('❌ Simulation failed:', error);
  }
};

// Run the simulation
runSimulation();
