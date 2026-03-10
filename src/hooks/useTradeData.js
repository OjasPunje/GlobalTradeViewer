import { useEffect, useMemo, useState } from 'react'
import { countryByIso } from '../data/countries.js'
import { fetchTradeFlows } from '../services/apiClient.js'
import { filterTradeFlows } from '../utils/filterTradeFlows.js'

const FALLBACK_YEARS = [2024, 2023, 2022]
const SELECTED_COUNTRY_LIMIT = 160
const GLOBAL_LIMIT = 220

export function useTradeData(filters) {
  const [baseFlows, setBaseFlows] = useState([])
  const [source, setSource] = useState('unavailable')
  const [generatedAt, setGeneratedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resolvedYears, setResolvedYears] = useState([filters.selectedYear])
  const [yearOptions, setYearOptions] = useState(FALLBACK_YEARS)

  useEffect(() => {
    let cancelled = false

    setLoading(true)

    fetchTradeFlows({
      year: filters.selectedYear,
      commodity: filters.selectedCommodity,
      country: filters.selectedCountry?.iso ?? 'all',
      partner: filters.selectedPartner,
      direction: filters.selectedDirection,
      limit: filters.selectedCountry ? SELECTED_COUNTRY_LIMIT : GLOBAL_LIMIT,
    })
      .then((result) => {
        if (cancelled) {
          return
        }

        setBaseFlows(Array.isArray(result?.flows) ? result.flows : [])
        setSource(result?.source ?? 'unavailable')
        setGeneratedAt(result?.generatedAt ?? null)
        setError(result?.error ?? null)
        setResolvedYears(Array.isArray(result?.resolvedYears) && result.resolvedYears.length > 0 ? result.resolvedYears : [filters.selectedYear])
        setYearOptions(
          Array.isArray(result?.years) && result.years.length > 0
            ? result.years.filter((year) => Number.isFinite(year)).sort((a, b) => b - a)
            : FALLBACK_YEARS,
        )
      })
      .catch((nextError) => {
        if (cancelled) {
          return
        }

        setBaseFlows([])
        setSource('unavailable')
        setGeneratedAt(null)
        setError(nextError instanceof Error ? nextError.message : 'Unable to load live trade data')
        setResolvedYears([filters.selectedYear])
        setYearOptions(FALLBACK_YEARS)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    filters.selectedCommodity,
    filters.selectedCountry?.iso,
    filters.selectedDirection,
    filters.selectedPartner,
    filters.selectedYear,
  ])

  const effectiveFilters = useMemo(() => {
    if (filters.selectedYear === 'all') {
      return filters
    }

    const resolvedYear = resolvedYears?.[0]

    if (!resolvedYear || resolvedYear === filters.selectedYear) {
      return filters
    }

    return {
      ...filters,
      selectedYear: resolvedYear,
    }
  }, [filters, resolvedYears])

  const filteredFlows = useMemo(() => filterTradeFlows(baseFlows, effectiveFilters), [baseFlows, effectiveFilters])

  const availableYears = useMemo(() => {
    const years = [...new Set([...yearOptions, ...resolvedYears, filters.selectedYear])]
      .filter((year) => Number.isFinite(year))
      .sort((a, b) => b - a)
    return years.length > 0 ? years : FALLBACK_YEARS
  }, [filters.selectedYear, resolvedYears, yearOptions])

  const availableCommodities = useMemo(
    () => [...new Set(baseFlows.map((flow) => flow.commodity))].sort((a, b) => a.localeCompare(b)),
    [baseFlows],
  )

  const totals = useMemo(() => {
    const totalTradeValue = filteredFlows.reduce((sum, flow) => sum + flow.valueUsd, 0)
    const routeCount = filteredFlows.length

    const exporterTotals = new Map()
    const importerTotals = new Map()
    const commodityTotals = new Map()
    const exporterNames = new Map()
    const importerNames = new Map()

    filteredFlows.forEach((flow) => {
      exporterTotals.set(flow.exporterIso, (exporterTotals.get(flow.exporterIso) ?? 0) + flow.valueUsd)
      importerTotals.set(flow.importerIso, (importerTotals.get(flow.importerIso) ?? 0) + flow.valueUsd)
      commodityTotals.set(flow.commodity, (commodityTotals.get(flow.commodity) ?? 0) + flow.valueUsd)
      exporterNames.set(flow.exporterIso, flow.exporter)
      importerNames.set(flow.importerIso, flow.importer)
    })

    const topExporterIso = [...exporterTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    const topImporterIso = [...importerTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    const topCommodity = [...commodityTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return {
      totalTradeValue,
      routeCount,
      topExporter: topExporterIso ? exporterNames.get(topExporterIso) ?? countryByIso[topExporterIso]?.name ?? topExporterIso : 'N/A',
      topImporter: topImporterIso ? importerNames.get(topImporterIso) ?? countryByIso[topImporterIso]?.name ?? topImporterIso : 'N/A',
      topCommodity: topCommodity ?? 'N/A',
    }
  }, [filteredFlows])

  const topRoutes = useMemo(
    () => [...filteredFlows].sort((a, b) => b.valueUsd - a.valueUsd).slice(0, 6),
    [filteredFlows],
  )

  return {
    availableCommodities,
    availableYears,
    filteredFlows,
    loading,
    source,
    generatedAt,
    error,
    resolvedYears,
    totals,
    topRoutes,
  }
}
