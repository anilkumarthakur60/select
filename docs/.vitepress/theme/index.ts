import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { VueSelectPlugin } from '@anilkumarthakur/vue3-select'
import '@anilkumarthakur/vue3-select/style.css'
import './style.css'

// Register `<VSelect>` and `<VTreeSelect>` globally so every `.md` page can
// drop them into a code fence's preview block without an explicit import.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(VueSelectPlugin)
  },
} satisfies Theme
