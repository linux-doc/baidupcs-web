<template>
    <Layout>
        <Sider hide-trigger :style="{background: '#fff'}">
            <Menu theme="light" width="auto" :open-names="['1']" :active-name="select_menu_name"
                  @on-select="getMenuName">
                <Submenu name="1">
                    <template slot="title">
                        <Icon type="ios-cloud-download"></Icon>
                        我的下载
                    </template>
                    <MenuItem name="1-1">正在下载</MenuItem>
                    <MenuItem name="1-2">已经完成</MenuItem>
                </Submenu>
                <Submenu name="2">
                    <template slot="title">
                        <Icon type="ios-cloud-upload"></Icon>
                        我的上传
                    </template>
                    <MenuItem name="2-1">正在上传</MenuItem>
                    <MenuItem name="2-2">已经完成</MenuItem>
                </Submenu>
                <Submenu name="3">
                    <template slot="title">
                        <Icon type="ios-link" />
                        离线下载
                    </template>
                    <MenuItem name="3-1">正在下载</MenuItem>
                    <MenuItem name="3-2">已经完成</MenuItem>
                </Submenu>
            </Menu>
        </Sider>
        <Layout :style="{padding: '0 24px 24px'}">
            <!--下载相关-->
            <ProcessItemComponent :items="downloading" itype="1" istatus="2"
                                  v-show="select_menu_name === '1-1'"></ProcessItemComponent>
            <ProcessItemComponent :items="pending_download" itype="1" istatus="1"
                                  v-show="select_menu_name === '1-1'"></ProcessItemComponent>
            <ProcessItemComponent :items="downloaded" itype="1" istatus="3"
                                  v-show="select_menu_name === '1-2'"></ProcessItemComponent>

            <!--上传相关-->
            <ProcessItemComponent :items="uploading" itype="2" istatus="2"
                                  v-show="select_menu_name === '2-1'"></ProcessItemComponent>
            <ProcessItemComponent :items="pending_upload" itype="2" istatus="1"
                                  v-show="select_menu_name === '2-1'"></ProcessItemComponent>
            <ProcessItemComponent :items="uploaded" itype="2" istatus="3"
                                  v-show="select_menu_name === '2-2'"></ProcessItemComponent>
            <div v-show="select_menu_name === '3-1'">
                <Card :bordered="false" style="margin-top: 16px">
                    <Row>
                        <Col span="6">任务名</Col>
                        <Col span="2">大小</Col>
                        <Col span="7">进度</Col>
                        <Col span="3">任务状态</Col>
                        <Col span="4">开始时间</Col>
                        <Col span="2">操作</Col>
                    </Row>
                </Card>
                <Card :bordered="false" style="margin-top: 2px" v-for="item in offline_downloading">
                    <Row>
                        <Col span="6" style="overflow: hidden;white-space: nowrap;">
                            {{item.taskname}}
                        </Col>
                        <Col span="2">{{item.file_size}}</Col>
                        <Col span="7">
                            <Progress :percent="item.percent" status="active"/>
                        </Col>
                        <Col span="3">{{item.status_text}}</Col>
                        <Col span="4">{{item.stime}}</Col>
                        <Col span="2">
                            <Button icon="md-close" type="error" size="small" ghost @click="deleteTask(item)"></Button>
                        </Col>
                    </Row>
                </Card>
            </div>
            <div v-show="select_menu_name === '3-2'">
                <Card :bordered="false" style="margin-top: 16px">
                    <Row>
                        <Col span="6">任务名</Col>
                        <Col span="2">任务状态</Col>
                        <Col span="2">大小</Col>
                        <Col span="8">路径</Col>
                        <Col span="4">完成时间</Col>
                        <Col span="2">操作</Col>
                    </Row>
                </Card>
                <Card :bordered="false" style="margin-top: 2px" v-for="item in offline_downloaded">
                    <Row>
                        <Col span="6" style="overflow: hidden;white-space: nowrap;">
                            {{item.taskname}}
                        </Col>
                        <Col span="2">{{item.status_text}}</Col>
                        <Col span="2">{{item.file_size}}</Col>
                        <Col span="8" style="overflow: hidden;white-space: nowrap;">{{item.path}}</Col>
                        <Col span="4">{{item.ftime}}</Col>
                        <Col span="2">
                            <Button icon="md-close" type="error" size="small" ghost @click="deleteTask(item)"></Button>
                        </Col>
                    </Row>
                </Card>
            </div>
        </Layout>
    </Layout>
</template>

<script>
    import ProcessItemComponent from "./download_process_item";
    import pcsConfig from '../config/pcsconfig.js'
    import axios from 'axios'
    import utils from '../libs/util'
    export default {
        name: "download",
        components: {ProcessItemComponent},
        data() {
            return {
                select_menu_name: "1-1",
                base_url: pcsConfig.base_url,
                ws_url: pcsConfig.ws_url,
                websocket: null,
                modalDetailFlag: false,
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
                    // }
                ],
                downloaded: [],
                pending_upload: [],
                uploading: [],
                uploaded: [],
                offline_downloaded: [],
                offline_downloading: []
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
                    if (pending.length === 1) {
                        this.$Message.error('请至少选择一个文件');
                        pending.pop();
                        this.global_data.send_upload_signal = 0;
                        return;
                    }

                    let tpath = pending.shift();
                    for (let i = 0; i < pending.length; i++) {
                        if (this.indexPendingUploadList(pending[i]) !== -1) {
                            continue;
                        }

                        let fd_names = pending[i].split("/");
                        this.pending_upload.push({
                            lastID: 0,
                            path: pending[i],
                            name: fd_names[fd_names.length - 1],
                            speed: "0KB",
                            time_used: "0s",
                            uploaded_size: "0KB",
                            total_size: "--KB",
                            time_left: "--s",
                            percent: 0,
                            status: 0,
                        })
                    }
                    var send_json = {
                        "type": 3,
                        "paths": pending,
                        "tpath": tpath
                    };
                    this.websocket.send(JSON.stringify(send_json));
                    this.$Message.success('已经添加到上传队列!');

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
                if (name === '3-1' || name === '3-2') {
                    this.getOfflineTask();
                }
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

                let pos = 0;
                let ditem = {};
                let data = redata.data.replace(/\\/g, '/');
                data = JSON.parse(data);

                //下载任务
                if (redata.type === 2) {
                    switch (redata.status) {
                        case 1: //添加到下载任务列表
                            let index = this.indexPendingDownloadList(data.path);
                            if (index > -1) {
                                this.pending_download.splice(index, 1);
                            }

                            let fd_names = data.path.split("/");
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
                            });
                            break;
                        case 2:
                            this.removeDownloadingList(data.path);
                            break;
                        case 5: //正在下载
                            pos = this.getIndexFromArray(this.downloading, data.LastID);
                            ditem = this.downloading[pos];
                            if (!ditem.is_pause) {
                                ditem.speed = data.speed;
                                ditem.avg_speed = data.avg_speed;
                                ditem.time_used = data.time_used;
                                ditem.download_size = data.download_size;
                                ditem.total_size = data.total_size;
                                ditem.time_left = data.time_left;
                                ditem.percent = data.percent;
                                ditem.status = redata.status;
                            }
                            break;
                        case 6: //任务暂停
                            pos = this.getIndexFromArray(this.downloading, data.LastID);
                            ditem = this.downloading[pos];
                            ditem.is_pause = true;
                            ditem.speed = "0KB";
                            ditem.avg_speed = "0KB";
                            ditem.time_left = "--s";
                            ditem.status = redata.status;
                            break;
                        case 7: //任务恢复
                            pos = this.getIndexFromArray(this.downloading, data.LastID);
                            ditem = this.downloading[pos];
                            ditem.is_pause = false;
                            ditem.status = redata.status;
                            break;
                        case 8: //任务删除
                            pos = this.getIndexFromArray(this.downloading, data.LastID);
                            this.downloading.splice(pos, 1);
                            break;
                        case 9: //任务完成
                            pos = this.getIndexFromArray(this.downloading, data.LastID);
                            ditem = this.downloading[pos];
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
                            this.downloading.splice(pos, 1);
                            break;
                    }
                }

                //上传任务
                if (redata.type === 3) {
                    switch (redata.status) {
                        case 1: //添加到上传任务中
                            let index = this.indexPendingUploadList(data.path);
                            if (index > -1) {
                                this.pending_upload.splice(index, 1);
                            }

                            let fd_names = data.path.split("/");
                            this.uploading.push({
                                lastID: data.LastID,
                                path: data.path,
                                name: fd_names[fd_names.length - 1],
                                speed: "0KB",
                                avg_speed: "0KB",
                                time_used: "0s",
                                uploaded_size: "0KB",
                                total_size: "--KB",
                                time_left: "--s",
                                percent: 0,
                                is_pause: false,
                                status: redata.status,
                            });
                            break;
                        case 2:
                            break;
                        case 3: //秒传成功
                            pos = this.getIndexFromArray(this.uploading, data.LastID);
                            ditem = this.uploading[pos];
                            this.uploaded.push({
                                lastID: ditem.lastID,
                                path: ditem.path,
                                name: ditem.name,
                                speed: ditem.speed,
                                avg_speed: ditem.avg_speed,
                                time_used: ditem.time_used,
                                uploaded_size: ditem.uploaded_size,
                                total_size: ditem.total_size,
                                time_left: "0s",
                                percent: 100,
                                status: redata.status,
                                save_path: data.savePath,
                            });
                            this.uploading.splice(pos, 1);

                            break;
                        case 4: //正在上传
                            pos = this.getIndexFromArray(this.uploading, data.LastID);
                            ditem = this.uploading[pos];
                            ditem.speed = data.speed;
                            ditem.avg_speed = data.avg_speed;
                            ditem.time_used = data.time_used;
                            ditem.uploaded_size = data.uploaded_size;
                            ditem.total_size = data.total_size;
                            ditem.time_left = data.time_left;
                            ditem.percent = data.percent;
                            ditem.status = redata.status;
                            break;
                        case 5: //上传完成
                            pos = this.getIndexFromArray(this.uploading, data.LastID);
                            ditem = this.uploading[pos];
                            this.uploaded.push({
                                lastID: ditem.lastID,
                                path: ditem.path,
                                name: ditem.name,
                                speed: ditem.speed,
                                avg_speed: ditem.avg_speed,
                                time_used: ditem.time_used,
                                uploaded_size: ditem.uploaded_size,
                                total_size: ditem.total_size,
                                time_left: "0s",
                                percent: 100,
                                status: redata.status,
                                save_path: data.savePath,
                            });
                            this.uploading.splice(pos, 1);
                            break;
                    }
                }
            },
            indexPendingDownloadList(path) {
                for (let i = 0; i < this.pending_download.length; i++) {
                    if (path === this.pending_download[i].path) {
                        return i;
                    }
                }
                return -1;
            },
            indexPendingUploadList(path) {
                for (let i = 0; i < this.pending_upload.length; i++) {
                    if (path === this.pending_upload[i].path) {
                        return i;
                    }
                }
                return -1;
            },
            getIndexFromArray(array, id) {
                for (let i = 0; i < array.length; i++) {
                    let ditem = array[i];
                    if (ditem.lastID === id)
                        return i;
                }
            },
            removeDownloadingList(path) {
                for (let i = 0; i < this.downloading.length; i++) {
                    if (path === this.downloading[i].path) {
                        this.downloading.splice(i, 1);
                    }
                }
            },
            deleteTask(item) {
                let method = "delete";
                if (item.status !== 0){
                    method = "cancel";
                }
                axios.get(this.base_url + 'api/v1/offline_download?method=' + method + '&id=' + item.taskid)
                    .then(result => {
                        if (result.data.code === 0) {
                            this.$Message.success("删除成功");
                            this.getOfflineTask();
                        } else {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10,
                                closable: true
                            });
                        }
                    });
            },
            getOfflineTask() {
                axios.get(this.base_url + 'api/v1/offline_download?method=list')
                    .then(result => {
                        if (result.data.code === 0) {
                            const fdata = result.data.data;
                            let finishedData = [];
                            let downloadingData = [];
                            for (var i = 0; i < fdata.length; i++) {
                                var fd = fdata[i];
                                if (fd.Status === 0){
                                    finishedData.push({
                                        taskid: fd.TaskID,
                                        taskname: fd.TaskName,
                                        status: fd.Status,
                                        status_text: fd.StatusText,
                                        file_size: utils.bytesToSize(fd.FileSize),
                                        finished_size: utils.bytesToSize(fd.FinishedSize),
                                        ftime: utils.formatDateTime(fd.FinishTime * 1000),
                                        path: fd.SavePath,
                                        url: fd.SourceURL,
                                        type: fd.OdType,
                                    });
                                } else {
                                    let percent = ((fd.FinishedSize*1) / (fd.FileSize*1) * 100).toFixed(2);
                                    downloadingData.push({
                                        taskid: fd.TaskID,
                                        taskname: fd.TaskName,
                                        status: fd.Status,
                                        status_text: fd.StatusText,
                                        file_size: utils.bytesToSize(fd.FileSize),
                                        finished_size: utils.bytesToSize(fd.FinishedSize),
                                        percent: percent * 1,
                                        stime: utils.formatDateTime(fd.StartTime * 1000),
                                        path: fd.SavePath,
                                        url: fd.SourceURL,
                                        type: fd.OdType,
                                    });
                                }
                            }
                            this.offline_downloaded = finishedData;
                            this.offline_downloading = downloadingData;
                            if (downloadingData.length > 0) {
                                setTimeout(() => this.getOfflineTask(), 1000);
                            }
                        } else {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10,
                                closable: true
                            });
                        }
                    });
            }
        },
        mounted() {
            this.initWebSocket()
        }
    }
</script>

<style scoped>

</style>