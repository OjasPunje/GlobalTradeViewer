import { useMemo, useState } from 'react'
import { formatCurrency } from '../utils/formatters.js'

function TopRoutesTable({ routes }) {
  const [sortKey, setSortKey] = useState('valueUsd')
  const [sortDirection, setSortDirection] = useState('desc')

  const sortedRoutes = useMemo(() => {
    const sorted = [...routes].sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1

      if (sortKey === 'valueUsd' || sortKey === 'year') {
        return (a[sortKey] - b[sortKey]) * modifier
      }

      return a[sortKey].localeCompare(b[sortKey]) * modifier
    })

    return sorted
  }, [routes, sortDirection, sortKey])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection(key === 'valueUsd' ? 'desc' : 'asc')
  }

  return (
    <section className="routes-table-wrap">
      <div className="routes-table-head">
        <div>
          <p className="sidebar-kicker">Top routes</p>
          <h2>Filtered trade corridors</h2>
        </div>
      </div>
      <table className="routes-table">
        <thead>
          <tr>
            <th><button type="button" onClick={() => handleSort('exporter')}>Exporter</button></th>
            <th><button type="button" onClick={() => handleSort('importer')}>Importer</button></th>
            <th><button type="button" onClick={() => handleSort('commodity')}>Commodity</button></th>
            <th><button type="button" onClick={() => handleSort('valueUsd')}>Value</button></th>
            <th><button type="button" onClick={() => handleSort('year')}>Year</button></th>
          </tr>
        </thead>
        <tbody>
          {sortedRoutes.map((route) => (
            <tr key={route.id}>
              <td>{route.exporter}</td>
              <td>{route.importer}</td>
              <td>{route.commodityLabel ?? route.commodity}</td>
              <td>{formatCurrency(route.valueUsd)}</td>
              <td>{route.year}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default TopRoutesTable
