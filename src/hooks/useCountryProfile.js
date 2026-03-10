import { useEffect, useState } from 'react'
import { fetchCountryProfile } from '../services/apiClient.js'

export function useCountryProfile(selectedCountry, year) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!selectedCountry?.iso) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchCountryProfile({
      iso3: selectedCountry.iso,
      year,
    })
      .then((result) => {
        if (cancelled) {
          return
        }

        setProfile(result)
        setError(result?.error ?? null)
      })
      .catch((nextError) => {
        if (cancelled) {
          return
        }

        setProfile(null)
        setError(nextError instanceof Error ? nextError.message : 'Unable to load country profile')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedCountry?.iso, year])

  return {
    profile,
    loading,
    error,
  }
}
