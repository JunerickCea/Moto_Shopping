import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import '@/styles/index.css'
import '@/styles/app.css'

import vuetify from './plugins/vuetify'
import './assets/main.css'
import { setUnauthorizedHandler } from './services/api'
import { useMainStore } from './stores/mainStore'

const pinia = createPinia()

setUnauthorizedHandler(() => {
  useMainStore(pinia).user = null
  router.push({ name: 'Login' })
})

createApp(App)
.use(pinia)
.use(router)
.use(vuetify)
.mount('#app')
