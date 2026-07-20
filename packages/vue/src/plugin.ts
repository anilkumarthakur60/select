import type { App, Plugin } from 'vue'
import VSelect from '@/components/VSelect'
import VSelectOption from '@/components/VSelectOption'
import VSelectTag from '@/components/VSelectTag'
import VTreeSelect from '@/components/VTreeSelect'

export interface VueSelectPluginOptions {
  /** Override the global tag for `<VSelect>` (default: 'VSelect'). */
  name?: string
  /** Override the global tag for `<VTreeSelect>` (default: 'VTreeSelect'). */
  treeName?: string
  /** Skip registering `<VTreeSelect>` to drop it from the runtime cost. */
  registerTree?: boolean
  /** Register `VSelectOption` and `VSelectTag` globally too (default: false). */
  registerInternals?: boolean
}

/**
 * Optional plugin entry — `app.use(VueSelectPlugin)` registers `<VSelect />`
 * and `<VTreeSelect />` globally. Most consumers should prefer the named
 * import for tree-shaking; the plugin is most useful in app shells where
 * components are referenced from runtime templates.
 */
export const VueSelectPlugin: Plugin<[VueSelectPluginOptions?]> = {
  install(app: App, options: VueSelectPluginOptions = {}) {
    app.component(options.name ?? 'VSelect', VSelect)
    if (options.registerTree !== false) {
      app.component(options.treeName ?? 'VTreeSelect', VTreeSelect)
    }
    if (options.registerInternals) {
      app.component('VSelectOption', VSelectOption)
      app.component('VSelectTag', VSelectTag)
    }
  },
}
