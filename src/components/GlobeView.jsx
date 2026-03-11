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
const MOBILE_ROTATION_MULTIPLIER_X = 0.58
const MOBILE_ROTATION_MULTIPLIER_Y = 0.72
const DESKTOP_ROTATION_MULTIPLIER_X = 0.2
const DESKTOP_ROTATION_MULTIPLIER_Y = 0.24
const MOBILE_IDLE_ZOOM = 0.96
const MOBILE_IMMERSIVE_ZOOM = 1.28
const MOBILE_SELECTED_ZOOM = 2.15
const DESKTOP_IDLE_ZOOM = 0.8
const DESKTOP_IMMERSIVE_ZOOM = 1.08
const DESKTOP_SELECTED_ZOOM = 1.8
const MIN_ZOOM = 0.78
const MAX_ZOOM = 3.1
const TAP_SELECTION_THRESHOLD = 10

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const getPointerDistance = (firstPointer, secondPointer) =>
  Math.hypot(secondPointer.x - firstPointer.x, secondPointer.y - firstPointer.y)

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
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    rotationX: 14,
    rotationY: -24,
  })
  const activePointersRef = useRef(new Map())
  const pinchRef = useRef({ active: false, distance: 0, zoom: 0.92 })
  const tapRef = useRef({ countryIso: null, moved: false, pointerId: null })
  const rotationRef = useRef({ x: 14, y: -24 })
  const zoomRef = useRef(0.92)
  const pendingViewRef = useRef({ rotation: { x: 14, y: -24 }, zoom: 0.92 })
  const renderFrameRef = useRef(null)
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  const scheduleViewState = (nextRotation = rotationRef.current, nextZoom = zoomRef.current) => {
    rotationRef.current = nextRotation
    zoomRef.current = nextZoom
    pendingViewRef.current = { rotation: nextRotation, zoom: nextZoom }

    if (renderFrameRef.current !== null) {
      return
    }

    renderFrameRef.current = window.requestAnimationFrame(() => {
      renderFrameRef.current = null
      setRotation(pendingViewRef.current.rotation)
      setZoom(pendingViewRef.current.zoom)
    })
  }

  const commitViewState = (nextRotation = rotationRef.current, nextZoom = zoomRef.current) => {
    if (renderFrameRef.current !== null) {
      window.cancelAnimationFrame(renderFrameRef.current)
      renderFrameRef.current = null
    }

    rotationRef.current = nextRotation
    zoomRef.current = nextZoom
    pendingViewRef.current = { rotation: nextRotation, zoom: nextZoom }
    setRotation(nextRotation)
    setZoom(nextZoom)
  }

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

  useEffect(() => () => {
    if (renderFrameRef.current !== null) {
      window.cancelAnimationFrame(renderFrameRef.current)
    }
  }, [])

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
      commitViewState(
        { x: selectedCountry.lat, y: selectedCountry.lng },
        isTouchDevice ? MOBILE_SELECTED_ZOOM : DESKTOP_SELECTED_ZOOM,
      )
      return
    }

    commitViewState(
      rotationRef.current,
      isTouchDevice
        ? (immersive ? MOBILE_IMMERSIVE_ZOOM : MOBILE_IDLE_ZOOM)
        : (immersive ? DESKTOP_IMMERSIVE_ZOOM : DESKTOP_IDLE_ZOOM),
    )
  }, [immersive, isTouchDevice, selectedCountry])

  useEffect(() => {
    if (immersive || selectedCountry || isInteracting) {
      return undefined
    }

    const id = window.setInterval(() => {
      scheduleViewState({ ...rotationRef.current, y: rotationRef.current.y + 0.14 }, zoomRef.current)
    }, 16)

    return () => window.clearInterval(id)
  }, [immersive, isInteracting, selectedCountry])

  const countryCenterByIso = useMemo(() => {
    const usedCenters = new Set()
    const entries = countries.map((country) => {
      const matchingFeature = countryFeatures.find((shape) => geoContains(shape, [country.lng, country.lat]))
      const [featureLng, featureLat] = matchingFeature ? geoCentroid(matchingFeature) : [country.lng, country.lat]
      const featureKey = `${featureLat.toFixed(3)}:${featureLng.toFixed(3)}`
      const useFeatureCenter = matchingFeature && !usedCenters.has(featureKey)
      const [centerLng, centerLat] = useFeatureCenter
        ? [featureLng, featureLat]
        : [country.lng, country.lat]

      if (useFeatureCenter) {
        usedCenters.add(featureKey)
      }

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

  const countryFeatureByIso = useMemo(() => {
    const usedFeatureIds = new Set()
    const entries = countries.map((country) => {
      const matchingFeature = countryFeatures.find((shape) => geoContains(shape, [country.lng, country.lat]))
      const featureId = matchingFeature?.id ?? null
      const useFeature = matchingFeature && featureId !== null && !usedFeatureIds.has(featureId)

      if (useFeature) {
        usedFeatureIds.add(featureId)
      }

      return [country.iso, useFeature ? matchingFeature : null]
    })

    return Object.fromEntries(entries)
  }, [countries])

  const countryByIso = useMemo(() => Object.fromEntries(countries.map((country) => [country.iso, country])), [countries])

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

  const projectedCountryShapes = useMemo(
    () =>
      projectedCountries
        .map((country) => {
          const featureShape = countryFeatureByIso[country.iso]
          const shapePath = featureShape ? path(featureShape) : null

          if (!country.visible || !shapePath) {
            return null
          }

          return {
            country,
            shapePath,
          }
        })
        .filter(Boolean),
    [countryFeatureByIso, path, projectedCountries],
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
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const tappedCountryIso = event.target.closest?.('[data-country-iso]')?.dataset.countryIso ?? null
    tapRef.current = {
      countryIso: tappedCountryIso,
      moved: false,
      pointerId: event.pointerId,
    }

    if (activePointersRef.current.size === 2) {
      event.currentTarget.setPointerCapture(event.pointerId)
      const [firstPointer, secondPointer] = [...activePointersRef.current.values()]
      pinchRef.current = {
        active: true,
        distance: getPointerDistance(firstPointer, secondPointer),
        zoom: zoomRef.current,
      }
      dragRef.current.active = false
      dragRef.current.pointerId = null
      setIsInteracting(true)
      return
    }

    dragRef.current = {
      active: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rotationX: rotationRef.current.x,
      rotationY: rotationRef.current.y,
    }
  }

  const handlePointerMove = (event) => {
    if (!activePointersRef.current.has(event.pointerId)) {
      return
    }

    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pinchRef.current.active && activePointersRef.current.size >= 2) {
      const [firstPointer, secondPointer] = [...activePointersRef.current.values()]
      const distance = getPointerDistance(firstPointer, secondPointer)

      if (pinchRef.current.distance > 0) {
        const zoomRatio = distance / pinchRef.current.distance
        scheduleViewState(
          rotationRef.current,
          clamp(pinchRef.current.zoom * zoomRatio, MIN_ZOOM, MAX_ZOOM),
        )
      }

      return
    }

    if (dragRef.current.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - dragRef.current.startX
    const deltaY = event.clientY - dragRef.current.startY
    const rotationMultiplierX = isTouchDevice ? MOBILE_ROTATION_MULTIPLIER_X : DESKTOP_ROTATION_MULTIPLIER_X
    const rotationMultiplierY = isTouchDevice ? MOBILE_ROTATION_MULTIPLIER_Y : DESKTOP_ROTATION_MULTIPLIER_Y

    if (Math.hypot(deltaX, deltaY) > TAP_SELECTION_THRESHOLD) {
      tapRef.current.moved = true
    }

    if (!dragRef.current.active) {
      if (!tapRef.current.moved) {
        return
      }

      event.currentTarget.setPointerCapture(event.pointerId)
      dragRef.current.active = true
      setIsInteracting(true)
    }

    scheduleViewState({
      x: clamp(dragRef.current.rotationX + deltaY * rotationMultiplierX, -70, 70),
      y: dragRef.current.rotationY - deltaX * rotationMultiplierY,
    }, zoomRef.current)
  }

  const handlePointerUp = (event) => {
    const shouldSelectTappedCountry =
      tapRef.current.pointerId === event.pointerId &&
      tapRef.current.countryIso &&
      !tapRef.current.moved &&
      !pinchRef.current.active

    activePointersRef.current.delete(event.pointerId)
    pinchRef.current.active = false

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (activePointersRef.current.size === 1) {
      const [[remainingPointerId, remainingPointer]] = [...activePointersRef.current.entries()]
      dragRef.current = {
        active: false,
        pointerId: remainingPointerId,
        startX: remainingPointer.x,
        startY: remainingPointer.y,
        rotationX: rotationRef.current.x,
        rotationY: rotationRef.current.y,
      }
      tapRef.current = { countryIso: null, moved: false, pointerId: remainingPointerId }
      return
    }

    dragRef.current.active = false
    dragRef.current.pointerId = null
    setIsInteracting(false)

    if (shouldSelectTappedCountry) {
      const tappedCountry = countryByIso[tapRef.current.countryIso]

      if (tappedCountry) {
        onCountryClick(tappedCountry)
      }
    }

    tapRef.current = { countryIso: null, moved: false, pointerId: null }
  }

  const handleWheel = (event) => {
    event.preventDefault()
    onFirstInteract?.()
    scheduleViewState(
      rotationRef.current,
      clamp(zoomRef.current - event.deltaY * 0.0038, MIN_ZOOM, MAX_ZOOM),
    )
  }

  const handleCountryHoverStart = (country) => {
    if (isTouchDevice) {
      return
    }

    setHovered({ label: country.name, detail: country.iso, countryIso: country.iso })
  }

  const handleCountryHoverEnd = () => {
    if (isTouchDevice) {
      return
    }

    setHovered(null)
  }

  const handleArcHoverStart = (flow) => {
    if (isTouchDevice) {
      return
    }

    setHovered({
      label: `${flow.exporter} to ${flow.importer}`,
      detail: `${flow.commodityLabel ?? flow.commodity} · ${formatCompactCurrency(flow.valueUsd)}`,
    })
  }

  return (
    <div
      className={`trade-globe ${isInteracting ? 'is-interacting' : ''}`}
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
            {projectedCountryShapes.map(({ country, shapePath }) => (
              <path
                key={`hit-${country.iso}`}
                className={`trade-country-hit-area ${selectedCountry?.iso === country.iso ? 'is-selected' : ''}`}
                data-country-iso={country.iso}
                d={shapePath}
                onMouseEnter={() => handleCountryHoverStart(country)}
                onMouseLeave={handleCountryHoverEnd}
              />
            ))}
            {projectedArcs.map((flow) => (
              <path
                key={flow.id}
                className="trade-arc"
                d={flow.path}
                stroke={TRADE_CATEGORY_COLORS[flow.colorKey] ?? '#ffffff'}
                strokeWidth={1.1}
                onMouseEnter={() => handleArcHoverStart(flow)}
                onMouseLeave={handleCountryHoverEnd}
              />
            ))}
            {projectedCountries.map((country) =>
              country.visible ? (
                <g
                  key={country.iso}
                  className="trade-country-node"
                  data-country-iso={country.iso}
                  transform={`translate(${country.x}, ${country.y})`}
                  onMouseEnter={() => handleCountryHoverStart(country)}
                  onMouseLeave={handleCountryHoverEnd}
                >
                  <circle
                    className={`trade-country-dot ${selectedCountry?.iso === country.iso ? 'is-selected' : ''}`}
                    r={selectedCountry?.iso === country.iso ? 7.2 : isTouchDevice ? 4.8 : 4.4}
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

      {hovered && !isTouchDevice ? (
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
