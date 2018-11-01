<style scoped>
    @import 'styles/common.css';

    .layout {
        border: 1px solid #d7dde4;
        background: #f5f7f9;
        position: relative;
        border-radius: 4px;
        overflow: hidden;
    }

    .layout-logo {
        height: 100%;
    }

    .ivu-menu-horizontal {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .ivu-layout-header {
        height: 60px;
        line-height: 60px;
    }
</style>
<template>
    <div style="height: 100%">
        <div class="layout" v-if="login_flag">
            <Layout>
                <Header>
                    <Menu mode="horizontal" theme="dark" active-name="select_menu_name" @on-select="getMenuName">
                        <img class="layout-logo" src="./images/baiduyun_logo.png"/>
                        <div class="layout-nav">
                            <MenuItem name="1">
                                <Icon type="md-folder"/>
                                文件管理
                            </MenuItem>
                            <MenuItem name="2">
                                <Icon type="md-cloud"/>
                                上传下载管理
                            </MenuItem>
                            <MenuItem name="3">
                                <Icon type="md-share"/>
                                分享管理
                            </MenuItem>
                            <Submenu name="4">
                                <template slot="title">
                                    <Icon type="md-person"/>
                                    {{baidu_name}}
                                </template>
                                <MenuItem name="4-1">简介~</MenuItem>
                                <MenuItem name="4-2">设置</MenuItem>
                                <MenuItem name="4-3">
                                    <Badge dot v-if="update_flag">更新</Badge>
                                    <span v-if="!update_flag">更新</span>
                                </MenuItem>
                                <MenuItem name="4-4">退出</MenuItem>
                            </Submenu>
                        </div>
                    </Menu>
                </Header>
                <file_manager_component :global_data="globalData"
                                        v-show='select_menu_name === "1"'/>
                <download_component :global_data="globalData"
                                    v-show='select_menu_name === "2"'/>
                <Modal v-model="modalSettingFlag" @on-ok="updateSetting">
                    <div style="height: 72vh; overflow: auto;">
                        <Row type="flex" justify="center" align="middle" v-if="quota_data.flag">
                            <Col span="5">
                                <p style="font-size: 16px">百度云存储</p>
                            </Col>
                            <Col span="5">
                                <Circle :percent="quota_data.data.percent" :size="80">
                                    <span style="font-size:16px">{{quota_data.data.percent}}%</span>
                                    <div style="font-size:10px">还剩 {{quota_data.data.un_used}}</div>
                                </Circle>
                            </Col>
                        </Row>
                        <Form style="margin-top: 16px" ref="settingForm" :model="formData" :label-width="110">
                            <FormItem :label="item.name" v-for="item in formData.config">
                                <Input v-model="item.value"></Input>
                                <p>{{item.desc}}</p>
                            </FormItem>
                        </Form>
                    </div>
                </Modal>
                <Modal v-model="modalShareFlag" :width="800">
                    <share_component :global_data="globalData"></share_component>
                    <div slot="footer">
                        <Button type="info" @click="modalShareFlag = false">确认</Button>
                    </div>
                </Modal>
            </Layout>
        </div>
        <login_component v-if="!login_flag"/>
    </div>
</template>
<script>
    import axios from 'axios'
    import login_component from './views/login'
    import file_manager_component from './views/file_manager'
    import download_component from './views/download'
    import share_component from './views/share'
    import pcsConfig from './config/pcsconfig.js'
    export default {
        data () {
            return {
                base_url: pcsConfig.base_url,
                login_flag: false,
                select_menu_name: "1",
                baidu_name: "",
                quota_data: {
                    flag: false,
                    data: {}
                },
                modalSettingFlag: false,
                modalShareFlag: false,
                formData: {config: []},
                notices: [],
                update_version: [],
                update_flag: false,
                globalData: {
                    pending_download_data: [],
                    send_download_signal: false,
                    pending_upload_data: [],
                    send_upload_signal: 0,
                    press_back_key: false,
                    share_refresh: false,
                }
            }
        },
        components: {login_component, file_manager_component, download_component, share_component},
        mounted () {
            axios.get(this.base_url + 'api/v1/user')
                .then(result => {
                    if (result.data.code !== -4) {
                        this.login_flag = true;
                        this.baidu_name = result.data.data.name;
                    }
                })
                .catch(reason => {
                    this.$Message.error({
                        content: '与服务器联系断开 ' + reason.toString(),
                        duration: 10
                    });
                });
            axios.get(this.base_url + 'api/v1/setting?method=update')
                .then(result => {
                    if (result.data.code === 0) {
                        this.update_version = JSON.parse(result.data.data).data.filename;
                        if (this.update_version.length > 1){
                            this.update_flag = true;
                        }
                    }
                });
            axios.get(this.base_url + 'api/v1/setting?method=notice')
                .then(result => {
                    if (result.data.code === 0) {
                        let storage = window.localStorage;
                        let storage_key = "baidupcs_notice_time";
                        this.notices = JSON.parse(result.data.data).data;
                        for(let i = 0; i < this.notices.length; i++){
                            if (storage[storage_key] == null || storage[storage_key] < this.notices[i].CreatedAt){
                                storage.setItem(storage_key, this.notices[i].CreatedAt);
                                this.$Notice.info({
                                    top: 50,
                                    duration: 10,
                                    title: "温馨提示",
                                    desc: this.notices[i].Msg,
                                })
                            }
                        }
                    }
                });
        },
        beforeDestroy () {

        },
        methods: {
            getMenuName(name) {
                if (name === "3") {
                    this.modalShareFlag = true;
                    return;
                }
                if (name === "4-1") {
                    this.$Modal.success({
                        title: 'BaiduPCS-Go Web版本',
                        content: `<i class="ivu-icon ivu-icon-ios-mail" style="font-size: 24px"></i> liuzhuoling2011@hotmail.com <br />
                                  <i class="ivu-icon ivu-icon-logo-github" style="font-size: 24px"></i> <a href="https://github.com/liuzhuoling2011/baidupcs-web" target="_blank">https://github.com/liuzhuoling2011/baidupcs-web</a> <br />
                                  <br />
                                  感谢 iikira 提供了高速, 稳定可靠的百度云后台服务<br />
                                  <i class="ivu-icon ivu-icon-logo-github" style="font-size: 24px"></i> <a href="https://github.com/iikira/BaiduPCS-Go" target="_blank">https://github.com/iikira/BaiduPCS-Go</a>`
                    });
                    return;
                }
                if (name === "4-2") {
                    axios.get(this.base_url + 'api/v1/quota')
                        .then(result => {
                            if (result.data.code === 0) {
                                this.quota_data.data = JSON.parse(result.data.data);
                                this.quota_data.flag = true;
                            }
                        });
                    axios.get(this.base_url + 'api/v1/setting?method=get')
                        .then(result => {
                            if (result.data.code === 0) {
                                this.formData.config = result.data.data;
                                // this.formData.config.shift();
                            }
                        });
                    this.modalSettingFlag = true;
                    return;
                }
                if (name === "4-3") {
                    let version = "";
                    for(let i = 1; i < this.update_version.length; i++){
                        let url = 'http://' + this.update_version[i];
                        version += '<a href="' + url + '">' + url + '</a><br />'
                    }
                    if (version === ""){
                        version = "您目前使用的版本是最新的, 无需更新!"
                    }
                    this.$Modal.info({
                        width: 600,
                        title: "可以升级的版本如下, 下载后请替换本程序",
                        content: version
                    });
                    return;
                }
                if (name === "4-4") {
                    this.$Modal.confirm({
                        title: '退出登录',
                        okText: '确定',
                        cancelText: '取消',
                        onOk: () => {
                            axios.get(this.base_url + 'api/v1/logout')
                                .then(result => {
                                    console.log(result);
                                    location.reload();
                                });
                        }
                    });
                    return;
                }
                this.select_menu_name = name;
            },
            updateSetting() {
                let settings = this.$refs['settingForm'].model.config;
                let params = "";
                for (let i = 0; i < settings.length; i++) {
                    params += '&' + settings[i].en_name + '=' + settings[i].value;
                }
                axios.get(this.base_url + 'api/v1/setting?method=set' + params)
                    .then(result => {
                        if (result.data.code === -1) {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10
                            });
                            return
                        }
                        this.$Message.success("配置保存成功");
                    });
            }
        }
    }
</script>
