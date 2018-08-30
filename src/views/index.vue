<style scoped>
    .layout {
        border: 1px solid #d7dde4;
        background: #f5f7f9;
        position: relative;
        border-radius: 4px;
        overflow: hidden;
    }

    .layout-logo {
        height: 100%;
        border-radius: 3px;
        float: left;
        position: relative;
    }

    .layout-nav {
        width: 420px;
        margin: 0 auto;
        margin-right: 20px;
    }
</style>

<template>
    <div style="height: 100%">
        <div class="layout" v-if="login_flag">
            <Layout>
                <Header>
                    <Menu mode="horizontal" theme="dark" active-name="select_menu_name" @on-select="getMenuName">
                        <img class="layout-logo" src="../images/baiduyun_logo.png"/>
                        <div class="layout-nav">
                            <MenuItem name="1">
                                <Icon type="ios-folder"/>
                                文件管理
                            </MenuItem>
                            <MenuItem name="2">
                                <Icon type="ios-cloud-download"/>
                                下载管理
                            </MenuItem>
                            <Submenu name="3">
                                <template slot="title">
                                    <Icon type="md-person"/>
                                    {{baidu_name}}
                                </template>
                                <MenuItem name="3-1">设置</MenuItem>
                                <MenuItem name="3-2">退出</MenuItem>
                            </Submenu>
                        </div>
                    </Menu>
                </Header>
                <file_manager_component :pending_download_data="pending_download_data"
                                        v-show='select_menu_name === "1"'/>
                <download_component :pending_download_data="pending_download_data" v-show='select_menu_name === "2"'/>
            </Layout>
        </div>
        <login_component v-if="!login_flag"/>
    </div>
</template>
<script>
    import axios from 'axios'
    import login_component from './login'
    import file_manager_component from './file_manager'
    import download_component from './download'
    export default {
        data() {
            return {
                base_url: 'http://127.0.0.1:8081/',
                login_flag: false,
                select_menu_name: "1",
                baidu_name: "",
                pending_download_data: []
            }
        },
        components: {login_component, file_manager_component, download_component},
        methods: {
            getMenuName(name) {
                this.select_menu_name = name;
                if (name === "3-2") {
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
                }
            },

        },
        created() {
            axios.get(this.base_url + 'api/v1/user')
                .then(result => {
                    if (result.data.code !== -4) {
                        this.login_flag = true;
                        this.baidu_name = result.data.data.name;
                    }
                });
        },
        destroyed() {
        }
    }
</script>
