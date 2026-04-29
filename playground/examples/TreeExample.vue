<script setup lang="ts">
import { ref } from 'vue'
import { VTreeSelect } from '@'

defineProps<{ theme: 'light' | 'dark' | 'auto' }>()

interface Category {
  id: number
  name: string
  slug: string
  children: Category[]
}

// Three-level tree — the exact shape the user is feeding the component.
const categories: Category[] = [
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

// Same data, but flat (the user's first example) — every node has children: [].
const flatCategories: Category[] = [
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

const selectedTree = ref<number[]>([4, 8])
const selectedFlat = ref<number[]>([])
</script>

<template>
  <article class="card">
    <h2>Tree — checkbox select</h2>
    <p>
      Multi-level categories. Tick a parent to select all leaves under it, tick leaves individually
      for partial coverage. Search filters across every level and reveals matches.
    </p>
    <VTreeSelect
      v-model="selectedTree"
      :options="categories"
      option-value="id"
      option-label="name"
      option-children="children"
      :theme="theme"
      placeholder="Pick categories"
      :max-visible-tags="3"
    />
    <pre>{{ JSON.stringify({ selectedTree }, null, 2) }}</pre>
  </article>

  <article class="card">
    <h2>Tree — flat (children: [])</h2>
    <p>
      The same component handles your flat list — when no node has children, it renders as a plain
      checkbox list.
    </p>
    <VTreeSelect
      v-model="selectedFlat"
      :options="flatCategories"
      option-value="id"
      option-label="name"
      option-children="children"
      :theme="theme"
      placeholder="Pick frameworks"
    />
    <pre>{{ JSON.stringify({ selectedFlat }, null, 2) }}</pre>
  </article>
</template>
