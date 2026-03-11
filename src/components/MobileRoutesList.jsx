import { formatCurrency } from '../utils/formatters.js'

function MobileRoutesList({ routes }) {
  return (
    <section className="mobile-routes">
      <div className="mobile-routes-head">
        <p className="sidebar-kicker">Top routes</p>
        <h2>Trade corridors</h2>
      </div>

      {routes.length === 0 ? (
        <p className="mobile-panel-empty">No trade corridors match the current filters.</p>
      ) : (
        <div className="mobile-route-list">
          {routes.map((route) => (
            <article key={route.id} className="mobile-route-card">
              <div className="mobile-route-topline">
                <strong>{route.exporter}</strong>
                <span>{route.year}</span>
              </div>
              <p>{route.importer}</p>
              <div className="mobile-route-meta">
                <span>{route.commodityLabel ?? route.commodity}</span>
                <strong>{formatCurrency(route.valueUsd)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default MobileRoutesList
