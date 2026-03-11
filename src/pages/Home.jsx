import { useEffect, useMemo, useState } from 'react'
import GlobeView from '../components/GlobeView.jsx'
import Filters from '../components/Filters.jsx'
import MobileRoutesList from '../components/MobileRoutesList.jsx'
import MobileTradePanel from '../components/MobileTradePanel.jsx'
import Sidebar from '../components/Sidebar.jsx'
import TopRoutesTable from '../components/TopRoutesTable.jsx'
import { useCountries } from '../hooks/useCountries.js'
import { useCountryProfile } from '../hooks/useCountryProfile.js'
import { useTradeData } from '../hooks/useTradeData.js'
import { formatCompactCurrency } from '../utils/formatters.js'

const initialFilters = {
  selectedYear: 2024,
  selectedCommodity: 'all',
  selectedDirection: 'both',
  selectedPartner: 'all',
}

const MOBILE_MEDIA_QUERY = '(max-width: 960px)'

function Home() {
  const [immersive, setImmersive] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [filters, setFilters] = useState(initialFilters)
  const { countries } = useCountries()

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedCountry(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    const syncMobileView = () => setIsMobileView(mediaQuery.matches)

    syncMobileView()
    mediaQuery.addEventListener('change', syncMobileView)

    return () => mediaQuery.removeEventListener('change', syncMobileView)
  }, [])

  const mergedFilters = useMemo(
    () => ({ ...filters, selectedCountry }),
    [filters, selectedCountry],
  )

  const {
    availableCommodities,
    availableYears,
    filteredFlows,
    totals,
    topRoutes,
    source,
    generatedAt,
    loading,
    error,
    resolvedYears,
  } = useTradeData(mergedFilters)

  const {
    profile: selectedProfile,
    loading: profileLoading,
    error: profileError,
  } = useCountryProfile(selectedCountry, filters.selectedYear)

  const countryStats = useMemo(() => {
    if (!selectedCountry || !selectedProfile) {
      return null
    }

    return {
      totalExports: selectedProfile.totalExports,
      totalImports: selectedProfile.totalImports,
      tradeBalance: selectedProfile.tradeBalance,
      partnerCount: selectedProfile.partnerCount,
    }
  }, [selectedCountry, selectedProfile])

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const handleReset = () => {
    setFilters(initialFilters)
    setSelectedCountry(null)
  }

  const handleReturnToLanding = () => {
    setSelectedCountry(null)
    setImmersive(false)
  }

  const handleCountryClick = (country) => {
    setImmersive(true)
    setSelectedCountry(country)
  }

  const handleCountrySearch = (country) => {
    setImmersive(true)
    setSelectedCountry(country)
  }

  const sourceLabel = source === 'oec' ? 'OEC API' : 'Trade data unavailable'
  const sourceMeta = source === 'oec' && generatedAt
    ? `Cached from OEC on ${new Date(generatedAt).toLocaleDateString()}`
    : null
  const resolvedYearNote =
    filters.selectedYear !== 'all' &&
    resolvedYears?.[0] &&
    resolvedYears[0] !== filters.selectedYear
      ? `Showing ${resolvedYears[0]} data for requested ${filters.selectedYear}.`
      : null
  const partialYearNote =
    filters.selectedYear === 2025
      ? '2025 is partial seed coverage. Full annual OEC trade coverage is currently stronger through 2024 in this app.'
      : null
  const mobileFilterTags = [
    filters.selectedYear === 'all' ? 'All years' : `Year ${filters.selectedYear}`,
    filters.selectedDirection === 'both' ? 'Both directions' : filters.selectedDirection,
    filters.selectedCommodity === 'all' ? 'All commodities' : filters.selectedCommodity,
    filters.selectedPartner === 'all' ? 'All partners' : filters.selectedPartner,
  ]
  const mobileSummary = selectedCountry
    ? `${selectedCountry.name} across ${countryStats?.partnerCount ?? 0} trading partners.`
    : `${totals.routeCount} active routes worth ${formatCompactCurrency(totals.totalTradeValue)}.`
  const notesPanel = (
    <aside className={`experience-notes ${immersive ? 'is-hidden' : ''}`}>
      <p className="experience-notes-kicker">Open Source Global Trade Project</p>
      <div className="experience-note-block">
        <span className="experience-note-label">Created by</span>
        <p className="experience-note-value">Ojas Punje</p>
      </div>
      <div className="experience-note-block">
        <span className="experience-note-label">LinkedIn</span>
        <p className="experience-note-value">https://www.linkedin.com/in/ojaspunje/</p>
      </div>
      <div className="experience-note-block">
        <span className="experience-note-label">GitHub</span>
        <p className="experience-note-value">https://github.com/OjasPunje</p>
      </div>
      <div className="experience-note-block">
        <span className="experience-note-label">Source</span>
        <p className="experience-note-value">{loading ? 'Resolving data source...' : sourceLabel}</p>
        {sourceMeta ? <p className="experience-note-value">{sourceMeta}</p> : null}
      </div>
      <div className="experience-note-block">
        <span className="experience-note-label">Snapshot</span>
        <p className="experience-note-value">
          {loading
            ? 'Loading trade flows...'
            : source === 'oec'
              ? `${totals.routeCount} active routes worth ${formatCompactCurrency(totals.totalTradeValue)}.`
              : 'Live trade data is not currently available.'}
        </p>
        {partialYearNote ? <p className="experience-note-value">{partialYearNote}</p> : null}
        {resolvedYearNote ? <p className="experience-note-value">{resolvedYearNote}</p> : null}
        {error ? <p className="experience-note-value">{error}</p> : null}
      </div>
    </aside>
  )

  return (
    <main
      className={`experience-shell ${immersive ? 'is-immersive' : ''} ${selectedCountry ? 'has-selection' : ''} ${isMobileView ? 'is-mobile-view' : ''}`}
    >
      <section className={`experience-hero ${immersive ? 'is-hidden' : ''}`}>
        <p className="experience-kicker">Global Trade Tracker</p>
        <h1>Read the world through its trade routes.</h1>
        <p className="experience-lede">
          Explore real bilateral trade flows on a global globe interface, then drill into
          any country to see its major partners, traded goods, and route intensity across years.
        </p>
        <div className="experience-legend">
          <span />
          Touch the globe to enter trade mode
        </div>
      </section>

      {!isMobileView ? notesPanel : null}

      {isMobileView && immersive ? (
        <section className="mobile-trade-header">
          <div className="mobile-trade-header-top">
            <div>
              <p className="sidebar-kicker">Mobile trade mode</p>
              <h2>{selectedCountry?.name ?? 'Global trade'}</h2>
            </div>
            <button type="button" className="trade-back-button" onClick={handleReturnToLanding}>
              Back
            </button>
          </div>
          <p className="mobile-trade-summary">{loading ? 'Loading trade data...' : mobileSummary}</p>
          <div className="mobile-filter-tags" aria-label="Current mobile trade filters">
            {mobileFilterTags.map((tag) => (
              <span key={tag} className="trade-pill">
                {tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="experience-globe-stage" aria-label="Interactive trade globe">
        <div className="experience-globe-frame">
          <GlobeView
            immersive={immersive}
            arcs={filteredFlows}
            countries={countries}
            selectedCountry={selectedCountry}
            onFirstInteract={() => setImmersive(true)}
            onCountryClick={handleCountryClick}
          />
        </div>
      </section>

      {isMobileView ? notesPanel : null}

      {isMobileView && immersive ? (
        <>
          <section className="mobile-filters-shell">
            <Filters
              years={availableYears}
              commodities={availableCommodities}
              countries={countries}
              filters={filters}
              selectedCountry={selectedCountry}
              onChange={handleFilterChange}
              onReset={handleReset}
              onCountrySearch={handleCountrySearch}
            />
          </section>

          <section className="mobile-panel-shell">
            <MobileTradePanel
              selectedCountry={selectedCountry}
              profile={selectedProfile}
              countryStats={countryStats}
              globalTotals={totals}
              source={source}
              loading={loading || profileLoading}
              error={profileError ?? error}
            />
          </section>

          <section className="mobile-routes-shell">
            <MobileRoutesList routes={topRoutes} />
          </section>
        </>
      ) : null}

      <section className={`trade-controls ${immersive && !isMobileView ? 'is-visible' : ''}`}>
        <div className="trade-controls-row">
          <Filters
            years={availableYears}
            commodities={availableCommodities}
            countries={countries}
            filters={filters}
            selectedCountry={selectedCountry}
            onChange={handleFilterChange}
            onReset={handleReset}
            onCountrySearch={handleCountrySearch}
          />
          <div className="trade-controls-subrow">
            <div className="trade-nav-hints">
              <button type="button" className="trade-back-button" onClick={handleReturnToLanding}>
                Back to landing
              </button>
              {selectedCountry ? <p className="trade-escape-hint">Click Escape to go back</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className={`trade-sidebar-shell ${immersive && !isMobileView ? 'is-visible' : ''}`}>
        <Sidebar
          selectedCountry={selectedCountry}
          profile={selectedProfile}
          countryStats={countryStats}
          globalTotals={totals}
          source={source}
          loading={loading || profileLoading}
          error={profileError ?? error}
        />
      </section>

      <section className={`trade-routes-shell ${immersive && !isMobileView ? 'is-visible' : ''}`}>
        <TopRoutesTable routes={topRoutes} />
      </section>
    </main>
  )
}

export default Home
