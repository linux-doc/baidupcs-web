const wsProtocol = location.protocol === 'http:' ? 'ws:' : 'wss:'
let base_url = location.origin, ws_url = `${wsProtocol}//${location.host}/ws`

if (process.env.NODE_ENV === 'development') {
  base_url = 'http://127.0.0.1:5299'
  ws_url = 'ws://127.0.0.1:5299/ws'
}

export default {
  base_url,
  ws_url
}

