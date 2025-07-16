/**
 * Test file for validating individual functions in the refactored main process
 */
/**
 * Test configuration loading
 */
declare function testConfigurationLoading(): Promise<boolean>;
/**
 * Test run state initialization (without actual initialization)
 */
declare function testRunStateInitialization(): Promise<boolean>;
/**
 * Test file preparation structure (without downloading)
 */
declare function testFilePreperation(): Promise<boolean>;
/**
 * Test URL configuration
 */
declare function testUrlConfiguration(): Promise<boolean>;
/**
 * Run all validation tests
 */
declare function runValidationTests(): Promise<void>;
export { testConfigurationLoading, testRunStateInitialization, testFilePreperation, testUrlConfiguration, runValidationTests };
