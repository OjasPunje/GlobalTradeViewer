import { buildCountryCoordinateMap } from '../services/worldBankService.js'
import { getAvailableCountryIsos } from '../services/tradeDatasetService.js'

export async function handleCountries(request, response) {
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

  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify({ countries }))
}
