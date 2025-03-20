import { tryCatch } from './tryCatch';

// Test successful promise
async function testSuccess() {
  const successPromise = Promise.resolve('Operation succeeded');

  const result = await tryCatch(successPromise);

  console.log('Success Test:', result);
  console.log('Is success:', result.data !== null && result.error === null);
}

// Test failed promise
async function testFailure() {
  const failurePromise = Promise.reject(new Error('Operation failed'));

  // Test with error logging
  const result1 = await tryCatch(failurePromise, 'Custom error message', true);
  console.log('Failure Test with logging:', result1);
  console.log('Is failure:', result1.data === null && result1.error !== null);

  // Test without error logging
  const result2 = await tryCatch(failurePromise);
  console.log('Failure Test without logging:', result2);
  console.log('Is failure:', result2.data === null && result2.error !== null);
}

// Run all tests
async function runTests() {
  console.log('=== Running tryCatch Tests ===');

  await testSuccess();
  console.log('----------------------------');
  await testFailure();

  console.log('=== Tests Complete ===');
}

// Execute tests
runTests();
