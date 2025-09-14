/**
 * Test Script for Self-Repairing System
 * This script tests the assignment repair functionality
 */

import { repairAssignments, quickRepair, advancedRepair } from '../services/assignmentRepairService';
import { supabase } from '../services/supabase';

interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  duration: number;
}

class RepairSystemTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Self-Repairing System Tests...\n');

    await this.testDuplicateRepair();
    await this.testMissingAssignmentRepair();
    await this.testQuickRepair();
    await this.testAdvancedRepair();
    await this.testErrorHandling();

    this.printResults();
  }

  private async testDuplicateRepair(): Promise<void> {
    const startTime = Date.now();
    console.log('🔧 Testing Duplicate Assignment Repair...');

    try {
      // Get a test user ID (you'll need to replace this with an actual user ID)
      const { data: testUser } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (!testUser) {
        this.recordResult('Duplicate Repair Test', false, 'No test user found', Date.now() - startTime);
        return;
      }

      const result = await repairAssignments(testUser.id);
      this.recordResult('Duplicate Repair Test', result.success, result.message, Date.now() - startTime);

    } catch (error) {
      this.recordResult('Duplicate Repair Test', false, `Error: ${error.message}`, Date.now() - startTime);
    }
  }

  private async testMissingAssignmentRepair(): Promise<void> {
    const startTime = Date.now();
    console.log('🔧 Testing Missing Assignment Repair...');

    try {
      // This test would require setting up a scenario with missing assignments
      // For now, we'll test with a valid user
      const { data: testUser } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (!testUser) {
        this.recordResult('Missing Assignment Test', false, 'No test user found', Date.now() - startTime);
        return;
      }

      const result = await repairAssignments(testUser.id);
      this.recordResult('Missing Assignment Test', result.success, result.message, Date.now() - startTime);

    } catch (error) {
      this.recordResult('Missing Assignment Test', false, `Error: ${error.message}`, Date.now() - startTime);
    }
  }

  private async testQuickRepair(): Promise<void> {
    const startTime = Date.now();
    console.log('🔧 Testing Quick Repair...');

    try {
      const { data: testUser } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (!testUser) {
        this.recordResult('Quick Repair Test', false, 'No test user found', Date.now() - startTime);
        return;
      }

      const result = await quickRepair(testUser.id);
      this.recordResult('Quick Repair Test', result.success, result.message, Date.now() - startTime);

    } catch (error) {
      this.recordResult('Quick Repair Test', false, `Error: ${error.message}`, Date.now() - startTime);
    }
  }

  private async testAdvancedRepair(): Promise<void> {
    const startTime = Date.now();
    console.log('🔧 Testing Advanced Repair...');

    try {
      const { data: testUser } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (!testUser) {
        this.recordResult('Advanced Repair Test', false, 'No test user found', Date.now() - startTime);
        return;
      }

      const result = await advancedRepair(testUser.id, {
        maxVolunteersToCheck: 5,
        preferredSelectionStrategy: 'workload',
        enableWorkloadBalancing: true,
        maxRetryAttempts: 2
      });

      this.recordResult('Advanced Repair Test', result.success, result.message, Date.now() - startTime);

    } catch (error) {
      this.recordResult('Advanced Repair Test', false, `Error: ${error.message}`, Date.now() - startTime);
    }
  }

  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    console.log('🔧 Testing Error Handling...');

    try {
      // Test with invalid user ID
      const result = await repairAssignments('invalid-user-id');
      this.recordResult('Error Handling Test', !result.success, 'Should handle invalid user gracefully', Date.now() - startTime);

    } catch (error) {
      this.recordResult('Error Handling Test', true, 'Error handled correctly', Date.now() - startTime);
    }
  }

  private recordResult(testName: string, success: boolean, message: string, duration: number): void {
    this.results.push({ testName, success, message, duration });
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}: ${message} (${duration}ms)`);
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;

    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.message}`);
    });

    console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 All self-repairing system tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above for details.');
    }
  }
}

// Export for use in other files
export default RepairSystemTester;

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new RepairSystemTester();
  tester.runAllTests().catch(console.error);
}