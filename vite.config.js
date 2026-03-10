import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleCountries } from './server/routes/countryRoutes.js'
import {
  handleTradeCountryProfile,
  handleTradeFlows,
  handleTradeYears,
} from './server/routes/tradeRoutes.js'

function tradeApiPlugin() {
  return {
    name: 'trade-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith('/api/')) {
          next()
          return
        }

        const url = new URL(request.url, 'http://localhost:5173')

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
            await handleTradeYears(request, response)
            return
          }

          if (request.method === 'GET' && url.pathname === '/api/countries') {
            await handleCountries(request, response)
            return
          }

          response.statusCode = 404
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: 'Not found' }))
        } catch (error) {
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json')
          response.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Internal server error',
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tradeApiPlugin()],
})
