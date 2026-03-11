import { queryCountryProfile } from '../../server/services/tradeDatasetService.js'
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
    const iso3 = String(req.query.iso3 ?? '').toUpperCase()
    const yearParam = req.query.year ?? 'all'
    const year = yearParam === 'all' ? 'all' : Number(yearParam)

    if (!iso3) {
      json(res, 400, { error: 'iso3 is required' })
      return
    }

    const profile = await queryCountryProfile({ iso3, year })
    json(res, 200, profile)
  } catch (error) {
    internalError(res, error)
  }
}
