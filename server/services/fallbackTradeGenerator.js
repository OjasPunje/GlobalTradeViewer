const COUNTRY_SPECS = [
  { iso: 'USA', region: 'americas', role: 'diversified', tier: 'hub' },
  { iso: 'CAN', region: 'americas', role: 'energy', tier: 'high' },
  { iso: 'MEX', region: 'americas', role: 'manufacturing', tier: 'high' },
  { iso: 'BRA', region: 'americas', role: 'agriculture', tier: 'high' },
  { iso: 'ARG', region: 'americas', role: 'agriculture', tier: 'mid' },
  { iso: 'CHL', region: 'americas', role: 'minerals', tier: 'mid' },
  { iso: 'COL', region: 'americas', role: 'energy', tier: 'mid' },
  { iso: 'PER', region: 'americas', role: 'minerals', tier: 'mid' },
  { iso: 'URY', region: 'americas', role: 'agriculture', tier: 'mid' },
  { iso: 'ECU', region: 'americas', role: 'agriculture', tier: 'mid' },
  { iso: 'GBR', region: 'europe', role: 'pharma', tier: 'high' },
  { iso: 'IRL', region: 'europe', role: 'pharma', tier: 'mid' },
  { iso: 'FRA', region: 'europe', role: 'manufacturing', tier: 'high' },
  { iso: 'DEU', region: 'europe', role: 'manufacturing', tier: 'hub' },
  { iso: 'ESP', region: 'europe', role: 'manufacturing', tier: 'high' },
  { iso: 'ITA', region: 'europe', role: 'manufacturing', tier: 'high' },
  { iso: 'NLD', region: 'europe', role: 'logistics', tier: 'high' },
  { iso: 'BEL', region: 'europe', role: 'pharma', tier: 'mid' },
  { iso: 'CHE', region: 'europe', role: 'pharma', tier: 'high' },
  { iso: 'AUT', region: 'europe', role: 'manufacturing', tier: 'mid' },
  { iso: 'POL', region: 'europe', role: 'manufacturing', tier: 'mid' },
  { iso: 'CZE', region: 'europe', role: 'vehicles', tier: 'mid' },
  { iso: 'SVK', region: 'europe', role: 'vehicles', tier: 'mid' },
  { iso: 'SVN', region: 'europe', role: 'vehicles', tier: 'mid' },
  { iso: 'HUN', region: 'europe', role: 'vehicles', tier: 'mid' },
  { iso: 'ROU', region: 'europe', role: 'manufacturing', tier: 'mid' },
  { iso: 'SWE', region: 'europe', role: 'technology', tier: 'mid' },
  { iso: 'NOR', region: 'europe', role: 'energy', tier: 'mid' },
  { iso: 'DNK', region: 'europe', role: 'pharma', tier: 'mid' },
  { iso: 'FIN', region: 'europe', role: 'technology', tier: 'mid' },
  { iso: 'PRT', region: 'europe', role: 'textiles', tier: 'mid' },
  { iso: 'GRC', region: 'europe', role: 'logistics', tier: 'mid' },
  { iso: 'TUR', region: 'europe', role: 'textiles', tier: 'high' },
  { iso: 'UKR', region: 'europe', role: 'agriculture', tier: 'mid' },
  { iso: 'RUS', region: 'europe', role: 'energy', tier: 'high' },
  { iso: 'CHN', region: 'asia', role: 'technology', tier: 'hub' },
  { iso: 'JPN', region: 'asia', role: 'vehicles', tier: 'hub' },
  { iso: 'KOR', region: 'asia', role: 'technology', tier: 'high' },
  { iso: 'IND', region: 'asia', role: 'diversified', tier: 'hub' },
  { iso: 'PAK', region: 'asia', role: 'textiles', tier: 'mid' },
  { iso: 'BGD', region: 'asia', role: 'textiles', tier: 'mid' },
  { iso: 'VNM', region: 'asia', role: 'technology', tier: 'mid' },
  { iso: 'THA', region: 'asia', role: 'vehicles', tier: 'mid' },
  { iso: 'MYS', region: 'asia', role: 'technology', tier: 'mid' },
  { iso: 'SGP', region: 'asia', role: 'logistics', tier: 'high' },
  { iso: 'IDN', region: 'asia', role: 'minerals', tier: 'high' },
  { iso: 'PHL', region: 'asia', role: 'technology', tier: 'mid' },
  { iso: 'KAZ', region: 'asia', role: 'energy', tier: 'mid' },
  { iso: 'UZB', region: 'asia', role: 'textiles', tier: 'mid' },
  { iso: 'ARE', region: 'middle-east-africa', role: 'energy', tier: 'high' },
  { iso: 'SAU', region: 'middle-east-africa', role: 'energy', tier: 'hub' },
  { iso: 'QAT', region: 'middle-east-africa', role: 'energy', tier: 'mid' },
  { iso: 'KWT', region: 'middle-east-africa', role: 'energy', tier: 'mid' },
  { iso: 'ISR', region: 'middle-east-africa', role: 'technology', tier: 'mid' },
  { iso: 'EGY', region: 'middle-east-africa', role: 'manufacturing', tier: 'mid' },
  { iso: 'MAR', region: 'middle-east-africa', role: 'textiles', tier: 'mid' },
  { iso: 'DZA', region: 'middle-east-africa', role: 'energy', tier: 'mid' },
  { iso: 'NGA', region: 'middle-east-africa', role: 'energy', tier: 'mid' },
  { iso: 'ZAF', region: 'middle-east-africa', role: 'minerals', tier: 'high' },
  { iso: 'KEN', region: 'middle-east-africa', role: 'agriculture', tier: 'mid' },
  { iso: 'ETH', region: 'middle-east-africa', role: 'agriculture', tier: 'mid' },
  { iso: 'GHA', region: 'middle-east-africa', role: 'minerals', tier: 'mid' },
  { iso: 'AUS', region: 'oceania', role: 'minerals', tier: 'hub' },
  { iso: 'NZL', region: 'oceania', role: 'agriculture', tier: 'mid' }
]

const YEAR_FACTORS = { 2025: 1.08, 2024: 1, 2023: 0.93 }
const TIER_BASE = { hub: 1_700_000_000, high: 940_000_000, mid: 420_000_000 }
const PARTNER_IMPORTERS = {
  energy: ['CHN', 'IND', 'JPN', 'KOR', 'DEU', 'USA'],
  minerals: ['CHN', 'USA', 'DEU', 'JPN', 'KOR', 'IND'],
  agriculture: ['CHN', 'USA', 'DEU', 'GBR', 'JPN', 'IND'],
  technology: ['USA', 'CHN', 'DEU', 'IND', 'JPN', 'SGP'],
  vehicles: ['USA', 'DEU', 'GBR', 'CHN', 'AUS', 'IND'],
  textiles: ['USA', 'DEU', 'GBR', 'FRA', 'JPN', 'CAN'],
  pharma: ['USA', 'DEU', 'GBR', 'FRA', 'CHE', 'JPN'],
  manufacturing: ['USA', 'DEU', 'GBR', 'CHN', 'IND', 'JPN'],
  logistics: ['USA', 'CHN', 'DEU', 'SGP', 'GBR', 'FRA'],
  diversified: ['CHN', 'USA', 'DEU', 'IND', 'JPN', 'GBR'],
}
const REGION_PARTNERS = {
  americas: ['USA', 'CAN', 'MEX', 'BRA', 'ARG', 'CHL', 'COL', 'PER'],
  europe: ['DEU', 'FRA', 'GBR', 'ITA', 'ESP', 'NLD', 'POL', 'TUR'],
  asia: ['CHN', 'JPN', 'KOR', 'IND', 'VNM', 'THA', 'MYS', 'SGP', 'IDN'],
  'middle-east-africa': ['SAU', 'ARE', 'QAT', 'ZAF', 'EGY', 'NGA', 'ISR', 'MAR'],
  oceania: ['AUS', 'NZL', 'CHN', 'JPN', 'KOR'],
}
const ROLE_COMMODITIES = {
  energy: [
    { commodity: 'crude oil', category: 'energy', factor: 1.2 },
    { commodity: 'lng', category: 'energy', factor: 1.05 },
  ],
  minerals: [
    { commodity: 'iron ore', category: 'minerals', factor: 1.1 },
    { commodity: 'lithium', category: 'minerals', factor: 0.88 },
    { commodity: 'copper ore', category: 'minerals', factor: 0.92 },
  ],
  agriculture: [
    { commodity: 'soybeans', category: 'agriculture', factor: 1.02 },
    { commodity: 'wheat', category: 'agriculture', factor: 0.88 },
    { commodity: 'beef', category: 'agriculture', factor: 0.76 },
  ],
  technology: [
    { commodity: 'electronics', category: 'technology', factor: 1.08 },
    { commodity: 'semiconductors', category: 'technology', factor: 1.2 },
    { commodity: 'medical devices', category: 'manufactured_goods', factor: 0.82 },
  ],
  vehicles: [
    { commodity: 'vehicles', category: 'vehicles', factor: 1.18 },
    { commodity: 'industrial machinery', category: 'manufactured_goods', factor: 0.86 },
  ],
  textiles: [
    { commodity: 'textiles', category: 'textiles', factor: 1.04 },
    { commodity: 'garments', category: 'textiles', factor: 0.82 },
  ],
  pharma: [
    { commodity: 'pharmaceuticals', category: 'manufactured_goods', factor: 1.12 },
    { commodity: 'medical devices', category: 'manufactured_goods', factor: 0.84 },
  ],
  manufacturing: [
    { commodity: 'machinery', category: 'manufactured_goods', factor: 1.02 },
    { commodity: 'electronics', category: 'technology', factor: 0.9 },
    { commodity: 'vehicles', category: 'vehicles', factor: 0.86 },
  ],
  logistics: [
    { commodity: 'chemicals', category: 'manufactured_goods', factor: 0.92 },
    { commodity: 'industrial machinery', category: 'manufactured_goods', factor: 0.86 },
  ],
  diversified: [
    { commodity: 'lng', category: 'energy', factor: 0.95 },
    { commodity: 'soybeans', category: 'agriculture', factor: 0.88 },
    { commodity: 'aircraft', category: 'manufactured_goods', factor: 1.02 },
  ],
}

function unique(items) {
  return [...new Set(items)]
}

function deterministicOffset(...parts) {
  const seed = parts.join(':')
  let total = 0

  for (let index = 0; index < seed.length; index += 1) {
    total = (total + seed.charCodeAt(index) * (index + 7)) % 1000
  }

  return total / 1000
}

function pickPartners(spec) {
  const regional = REGION_PARTNERS[spec.region].filter((iso) => iso !== spec.iso).slice(0, spec.tier === 'hub' ? 3 : 2)
  const importers = PARTNER_IMPORTERS[spec.role].filter((iso) => iso !== spec.iso).slice(0, spec.tier === 'mid' ? 2 : 3)
  return unique([...regional, ...importers]).slice(0, spec.tier === 'hub' ? 4 : 3)
}

export function generateFallbackTradeFlows(countryMap) {
  const availableSpecs = COUNTRY_SPECS.filter((spec) => countryMap[spec.iso])
  const flows = []

  for (const year of [2025, 2024, 2023]) {
    for (const spec of availableSpecs) {
      const exporter = countryMap[spec.iso]
      const partners = pickPartners(spec)
      const commodities = ROLE_COMMODITIES[spec.role]

      partners.forEach((partnerIso, partnerIndex) => {
        const importer = countryMap[partnerIso]

        if (!importer) {
          return
        }

        const commodity = commodities[partnerIndex % commodities.length]
        const valueScale = 0.86 + deterministicOffset(spec.iso, partnerIso, commodity.commodity, String(year)) * 0.46
        const valueUsd = Math.round(TIER_BASE[spec.tier] * YEAR_FACTORS[year] * commodity.factor * valueScale)
        const quantity = Math.round(valueUsd / 12_500)

        flows.push({
          id: `${spec.iso}-${partnerIso}-${commodity.commodity.replace(/[^a-z0-9]+/gi, '-')}-${year}`,
          year,
          commodity: commodity.commodity,
          commodityLabel: commodity.commodity,
          commodityCode: commodity.commodity,
          category: commodity.category,
          exporter: exporter.name,
          exporterIso: spec.iso,
          exporterIso3: spec.iso,
          importer: importer.name,
          importerIso: partnerIso,
          importerIso3: partnerIso,
          startLat: exporter.lat,
          startLng: exporter.lng,
          endLat: importer.lat,
          endLng: importer.lng,
          valueUsd,
          quantity,
          volumeTonnes: quantity,
          colorKey: commodity.category,
        })
      })
    }
  }

  return flows
}

export function summarizeTradeFlows(flows) {
  const countryTotals = new Map()

  flows.forEach((flow) => {
    countryTotals.set(flow.exporterIso3, (countryTotals.get(flow.exporterIso3) ?? 0) + 1)
    countryTotals.set(flow.importerIso3, (countryTotals.get(flow.importerIso3) ?? 0) + 1)
  })

  return {
    totalCountries: new Set(flows.flatMap((flow) => [flow.exporterIso3, flow.importerIso3])).size,
    totalFlows: flows.length,
    yearsCovered: [...new Set(flows.map((flow) => flow.year))].sort((a, b) => b - a),
    topCountriesByRouteCount: [...countryTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([iso3, routeCount]) => ({ iso3, routeCount })),
  }
}
