<template>
    <Layout>
        <Sider hide-trigger :style="{background: '#fff'}">
            <Menu theme="light" width="auto" :open-names="['1']" :active-name="select_menu_name"
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
        <Modal v-model="modalDetailFlag" draggable title="任务详情" :width="800">
            <Row>
                <Col span="4"><p style="font-size: 14px">任务ID</p></Col>
                <Col span="4"><p style="font-size: 14px">任务状态</p></Col>
                <Col span="4"><p style="font-size: 14px">速度</p></Col>
                <Col span="12"><p style="font-size: 14px">错误信息</p></Col>
            </Row>
            <div style="height: 60vh; overflow-y: auto">
                <Row v-for="item in taskDetail">
                    <Col span="4">
                        <p style="font-size: 14px">{{item.id}}</p>
                    </Col>
                    <Col span="4">
                        <p style="font-size: 14px">{{item.status}}</p>
                    </Col>
                    <Col span="4">
                        <p style="font-size: 14px">{{item.speed}}/s</p>
                    </Col>
                    <Col span="12">
                        <p style="font-size: 14px">{{item.error}}</p>
                    </Col>
                </Row>
            </div>
            <div slot="footer">
                <Button type="info" @click="modalDetailFlag = false">确认</Button>
            </div>
        </Modal>
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
                    <Col span="2">
                        <Button size="small" type="warning" ghost v-if="!item.is_pause"
                                @click="swichDownloadStatus(item)">
                            <Icon type="md-pause"></Icon>
                        </Button>
                        <Button size="small" type="success" ghost v-if="item.is_pause"
                                @click="swichDownloadStatus(item)">
                            <Icon type="md-play"></Icon>
                        </Button>
                        <Button size="small" type="error" ghost @click="cancelTask(item)">
                            <Icon type="md-close"></Icon>
                        </Button>
                        <Button size="small" type="info" ghost @click="detailTask(item)">
                            <Icon type="md-barcode"></Icon>
                        </Button>
                    </Col>
                    <Col span="10">
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
                    <Col span="8">
                        <Progress :percent="item.percent" status="active"/>
                    </Col>
                    <Col span="16">
                        <p>
                            平均速度: {{item.avg_speed}}/s
                            <Divider type="vertical"/>
                            已用时间: {{item.time_used}}
                            <Divider type="vertical"/>
                            保存路径: {{item.save_path}}
                        </p>
                    </Col>
                </Row>
            </Card>
        </Layout>
    </Layout>
</template>

<script>
    import axios from 'axios'
    import CollapseTransition from "iview/src/components/base/collapse-transition";
    export default {
        name: "download",
        components: {CollapseTransition},
        data() {
            return {
                select_menu_name: "1-1",
                base_url: 'http://127.0.0.1:8081/',
                ws_url: 'ws://127.0.0.1:8081/ws',
                websocket: null,
                modalDetailFlag: false,
                taskDetail: [],
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
                    //     is_pause: true,
                    //     status: 1,
                    // },
                    // {
                    //     lastID: 2,
                    //     download_size: "585.94KB",
                    //     total_size: "18.43MB",
                    //     speed: "5.37KB",
                    //     time_used: "1s",
                    //     time_left: "56m46s",
                    //     percent: 0.03,
                    //     name: "kanong",
                    //     path: "./kanong",
                    //     is_pause: false,
                    //     status: 1,
                    // }
                ],
                downloaded: []
            }
        },
        props: ['global_data'],
        watch: {
            'global_data.send_download_signal'(cur_val) {
                if (cur_val === true) {
                    let pending = this.global_data.pending_download_data;
                    for (let i = 0; i < pending.length; i++) {
                        if (this.indexPendingDownloadList(pending[i]) !== -1) {
                            continue;
                        }

                        let fd_names = pending[i].split("/");
                        this.pending_download.push({
                            lastID: 0,
                            path: pending[i],
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
                        "method": "download",
                        "paths": this.global_data.pending_download_data
                    };
                    this.websocket.send(JSON.stringify(send_json));

                    while (pending.length > 0) {
                        pending.pop()
                    }
                    this.global_data.send_download_signal = false;
                }
            },
            'global_data.send_upload_signal'(cur_val) {
                if (cur_val === 2) {
                    let pending = this.global_data.pending_upload_data;
                    console.log(pending);
                    let tpath = pending.shift();
                    var send_json = {
                        "type": 3,
                        "paths": pending,
                        "tpath": tpath
                    };
                    console.log(send_json);
                    this.websocket.send(JSON.stringify(send_json));

                    while (pending.length > 0) {
                        pending.pop()
                    }
                    this.global_data.send_upload_signal = 0;
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
                            lastID: data.LastID,
                            path: data.path,
                            name: fd_names[fd_names.length - 1],
                            speed: "0KB",
                            avg_speed: "0KB",
                            time_used: "0s",
                            download_size: "0KB",
                            total_size: "--KB",
                            time_left: "--s",
                            percent: 0,
                            is_pause: false,
                            status: redata.status,
                        })
                    }
                    if (redata.status === 2) {
                        this.removeDownloadingList(data.path);
                    }
                    if (redata.status === 5) {
                        for (let i = 0; i < this.downloading.length; i++) {
                            let ditem = this.downloading[i];
                            if (ditem.lastID === data.LastID) {
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
                            if (ditem.lastID === data.LastID) {
                                ditem.is_pause = true;
                                ditem.avg_speed = "0KB";
                                ditem.time_left = "--s";
                                ditem.status = redata.status;
                            }
                        }
                    }
                    if (redata.status === 7) {
                        for (let i = 0; i < this.downloading.length; i++) {
                            let ditem = this.downloading[i];
                            if (ditem.lastID === data.LastID) {
                                ditem.is_pause = false;
                                ditem.status = redata.status;
                            }
                        }
                    }
                    if (redata.status === 8) {
                        for (let i = 0; i < this.downloading.length; i++) {
                            let ditem = this.downloading[i];
                            if (ditem.lastID === data.LastID) {
                                this.downloading.splice(i, 1);
                            }
                        }
                    }
                    if (redata.status === 9) {
                        for (let i = 0; i < this.downloading.length; i++) {
                            let ditem = this.downloading[i];
                            if (ditem.lastID === data.LastID) {
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
                                    save_path: data.savePath,
                                });
                                this.downloading.splice(i, 1);
                            }
                        }
                    }
                }
                // console.log(redata);
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
            swichDownloadStatus(item) {
                let method = "";
                if (item.is_pause) {
                    method = "resume";
                } else {
                    method = "pause";
                }
                axios.get(this.base_url + 'api/v1/download?method=' + method + '&id=' + item.lastID)
                    .then(result => {
                        if (result.data.code === 0) {
                            this.$Message.success('操作成功');
                        } else {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10,
                                closable: true
                            });
                        }
                    });
            },
            cancelTask(item) {
                axios.get(this.base_url + 'api/v1/download?method=cancel&id=' + item.lastID)
                    .then(result => {
                        if (result.data.code === 0) {
                            this.$Message.success('操作成功');
                        } else {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10,
                                closable: true
                            });
                        }
                    });
            },
            bytesToSize(bytes) {
                if (bytes === 0) return '0 B';
                var k = 1000, // or 1024
                    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                    i = Math.floor(Math.log(bytes) / Math.log(k));

                return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
            },
            getTaskStatus(id) {
                axios.get(this.base_url + 'api/v1/download?method=status&id=' + id)
                    .then(result => {
                        if (result.data.code === 0) {
                            this.taskDetail = [];
                            let details = result.data.data;
                            for (let i = 0; i < details.length; i++) {
                                let error = "";
                                if (details[i].error !== "<nil>")
                                    error = details[i].error;
                                this.taskDetail.push({
                                    id: details[i].id,
                                    status: details[i].status,
                                    speed: this.bytesToSize(details[i].speed),
                                    error: error,
                                })
                            }
                            if (this.modalDetailFlag) {
                                setTimeout(() => this.getTaskStatus(id), 1000);
                            }
                        } else {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10,
                                closable: true
                            });
                        }
                    });
            },
            detailTask(item) {
                this.getTaskStatus(item.lastID);
                this.modalDetailFlag = true;
            }
        },
        mounted() {
            this.initWebSocket()
        }
    }
</script>

<style scoped>

</style>