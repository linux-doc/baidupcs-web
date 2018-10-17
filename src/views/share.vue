<template>
    <div style="height: 60vh; overflow: auto; margin-top: 30px">
        <Row>
            <Col span="9">文件名</Col>
            <Col span="2">密码</Col>
            <Col span="11">链接</Col>
            <Col span="2">操作</Col>
        </Row>
        <Row class="file_list" style="margin-top: 8px"
             v-for="item in shareData">
            <Col :title="item.name" span="9" style="overflow-x: hidden;text-overflow:ellipsis;white-space: nowrap;">
                <Icon type="ios-folder-outline" size="24" v-if="item.isDir && !item.isDel"/>
                <Icon type="ios-document" size="24" v-if="!item.isDir && !item.isDel"/>
                <Icon type="md-close" size="24" v-if="item.isDel"/>
                {{item.name}}
            </Col>
            <Col span="2">{{item.password}}</Col>
            <Col span="11">{{item.link}}</Col>
            <Col span="2">
                <Button icon="md-close" type="error" ghost @click="cancelShare(item.id)"></Button>
            </Col>
        </Row>
    </div>
</template>

<script>
    import axios from 'axios'
    import pcsConfig from '../config/pcsconfig.js'
    export default {
        name: "share",
        data() {
            return {
                base_url: pcsConfig.base_url,
                shareData: []
            }
        },
        watch: {
            'global_data.share_refresh'(cur_val) {
                if (cur_val) {
                    this.getShareList();
                    this.global_data.share_refresh = false;
                }
            }
        },
        props: ['global_data'],
        methods: {
            guessDirType(name) {
                let index = name.lastIndexOf('.');
                return !(index !== -1 && (name.length - index === 4 || name.length - index === 5));
            },
            getShareList() {
                axios.get(this.base_url + 'api/v1/share?method=list')
                    .then(result => {
                        if (result.data.code === 0) {
                            this.shareData = [];
                            let shares = result.data.data;
                            for (let i = 0; i < shares.length; i++) {
                                let name = shares[i].typicalPath.split('/');
                                name = name[name.length - 1];
                                let multi = "";
                                if (shares[i].fsIds.length > 1) {
                                    multi = ' 等';
                                }
                                this.shareData.push({
                                    id: shares[i].shareId,
                                    name: name + multi,
                                    password: (function () {
                                        if (shares[i].passwd === "")
                                            return "无";
                                        return shares[i].passwd;
                                    })(),
                                    link: shares[i].shortlink,
                                    isDir: this.guessDirType(name),
                                    path: shares[i].typicalPath,
                                    isDel: shares[i].typicalPath === '分享的文件已被删除' || shares[i].typicalPath === '分享已过期'
                                });
                            }
                        } else {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10
                            });
                        }
                    })
                    .catch(reason => {
                        this.$Message.error({
                            content: '与服务器联系断开 ' + reason.toString(),
                            duration: 10
                        });
                    });
            },
            cancelShare(id) {
                axios.get(this.base_url + 'api/v1/share?method=cancel&id=' + id)
                    .then(result => {
                        if (result.data.code === 0) {
                            this.$Message.success("取消分享成功");
                            this.getShareList()
                        } else {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10
                            });
                        }
                    })
            }
        },
        mounted() {
            this.getShareList()
        },
    }
</script>

<style scoped>
    .ivu-btn {
        padding: 0 3px 0 3px;
    }
</style>