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

export interface Category {
  id: number
  name: string
  slug: string
  children: Category[]
}

// Three-level tree  same dataset the Vue playground uses, lifted to /shared
// so React/Svelte/Solid/WC playgrounds can render the same example.
export const categories: Category[] = [
  {
    id: 1,
    name: 'Web Development',
    slug: 'web-development',
    children: [
      {
        id: 2,
        name: 'Frontend Development',
        slug: 'frontend-development',
        children: [
          {
            id: 3,
            name: 'HTML, CSS & UI Frameworks',
            slug: 'html-css-ui-frameworks',
            children: [],
          },
          {
            id: 4,
            name: 'JavaScript & Frontend Frameworks',
            slug: 'javascript-frontend-frameworks',
            children: [],
          },
          {
            id: 5,
            name: 'JavaScript & Backend Frameworks',
            slug: 'javascript-backend-frameworks',
            children: [],
          },
        ],
      },
      {
        id: 6,
        name: 'Backend Development',
        slug: 'backend-development',
        children: [
          { id: 7, name: 'PHP, SQL & APIs', slug: 'php-sql-apis', children: [] },
          { id: 8, name: 'Laravel & Ecosystem', slug: 'laravel-ecosystem', children: [] },
        ],
      },
    ],
  },
  {
    id: 9,
    name: 'DevOps',
    slug: 'devops',
    children: [
      {
        id: 10,
        name: 'Infrastructure & Containers',
        slug: 'infrastructure-containers',
        children: [
          {
            id: 11,
            name: 'Docker & Server Management',
            slug: 'docker-server-management',
            children: [],
          },
          { id: 12, name: 'AWS, Forge & Vapor', slug: 'aws-forge-vapor', children: [] },
        ],
      },
      {
        id: 13,
        name: 'CI/CD & Automation',
        slug: 'ci-cd-automation',
        children: [
          { id: 14, name: 'CI/CD Pipelines', slug: 'ci-cd-pipelines', children: [] },
          { id: 15, name: 'Monitoring & Debugging', slug: 'monitoring-debugging', children: [] },
        ],
      },
    ],
  },
  {
    id: 16,
    name: 'Quality Assurance',
    slug: 'quality-assurance',
    children: [
      {
        id: 17,
        name: 'PHP Testing',
        slug: 'php-testing',
        children: [
          { id: 18, name: 'PHPUnit', slug: 'phpunit', children: [] },
          { id: 19, name: 'Pest', slug: 'pest', children: [] },
        ],
      },
      {
        id: 20,
        name: 'JS Testing',
        slug: 'js-testing',
        children: [
          { id: 21, name: 'Jest', slug: 'jest', children: [] },
          { id: 22, name: 'Cypress', slug: 'cypress', children: [] },
          { id: 23, name: 'Playwright', slug: 'playwright', children: [] },
        ],
      },
    ],
  },
]

// Same data, but flat  every node has children: []. Renders as a plain checkbox list.
export const flatCategories: Category[] = [
  { id: 3, name: 'HTML, CSS & UI Frameworks', slug: 'html-css-ui-frameworks', children: [] },
  {
    id: 4,
    name: 'JavaScript & Frontend Frameworks',
    slug: 'javascript-frontend-frameworks',
    children: [],
  },
  {
    id: 5,
    name: 'JavaScript & Backend Frameworks',
    slug: 'javascript-backend-frameworks',
    children: [],
  },
]
