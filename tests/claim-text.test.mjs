import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanClaim } from '../app/claim-text.mjs';

test('formatting preserves every supplied word and number', () => {
  const original='  Managed  the roadmap.\nReported 12% adoption.  ';
  assert.equal(cleanClaim(original),'Managed the roadmap. Reported 12% adoption.');
  assert.deepEqual(cleanClaim(original).split(/\s+/),original.trim().split(/\s+/));
});
test('clean claims and missing content do not gain inferred facts', () => {
  assert.equal(cleanClaim('Managed the product roadmap.'),'Managed the product roadmap.');
  assert.equal(cleanClaim('   '),'');
});
