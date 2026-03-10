import { useEffect, useState } from 'react'
import { countries as fallbackCountries } from '../data/countries.js'
import { fetchCountries } from '../services/apiClient.js'

export function useCountries() {
  const [countries, setCountries] = useState(fallbackCountries)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetchCountries()
      .then((result) => {
        if (cancelled) {
          return
        }

        const nextCountries = Array.isArray(result?.countries) && result.countries.length > 0
          ? result.countries
          : fallbackCountries

        setCountries(nextCountries)
        setError(result?.error ?? null)
      })
      .catch((nextError) => {
        if (cancelled) {
          return
        }

        setCountries(fallbackCountries)
        setError(nextError instanceof Error ? nextError.message : 'Unable to load countries')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    countries,
    loading,
    error,
  }
}
