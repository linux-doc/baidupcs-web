<template>
    <div class="login">
        <x-particles class="particles-background" :config="config"></x-particles>
        <div class="login-con">
            <Card icon="log-in" title="百度云登录" :bordered="false">
                <div class="form-con">
                    <Input type="text" v-model="username" @keydown.native="watchkey($event)" clearable
                           placeholder="用户名">
                    <Icon type="ios-person-outline" slot="prepend"></Icon>
                    </Input>
                    <Input type="password" v-model="password" @keydown.native="watchkey($event)" clearable
                           placeholder="密码">
                    <Icon type="ios-lock-outline" slot="prepend"></Icon>
                    </Input>
                    <Row>
                        <Col span="14">
                            <Select v-model="verify_type" @on-change="websocketsend" placeholder="请选择验证方法"
                                    v-if="show_verify_types">
                                <Option v-for="item in verify_types" :value="item.value" :key="item.value">{{ item.label
                                    }}
                                </Option>
                            </Select>
                            <img :src="verify_img" v-if="verify_img">
                        </Col>
                        <Col span="9" offset="1">
                            <Input type="text" v-if="show_verify_code" v-model="verify_code"
                                   @keydown.native="watchkey($event)" clearable placeholder="验证码">
                            <Icon type="ios-barcode-outline" slot="prepend"></Icon>
                            </Input>
                        </Col>
                    </Row>
                    <Button type="success" :loading="button_loading" v-on:keyup.enter="websocketsend"
                            @click="websocketsend" long>登录
                    </Button>
                </div>
            </Card>
        </div>
    </div>
</template>

<script>
    import defConfig from '../config/particles_config.js'
    import pcsConfig from '../config/pcsconfig.js'
    export default {
        name: "login",
        data() {
            return {
                base_url: pcsConfig.base_url,
                ws_url: pcsConfig.ws_url,
                login_status: 1,
                username: '',
                password: '',
                verify_code: '',
                verify_types: null,
                verify_type: '',
                show_verify_types: false,
                show_verify_code: false,
                verify_img: '',
                button_loading: false,
                websocket: null,
                init_websocket: false,
                config: {}
            }
        },
        methods: {
            initWebSocket() { //初始化websocket
                this.websocket = new WebSocket(this.ws_url);
                this.websocket.onopen = this.websocketonopen;
                this.websocket.onerror = this.websocketonerror;
                this.websocket.onmessage = this.websocketonmessage;
                this.websocket.onclose = this.websocketclose;
            },

            websocketonopen() {
                this.init_websocket = true;
                console.log("WebSocket连接成功");
            },
            websocketonerror(e) { //错误
                this.$Message.error({
                    content: 'WebSocket连接发生错误 ' + e,
                    duration: 10
                });
            },
            websocketonmessage(e) { //数据接收
                const redata = JSON.parse(e.data);
                this.button_loading = false;

                if (redata.code !== 0) {
                    this.$Message.error({
                        content: redata.msg,
                        duration: 10,
                        closable: true
                    });
                }
                if (redata.type === 1) {
                    switch (redata.status) {
                        case 2: //需要验证手机或邮箱
                            this.verify_types = JSON.parse(redata.data);
                            this.show_verify_types = true;
                            this.show_verify_code = false;
                            this.verify_img = '';
                            this.verify_code = '';
                            break;
                        case 3: //发送验证码
                            this.show_verify_code = true;
                            this.$Message.success({
                                content: '验证码已发送',
                                duration: 10,
                                closable: true
                            });
                            break;
                        case 4: //验证码错误
                            this.$Message.error({
                                content: '验证码错误',
                                duration: 10,
                                closable: true
                            });
                            break;
                        case 5: //账号或密码错误
                            this.$Message.error({
                                content: '账号或者密码错误',
                                duration: 10,
                                closable: true
                            });
                            break;
                        case 6: //使用图片验证码
                            this.verify_img = redata.msg;
                            this.show_verify_code = true;
                            break;
                        case 7: //登录成功
                            location.reload();
                            break;
                    }
                }
            },
            websocketsend() {//数据发送
                this.button_loading = true;
                var send_json = {
                    "type": 1,
                    "status": this.login_status,
                    "username": this.username,
                    "password": this.password
                };
                if (this.verify_type !== '')
                    send_json['verify_type'] = this.verify_type;
                if (this.verify_code !== '')
                    send_json['verify_code'] = this.verify_code;

                this.websocket.send(JSON.stringify(send_json));
            },
            websocketclose(e) { //关闭
                console.log("connection closed (" + e + ")");
            },
            watchkey(ev) {
                if (!this.init_websocket) {
                    this.initWebSocket();
                }
                if (ev.keyCode === 13) {
                    this.websocketsend()
                }
            }
        },
        mounted() {
            this.config = defConfig;
        },
        destroyed() {
            if (this.init_websocket) {
                this.websocketclose();
            }
        }
    }
</script>

<style scoped lang="less">
    .login {
        width: 100vw;
        height: 100vh;
        background-size: cover;
        background-position: center;
        position: relative;
    }

    .login-con {
        position: absolute;
        right: 160px;
        top: 50%;
        transform: translateY(-60%);
        width: 300px;
    }

    .form-con {
        padding: 10px 0 0;
        > * {
            margin-bottom: 10px;
        }
    }

    .particles-background {
        background: url("../images/login-bg.jpg") center;
        height: 100vh;
        overflow: hidden;
    }
</style>