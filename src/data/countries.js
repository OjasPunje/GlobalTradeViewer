export const countries = [
  { iso: 'USA', name: 'United States', lat: 38.0, lng: -97.0 },
  { iso: 'CHN', name: 'China', lat: 35.0, lng: 103.0 },
  { iso: 'IND', name: 'India', lat: 20.0, lng: 78.0 },
  { iso: 'DEU', name: 'Germany', lat: 51.0, lng: 10.0 },
  { iso: 'BRA', name: 'Brazil', lat: -14.0, lng: -51.0 },
  { iso: 'JPN', name: 'Japan', lat: 36.0, lng: 138.0 },
  { iso: 'KOR', name: 'South Korea', lat: 36.5, lng: 127.8 },
  { iso: 'SAU', name: 'Saudi Arabia', lat: 24.0, lng: 45.0 },
  { iso: 'AUS', name: 'Australia', lat: -25.0, lng: 133.0 },
  { iso: 'GBR', name: 'United Kingdom', lat: 54.0, lng: -2.0 },
]

export const countryByIso = Object.fromEntries(countries.map((country) => [country.iso, country]))
