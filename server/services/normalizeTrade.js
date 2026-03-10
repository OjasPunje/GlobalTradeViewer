function getValue(record, keys) {
  for (const key of keys) {
    if (record[key] != null && record[key] !== '') {
      return record[key]
    }
  }

  return null
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function classifyCommodity(record) {
  const label = String(
    getValue(record, [
      'cmdDesc',
      'cmdDescE',
      'cmdDescF',
      'commodityLabel',
      'Commodity',
      'HS2',
      'HS4',
    ]) ?? '',
  ).toLowerCase()

  if (/(oil|gas|petroleum|coal|diesel|fuel|lng)/.test(label)) {
    return 'energy'
  }

  if (/(wheat|soy|corn|rice|meat|beef|coffee|grain|sugar|fruit)/.test(label)) {
    return 'agriculture'
  }

  if (/(semiconductor|electronic|circuit|computer|chip|telecom)/.test(label)) {
    return 'technology'
  }

  if (/(vehicle|car|truck|automobile)/.test(label)) {
    return 'vehicles'
  }

  if (/(ore|copper|iron|aluminum|aluminium|nickel|lithium|mineral)/.test(label)) {
    return 'minerals'
  }

  if (/(textile|apparel|garment|cotton)/.test(label)) {
    return 'textiles'
  }

  if (/(pharmaceutical|medical)/.test(label)) {
    return 'pharmaceuticals'
  }

  return 'manufactured_goods'
}

export function normalizeTradeRecord(record, countryMap) {
  const exporterIso3 = String(
    getValue(record, ['reporterISO', 'reporterISO3', 'reporterCode', 'Reporter ISO']) ?? '',
  ).toUpperCase()
  const importerIso3 = String(
    getValue(record, ['partnerISO', 'partnerISO3', 'partnerCode', 'Partner ISO']) ?? '',
  ).toUpperCase()
  const exporterMeta = countryMap[exporterIso3]
  const importerMeta = countryMap[importerIso3]

  if (!exporterMeta || !importerMeta) {
    return null
  }

  const commodityCode = String(
    getValue(record, ['cmdCode', 'cmdId', 'commodityCode', 'HS2 ID']) ?? 'TOTAL',
  )
  const commodityLabel =
    String(
      getValue(record, ['cmdDesc', 'cmdDescE', 'commodityLabel', 'Commodity', 'HS2', 'HS4']) ??
        'Trade goods',
    ).trim()
  const year = toNumber(getValue(record, ['period', 'yr', 'Year']))
  const valueUsd = toNumber(
    getValue(record, ['primaryValue', 'Trade Value', 'tradeValue', 'valueUsd', 'TradeValue']),
  )
  const quantity = toNumber(getValue(record, ['qty', 'netWgt', 'Weight', 'Quantity']))

  if (!year || !valueUsd) {
    return null
  }

  return {
    id: `${year}-${exporterIso3}-${importerIso3}-${commodityCode}`,
    year,
    exporter: exporterMeta.name,
    exporterIso3,
    exporterIso: exporterIso3,
    importer: importerMeta.name,
    importerIso3,
    importerIso: importerIso3,
    commodityCode,
    commodityLabel,
    commodity: commodityLabel.toLowerCase(),
    category: classifyCommodity(record),
    valueUsd,
    quantity,
    volumeTonnes: quantity,
    startLat: exporterMeta.lat,
    startLng: exporterMeta.lng,
    endLat: importerMeta.lat,
    endLng: importerMeta.lng,
    colorKey: classifyCommodity(record),
  }
}

export function normalizeTradeResponse(records, countryMap) {
  return records
    .map((record) => normalizeTradeRecord(record, countryMap))
    .filter(Boolean)
}
