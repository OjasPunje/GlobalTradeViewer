export function filterTradeFlows(flows, filters) {
  return flows.filter((flow) => {
    const yearMatch = filters.selectedYear === 'all' || flow.year === filters.selectedYear

    const commodityMatch =
      filters.selectedCommodity === 'all' || flow.commodity === filters.selectedCommodity

    const countryMatch =
      !filters.selectedCountry ||
      flow.exporterIso === filters.selectedCountry.iso ||
      flow.importerIso === filters.selectedCountry.iso

    const partnerMatch =
      filters.selectedPartner === 'all' ||
      flow.exporterIso === filters.selectedPartner ||
      flow.importerIso === filters.selectedPartner

    const directionMatch =
      filters.selectedDirection === 'both' ||
      (filters.selectedDirection === 'exports' &&
        (!filters.selectedCountry || flow.exporterIso === filters.selectedCountry.iso)) ||
      (filters.selectedDirection === 'imports' &&
        (!filters.selectedCountry || flow.importerIso === filters.selectedCountry.iso))

    return yearMatch && commodityMatch && countryMatch && partnerMatch && directionMatch
  })
}
