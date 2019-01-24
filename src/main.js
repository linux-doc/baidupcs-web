import Vue from 'vue'
import iView from 'iview'
import 'iview/dist/styles/iview.css';
import './less/common.less'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import config from './config'
// import './registerServiceWorker'


if (/Mobi/i.test(navigator.userAgent)) {
    location.href = `${location.origin}/dist_mobile`
}

Vue.use(iView)
Vue.config.productionTip = false

Vue.prototype.error = function(msg) {
  this.$Message.error({
    content: msg
  })
}

window.$axios = axios.create({
  baseURL: `${config.base_url}/api/v1/`
})

store
    .dispatch('init')
    .then(() => {
      new Vue({
        router,
        store,
        render: h => h(App)
      }).$mount('#app')
    })


// import XParticles from 'x-particles'
// Vue.use(XParticles);
