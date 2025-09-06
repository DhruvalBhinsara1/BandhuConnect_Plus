import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import SuccessRateSimulation from '../../utils/successRateSimulation';

const SuccessRateTestScreen: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runSimulation = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      console.log('🧪 Starting Success Rate Simulation...');
      
      // Create test data
      await SuccessRateSimulation.createTestData();
      
      // Run simulation
      const simulationResults = await SuccessRateSimulation.runSimulation();
      setResults(simulationResults);
      
      // Clean up
      await SuccessRateSimulation.cleanupTestData();
      
      Alert.alert('Success', 'Simulation completed! Check results below.');
      
    } catch (error) {
      console.error('Simulation error:', error);
      Alert.alert('Error', 'Simulation failed. Check console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? '#4CAF50' : '#F44336';
  };

  const getStatusText = (passed: boolean) => {
    return passed ? '✅ PASS' : '❌ FAIL';
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
      <View style={styles.card}>
        <Text style={styles.title}>
          Success Rate Fix Simulation
        </Text>
        <Text style={styles.subtitle}>
          Tests whether manual assignments still affect auto-assignment success rates
        </Text>
        
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runSimulation}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Simulation...' : 'Run Simulation'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.note}>
          This will create test data, run calculations, and clean up automatically.
        </Text>
      </View>

      {results.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.resultsTitle}>
            Simulation Results
          </Text>
          
          {results.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultCard,
                { borderColor: getStatusColor(result.passed) },
                { backgroundColor: result.passed ? '#E8F5E8' : '#FFEBEE' }
              ]}
            >
              <Text style={styles.scenarioTitle}>
                {result.scenario}
              </Text>
              
              <View style={styles.resultRow}>
                <Text>Auto Assigned:</Text>
                <Text style={styles.resultValue}>{result.autoAssigned}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text>Manual Assigned:</Text>
                <Text style={styles.resultValue}>{result.manualAssigned}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text>Pending Auto:</Text>
                <Text style={styles.resultValue}>{result.pendingRequests}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text>Calculated Rate:</Text>
                <Text style={styles.resultValue}>{result.calculatedSuccessRate}%</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text>Expected Rate:</Text>
                <Text style={styles.resultValue}>{result.expectedSuccessRate}%</Text>
              </View>
              
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(result.passed) }
                ]}
              >
                {getStatusText(result.passed)}
              </Text>
            </View>
          ))}
          
          <View style={styles.expectedResults}>
            <Text style={styles.expectedTitle}>
              📋 Expected Results:
            </Text>
            <Text>• OLD Logic scenarios should FAIL ❌</Text>
            <Text>• NEW Logic scenarios should PASS ✅</Text>
            <Text>• Manual assignments should NOT affect auto-assignment rates</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#888',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  scenarioTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultValue: {
    fontWeight: 'bold',
  },
  statusText: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
  },
  expectedResults: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  expectedTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default SuccessRateTestScreen;
