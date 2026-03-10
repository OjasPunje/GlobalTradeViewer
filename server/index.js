import http from 'node:http'
import { handleCountries } from './routes/countryRoutes.js'
import {
  handleTradeCountryProfile,
  handleTradeFlows,
  handleTradeYears,
} from './routes/tradeRoutes.js'

const port = Number(process.env.API_PORT ?? 8787)

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

const server = http.createServer(async (request, response) => {
  setCorsHeaders(response)

  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host}`)

  try {
    if (request.method === 'GET' && url.pathname === '/api/trade/flows') {
      await handleTradeFlows(request, response, url)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/trade/country-profile') {
      await handleTradeCountryProfile(request, response, url)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/trade/years') {
      await handleTradeYears(request, response, url)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/countries') {
      await handleCountries(request, response, url)
      return
    }

    response.writeHead(404, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: 'Not found' }))
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'application/json' })
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    )
  }
})

server.listen(port, () => {
  console.log(`Trade API listening on http://localhost:${port}`)
})
