import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mockTradeFlows } from '../src/data/mockTradeFlows.js'
import {
  generateFallbackTradeFlows,
  summarizeTradeFlows,
} from '../server/services/fallbackTradeGenerator.js'
import { buildCountryCoordinateMap } from '../server/services/worldBankService.js'
import { buildTradeDataset } from '../server/services/tradeDatasetBuilder.js'
import { fetchOecYear } from '../server/services/oecService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const datasetPath = path.resolve(__dirname, '../server/data/tradeDataset.json')

function printSummary(summary, countryMap) {
  console.log('Dataset summary:')
  console.log(`- total countries: ${summary.totalCountries}`)
  console.log(`- total flows: ${summary.totalFlows}`)
  console.log(`- years covered: ${summary.yearsCovered.join(', ')}`)
  console.log('- top 20 countries by route count:')
  summary.topCountriesByRouteCount.forEach((entry) => {
    const name = countryMap[entry.iso3]?.name ?? entry.iso3
    console.log(`  - ${entry.iso3} (${name}): ${entry.routeCount}`)
  })
}

async function ingest() {
  const countryMap = await buildCountryCoordinateMap()
  const years = [2024, 2023, 2022]
  const seed2025Flows = mockTradeFlows.filter((flow) => flow.year === 2025)
  const perReporterLimit = 12

  try {
    const yearlyFlows = await Promise.all(years.map((year) => fetchOecYear(year, countryMap, perReporterLimit)))
    const dataset = buildTradeDataset([...seed2025Flows, ...yearlyFlows.flat()], 'oec')
    await writeFile(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8')
    console.log(`Wrote OEC dataset to ${datasetPath}`)
    printSummary(summarizeTradeFlows(dataset.flows), countryMap)
  } catch (error) {
    console.warn('OEC ingestion failed, generating expanded fallback dataset instead.')
    console.warn(error instanceof Error ? error.message : error)
    const fallbackFlows = generateFallbackTradeFlows(countryMap)
    const dataset = buildTradeDataset([...mockTradeFlows, ...fallbackFlows], 'synthetic-fallback')
    await writeFile(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8')
    console.log(`Wrote synthetic fallback dataset to ${datasetPath}`)
    printSummary(summarizeTradeFlows(dataset.flows), countryMap)
  }
}

ingest()
