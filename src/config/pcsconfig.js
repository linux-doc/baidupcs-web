var host = location.host;

export default {
    base_url: '/', //production
    ws_url: 'ws://' + host + '/ws', //production

    // base_url: 'http://127.0.0.1:8081/', //develop
    // ws_url: 'ws://127.0.0.1:8081/ws', //develop
};