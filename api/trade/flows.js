import { queryTradeFlows } from '../../server/services/tradeDatasetService.js'
import { handleOptions, internalError, json, methodNotAllowed } from '../_lib/http.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return
  }

  if (req.method !== 'GET') {
    methodNotAllowed(res)
    return
  }

  try {
    const yearParam = req.query.year ?? 'all'
    const year = yearParam === 'all' ? 'all' : Number(yearParam)
    const category = req.query.category ?? 'all'
    const commodity = req.query.commodity ?? 'all'
    const country = req.query.country ?? 'all'
    const partner = req.query.partner ?? 'all'
    const direction = req.query.direction ?? 'both'
    const limit = Number(req.query.limit ?? 250)
    const result = await queryTradeFlows({
      year,
      category,
      commodity,
      country,
      partner,
      direction,
      limit,
    })

    json(res, 200, {
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
    })
  } catch (error) {
    internalError(res, error)
  }
}
