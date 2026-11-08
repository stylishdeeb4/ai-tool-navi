export interface HostingCostInput {
  comparisonMonths: number
  initialTermMonths: number | null
  initialPaymentYen: number | null
  renewalTermMonths: number | null
  renewalPaymentYen: number | null
  extraFeesYen: number | null
}

export interface HostingCostEstimate {
  totalYen: number
  renewalCount: number
  paidThroughMonths: number
}

function isNonNegativeInteger(value: number | null): value is number {
  return value !== null && Number.isSafeInteger(value) && value >= 0
}

function isPositiveInteger(value: number | null): value is number {
  return isNonNegativeInteger(value) && value > 0
}

/** Counts full invoices needed to cover the same comparison period for each plan. */
export function calculateHostingCost(input: HostingCostInput): HostingCostEstimate | null {
  const {
    comparisonMonths,
    initialTermMonths,
    initialPaymentYen,
    renewalTermMonths,
    renewalPaymentYen,
    extraFeesYen,
  } = input

  if (!isPositiveInteger(comparisonMonths) || !isPositiveInteger(initialTermMonths)
    || !isNonNegativeInteger(initialPaymentYen) || !isNonNegativeInteger(extraFeesYen)) {
    return null
  }

  const needsRenewal = comparisonMonths > initialTermMonths
  let renewalCount = 0
  let renewalTotalYen = 0
  let paidThroughMonths = initialTermMonths

  if (needsRenewal) {
    if (!isPositiveInteger(renewalTermMonths) || !isNonNegativeInteger(renewalPaymentYen)) return null
    renewalCount = Math.ceil((comparisonMonths - initialTermMonths) / renewalTermMonths)
    renewalTotalYen = renewalCount * renewalPaymentYen
    paidThroughMonths += renewalCount * renewalTermMonths
  }

  const totalYen = initialPaymentYen + renewalTotalYen + extraFeesYen

  if (!Number.isSafeInteger(totalYen) || !Number.isSafeInteger(paidThroughMonths)) return null

  return { totalYen, renewalCount, paidThroughMonths }
}
