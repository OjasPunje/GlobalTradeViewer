import { formatCompactCurrency, formatCurrency } from '../utils/formatters.js'

function renderList(items, labelKey, emptyLabel) {
  if (!items.length) {
    return <p className="mobile-panel-empty">No {emptyLabel} in the current filter.</p>
  }

  return (
    <ul className="mobile-panel-list">
      {items.slice(0, 4).map((item) => (
        <li key={item[labelKey]}>
          <span>{item[labelKey]}</span>
          <strong>{formatCompactCurrency(item.valueUsd)}</strong>
        </li>
      ))}
    </ul>
  )
}

function MobileTradePanel({
  selectedCountry,
  profile,
  countryStats,
  globalTotals,
  source,
  loading,
  error,
}) {
  if (!selectedCountry || !profile || !countryStats) {
    return (
      <section className="mobile-panel">
        <p className="sidebar-kicker">Global snapshot</p>
        <h2>Trade pulse</h2>
        <div className="mobile-panel-stat-grid">
          <article>
            <span>Total trade</span>
            <strong>{formatCompactCurrency(globalTotals.totalTradeValue)}</strong>
          </article>
          <article>
            <span>Active routes</span>
            <strong>{globalTotals.routeCount}</strong>
          </article>
          <article>
            <span>Top exporter</span>
            <strong>{globalTotals.topExporter}</strong>
          </article>
          <article>
            <span>Top importer</span>
            <strong>{globalTotals.topImporter}</strong>
          </article>
        </div>
        <p className="mobile-panel-footer">
          {loading
            ? 'Loading live trade data...'
            : source === 'oec'
              ? 'Source: OEC trade data.'
              : 'Source unavailable.'}
        </p>
        {error ? <p className="mobile-panel-empty">{error}</p> : null}
      </section>
    )
  }

  return (
    <section className="mobile-panel">
      <p className="sidebar-kicker">Country profile</p>
      <h2>{profile.name}</h2>
      <div className="mobile-panel-stat-grid">
        <article>
          <span>Total exports</span>
          <strong>{formatCompactCurrency(countryStats.totalExports)}</strong>
        </article>
        <article>
          <span>Total imports</span>
          <strong>{formatCompactCurrency(countryStats.totalImports)}</strong>
        </article>
        <article>
          <span>Trade balance</span>
          <strong>{formatCompactCurrency(countryStats.tradeBalance)}</strong>
        </article>
        <article>
          <span>Partners</span>
          <strong>{countryStats.partnerCount}</strong>
        </article>
      </div>

      <section className="mobile-panel-block">
        <h3>Top exports</h3>
        {renderList(profile.topExports, 'commodity', 'exports')}
      </section>

      <section className="mobile-panel-block">
        <h3>Top imports</h3>
        {renderList(profile.topImports, 'commodity', 'imports')}
      </section>

      <section className="mobile-panel-block">
        <h3>Top partners</h3>
        {renderList(profile.topPartners, 'country', 'partners')}
      </section>

      <p className="mobile-panel-footer">
        Profile balance snapshot: {formatCurrency(profile.tradeBalanceUsd)}
      </p>
      {error ? <p className="mobile-panel-empty">{error}</p> : null}
    </section>
  )
}

export default MobileTradePanel
