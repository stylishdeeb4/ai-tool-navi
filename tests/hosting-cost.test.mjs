import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateHostingCost } from '../lib/hosting-cost.ts'

const plan = {
  comparisonMonths: 12,
  initialTermMonths: 12,
  initialPaymentYen: 9000,
  renewalTermMonths: null,
  renewalPaymentYen: null,
  extraFeesYen: 1200,
}

test('a contract covering the full period needs no renewal invoice', () => {
  assert.deepEqual(calculateHostingCost(plan), {
    totalYen: 10200,
    renewalCount: 0,
    paidThroughMonths: 12,
  })
})

test('a partial final contract counts its full advance invoice', () => {
  assert.deepEqual(calculateHostingCost({
    ...plan,
    comparisonMonths: 18,
    renewalTermMonths: 12,
    renewalPaymentYen: 12000,
  }), {
    totalYen: 22200,
    renewalCount: 1,
    paidThroughMonths: 24,
  })
})

test('multiple renewals are counted from the actual billing cycle', () => {
  assert.deepEqual(calculateHostingCost({
    ...plan,
    comparisonMonths: 24,
    initialTermMonths: 6,
    renewalTermMonths: 3,
    renewalPaymentYen: 2400,
  }), {
    totalYen: 24600,
    renewalCount: 6,
    paidThroughMonths: 24,
  })
})

test('unknown renewal amount cannot be treated as zero', () => {
  assert.equal(calculateHostingCost({ ...plan, comparisonMonths: 24 }), null)
})

test('missing fees, negative values, and unsafe totals are rejected', () => {
  assert.equal(calculateHostingCost({ ...plan, extraFeesYen: null }), null)
  assert.equal(calculateHostingCost({ ...plan, initialPaymentYen: -1 }), null)
  assert.equal(calculateHostingCost({ ...plan, comparisonMonths: 0 }), null)
  assert.equal(calculateHostingCost({ ...plan, initialPaymentYen: Number.MAX_SAFE_INTEGER }), null)
})
