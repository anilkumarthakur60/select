// Shared data for playground examples.

export const fruits = ['Apple', 'Banana', 'Cherry', 'Durian', 'Elderberry', 'Fig', 'Grape']

export interface Country {
  code: string
  name: string
  region: string
}

export const countries: Country[] = [
  { code: 'us', name: 'United States', region: 'Americas' },
  { code: 'ca', name: 'Canada', region: 'Americas' },
  { code: 'br', name: 'Brazil', region: 'Americas' },
  { code: 'fr', name: 'France', region: 'Europe' },
  { code: 'de', name: 'Germany', region: 'Europe' },
  { code: 'gb', name: 'United Kingdom', region: 'Europe' },
  { code: 'jp', name: 'Japan', region: 'Asia' },
  { code: 'in', name: 'India', region: 'Asia' },
  { code: 'sg', name: 'Singapore', region: 'Asia' },
  { code: 'au', name: 'Australia', region: 'Oceania' },
  { code: 'nz', name: 'New Zealand', region: 'Oceania' },
]

export interface User {
  id: number
  name: string
  email: string
}

export const plans = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
  { value: 'enterprise', label: 'Enterprise', disabled: true },
]

export function flagFor(code: string): string {
  if (!code) return ''
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}
