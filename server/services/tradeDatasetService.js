import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mockTradeFlows } from '../../src/data/mockTradeFlows.js'
import { buildTradeDataset } from './tradeDatasetBuilder.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const datasetPath = path.resolve(__dirname, '../data/tradeDataset.json')

let datasetCache = null

async function readTradeDatasetFile() {
  const raw = await readFile(datasetPath, 'utf8')
  return JSON.parse(raw)
}

function getYearKey(year) {
  return year === 'all' ? 'all' : String(year)
}

function resolveRequestedYear(year, years) {
  if (year === 'all') {
    return 'all'
  }

  const numericYear = Number(year)

  if (years.includes(numericYear)) {
    return numericYear
  }

  const priorYear = years.find((candidate) => candidate <= numericYear)
  return priorYear ?? years[0] ?? numericYear
}

function sliceFlows(flows, year, years, limit) {
  if (year !== 'all') {
    return flows.slice(0, limit)
  }

  return years.flatMap((currentYear) =>
    flows
      .filter((flow) => flow.year === currentYear)
      .slice(0, limit),
  )
}

export async function loadTradeDataset() {
  if (datasetCache) {
    return datasetCache
  }

  try {
    datasetCache = await readTradeDatasetFile()
  } catch {
    datasetCache = buildTradeDataset(mockTradeFlows, 'seed-mock')
  }

  return datasetCache
}

export async function queryTradeFlows({
  year = 'all',
  category = 'all',
  commodity = 'all',
  country = 'all',
  partner = 'all',
  direction = 'both',
  limit = 250,
}) {
  const dataset = await loadTradeDataset()
  const years = dataset.years
  const resolvedYear = resolveRequestedYear(year, years)
  const yearFilter =
    resolvedYear === 'all'
      ? dataset.flows
      : dataset.flows.filter((flow) => flow.year === resolvedYear)
  const flows = yearFilter
    .filter((flow) => category === 'all' || flow.category === category)
    .filter(
      (flow) =>
        commodity === 'all' ||
        flow.commodity === commodity ||
        flow.commodityLabel.toLowerCase() === commodity,
    )
    .filter(
      (flow) =>
        country === 'all' || flow.exporterIso3 === country || flow.importerIso3 === country,
    )
    .filter(
      (flow) =>
        partner === 'all' || flow.exporterIso3 === partner || flow.importerIso3 === partner,
    )
    .filter((flow) => {
      if (direction === 'both' || country === 'all') {
        return true
      }

      if (direction === 'exports') {
        return flow.exporterIso3 === country
      }

      if (direction === 'imports') {
        return flow.importerIso3 === country
      }

      return true
    })
    .sort((a, b) => b.valueUsd - a.valueUsd)

  const slicedFlows = sliceFlows(flows, resolvedYear, years, limit)

  return {
    source: dataset.source,
    generatedAt: dataset.generatedAt,
    flows: slicedFlows,
    years,
    categories: dataset.categories,
    commodities: dataset.commodities,
    resolvedYears: resolvedYear === 'all' ? years : [resolvedYear],
  }
}

export async function queryCountryProfile({ iso3, year = 'all' }) {
  const dataset = await loadTradeDataset()
  const resolvedYear = resolveRequestedYear(year, dataset.years)
  const yearKey = getYearKey(resolvedYear)
  const profile = dataset.profilesByYear?.[yearKey]?.[iso3]

  if (profile) {
    return {
      ...profile,
      source: dataset.source,
      generatedAt: dataset.generatedAt,
      resolvedYears: resolvedYear === 'all' ? dataset.years : [resolvedYear],
    }
  }

  return {
    iso3,
    year: yearKey,
    totalExports: 0,
    totalImports: 0,
    tradeBalance: 0,
    tradeBalanceUsd: 0,
    partnerCount: 0,
    topPartners: [],
    topExportPartners: [],
    topImportPartners: [],
    topExports: [],
    topImports: [],
    source: dataset.source,
    generatedAt: dataset.generatedAt,
    resolvedYears: resolvedYear === 'all' ? dataset.years : [resolvedYear],
  }
}

export async function getAvailableCountryIsos() {
  const dataset = await loadTradeDataset()
  return [...new Set(dataset.flows.flatMap((flow) => [flow.exporterIso3, flow.importerIso3]))].sort()
}
