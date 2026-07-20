import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { VueSelectPlugin } from '@anil-labs/select-vue'
import '@anil-labs/select-core/styles.css'
import './style.css'

// Register `<VSelect>` and `<VTreeSelect>` globally so every `.md` page can
// drop them into a code fence's preview block without an explicit import.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(VueSelectPlugin)
  },
} satisfies Theme
