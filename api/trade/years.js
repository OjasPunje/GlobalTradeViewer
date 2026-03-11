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
    const result = await queryTradeFlows({ year: 'all', limit: 1 })
    json(res, 200, { years: result.years })
  } catch (error) {
    internalError(res, error)
  }
}
