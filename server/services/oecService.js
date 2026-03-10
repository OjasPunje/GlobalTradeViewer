const OEC_API_ROOT = 'https://api-v2.oec.world/tesseract'
const OEC_DATA_URL = `${OEC_API_ROOT}/data.jsonrecords`
const OEC_MEMBERS_URL = `${OEC_API_ROOT}/members`
const OEC_CUBES = ['trade_i_baci_a_22', 'trade_i_baci_a_92']
const OEC_PAGE_SIZE = 100
const REQUEST_BATCH_SIZE = 8

const COUNTRY_NAME_ALIASES = {
  'bahamas the': 'BHS',
  'bolivia': 'BOL',
  'brunei': 'BRN',
  'cape verde': 'CPV',
  'china': 'CHN',
  'congo dem rep': 'COD',
  'congo democratic republic of the': 'COD',
  'congo rep': 'COG',
  'congo republic of the': 'COG',
  'cote divoire': 'CIV',
  'czech republic': 'CZE',
  'czechia': 'CZE',
  'dominican republic': 'DOM',
  'egypt arab rep': 'EGY',
  'gambia the': 'GMB',
  'hong kong': 'HKG',
  'iran islamic rep': 'IRN',
  'korea dem peoples rep': 'PRK',
  'korea rep': 'KOR',
  'korea republic of': 'KOR',
  'kyrgyz republic': 'KGZ',
  'lao pdr': 'LAO',
  'macao': 'MAC',
  'micronesia fed sts': 'FSM',
  'moldova': 'MDA',
  'north macedonia': 'MKD',
  'russian federation': 'RUS',
  'slovak republic': 'SVK',
  'south korea': 'KOR',
  'st kitts and nevis': 'KNA',
  'st lucia': 'LCA',
  'st vincent and the grenadines': 'VCT',
  'syrian arab republic': 'SYR',
  taiwan: 'TWN',
  tanzania: 'TZA',
  'turkiye': 'TUR',
  turkey: 'TUR',
  'united states': 'USA',
  'venezuela rb': 'VEN',
  'viet nam': 'VNM',
  yemen: 'YEM',
}

function normalizeCountryName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[().,']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function classifyCommodity(label) {
  const value = String(label ?? '').toLowerCase()

  if (/(oil|gas|lng|coal|petroleum|fuel)/.test(value)) return 'energy'
  if (/(soy|beef|grain|wheat|corn|rice|coffee|fruit|fish|cocoa|sugar)/.test(value)) return 'agriculture'
  if (/(semiconductor|electronic|circuit|computer|chip|telecom)/.test(value)) return 'technology'
  if (/(vehicle|car|truck|automotive|tractor)/.test(value)) return 'vehicles'
  if (/(ore|iron|copper|nickel|aluminum|aluminium|lithium|mineral|gold)/.test(value)) return 'minerals'
  if (/(textile|cotton|garment|apparel)/.test(value)) return 'textiles'
  if (/(pharmaceutical|medical)/.test(value)) return 'pharmaceuticals'
  return 'manufactured_goods'
}

function buildCountryNameIndex(countryMap) {
  const index = new Map()

  Object.entries(countryMap).forEach(([iso3, country]) => {
    index.set(normalizeCountryName(country.name), iso3)
  })

  Object.entries(COUNTRY_NAME_ALIASES).forEach(([name, iso3]) => {
    index.set(normalizeCountryName(name), iso3)
  })

  return index
}

function mapCountryNameToIso(name, countryIndex) {
  return countryIndex.get(normalizeCountryName(name)) ?? null
}

function parseOecListPayload(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return []
}

function parseOecTotal(payload, fallbackLength) {
  const pageTotal = Number(payload?.page?.total)
  const total = Number(payload?.total)

  if (Number.isFinite(pageTotal) && pageTotal > 0) {
    return pageTotal
  }

  if (Number.isFinite(total) && total > 0) {
    return total
  }

  return fallbackLength
}

function buildOecDataUrl({ year, cube, reporterId, offset = 0, pageSize = OEC_PAGE_SIZE }) {
  const params = new URLSearchParams({
    cube,
    Year: String(year),
    drilldowns: 'HS2,Exporter Country,Importer Country,Year',
    measures: 'Trade Value',
    parents: 'true',
    sort: 'Trade Value.desc',
    limit: `${pageSize},${offset}`,
  })

  if (reporterId) {
    params.set('include', `Exporter Country:${reporterId};Year:${year}`)
  } else {
    params.set('include', `Year:${year}`)
  }

  return `${OEC_DATA_URL}?${params.toString()}`
}

function buildOecMembersUrl({ cube, level }) {
  const params = new URLSearchParams({
    cube,
    level,
  })

  return `${OEC_MEMBERS_URL}?${params.toString()}`
}

async function fetchJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`OEC request failed with ${response.status}`)
  }

  return response.json()
}

async function fetchOecMembers(cube, level) {
  const payload = await fetchJson(buildOecMembersUrl({ cube, level }))
  return Array.isArray(payload?.members) ? payload.members : parseOecListPayload(payload)
}

async function fetchOecPage({ year, cube, reporterId, offset }) {
  const payload = await fetchJson(buildOecDataUrl({ year, cube, reporterId, offset }))
  const records = parseOecListPayload(payload)

  return {
    records,
    total: parseOecTotal(payload, records.length),
  }
}

function extractMemberId(member) {
  const candidates = [
    member?.id,
    member?.key,
    member?.member_id,
    member?.memberId,
    member?.value,
    member?.['ID'],
  ]

  return candidates.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? null
}

function extractMemberLabel(member) {
  const candidates = [
    member?.name,
    member?.label,
    member?.caption,
    member?.title,
    member?.member_name,
    member?.memberName,
    member?.['Exporter Country'],
    member?.['Importer Country'],
  ]

  return candidates.find((value) => typeof value === 'string' && value.trim()) ?? null
}

async function fetchReporterMembers(countryMap) {
  const countryIndex = buildCountryNameIndex(countryMap)
  const reporters = new Map()

  for (const cube of OEC_CUBES) {
    try {
      const members = await fetchOecMembers(cube, 'Exporter Country')

      members.forEach((member) => {
        const id = extractMemberId(member)
        const label = extractMemberLabel(member)
        const iso3 = label ? mapCountryNameToIso(label, countryIndex) : null

        if (!id || !iso3 || !countryMap[iso3]) {
          return
        }

        const existing = reporters.get(`${cube}:${iso3}`)

        if (!existing) {
          reporters.set(`${cube}:${iso3}`, {
            cube,
            iso3,
            reporterId: String(id),
            label,
          })
        }
      })
    } catch {
      continue
    }
  }

  return [...reporters.values()]
}

function normalizeRecord(record, year, countryMap, countryIndex) {
  const exporterName = String(record?.['Exporter Country'] ?? '').trim()
  const importerName = String(record?.['Importer Country'] ?? '').trim()
  const exporterIso3 = mapCountryNameToIso(exporterName, countryIndex)
  const importerIso3 = mapCountryNameToIso(importerName, countryIndex)
  const exporter = exporterIso3 ? countryMap[exporterIso3] : null
  const importer = importerIso3 ? countryMap[importerIso3] : null

  if (!exporter || !importer || exporterIso3 === importerIso3) {
    return null
  }

  const commodityLabel = String(record?.HS2 ?? record?.HS4 ?? 'Trade goods').trim()
  const category = classifyCommodity(commodityLabel)
  const commoditySlug = commodityLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const valueUsd = Number(record?.['Trade Value'] ?? 0)

  if (!valueUsd) {
    return null
  }

  return {
    id: `${year}-${exporterIso3}-${importerIso3}-${commoditySlug}`,
    year,
    exporter: exporter.name,
    exporterIso: exporterIso3,
    exporterIso3,
    importer: importer.name,
    importerIso: importerIso3,
    importerIso3,
    commodity: commodityLabel.toLowerCase(),
    commodityLabel,
    commodityCode: commodityLabel,
    category,
    valueUsd,
    quantity: 0,
    volumeTonnes: 0,
    startLat: exporter.lat,
    startLng: exporter.lng,
    endLat: importer.lat,
    endLng: importer.lng,
    colorKey: category,
  }
}

async function fetchReporterYearRoutes({ year, reporter, countryMap, countryIndex, perReporterLimit }) {
  const records = []

  for (let offset = 0; offset < perReporterLimit; offset += OEC_PAGE_SIZE) {
    const page = await fetchOecPage({
      year,
      cube: reporter.cube,
      reporterId: reporter.reporterId,
      offset,
    })

    records.push(...page.records)

    if (page.records.length < OEC_PAGE_SIZE || offset + OEC_PAGE_SIZE >= page.total) {
      break
    }
  }

  return records
    .map((record) => normalizeRecord(record, year, countryMap, countryIndex))
    .filter(Boolean)
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, perReporterLimit)
}

async function runInBatches(items, batchSize, worker) {
  const results = []

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize)
    const batchResults = await Promise.allSettled(batch.map(worker))

    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(...result.value)
      }
    })
  }

  return results
}

function dedupeFlows(flows) {
  const deduped = new Map()

  flows.forEach((flow) => {
    const existing = deduped.get(flow.id)

    if (!existing || flow.valueUsd > existing.valueUsd) {
      deduped.set(flow.id, flow)
    }
  })

  return [...deduped.values()].sort((a, b) => b.valueUsd - a.valueUsd)
}

export async function fetchOecYear(year, countryMap, perReporterLimit = 12) {
  const countryIndex = buildCountryNameIndex(countryMap)
  const reporters = await fetchReporterMembers(countryMap)

  if (reporters.length === 0) {
    throw new Error(`No OEC reporter members available for ${year}`)
  }

  const normalized = await runInBatches(
    reporters,
    REQUEST_BATCH_SIZE,
    (reporter) => fetchReporterYearRoutes({ year, reporter, countryMap, countryIndex, perReporterLimit }),
  )

  const deduped = dedupeFlows(normalized)

  if (deduped.length === 0) {
    throw new Error(`No OEC records returned for ${year}`)
  }

  return deduped
}
