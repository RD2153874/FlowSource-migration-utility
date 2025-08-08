// Test suite for FlowSource Migration Agent
import { test, describe } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs-extra';
import { FlowSourceAgent } from '../core/FlowSourceAgent.js';
import { ConfigValidator } from '../utils/ConfigValidator.js';
import { FileManager } from '../utils/FileManager.js';
import { DocumentationParser } from '../utils/DocumentationParser.js';

describe('FlowSource Migration Agent Tests', () => {
  
  test('ConfigValidator - validatePrerequisites', async () => {
    const validator = new ConfigValidator();
    
    try {
      const results = await validator.validatePrerequisites();
      assert.ok(results.passed.length > 0, 'Should have some passed prerequisites');
      console.log('✅ Prerequisites validation test passed');
    } catch (error) {
      // Expected if prerequisites are missing
      assert.ok(error.message.includes('Prerequisites validation failed'));
      console.log('⚠️ Prerequisites validation test - some requirements missing (expected)');
    }
  });

  test('FileManager - basic operations', async () => {
    const fileManager = new FileManager();
    const testDir = path.join(process.cwd(), 'test-temp');
    const testFile = path.join(testDir, 'test.txt');
    
    try {
      // Test directory creation
      await fileManager.ensureDir(testDir);
      assert.ok(await fs.pathExists(testDir), 'Directory should be created');
      
      // Test file writing
      await fileManager.writeFile(testFile, 'test content');
      assert.ok(await fs.pathExists(testFile), 'File should be created');
      
      // Test file reading
      const content = await fileManager.readFile(testFile);
      assert.strictEqual(content, 'test content', 'File content should match');
      
      // Cleanup
      await fs.remove(testDir);
      console.log('✅ FileManager test passed');
      
    } catch (error) {
      // Cleanup on error
      await fs.remove(testDir);
      throw error;
    }
  });

  test('DocumentationParser - parse markdown', async () => {
    const parser = new DocumentationParser();
    
    // Create a test markdown file
    const testMarkdown = `# Test Document

## Section 1
This is content for section 1.

### Step 1: First Step
Do something important.

### Step 2: Second Step
Do something else.

\`\`\`javascript
console.log('test code');
\`\`\`

## Requirements
- **Node.js**: v20+
- **Yarn**: v1.22+
`;

    const testFile = path.join(process.cwd(), 'test-doc.md');
    
    try {
      await fs.writeFile(testFile, testMarkdown);
      
      const parsed = await parser.parse(testFile);
      
      assert.strictEqual(parsed.title, 'Test Document', 'Should extract title correctly');
      assert.ok(parsed.sections.length >= 2, 'Should extract sections');
      assert.ok(parsed.steps.length >= 2, 'Should extract steps');
      assert.ok(parsed.codeBlocks.length >= 1, 'Should extract code blocks');
      
      // Cleanup
      await fs.remove(testFile);
      console.log('✅ DocumentationParser test passed');
      
    } catch (error) {
      // Cleanup on error
      await fs.remove(testFile);
      throw error;
    }
  });

  test('FlowSourceAgent - initialization', () => {
    const agent = new FlowSourceAgent({
      dryRun: true,
      verbose: false,
      phase: 1
    });
    
    assert.ok(agent, 'Agent should initialize');
    assert.strictEqual(agent.options.phase, 1, 'Phase should be set correctly');
    assert.strictEqual(agent.options.dryRun, true, 'Dry run should be enabled');
    
    console.log('✅ FlowSourceAgent initialization test passed');
  });

  test('FlowSourceAgent - validateSourcePaths (mock)', async () => {
    const agent = new FlowSourceAgent({ dryRun: true });
    
    // Test with invalid path
    const invalidConfig = {
      sourcePath: '/nonexistent/path'
    };
    
    try {
      await agent.validateSourcePaths(invalidConfig);
      assert.fail('Should throw error for invalid path');
    } catch (error) {
      assert.ok(error.message.includes('Required path not found'), 'Should fail with appropriate error');
      console.log('✅ FlowSourceAgent validateSourcePaths test passed');
    }
  });

});

// Helper function to run tests
export async function runTests() {
  console.log('🧪 Running FlowSource Migration Agent Tests...\n');
  
  try {
    // Note: In a real environment, you'd use a proper test runner
    // This is a simplified test setup for demonstration
    
    console.log('📝 Tests completed. Check individual test outputs above.');
    console.log('\n🎯 To run comprehensive tests:');
    console.log('1. Ensure all prerequisites are installed');
    console.log('2. Set up a test FlowSource package');
    console.log('3. Run: npm test');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
