const COMTRADE_BASE_URL =
  process.env.COMTRADE_API_URL ?? 'https://comtradeapi.worldbank.org/data/v1/get/C/A/HS'

function buildComtradeUrl({
  year,
  reporter = 'all',
  partner = 'all',
  commodityCode = 'TOTAL',
  maxRecords = 500,
}) {
  const params = new URLSearchParams({
    reporterCode: reporter,
    partnerCode: partner,
    cmdCode: commodityCode,
    flowCode: 'X,M',
    period: String(year),
    maxRecords: String(maxRecords),
    format: 'json',
    includeDesc: 'true',
  })

  return `${COMTRADE_BASE_URL}?${params.toString()}`
}

function unwrapComtradeRecords(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.dataset)) {
    return payload.dataset
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return []
}

function dedupeRecords(records) {
  const seen = new Set()

  return records.filter((record) => {
    const key = JSON.stringify([
      record.period ?? record.Year,
      record.reporterISO ?? record.reporterCode,
      record.partnerISO ?? record.partnerCode,
      record.cmdCode ?? record.cmdId,
      record.flowCode ?? record.flowDesc,
      record.primaryValue ?? record.TradeValue,
    ])

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export async function fetchTradeFlows({
  year,
  reporter = 'all',
  partner = 'all',
  commodityCode = 'TOTAL',
  maxRecords = 500,
}) {
  const response = await fetch(
    buildComtradeUrl({
      year,
      reporter,
      partner,
      commodityCode,
      maxRecords,
    }),
  )

  if (!response.ok) {
    throw new Error(`UN Comtrade request failed with ${response.status}`)
  }

  const payload = await response.json()
  return unwrapComtradeRecords(payload)
}

export async function fetchTradeByCountry({
  year,
  iso3,
  commodityCode = 'TOTAL',
  maxRecords = 500,
}) {
  const [reporterRecords, partnerRecords] = await Promise.all([
    fetchTradeFlows({
      year,
      reporter: iso3,
      partner: 'all',
      commodityCode,
      maxRecords,
    }),
    fetchTradeFlows({
      year,
      reporter: 'all',
      partner: iso3,
      commodityCode,
      maxRecords,
    }),
  ])

  return dedupeRecords([...reporterRecords, ...partnerRecords])
}

export async function fetchAvailableYears() {
  const currentYear = new Date().getUTCFullYear()
  return [currentYear - 2, currentYear - 3, currentYear - 4]
}
