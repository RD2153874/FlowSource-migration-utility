// Test configuration for verifying GitHub frontend setup
const testConfig = {
  sourcePath: "c:\\FlowSource_Automation\\FlowSource-Agent\\Flowsource_Package_1_0_0",
  destinationPath: "c:\\FlowSource_Automation\\FlowSource-Agent\\test-output",
  nonInteractive: true,
  githubAuth: {
    clientId: "test_client_id_123",
    clientSecret: "test_client_secret_456",
    organization: "TestOrg",
    callbackUrl: "http://localhost:7007/api/auth/github/handler/frame",
    personalAccessToken: "test_pat_token_789"
  }
};

console.log("Test config created for frontend GitHub setup verification");
console.log("This will test if Step 6 from GithubAuth.md is properly implemented");
