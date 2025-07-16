/**
 * Test file for validating individual functions in the refactored main process
 */

import { getRunConfiguration } from './automation/generate/src/config.js';

/**
 * Test configuration loading
 */
async function testConfigurationLoading(): Promise<boolean> {
  try {
    console.log("Testing configuration loading...");
    const config = getRunConfiguration();
    
    // Validate required properties
    if (!config.azure.projectEndpoint) {
      throw new Error("Missing Azure project endpoint");
    }
    if (!config.azure.modelDeploymentName) {
      throw new Error("Missing model deployment name");
    }
    if (!config.azure.agentId) {
      throw new Error("Missing agent ID");
    }
    
    console.log("✓ Configuration loading test passed");
    return true;
  } catch (error) {
    console.error("❌ Configuration loading test failed:", (error as Error).message);
    return false;
  }
}

/**
 * Test run state initialization (without actual initialization)
 */
async function testRunStateInitialization(): Promise<boolean> {
  try {
    console.log("Testing run state initialization...");
    
    // This would normally call initializeRunState() but we'll just validate the structure
    // without actually creating directories or modifying files
    const config = getRunConfiguration();
    
    // Check that all required paths are defined
    if (!config.runPaths.timestampedDir) {
      throw new Error("Missing timestamped directory path");
    }
    if (!config.runPaths.sourceOfTruthDir) {
      throw new Error("Missing source of truth directory path");
    }
    if (!config.runPaths.contentDir) {
      throw new Error("Missing content directory path");
    }
    if (!config.runPaths.agentNotesDir) {
      throw new Error("Missing agent notes directory path");
    }
    
    console.log("✓ Run state initialization test passed");
    return true;
  } catch (error) {
    console.error("❌ Run state initialization test failed:", (error as Error).message);
    return false;
  }
}

/**
 * Test file preparation structure (without downloading)
 */
async function testFilePreperation(): Promise<boolean> {
  try {
    console.log("Testing file preparation structure...");
    
    const config = getRunConfiguration();
    
    // Check that all required file paths are defined
    if (!config.runFilePaths.commandsFilePath) {
      throw new Error("Missing commands file path");
    }
    if (!config.runFilePaths.toolsJsonFilePath) {
      throw new Error("Missing tools JSON file path");
    }
    if (!config.runFilePaths.toolsJsonBackupPath) {
      throw new Error("Missing tools JSON backup path");
    }
    
    // Check source file paths
    if (!config.sourceFilePaths.templateFilePath) {
      throw new Error("Missing template file path");
    }
    if (!config.sourceFilePaths.createDocsPromptPath) {
      throw new Error("Missing create docs prompt path");
    }
    if (!config.sourceFilePaths.editorialReviewPath) {
      throw new Error("Missing editorial review path");
    }
    
    console.log("✓ File preparation test passed");
    return true;
  } catch (error) {
    console.error("❌ File preparation test failed:", (error as Error).message);
    return false;
  }
}

/**
 * Test URL configuration
 */
async function testUrlConfiguration(): Promise<boolean> {
  try {
    console.log("Testing URL configuration...");
    
    const config = getRunConfiguration();
    
    // Check that URLs are valid
    const engineeringUrl = config.urls.engineeringTeamCommandsUrl;
    const contentUrl = config.urls.contentTeamToolsUrl;
    
    if (!engineeringUrl || !engineeringUrl.startsWith('https://')) {
      throw new Error("Invalid engineering team commands URL");
    }
    if (!contentUrl || !contentUrl.startsWith('https://')) {
      throw new Error("Invalid content team tools URL");
    }
    
    console.log("✓ URL configuration test passed");
    return true;
  } catch (error) {
    console.error("❌ URL configuration test failed:", (error as Error).message);
    return false;
  }
}

/**
 * Run all validation tests
 */
async function runValidationTests(): Promise<void> {
  console.log("=== Running Function Validation Tests ===\n");
  
  const tests = [
    { name: "Configuration Loading", test: testConfigurationLoading },
    { name: "Run State Initialization", test: testRunStateInitialization },
    { name: "File Preparation", test: testFilePreperation },
    { name: "URL Configuration", test: testUrlConfiguration },
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ Test "${name}" threw an error:`, (error as Error).message);
    }
    console.log(); // Empty line for readability
  }
  
  console.log("=== Test Results ===");
  console.log(`Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log("🎉 All validation tests passed!");
    console.log("\nFunctions are ready for integration testing.");
  } else {
    console.log("⚠️  Some tests failed. Please fix the issues before proceeding.");
  }
}

// Export test functions for external use
export {
  testConfigurationLoading,
  testRunStateInitialization,
  testFilePreperation,
  testUrlConfiguration,
  runValidationTests
};
