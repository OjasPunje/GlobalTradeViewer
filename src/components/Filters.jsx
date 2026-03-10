import { useEffect, useState } from 'react'

function Filters({ years, commodities, countries, filters, selectedCountry, onChange, onReset, onCountrySearch }) {
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setSearchTerm(selectedCountry?.name ?? '')
  }, [selectedCountry?.name])

  const handleSearchSubmit = () => {
    const normalized = searchTerm.trim().toLowerCase()

    if (!normalized) {
      onCountrySearch(null)
      return
    }

    const match = countries.find((country) => country.name.toLowerCase() === normalized)
      ?? countries.find((country) => country.iso.toLowerCase() === normalized)
      ?? countries.find((country) => country.name.toLowerCase().includes(normalized))

    if (match) {
      onCountrySearch(match)
    }
  }

  return (
    <section className="filters-bar" aria-label="Trade filters">
      <label>
        <span>Year</span>
        <select value={filters.selectedYear} onChange={(event) => onChange('selectedYear', event.target.value === 'all' ? 'all' : Number(event.target.value))}>
          <option value="all">All years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year === 2025 ? `${year} (partial)` : year}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Commodity</span>
        <select value={filters.selectedCommodity} onChange={(event) => onChange('selectedCommodity', event.target.value)}>
          <option value="all">All commodities</option>
          {commodities.map((commodity) => (
            <option key={commodity} value={commodity}>
              {commodity}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Direction</span>
        <select value={filters.selectedDirection} onChange={(event) => onChange('selectedDirection', event.target.value)}>
          <option value="both">Both</option>
          <option value="exports">Exports</option>
          <option value="imports">Imports</option>
        </select>
      </label>

      <label>
        <span>Partner</span>
        <select value={filters.selectedPartner} onChange={(event) => onChange('selectedPartner', event.target.value)}>
          <option value="all">All partners</option>
          {countries.map((country) => (
            <option key={country.iso} value={country.iso}>
              {country.name}
            </option>
          ))}
        </select>
      </label>

      <label className="filters-search">
        <span>Country search</span>
        <div className="filters-search-row">
          <input
            type="search"
            list="country-search-list"
            value={searchTerm}
            placeholder="Search country"
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSearchSubmit()
              }
            }}
          />
          <button type="button" className="filters-search-button" onClick={handleSearchSubmit}>
            Find
          </button>
          <datalist id="country-search-list">
            {countries.map((country) => (
              <option key={country.iso} value={country.name} />
            ))}
          </datalist>
        </div>
      </label>

      <button type="button" className="filters-reset" onClick={onReset}>
        Reset
      </button>
    </section>
  )
}

export default Filters
