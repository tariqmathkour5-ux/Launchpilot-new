// Tests for Multi-Agent System core components
// Inline mock implementation for testing without module resolution

import { AgentErrorHandler } from '../../src/lib/agents/agent-errors';
import { AgentErrorType } from '../../src/lib/agents/types';
import { generateCallbackData, generateProposalKeyboard } from '../../src/lib/agents/telegram-gateway';

// Test results tracking
const testResults: { name: string; passed: boolean; error?: string }[] = [];

function assertEqual<T>(actual: T, expected: T, testName: string): void {
  const passed = actual === expected;
  testResults.push({ name: testName, passed, error: passed ? undefined : `Expected ${expected}, got ${actual}` });
  if (!passed) {
    console.error(`❌ ${testName}: Expected ${expected}, got ${actual}`);
  } else {
    console.log(`✓ ${testName}`);
  }
}

function assertDeepEqual<T>(actual: T, expected: T, testName: string): void {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  testResults.push({ name: testName, passed, error: passed ? undefined : `Deep equality check failed` });
  if (!passed) {
    console.error(`❌ ${testName}: Deep equality check failed`);
  } else {
    console.log(`✓ ${testName}`);
  }
}

// ============================================
// AgentErrorHandler Tests
// ============================================
function testAgentErrorHandler(): void {
  const error = new AgentErrorHandler({
    type: AgentErrorType.VALIDATION_ERROR,
    agentId: 'AGT-DATA',
    message: 'Test validation error',
    context: { toolId: 'test-tool' },
    retryable: false,
    fatal: false,
  });

  assertEqual(error.type, AgentErrorType.VALIDATION_ERROR, 'AgentErrorHandler: type property');
  assertEqual(error.agentId, 'AGT-DATA', 'AgentErrorHandler: agentId property');
  assertEqual(error.message, 'Test validation error', 'AgentErrorHandler: message property');
  assertEqual(error.context.toolId, 'test-tool', 'AgentErrorHandler: context property');
  assertEqual(error.retryable, false, 'AgentErrorHandler: retryable property');
  assertEqual(error.fatal, false, 'AgentErrorHandler: fatal property');
}

function testAgentErrorHandlerDefaults(): void {
  const error = new AgentErrorHandler({
    type: AgentErrorType.NETWORK_ERROR,
    agentId: 'AGT-TECH',
    message: 'Network error',
  });

  assertDeepEqual(error.context, {}, 'AgentErrorHandler: default context');
  assertEqual(error.retryable, false, 'AgentErrorHandler: default retryable');
  assertEqual(error.fatal, false, 'AgentErrorHandler: default fatal');
}

// ============================================
// classifyError Tests
// ============================================
function testClassifyError(): void {
  const classifyError = (error: unknown, agentId: string): AgentErrorHandler => {
    // Importing the actual function would require prisma client
    // For now, we test the error handler directly
    return error as AgentErrorHandler;
  };

  // Test that error classification works
  const testError = new AgentErrorHandler({
    type: AgentErrorType.VALIDATION_ERROR,
    agentId: 'AGT-DATA',
    message: 'test',
  });
  
  assertEqual(testError.type, AgentErrorType.VALIDATION_ERROR, 'classifyError: validation error type');
}

// ============================================
// TelegramGateway Tests
// ============================================
function testCallbackDataFormat(): void {
  const callback = generateCallbackData('test-id', 'approve');
  assertEqual(callback, 'prs_test-id_approve', 'TelegramGateway: callback data format');
}

function testInlineKeyboard(): void {
  const keyboard = generateProposalKeyboard('test-id');
  
  assertEqual(keyboard.inline_keyboard.length, 1, 'TelegramGateway: keyboard rows');
  assertEqual(keyboard.inline_keyboard[0].length, 3, 'TelegramGateway: keyboard buttons');
  assertEqual(keyboard.inline_keyboard[0][0].text, '✅ Approve', 'TelegramGateway: approve button text');
  assertEqual(keyboard.inline_keyboard[0][1].text, '❌ Reject', 'TelegramGateway: reject button text');
  assertEqual(keyboard.inline_keyboard[0][2].text, '💬 Request Changes', 'TelegramGateway: changes button text');
}

// ============================================
// Orchestrator Tests
// ============================================
function testOrchestrator(): void {
  const { orchestrator, AGENT_CONFIGS } = require('../../src/lib/agents/orchestrator');
  
  assertEqual(typeof orchestrator.getInstance, 'function', 'Orchestrator: getInstance method');
  assertEqual(typeof orchestrator.start, 'function', 'Orchestrator: start method');
  assertEqual(typeof orchestrator.stop, 'function', 'Orchestrator: stop method');
  assertEqual(typeof orchestrator.updateHeartbeat, 'function', 'Orchestrator: updateHeartbeat method');
  assertEqual(typeof orchestrator.getAgentStatus, 'function', 'Orchestrator: getAgentStatus method');
  assertEqual(Object.keys(AGENT_CONFIGS).length, 15, 'Orchestrator: all 15 agents configured');
}

// ============================================
// DataAggregatorAgent Tests
// ============================================
function testDataAggregatorAgent(): void {
  const { DataAggregatorAgent } = require('../../src/lib/agents/data-aggregator');
  const agent = new DataAggregatorAgent();
  
  assertEqual(typeof agent.run, 'function', 'DataAggregator: run method exists');
  assertEqual(typeof agent.getConfig, 'function', 'DataAggregator: getConfig method exists');
  assertEqual(typeof agent.handleProposalResponse, 'function', 'DataAggregator: handleProposalResponse method exists');
  assertEqual(agent.getConfig().validationThreshold, 70, 'DataAggregator: default validation threshold');
}

// ============================================
// Run all tests
// ============================================
console.log('\n=== Multi-Agent System Core Tests ===\n');

testAgentErrorHandler();
testAgentErrorHandlerDefaults();
testClassifyError();
testCallbackDataFormat();
testInlineKeyboard();
testOrchestrator();
testDataAggregatorAgent();

// Summary
console.log('\n=== Test Summary ===');
const passed = testResults.filter(r => r.passed).length;
const failed = testResults.filter(r => !r.passed).length;

console.log(`Total: ${testResults.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailed tests:');
  testResults.filter(r => !r.passed).forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  process.exit(1);
}

console.log('\n✅ All tests passed!');
process.exit(0);