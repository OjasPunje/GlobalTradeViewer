import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCache, setCache } from './cacheService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const countryCachePath = path.resolve(__dirname, '../data/countryCoords.json')
const COUNTRY_CACHE_KEY = 'countries:all'
const COUNTRY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const WORLD_BANK_URL = 'https://api.worldbank.org/v2/country?format=json&per_page=400'

async function readLocalCountryMap() {
  const raw = await readFile(countryCachePath, 'utf8')
  return JSON.parse(raw)
}

function normalizeWorldBankCountry(country) {
  const iso3 = String(country.id ?? '').toUpperCase()
  const lat = Number(country.latitude)
  const lng = Number(country.longitude)

  if (!iso3 || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return {
    iso2: String(country.iso2Code ?? '').toUpperCase(),
    iso3,
    name: country.name,
    capitalCity: country.capitalCity,
    lat,
    lng,
  }
}

export async function fetchAllCountries() {
  const cached = getCache(COUNTRY_CACHE_KEY)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(WORLD_BANK_URL)

    if (!response.ok) {
      throw new Error(`World Bank request failed with ${response.status}`)
    }

    const payload = await response.json()
    const countries = Array.isArray(payload?.[1]) ? payload[1].map(normalizeWorldBankCountry).filter(Boolean) : []

    if (countries.length === 0) {
      throw new Error('World Bank returned no country metadata')
    }

    const map = Object.fromEntries(
      countries.map((country) => [
        country.iso3,
        {
          name: country.name,
          iso2: country.iso2,
          capitalCity: country.capitalCity,
          lat: country.lat,
          lng: country.lng,
        },
      ]),
    )

    await writeFile(countryCachePath, `${JSON.stringify(map, null, 2)}\n`, 'utf8')
    return setCache(COUNTRY_CACHE_KEY, map, COUNTRY_CACHE_TTL_MS)
  } catch {
    const localMap = await readLocalCountryMap()
    return setCache(COUNTRY_CACHE_KEY, localMap, COUNTRY_CACHE_TTL_MS)
  }
}

export async function fetchCountryByIso2(iso2) {
  const countryMap = await fetchAllCountries()

  return Object.values(countryMap).find((country) => country.iso2 === iso2.toUpperCase()) ?? null
}

export async function buildCountryCoordinateMap() {
  return fetchAllCountries()
}
