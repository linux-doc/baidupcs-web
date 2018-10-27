import Vue from 'vue'
import Vuex from 'vuex'
import config from './config'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    login: false,
    user: {},
    globals: {
      pending_download_data: [],
      send_download_signal: false,
      pending_upload_data: [],
      send_upload_signal: 0,
      press_back_key: false,
      share_refresh: false,
      pending_download: [],
      downloading: [],
      downloaded: [],
      pending_upload: [],
      uploading: [],
      uploaded: []
    },
    websocket: null
  },
  mutations: {
    setUserInfo(state, payload) {
      state.login = payload.login
      state.user = payload.user
    },
    initWS(state) {
      const websocket = new WebSocket(config.ws_url)
      websocket.onopen = () => console.log("WebSocket连接成功")
      websocket.onerror = () => console.log("WebSocket连接发生错误")
      websocket.onclose = (e) => console.log(`connection closed (${e})`)
      state.websocket = websocket
    }
  },
  actions: {
    async init({commit}) {
      let user, login = false
      const body = await $axios.get('user')
      if (body.status === 200 && body.data && body.data.code === 0) {
        user = body.data.data
        login = true
      } else {
        user = {}
      }
      commit('setUserInfo', { user, login })
      return true
    }
  }
})
