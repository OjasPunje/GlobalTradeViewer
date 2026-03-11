export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function handleOptions(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }

  return false
}

export function methodNotAllowed(res) {
  setCors(res)
  res.status(405).json({ error: 'Method not allowed' })
}

export function json(res, status, payload) {
  setCors(res)
  res.status(status).json(payload)
}

export function internalError(res, error) {
  json(res, 500, {
    error: error instanceof Error ? error.message : 'Internal server error',
  })
}
