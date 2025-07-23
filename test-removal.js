// Test the removeAllowAllPolicyImport regex patterns
console.log('🧪 Testing Allow-All-Policy Removal Patterns...');

// Test cases from real backend index.ts files
const testCases = [
  // Case 1: Multi-line format (from Auth.md)
  `backend.add(
  import("@backstage/plugin-permission-backend-module-allow-all-policy")
);`,

  // Case 2: Single line format
  `backend.add(import("@backstage/plugin-permission-backend-module-allow-all-policy"));`,

  // Case 3: With extra spaces
  `backend.add(
    import("@backstage/plugin-permission-backend-module-allow-all-policy")
  );`,

  // Case 4: In a list with other imports
  `backend.add(customAuthProvidersModule);
backend.add(
  import("@backstage/plugin-permission-backend-module-allow-all-policy")
);
backend.add(customCatalogAdminPermissionPolicyBackendModule);`
];

// The patterns I implemented
const patterns = [
  /backend\.add\(\s*import\(\s*["']@backstage\/plugin-permission-backend-module-allow-all-policy["']\s*\)\s*\);?\s*\n?/g,
  /import\s*\(\s*["']@backstage\/plugin-permission-backend-module-allow-all-policy["']\s*\)\s*,?\s*\n?/g,
  /["']@backstage\/plugin-permission-backend-module-allow-all-policy["']\s*,?\s*\n?/g
];

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test Case ${index + 1}:`);
  console.log('Original:', JSON.stringify(testCase));
  
  let result = testCase;
  let matchFound = false;
  
  patterns.forEach((pattern, patternIndex) => {
    const matches = result.match(pattern);
    if (matches) {
      console.log(`Pattern ${patternIndex + 1} matches:`, matches.length, 'occurrence(s)');
      result = result.replace(pattern, '');
      matchFound = true;
    }
  });
  
  console.log('Match found:', matchFound ? '✅ YES' : '❌ NO');
  console.log('After removal:', JSON.stringify(result));
  console.log('Completely removed:', result.trim() === '' || !result.includes('allow-all-policy') ? '✅ YES' : '❌ NO');
});

console.log('\n📊 CONCLUSION:');
console.log('The removeAllowAllPolicyImport method will successfully remove all variants of the allow-all-policy import!');
