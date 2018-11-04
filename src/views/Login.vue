<template>
  <div class="page-login">
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
            <Col span="14" style="padding: 0;">
              <Select v-model="verify_type" @on-change="websocketsend" placeholder="请选择验证方法"
                      v-if="show_verify_types">
                <Option v-for="item in verify_types" :value="item.value" :key="item.value">
                  {{item.label}}
                </Option>
              </Select>
              <img :src="verify_img" v-if="verify_img">
            </Col>
            <Col span="9" offset="1" style="padding: 0;">
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
      <Card v-if="users.length">
        <Row style="text-align: center;font-weight: 700;">已登录用户</Row>
        <Row v-for="(user, i) of users" :key="i" @click.native="selectUser(user)">{{user.name}}</Row>
      </Card>
    </div>
  </div>
</template>

<script>
  import config from '../config'

  export default {
    name: 'v-login',
    data() {
      return {
        base_url: config.base_url,
        ws_url: config.ws_url,
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
        config: {},
        users: []
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
        })
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
              location.href = '/dist'
              localStorage.lastUnlockTime = new Date().getTime()
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
      },
      async selectUser(user) {
        const body = await $axios.get(`user?method=set&name=${user.name}`).catch(this.error)
        if (body === undefined) return
        if (body.data.code === 0) {
          location.href = '/dist'
        }
      }
    },
    destroyed() {
      if (this.init_websocket) {
        this.websocketclose();
      }
    },
    async created() {
      const body = await $axios.get('user?method=list').catch(this.error)
      if (body === undefined) return
      if (body.data.code === 0) {
        this.users = body.data.data
      }
    }
  }
</script>

<style scoped lang="less">
  .page-login {
    width: 100vw;
    height: 100vh;
    background-size: cover;
    position: relative;
    background: url("../assets/login-bg.jpg") center;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-con {
    display: flex;
    /*width: 300px;*/

    .ivu-card:first-child {
      width: 300px;
    }

    .ivu-card:nth-child(2) {
      margin-left: 8px;

      .ivu-row:not(:first-child) {
        padding: 8px;
        cursor: pointer;
        transition: color .2s;

        &:hover {
          color: #19be6b;
        }
      }
    }
  }

  .form-con {
    padding: 10px 0 0;
    > * {
      margin-bottom: 10px;
    }
  }
</style>