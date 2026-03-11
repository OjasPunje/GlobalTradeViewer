import { buildCountryCoordinateMap } from '../server/services/worldBankService.js'
import { getAvailableCountryIsos } from '../server/services/tradeDatasetService.js'
import { handleOptions, internalError, json, methodNotAllowed } from './_lib/http.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return
  }

  if (req.method !== 'GET') {
    methodNotAllowed(res)
    return
  }

  try {
    const countryMap = await buildCountryCoordinateMap()
    const availableIsos = new Set(await getAvailableCountryIsos())
    const countries = Object.entries(countryMap)
      .map(([iso3, country]) => ({
        iso: iso3,
        iso3,
        iso2: country.iso2,
        name: country.name,
        lat: country.lat,
        lng: country.lng,
      }))
      .filter((country) => availableIsos.has(country.iso))
      .filter((country) => country.name && (country.lat !== 0 || country.lng !== 0))
      .sort((a, b) => a.name.localeCompare(b.name))

    json(res, 200, { countries })
  } catch (error) {
    internalError(res, error)
  }
}
