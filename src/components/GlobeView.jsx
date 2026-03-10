import { useEffect, useMemo, useRef, useState } from 'react'
import { geoCentroid, geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import atlas from 'world-atlas/countries-110m.json'
import { TRADE_CATEGORY_COLORS } from '../utils/colorScale.js'
import { formatCompactCurrency } from '../utils/formatters.js'

const land = feature(atlas, atlas.objects.land)
const countryFeatures = feature(atlas, atlas.objects.countries).features
const borders = mesh(atlas, atlas.objects.countries, (a, b) => a !== b)
const graticule = geoGraticule10()
const MAX_RENDERED_ARCS = 90

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function createArcPath(flow, projection) {
  let path = ''
  const segments = 12

  for (let step = 0; step <= segments; step += 1) {
    const t = step / segments
    const lat = flow.startLat + (flow.endLat - flow.startLat) * t
    const lng = flow.startLng + (flow.endLng - flow.startLng) * t
    const lift = Math.sin(t * Math.PI) * 22
    const point = projection([lng, lat])

    if (!point) {
      continue
    }

    const command = path ? 'L' : 'M'
    path += `${command}${point[0].toFixed(2)},${(point[1] - lift).toFixed(2)} `
  }

  return path.trim()
}

function GlobeView({ immersive, arcs, countries, selectedCountry, onFirstInteract, onCountryClick }) {
  const stageRef = useRef(null)
  const frameRef = useRef(null)
  const [globeSize, setGlobeSize] = useState(720)
  const [rotation, setRotation] = useState({ x: 14, y: -24 })
  const [zoom, setZoom] = useState(0.92)
  const [hovered, setHovered] = useState(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const dragRef = useRef({ active: false, x: 0, y: 0, rotationX: 14, rotationY: -24 })

  useEffect(() => {
    const stage = stageRef.current

    if (!stage) {
      return
    }

    const resize = () => {
      const nextSize = Math.max(360, Math.min(stage.clientWidth, stage.clientHeight, 860))
      setGlobeSize(nextSize)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [immersive])

  useEffect(() => {
    const stage = stageRef.current

    if (!stage) {
      return undefined
    }

    const preventGestureZoom = (event) => {
      event.preventDefault()
    }

    stage.addEventListener('wheel', preventGestureZoom, { passive: false })
    stage.addEventListener('gesturestart', preventGestureZoom)
    stage.addEventListener('gesturechange', preventGestureZoom)

    return () => {
      stage.removeEventListener('wheel', preventGestureZoom)
      stage.removeEventListener('gesturestart', preventGestureZoom)
      stage.removeEventListener('gesturechange', preventGestureZoom)
    }
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      setRotation({ x: selectedCountry.lat, y: selectedCountry.lng })
      setZoom(1.8)
      return
    }

    setZoom(immersive ? 1.08 : 0.8)
  }, [immersive, selectedCountry])

  useEffect(() => {
    if (immersive || selectedCountry || isInteracting) {
      return undefined
    }

    const id = window.setInterval(() => {
      setRotation((current) => ({ ...current, y: current.y + 0.14 }))
    }, 16)

    return () => window.clearInterval(id)
  }, [immersive, isInteracting, selectedCountry])

  const countryCenterByIso = useMemo(() => {
    const entries = countries.map((country) => {
      const matchingFeature = countryFeatures.find((shape) => geoContains(shape, [country.lng, country.lat]))
      const [centerLng, centerLat] = matchingFeature ? geoCentroid(matchingFeature) : [country.lng, country.lat]

      return [
        country.iso,
        {
          lat: centerLat,
          lng: centerLng,
        },
      ]
    })

    return Object.fromEntries(entries)
  }, [countries])

  const projection = useMemo(() => {
    const scale = globeSize * 0.34 * zoom

    return geoOrthographic()
      .translate([0, 0])
      .scale(scale)
      .rotate([-rotation.y, -rotation.x])
      .clipAngle(90)
      .precision(0.5)
  }, [globeSize, rotation.x, rotation.y, zoom])

  const path = useMemo(() => geoPath(projection), [projection])
  const displayArcs = useMemo(() => {
    if (!selectedCountry) {
      return []
    }

    return [...arcs].sort((a, b) => b.valueUsd - a.valueUsd).slice(0, MAX_RENDERED_ARCS)
  }, [arcs, selectedCountry])

  const connectedCountryIsos = useMemo(() => {
    if (!selectedCountry) {
      return null
    }

    const nextSet = new Set([selectedCountry.iso])

    displayArcs.forEach((flow) => {
      nextSet.add(flow.exporterIso)
      nextSet.add(flow.importerIso)
      nextSet.add(flow.exporterIso3)
      nextSet.add(flow.importerIso3)
    })

    return nextSet
  }, [displayArcs, selectedCountry])

  const projectedCountries = useMemo(
    () =>
      countries
        .map((country) => {
          const center = countryCenterByIso[country.iso] ?? { lat: country.lat, lng: country.lng }
          const point = projection([center.lng, center.lat])
          const visible = geoDistance([center.lng, center.lat], [rotation.y, rotation.x]) < Math.PI / 2 - 0.04
          const included = !connectedCountryIsos || connectedCountryIsos.has(country.iso)

          return {
            ...country,
            lat: center.lat,
            lng: center.lng,
            x: point?.[0] ?? 0,
            y: point?.[1] ?? 0,
            visible: Boolean(point) && visible && included,
          }
        })
        .sort((a, b) => a.y - b.y),
    [connectedCountryIsos, countries, countryCenterByIso, projection, rotation.x, rotation.y],
  )

  const projectedArcs = useMemo(
    () => {
      if (!selectedCountry) {
        return []
      }

      return displayArcs.map((flow) => {
        const exporterIso = flow.exporterIso ?? flow.exporterIso3
        const importerIso = flow.importerIso ?? flow.importerIso3
        const start = exporterIso ? countryCenterByIso[exporterIso] : null
        const end = importerIso ? countryCenterByIso[importerIso] : null
        const arcFlow = {
          ...flow,
          startLat: start?.lat ?? flow.startLat,
          startLng: start?.lng ?? flow.startLng,
          endLat: end?.lat ?? flow.endLat,
          endLng: end?.lng ?? flow.endLng,
        }

        return {
          ...arcFlow,
          path: createArcPath(arcFlow, projection),
        }
      })
    },
    [countryCenterByIso, displayArcs, projection, selectedCountry],
  )

  const handlePointerDown = (event) => {
    onFirstInteract?.()
    dragRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      rotationX: rotation.x,
      rotationY: rotation.y,
    }
    setIsInteracting(true)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current.active) {
      return
    }

    const deltaX = event.clientX - dragRef.current.x
    const deltaY = event.clientY - dragRef.current.y

    setRotation({
      x: clamp(dragRef.current.rotationX + deltaY * 0.2, -70, 70),
      y: dragRef.current.rotationY - deltaX * 0.24,
    })
  }

  const handlePointerUp = () => {
    dragRef.current.active = false
    setIsInteracting(false)
  }

  const handleWheel = (event) => {
    event.preventDefault()
    onFirstInteract?.()
    setZoom((current) => clamp(current - event.deltaY * 0.0038, 0.78, 3.1))
  }

  return (
    <div
      className={`trade-globe ${isInteracting ? 'is-interacting' : ''}`}
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      <div className="trade-globe-frame" ref={frameRef}>
        <svg
          className="trade-globe-svg"
          viewBox={`${-globeSize / 2} ${-globeSize / 2} ${globeSize} ${globeSize}`}
          role="img"
          aria-label="Interactive global trade globe"
        >
          <defs>
            <radialGradient id="trade-globe-fill" cx="34%" cy="28%">
              <stop offset="0%" stopColor="#1d232f" />
              <stop offset="60%" stopColor="#0d121b" />
              <stop offset="100%" stopColor="#05070b" />
            </radialGradient>
            <clipPath id="trade-globe-clip">
              <path d={path({ type: 'Sphere' })} />
            </clipPath>
          </defs>

          <path className="trade-globe-sphere" d={path({ type: 'Sphere' })} fill="url(#trade-globe-fill)" />
          <path className="trade-globe-rim" d={path({ type: 'Sphere' })} />
          <g clipPath="url(#trade-globe-clip)">
            <path className="trade-globe-grid" d={path(graticule)} />
            <path className="trade-globe-land" d={path(land)} />
            <path className="trade-globe-borders" d={path(borders)} />
            {projectedArcs.map((flow) => (
              <path
                key={flow.id}
                className="trade-arc"
                d={flow.path}
                stroke={TRADE_CATEGORY_COLORS[flow.colorKey] ?? '#ffffff'}
                strokeWidth={1.1}
                onMouseEnter={() => setHovered({
                  label: `${flow.exporter} to ${flow.importer}`,
                  detail: `${flow.commodityLabel ?? flow.commodity} · ${formatCompactCurrency(flow.valueUsd)}`,
                })}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
            {projectedCountries.map((country) =>
              country.visible ? (
                <g
                  key={country.iso}
                  className="trade-country-node"
                  transform={`translate(${country.x}, ${country.y})`}
                  onClick={() => onCountryClick(country)}
                  onMouseEnter={() => setHovered({ label: country.name, detail: country.iso, countryIso: country.iso })}
                  onMouseLeave={() => setHovered(null)}
                >
                  <circle
                    className={`trade-country-dot ${selectedCountry?.iso === country.iso ? 'is-selected' : ''}`}
                    r={selectedCountry?.iso === country.iso ? 7.2 : 4.4}
                  />
                  {selectedCountry?.iso === country.iso || hovered?.countryIso === country.iso ? (
                    <text className="trade-country-label" x={10} y={-10}>
                      {country.name}
                    </text>
                  ) : null}
                </g>
              ) : null,
            )}
          </g>
        </svg>
      </div>

      {hovered ? (
        <div className="trade-tooltip">
          <strong>{hovered.label}</strong>
          <span>{hovered.detail}</span>
        </div>
      ) : null}

      <div className={`trade-entry-hint ${immersive ? 'is-hidden' : ''}`}>
        <span />
        Drag to enter trade mode
      </div>
    </div>
  )
}

export default GlobeView
