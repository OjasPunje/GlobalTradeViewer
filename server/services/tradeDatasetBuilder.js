function compactLabel(value) {
  return String(value ?? '').trim()
}

function toSeedFlow(flow) {
  return {
    ...flow,
    exporterIso3: flow.exporterIso ?? flow.exporterIso3,
    importerIso3: flow.importerIso ?? flow.importerIso3,
    commodityCode: flow.commodityCode ?? flow.id,
    commodityLabel: compactLabel(flow.commodityLabel ?? flow.commodity),
    quantity: flow.quantity ?? flow.volumeTonnes ?? 0,
  }
}

function dedupeFlows(rawFlows) {
  const deduped = new Map()

  rawFlows
    .map(toSeedFlow)
    .forEach((flow) => {
      const existing = deduped.get(flow.id)

      if (!existing || flow.valueUsd > existing.valueUsd) {
        deduped.set(flow.id, flow)
      }
    })

  return [...deduped.values()]
}

function buildList(entries, labelKey) {
  return [...entries.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, valueUsd]) => ({ [labelKey]: label, valueUsd }))
}

function aggregateCountryProfile(flows, iso3, yearKey) {
  const relatedFlows = flows.filter((flow) => flow.exporterIso3 === iso3 || flow.importerIso3 === iso3)
  const exports = relatedFlows.filter((flow) => flow.exporterIso3 === iso3)
  const imports = relatedFlows.filter((flow) => flow.importerIso3 === iso3)
  const totalExports = exports.reduce((sum, flow) => sum + flow.valueUsd, 0)
  const totalImports = imports.reduce((sum, flow) => sum + flow.valueUsd, 0)

  const exportPartners = new Map()
  const importPartners = new Map()
  const exportCommodities = new Map()
  const importCommodities = new Map()
  const partnerIsos = new Set()
  const countryName = relatedFlows[0]?.exporterIso3 === iso3
    ? relatedFlows[0]?.exporter
    : relatedFlows[0]?.importer

  exports.forEach((flow) => {
    exportPartners.set(flow.importer, (exportPartners.get(flow.importer) ?? 0) + flow.valueUsd)
    exportCommodities.set(flow.commodityLabel, (exportCommodities.get(flow.commodityLabel) ?? 0) + flow.valueUsd)
    partnerIsos.add(flow.importerIso3)
  })

  imports.forEach((flow) => {
    importPartners.set(flow.exporter, (importPartners.get(flow.exporter) ?? 0) + flow.valueUsd)
    importCommodities.set(flow.commodityLabel, (importCommodities.get(flow.commodityLabel) ?? 0) + flow.valueUsd)
    partnerIsos.add(flow.exporterIso3)
  })

  return {
    iso3,
    year: yearKey,
    name: countryName ?? iso3,
    totalExports,
    totalImports,
    tradeBalance: totalExports - totalImports,
    tradeBalanceUsd: totalExports - totalImports,
    partnerCount: partnerIsos.size,
    topExportPartners: buildList(exportPartners, 'country'),
    topImportPartners: buildList(importPartners, 'country'),
    topPartners: buildList(
      new Map(
        [...exportPartners.entries(), ...importPartners.entries()].reduce((acc, [label, valueUsd]) => {
          acc.set(label, (acc.get(label) ?? 0) + valueUsd)
          return acc
        }, new Map()),
      ),
      'country',
    ),
    topExports: buildList(exportCommodities, 'commodity'),
    topImports: buildList(importCommodities, 'commodity'),
  }
}

export function buildTradeDataset(rawFlows, source = 'seed') {
  const flows = dedupeFlows(rawFlows)
  const years = [...new Set(flows.map((flow) => flow.year))].sort((a, b) => b - a)
  const categories = [...new Set(flows.map((flow) => flow.category))].sort((a, b) => a.localeCompare(b))
  const commodities = [...new Set(flows.map((flow) => flow.commodity))].sort((a, b) => a.localeCompare(b))
  const isoSet = new Set(flows.flatMap((flow) => [flow.exporterIso3, flow.importerIso3]))

  const profilesByYear = {}

  for (const year of [...years, 'all']) {
    const yearKey = String(year)
    const yearFlows = year === 'all' ? flows : flows.filter((flow) => flow.year === year)
    profilesByYear[yearKey] = {}

    isoSet.forEach((iso3) => {
      profilesByYear[yearKey][iso3] = aggregateCountryProfile(yearFlows, iso3, yearKey)
    })
  }

  return {
    source,
    generatedAt: new Date().toISOString(),
    years,
    categories,
    commodities,
    flows,
    profilesByYear,
  }
}
