'use client'

import { useState } from 'react'
import { calculateHostingCost, type HostingCostEstimate } from '@/lib/hosting-cost'

type Provider = 'xserver' | 'mixhost'
type PlanForm = {
  initialTermMonths: string
  initialPaymentYen: string
  renewalTermMonths: string
  renewalPaymentYen: string
  extraFeesYen: string
}

const providerNames: Record<Provider, string> = {
  xserver: 'エックスサーバー',
  mixhost: 'mixhost',
}

const emptyPlan: PlanForm = {
  initialTermMonths: '',
  initialPaymentYen: '',
  renewalTermMonths: '',
  renewalPaymentYen: '',
  extraFeesYen: '',
}

function readInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null
  const number = Number(value)
  return Number.isSafeInteger(number) ? number : null
}

function estimate(form: PlanForm, comparisonMonths: number): HostingCostEstimate | null {
  return calculateHostingCost({
    comparisonMonths,
    initialTermMonths: readInteger(form.initialTermMonths),
    initialPaymentYen: readInteger(form.initialPaymentYen),
    renewalTermMonths: readInteger(form.renewalTermMonths),
    renewalPaymentYen: readInteger(form.renewalPaymentYen),
    extraFeesYen: readInteger(form.extraFeesYen),
  })
}

function NumberField({ id, label, value, onChange, min = 0 }: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  min?: number
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        step="1"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </div>
  )
}

export default function HostingCostCalculator() {
  const [comparisonMonths, setComparisonMonths] = useState(12)
  const [plans, setPlans] = useState<Record<Provider, PlanForm>>({
    xserver: { ...emptyPlan },
    mixhost: { ...emptyPlan },
  })

  function updatePlan(provider: Provider, field: keyof PlanForm, value: string) {
    setPlans(current => ({
      ...current,
      [provider]: { ...current[provider], [field]: value },
    }))
  }

  const xserverEstimate = estimate(plans.xserver, comparisonMonths)
  const mixhostEstimate = estimate(plans.mixhost, comparisonMonths)
  const bothReady = xserverEstimate !== null && mixhostEstimate !== null

  return (
    <section id="hosting-cost-calculator" aria-labelledby="hosting-cost-heading" className="my-8 rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-6">
      <h3 id="hosting-cost-heading" className="text-xl font-bold text-gray-900">サーバー費用を同じ期間で比べる</h3>
      <p className="mt-3 text-sm leading-7 text-gray-700">
        各社の申込画面に表示される税込の請求額を入力してください。月額換算の表示額から推測せず、期間中に必要な一括払いを合計します。
      </p>

      <div className="mt-4 max-w-xs">
        <label htmlFor="hosting-comparison-months" className="block text-sm font-medium text-gray-800 mb-1">比較する期間</label>
        <select
          id="hosting-comparison-months"
          value={comparisonMonths}
          onChange={event => setComparisonMonths(Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value={12}>12か月</option>
          <option value={24}>24か月</option>
          <option value={36}>36か月</option>
        </select>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {(['xserver', 'mixhost'] as const).map(provider => {
          const form = plans[provider]
          const result = provider === 'xserver' ? xserverEstimate : mixhostEstimate
          const initialTerm = readInteger(form.initialTermMonths)
          const renewalNeeded = initialTerm !== null && initialTerm > 0 && initialTerm < comparisonMonths
          return (
            <fieldset key={provider} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
              <legend className="px-1 text-base font-bold text-gray-900">{providerNames[provider]}</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <NumberField id={`${provider}-initial-term`} label="初回の契約期間（月）" min={1} value={form.initialTermMonths} onChange={value => updatePlan(provider, 'initialTermMonths', value)} />
                <NumberField id={`${provider}-initial-payment`} label="初回の請求額（税込・円）" value={form.initialPaymentYen} onChange={value => updatePlan(provider, 'initialPaymentYen', value)} />
                <NumberField id={`${provider}-renewal-term`} label="更新時の契約期間（月）" min={1} value={form.renewalTermMonths} onChange={value => updatePlan(provider, 'renewalTermMonths', value)} />
                <NumberField id={`${provider}-renewal-payment`} label="更新1回の請求額（税込・円）" value={form.renewalPaymentYen} onChange={value => updatePlan(provider, 'renewalPaymentYen', value)} />
                <div className="sm:col-span-2 lg:col-span-1">
                  <NumberField id={`${provider}-extras`} label="期間内のドメイン・追加機能費用（税込・円）" value={form.extraFeesYen} onChange={value => updatePlan(provider, 'extraFeesYen', value)} />
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-600">追加費用がなければ0を入力。初回額や更新額に含まれる費用は重複して加えないでください。</p>
              <div className="mt-4 border-t border-gray-200 pt-4" aria-live="polite">
                {result ? (
                  <>
                    <p className="text-sm text-gray-700">{comparisonMonths}か月を使うための支払総額（概算）</p>
                    <p className="text-2xl font-bold text-gray-900">{result.totalYen.toLocaleString('ja-JP')}円</p>
                    <p className="mt-1 text-xs text-gray-600">更新 {result.renewalCount}回。最後の支払で{result.paidThroughMonths}か月目まで利用できる計算です。</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-700">
                    {renewalNeeded
                      ? '初回の期間・請求額・追加費用と、更新時の期間・請求額を入力してください。'
                      : '初回の期間・請求額・追加費用を入力してください。'}
                  </p>
                )}
              </div>
            </fieldset>
          )
        })}
      </div>

      <div className="mt-4 rounded-lg bg-white px-4 py-3 text-sm leading-6 text-gray-800" aria-live="polite">
        {bothReady ? (
          xserverEstimate.totalYen === mixhostEstimate.totalYen
            ? `入力した条件では、${comparisonMonths}か月間の支払総額の概算は同額です。`
            : `入力した条件では、${xserverEstimate.totalYen < mixhostEstimate.totalYen ? 'エックスサーバー' : 'mixhost'}の支払総額の概算が${Math.abs(xserverEstimate.totalYen - mixhostEstimate.totalYen).toLocaleString('ja-JP')}円少ない計算です。`
        ) : '両方の条件を入力すると、同じ期間の支払総額を比較できます。'}
      </div>
      <p className="mt-4 text-xs leading-6 text-gray-600">
        この計算ツールは入力内容を送信・保存しません。更新が複数回ある場合は、入力した更新額が毎回同じと仮定します。比較期間を超える契約でも、先に請求される金額は全額含めます。特典の適用、試用・返金条件、実際の請求額は各社の申込画面で確認してください。
      </p>
    </section>
  )
}
