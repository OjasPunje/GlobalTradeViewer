import { queryCountryProfile, queryTradeFlows } from '../services/tradeDatasetService.js'

export async function handleTradeFlows(request, response, url) {
  const yearParam = url.searchParams.get('year') ?? 'all'
  const year = yearParam === 'all' ? 'all' : Number(yearParam)
  const category = url.searchParams.get('category') ?? 'all'
  const commodity = url.searchParams.get('commodity') ?? 'all'
  const country = url.searchParams.get('country') ?? 'all'
  const partner = url.searchParams.get('partner') ?? 'all'
  const direction = url.searchParams.get('direction') ?? 'both'
  const limit = Number(url.searchParams.get('limit') ?? 250)
  const result = await queryTradeFlows({
    year,
    category,
    commodity,
    country,
    partner,
    direction,
    limit,
  })

  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.end(
    JSON.stringify({
      year: yearParam,
      count: result.flows.length,
      flows: result.flows,
      source: result.source,
      generatedAt: result.generatedAt,
      years: result.years,
      categories: result.categories,
      commodities: result.commodities,
      resolvedYears: result.resolvedYears,
      error: null,
    }),
  )
}

export async function handleTradeCountryProfile(request, response, url) {
  const iso3 = String(url.searchParams.get('iso3') ?? '').toUpperCase()
  const yearParam = url.searchParams.get('year') ?? 'all'
  const year = yearParam === 'all' ? 'all' : Number(yearParam)

  if (!iso3) {
    response.writeHead(400, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: 'iso3 is required' }))
    return
  }

  const profile = await queryCountryProfile({ iso3, year })

  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(profile))
}

export async function handleTradeYears(request, response) {
  const result = await queryTradeFlows({ year: 'all', limit: 1 })
  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify({ years: result.years }))
}
