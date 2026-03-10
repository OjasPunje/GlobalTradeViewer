import { formatCompactCurrency, formatCurrency } from '../utils/formatters.js'

function renderList(items, labelKey, emptyLabel) {
  if (items.length === 0) {
    return <p className="sidebar-empty">No {emptyLabel} in the current filter.</p>
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item[labelKey]}>
          <span>{item[labelKey]}</span>
          <strong>{formatCompactCurrency(item.valueUsd)}</strong>
        </li>
      ))}
    </ul>
  )
}

function Sidebar({ selectedCountry, profile, countryStats, globalTotals, source, loading, error }) {
  if (!selectedCountry || !profile || !countryStats) {
    return (
      <aside className="sidebar-panel">
        <p className="sidebar-kicker">Global snapshot</p>
        <h2>Trade pulse</h2>
        <div className="sidebar-stat-grid">
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
        <p className="sidebar-footer">
          {loading ? 'Loading live trade data...' : source === 'live' ? 'Source: OEC live trade data.' : 'Source: fallback mock dataset.'}
        </p>
        {error ? <p className="sidebar-empty">{error}</p> : null}
        <p className="sidebar-empty">
          Select a country on the globe to inspect exports, imports, partners, and balance.
        </p>
      </aside>
    )
  }

  return (
    <aside className="sidebar-panel">
      <p className="sidebar-kicker">Country profile</p>
      <h2>{profile.name}</h2>
      <div className="sidebar-stat-grid">
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
          <span>Partner count</span>
          <strong>{countryStats.partnerCount}</strong>
        </article>
      </div>

      <section className="sidebar-block">
        <h3>Top exports</h3>
        {renderList(profile.topExports, 'commodity', 'exports')}
      </section>

      <section className="sidebar-block">
        <h3>Top imports</h3>
        {renderList(profile.topImports, 'commodity', 'imports')}
      </section>

      <section className="sidebar-block">
        <h3>Top partners</h3>
        {renderList(profile.topPartners, 'country', 'partners')}
      </section>

      <p className="sidebar-footer">
        Profile balance snapshot: {formatCurrency(profile.tradeBalanceUsd)}
      </p>
    </aside>
  )
}

export default Sidebar
