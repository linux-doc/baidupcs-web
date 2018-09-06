<template>
    <div>
        <Modal v-model="modalDetailFlag" draggable title="任务详情" :width="800">
            <Row>
                <Col span="4"><p style="font-size: 14px">任务ID</p></Col>
                <Col span="4"><p style="font-size: 14px">任务状态</p></Col>
                <Col span="4"><p style="font-size: 14px">速度</p></Col>
                <Col span="12"><p style="font-size: 14px">错误信息</p></Col>
            </Row>
            <div style="height: 60vh; overflow-y: auto">
                <Row v-for="item in taskDetail">
                    <Col span="4"><p style="font-size: 14px">{{item.id}}</p></Col>
                    <Col span="4"><p style="font-size: 14px">{{item.status}}</p></Col>
                    <Col span="4"><p style="font-size: 14px">{{item.speed}}/s</p></Col>
                    <Col span="12"><p style="font-size: 14px">{{item.error}}</p></Col>
                </Row>
            </div>
            <div slot="footer">
                <Button type="info" @click="modalDetailFlag = false">确认</Button>
            </div>
        </Modal>
        <Card :bordered="false" style="margin-top: 16px" v-for="item in items">
            <p slot="title">{{item.name}}
                <Divider type="vertical"/>
                <span v-if="istatus != 1">{{item.total_size}}</span>
                <span v-if="itype == 1 && istatus == 1">等待下载...</span>
                <span v-if="itype == 2 && istatus == 1">等待上传...</span>
            </p>
            <Row v-if="istatus != 3">
                <Col span="11">
                    <Progress :percent="item.percent" status="active"/>
                </Col>
                <Col span="3" v-if="itype == 1 && istatus == 2">
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
                        <span v-if="itype == 1">已经下载: {{item.download_size}}</span>
                        <span v-if="itype == 2">已经上传: {{item.uploaded_size}}</span>
                        <Divider type="vertical"/>
                        已用时间: {{item.time_used}}
                        <Divider type="vertical"/>
                        预计还需: {{item.time_left}}
                    </p>
                </Col>
            </Row>
            <Row v-if="istatus == 3">
                <Col span="8">
                    <Progress :percent="item.percent" status="active"/>
                </Col>
                <Col span="16">
                    <p>
                        平均速度: {{item.avg_speed}}/s
                        <Divider type="vertical"/>
                        已用时间: {{item.time_used}}
                        <Divider type="vertical"/>
                        保存<span v-if="itype == 1">本地</span><span v-if="itype == 2">云端</span>
                        路径: {{item.save_path}}
                    </p>
                </Col>
            </Row>
        </Card>
    </div>
</template>

<script>
    import axios from 'axios'
    import pcsConfig from '../config/pcsconfig.js'
    export default {
        name: "process_item",
        //itype:   1 下载   2 上传
        //istatus: 1 等待   2 进行中   3 完成
        props: ['items', 'itype', 'istatus'],
        data() {
            return {
                base_url: pcsConfig.base_url,
                modalDetailFlag: false,
                taskDetail: [],
            }
        },
        methods: {
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
                this.$Modal.confirm({
                    title: '删除任务后无法恢复, 确定吗?',
                    okText: '确定',
                    cancelText: '取消',
                    onOk: () => {
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
        }
    }
</script>

<style scoped>

</style>