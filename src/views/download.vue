<template>
    <Layout>
        <Sider hide-trigger :style="{background: '#fff'}">
            <Menu theme="light" width="auto" :open-names="['1']" active-name="select_menu_name"
                  @on-select="getMenuName">
                <Submenu name="1">
                    <template slot="title">
                        <Icon type="ios-navigate"></Icon>
                        我的下载
                    </template>
                    <MenuItem name="1-1">正在下载</MenuItem>
                    <MenuItem name="1-2">已经完成</MenuItem>
                </Submenu>
                <Submenu name="2">
                    <template slot="title">
                        <Icon type="ios-keypad"></Icon>
                        离线下载
                    </template>
                    <MenuItem name="2-1">Option 1</MenuItem>
                    <MenuItem name="2-2">Option 2</MenuItem>
                </Submenu>
            </Menu>
        </Sider>
        <Layout :style="{padding: '0 24px 24px'}">
            <Card :bordered="false" style="margin-top: 16px" v-for="item in downloading"
                  v-if="select_menu_name === '1-1'">
                <p slot="title">{{item.name}}
                    <Divider type="vertical"/>
                    {{item.total_size}}
                </p>
                <Row>
                    <Col span="12">
                        <Progress :percent="item.percent" status="active"/>
                    </Col>
                    <Col span="10" offset="2">
                        <p>
                            速度: {{item.speed}}/s
                            <Divider type="vertical"/>
                            已经下载: {{item.download_size}}
                            <Divider type="vertical"/>
                            已用时间: {{item.time_used}}
                            <Divider type="vertical"/>
                            预计还需: {{item.time_left}}
                        </p>
                    </Col>
                </Row>
            </Card>
            <Card :bordered="false" style="margin-top: 16px" v-for="item in pending_download"
                  v-if="select_menu_name === '1-1'">
                <p slot="title">{{item.name}}
                    <Divider type="vertical"/>
                    等待下载...
                </p>
                <Row>
                    <Col span="12">
                        <Progress :percent="item.percent" status="active"/>
                    </Col>
                    <Col span="10" offset="2">
                        <p>
                            速度: {{item.speed}}/s
                            <Divider type="vertical"/>
                            已经下载: {{item.download_size}}
                            <Divider type="vertical"/>
                            已用时间: {{item.time_used}}
                            <Divider type="vertical"/>
                            预计还需: {{item.time_left}}
                        </p>
                    </Col>
                </Row>
            </Card>
            <Card :bordered="false" style="margin-top: 16px" v-for="item in downloaded"
                  v-if="select_menu_name === '1-2'">
                <p slot="title">{{item.name}}
                    <Divider type="vertical"/>
                    {{item.total_size}}
                </p>
                <Row>
                    <Col span="12">
                        <Progress :percent="item.percent" status="active"/>
                    </Col>
                    <Col span="10" offset="2">
                        <p>
                            已经下载: {{item.download_size}}
                            <Divider type="vertical"/>
                            平均速度: {{item.avg_speed}}/s
                            <Divider type="vertical"/>
                            已用时间: {{item.time_used}}
                        </p>
                    </Col>
                </Row>
            </Card>
        </Layout>
    </Layout>
</template>

<script>
    export default {
        name: "download",
        data() {
            return {
                select_menu_name: "1-1",
                ws_url: 'ws://127.0.0.1:8081/ws',
                websocket: null,
                pending_download: [],
                downloading: [
                    // {
                    //     lastID: 1,
                    //     download_size: "585.94KB",
                    //     total_size: "18.43MB",
                    //     speed: "5.37KB",
                    //     time_used: "1s",
                    //     time_left: "56m46s",
                    //     percent: 0.03,
                    //     name: "kanong",
                    //     path: "./kanong",
                    //     status: 1,
                    // }
                ],
                downloaded: []
            }
        },
        props: ['pending_download_data'],
        watch: {
            pending_download_data: {
                handler(cur_val) {
                    if (cur_val.length === 0)
                        return;

                    // console.log(cur_val);
                    for (let i = 0; i < cur_val.length; i++) {
                        if (this.indexPendingDownloadList(cur_val[i]) !== -1) {
                            console.log("hahah");
                            continue;
                        }

                        let fd_names = cur_val[i].split("/");
                        this.pending_download.push({
                            lastID: 0,
                            path: cur_val[i],
                            name: fd_names[fd_names.length - 1],
                            speed: "0KB",
                            time_used: "0s",
                            download_size: "0KB",
                            total_size: "--KB",
                            time_left: "--s",
                            percent: 0,
                            status: 0,
                        })
                    }

                    var send_json = {
                        "type": 2,
                        "paths": this.pending_download_data
                    };
                    this.websocket.send(JSON.stringify(send_json));

                    while (this.pending_download_data.length > 0) {
                        this.pending_download_data.pop()
                    }
                }
            }
        },
        methods: {
            getMenuName(name) {
                this.select_menu_name = name;
            },
            initWebSocket() { //初始化websocket
                this.websocket = new WebSocket(this.ws_url);
                this.websocket.onopen = this.websocketonopen;
                this.websocket.onerror = this.websocketonerror;
                this.websocket.onclose = this.websocketclose;
                this.websocket.onmessage = this.websocketonmessage;
            },
            websocketonopen() {
                console.log("WebSocket连接成功");
            },
            websocketonerror(e) { //错误
                console.log("WebSocket连接发生错误");
            },
            websocketclose(e) { //关闭
                console.log("connection closed (" + e + ")");
            },

            websocketonmessage(e) { //数据接收
                const redata = JSON.parse(e.data);
                if (redata.code !== 0) {
                    this.$Message.error({
                        content: redata.msg,
                        duration: 10,
                        closable: true
                    });
                }
                if (redata.type === 2) {
                    var data = redata.data.replace(/\\/g, '/');
                    data = JSON.parse(data);
                    if (redata.status === 1) {
                        var index = this.indexPendingDownloadList(data.path);
                        if (index > -1) {
                            this.pending_download.splice(index, 1);
                        }

                        var fd_names = data.path.split("/");
                        this.downloading.push({
                            lastID: data.lastID,
                            path: data.path,
                            name: fd_names[fd_names.length - 1],
                            speed: "0KB",
                            avg_speed: "0KB",
                            time_used: "0s",
                            download_size: "0KB",
                            total_size: "--KB",
                            time_left: "--s",
                            percent: 0,
                            status: redata.status,
                        })
                    }
                    if (redata.status === 2) {
                        this.removeDownloadingList(data.path);
                    }
                    if (redata.status === 5) {
                        for (let i = 0; i < this.downloading.length; i++) {
                            let ditem = this.downloading[i];
                            if (ditem.lastID === data.lastID) {
                                ditem.speed = data.speed;
                                ditem.avg_speed = data.avg_speed;
                                ditem.time_used = data.time_used;
                                ditem.download_size = data.download_size;
                                ditem.total_size = data.total_size;
                                ditem.time_left = data.time_left;
                                ditem.percent = data.percent;
                                ditem.status = redata.status;
                            }
                        }
                    }
                    if (redata.status === 6) {
                        for (let i = 0; i < this.downloading.length; i++) {
                            let ditem = this.downloading[i];
                            if (ditem.lastID === data.lastID) {
                                this.downloaded.push({
                                    lastID: ditem.lastID,
                                    path: ditem.path,
                                    name: ditem.name,
                                    speed: ditem.speed,
                                    avg_speed: ditem.avg_speed,
                                    time_used: ditem.time_used,
                                    download_size: ditem.download_size,
                                    total_size: ditem.total_size,
                                    time_left: "0s",
                                    percent: 100,
                                    status: redata.status,
                                });
                                this.downloading.splice(i, 1);
                            }
                        }
                    }
                }
                console.log(redata);
            },
            indexPendingDownloadList(path) {
                for (let i = 0; i < this.pending_download.length; i++) {
                    if (path === this.pending_download[i].path) {
                        return i;
                    }
                }
                return -1;
            },
            removeDownloadingList(path) {
                for (let i = 0; i < this.downloading.length; i++) {
                    if (path === this.downloading[i].path) {
                        this.downloading.splice(i, 1);
                    }
                }
            },
        },
        mounted() {
            this.initWebSocket()
        }
    }
</script>

<style scoped>

</style>