import Vue from 'vue'
import Vuex from 'vuex'
import config from './config'

Vue.use(Vuex)

function receiveData(e, state) {
  const redata = JSON.parse(e.data)
  if (redata.code !== 0) {
    Vue.prototype.$Message.error({
      content: redata.msg,
      duration: 10,
      closable: true
    })
  }

  let pos = 0
  let ditem = {}
  const data = JSON.parse(redata.data.replace(/\\/g, '/'))

  //下载任务
  if (redata.type === 2) {
    switch (redata.status) {
        //添加到下载任务列表
      case 1: {
        let fd_names = data.path.split('/')
        state.globals.downloading.push({
          LastID: data.LastID,
          path: data.path,
          name: fd_names.pop(),
          speed: '0KB',
          avg_speed: '0KB',
          time_used: '0s',
          download_size: '0KB',
          total_size: '--KB',
          time_left: '--s',
          percent: 0,
          is_pause: false,
          status: redata.status
        })
        break
      }
      case 2:
        for (let i = 0; i < state.globals.downloading.length; i++) {
          if (data.path === state.globals.downloading[i].path) {
            state.globals.downloading.splice(i, 1)
            break
          }
        }
        break
      case 5: //正在下载
        ditem = state.globals.downloading.find(item => item.LastID === data.LastID)
        if (!ditem.is_pause) {
          ditem.speed = data.speed
          ditem.avg_speed = data.avg_speed
          ditem.time_used = data.time_used
          ditem.download_size = data.download_size
          ditem.total_size = data.total_size
          ditem.time_left = data.time_left
          ditem.percent = data.percent
          ditem.status = redata.status
        }
        break
      case 6: //任务暂停
        ditem = state.globals.downloading.find(item => item.LastID === data.LastID)
        ditem.is_pause = true
        ditem.speed = '0KB'
        ditem.avg_speed = '0KB'
        ditem.time_left = '--s'
        ditem.status = redata.status
        break
      case 7: //任务恢复
        ditem = state.globals.downloading.find(item => item.LastID === data.LastID)
        ditem.is_pause = false
        ditem.status = redata.status
        break
      case 8: //任务删除
        pos = state.globals.downloading.findIndex(item => item.LastID === data.LastID)
        state.globals.downloading.splice(pos, 1)
        break
      case 9: //任务完成
        pos = state.globals.downloading.findIndex(item => item.LastID === data.LastID)
        if (pos >= 0) {
          ditem = state.globals.downloading[pos]
          state.globals.downloaded.push({
            LastID: ditem.LastID,
            path: ditem.path,
            name: ditem.name,
            speed: ditem.speed,
            avg_speed: ditem.avg_speed,
            time_used: ditem.time_used,
            download_size: ditem.download_size,
            total_size: ditem.total_size,
            time_left: '0s',
            percent: 100,
            status: redata.status,
            save_path: data.savePath
          })
          state.globals.downloading.splice(pos, 1)
        }
        break
    }
  }

  //上传任务
  if (redata.type === 3) {
    switch (redata.status) {
        //添加到上传任务中
      case 1: {
        let fd_names = data.path.split('/')
        state.globals.uploading.push({
          LastID: data.LastID,
          path: data.path,
          name: fd_names.pop(),
          speed: '0KB',
          avg_speed: '0KB',
          time_used: '0s',
          uploaded_size: '0KB',
          total_size: '--KB',
          time_left: '--s',
          percent: 0,
          is_pause: false,
          status: redata.status,
        })
        break
      }
      case 2:
        break
      case 3: //秒传成功
        pos = state.globals.uploading.findIndex(item => item.LastID === data.LastID)
        ditem = state.globals.uploading[pos]
        ditem.percent = 100
        ditem.status = redata.status
        ditem.save_path = data.savePath
        state.globals.uploaded.push(ditem)
        state.globals.uploading.splice(pos, 1)
        break
      case 4: //正在上传
        ditem = state.globals.uploading.find(item => item.LastID === data.LastID)
        ditem.speed = data.speed
        ditem.avg_speed = data.avg_speed
        ditem.time_used = data.time_used
        ditem.uploaded_size = data.uploaded_size
        ditem.total_size = data.total_size
        ditem.time_left = data.time_left
        ditem.percent = data.percent
        ditem.status = redata.status
        break
      case 5: //上传完成
        pos = state.globals.uploading.findIndex(item => item.LastID === data.LastID)
        ditem = state.globals.uploading[pos]
        state.globals.uploaded.push({
          LastID: ditem.LastID,
          path: ditem.path,
          name: ditem.name,
          speed: ditem.speed,
          avg_speed: ditem.avg_speed,
          time_used: ditem.time_used,
          uploaded_size: ditem.uploaded_size,
          total_size: ditem.total_size,
          time_left: '0s',
          percent: 100,
          status: redata.status,
          save_path: data.savePath
        })
        state.globals.uploading.splice(pos, 1)
        break
    }
  }
}

export default new Vuex.Store({
  state: {
    login: false,
    isLock: false,
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
    setIsLock(state, isLock) {
      state.isLock = isLock
    },
    initWS(state) {
      const websocket = new WebSocket(config.ws_url)
      websocket.onopen = () => console.log("WebSocket连接成功")
      websocket.onerror = () => console.log("WebSocket连接发生错误")
      websocket.onclose = (e) => console.log(`connection closed (${e})`)
      websocket.onmessage = (e) => receiveData(e, state)
      state.websocket = websocket
    }
  },
  actions: {
    async init({ commit }) {
      let user, login = false
      const body = await $axios.get('user?method=get')
      if (body.status === 200 && body.data && body.data.code === 0) {
        user = body.data.data
        login = true

        /*const hasLockPwd = await $axios.get('password?method=exist')
        if (hasLockPwd.status === 200 && hasLockPwd.data && hasLockPwd.data.code === 0) {
          if (hasLockPwd.data.data) {
            if (localStorage.lastUnlockTime === undefined || (new Date().getTime() - Number(localStorage.lastUnlockTime) > 86400 * 1000)) {
              commit('setIsLock', true)
            }
          }
        }*/
      } else {
        user = {}
      }
      commit('setUserInfo', { user, login })
      return true
    }
  }
})
