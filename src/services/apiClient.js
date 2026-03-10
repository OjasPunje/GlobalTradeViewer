async function requestJson(path, options = {}) {
  const response = await fetch(path, options)

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }

  return response.json()
}

export function fetchTradeFlows(params) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  return requestJson(`/api/trade/flows?${searchParams.toString()}`)
}

export function fetchCountryProfile(params) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  return requestJson(`/api/trade/country-profile?${searchParams.toString()}`)
}

export function fetchCountries() {
  return requestJson('/api/countries')
}

export function fetchTradeYears() {
  return requestJson('/api/trade/years')
}
