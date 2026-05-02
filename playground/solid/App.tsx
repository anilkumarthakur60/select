import { createMemo, createSignal, type JSX } from 'solid-js'
import BasicExample from './examples/BasicExample'
import MultiExample from './examples/MultiExample'
import TagsExample from './examples/TagsExample'
import AsyncExample from './examples/AsyncExample'
import CustomRenderExample from './examples/CustomRenderExample'
import SizesExample from './examples/SizesExample'
import TreeExample from './examples/TreeExample'

export type Theme = 'light' | 'dark' | 'auto'

export default function App(): JSX.Element {
  const [theme, setTheme] = createSignal<Theme>('light')
  const themeStyle = createMemo(() => ({
    background: theme() === 'dark' ? '#0b1220' : '#f8fafc',
    color: theme() === 'dark' ? '#e2e8f0' : '#0f172a',
  }))

  return (
    <main style={themeStyle()}>
      <header>
        <div class="brand">
          <span class="logo">▲</span>
          <h1>@anilkumarthakur/select · Solid</h1>
          <span class="tag">v0.0.1</span>
        </div>
        <p class="lead">
          Headless Solid adapter — drop-in <code>Select.tsx</code> example included. Backed by the
          framework-agnostic core.
        </p>
        <label class="theme-switch">
          Theme
          <select value={theme()} onChange={(e) => setTheme(e.currentTarget.value as Theme)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </label>
      </header>

      <section class="grid">
        <div class="single-row">
          <BasicExample theme={theme()} />
        </div>
        <div class="single-row">
          <MultiExample theme={theme()} />
        </div>
        <div class="single-row">
          <TagsExample theme={theme()} />
        </div>
        <div class="single-row">
          <AsyncExample theme={theme()} />
        </div>
        <div class="single-row">
          <CustomRenderExample theme={theme()} />
        </div>
        <div class="single-row">
          <SizesExample theme={theme()} />
        </div>
        <div class="single-row">
          <TreeExample theme={theme()} />
        </div>
      </section>

      <footer>
        <p>
          Press <kbd>↓</kbd>/<kbd>↑</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to
          close, <kbd>⌫</kbd> to remove the last tag.
        </p>
      </footer>

      <style>{playgroundCss}</style>
    </main>
  )
}

const playgroundCss = `
  :root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
  * { box-sizing: border-box; }
  body { margin: 0; }
  main { width: 100vw; min-height: 100vh; padding: 48px 32px 80px; transition: background 200ms ease, color 200ms ease; }
  header { margin: 0 0 40px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand .logo { font-size: 22px; color: #6366f1; }
  .brand h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
  .brand .tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #4338ca; font-weight: 600; }
  .lead { margin: 12px 0 0; max-width: 620px; opacity: 0.75; line-height: 1.55; }
  .theme-switch { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; font-size: 13px; opacity: 0.85; }
  .theme-switch select { padding: 4px 8px; border-radius: 6px; border: 1px solid currentColor; background: transparent; color: inherit; }
  .grid { display: flex; flex-direction: column; gap: 20px; }
  .single-row { width: 100%; }
  .card { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(6px); border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
  .card h2 { margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.7; }
  .card p { margin: 0; font-size: 13px; opacity: 0.7; line-height: 1.5; }
  .card pre { margin: 0; padding: 10px 12px; font-size: 12px; background: rgba(15, 23, 42, 0.05); border-radius: 8px; overflow-x: auto; font-family: 'SFMono-Regular', Menlo, monospace; }
  .stack { display: flex; flex-direction: column; gap: 8px; }
  footer { margin: 60px 0 0; font-size: 13px; opacity: 0.65; }
  kbd { font-family: inherit; font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(15, 23, 42, 0.08); border: 1px solid rgba(15, 23, 42, 0.12); }
  code { font-family: 'SFMono-Regular', Menlo, monospace; font-size: 0.92em; padding: 1px 5px; border-radius: 4px; background: rgba(15, 23, 42, 0.06); }
  .flag { font-size: 1.2em; line-height: 1; margin-right: 8px; }
`
