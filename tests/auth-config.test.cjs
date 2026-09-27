const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

function load(file, stubs = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, process, atob, URL,
    require: name => Object.hasOwn(stubs, name) ? stubs[name] : require(name),
  });
  return module.exports;
}

const { getClerkConfigurationState } = load('lib/auth/config.ts');
const configuration = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_' + Buffer.from('runner-test.clerk.accounts.dev$').toString('base64'),
  CLERK_SECRET_KEY: 'sk_test_synthetic_fixture',
  CLERK_EXPECTED_FRONTEND_API: 'runner-test.clerk.accounts.dev',
};

test('Clerk requires an explicit matching instance and matching key modes', () => {
  assert.equal(getClerkConfigurationState({}), 'missing');
  assert.equal(getClerkConfigurationState({ ...configuration, CLERK_EXPECTED_FRONTEND_API: '' }), 'unverified_instance');
  assert.equal(getClerkConfigurationState({ ...configuration, CLERK_EXPECTED_FRONTEND_API: 'another.clerk.accounts.dev' }), 'instance_mismatch');
  assert.equal(getClerkConfigurationState({ ...configuration, CLERK_SECRET_KEY: 'sk_live_synthetic_fixture' }), 'mode_mismatch');
  assert.equal(getClerkConfigurationState({ ...configuration, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_!!!!' }), 'invalid_keys');
  assert.equal(getClerkConfigurationState(configuration), 'configured');
});

test('unverified Clerk config blocks protected routes without calling Clerk', () => {
  let clerkCalls = 0;
  const { default: middleware } = load('middleware.ts', {
    '@/lib/auth/config': { isClerkConfigured: () => false },
    '@clerk/nextjs/server': {
      createRouteMatcher: () => request => request.url.includes('/admin'),
      clerkMiddleware: () => () => { clerkCalls++; },
    },
    'next/server': { NextResponse: { next: () => ({ status: 200 }), redirect: url => ({ status: 307, location: String(url) }) } },
  });
  const denied = middleware({ url: 'https://runner.test/admin/operations' }, {});
  assert.equal(denied.status, 307);
  assert.equal(denied.location, 'https://runner.test/sign-in');
  assert.equal(middleware({ url: 'https://runner.test/' }, {}).status, 200);
  assert.equal(clerkCalls, 0);
});
