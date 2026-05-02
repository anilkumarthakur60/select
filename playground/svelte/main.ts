import { mount } from 'svelte'
import App from './App.svelte'
import '@/styles/index.scss'

mount(App, { target: document.getElementById('app')! })
