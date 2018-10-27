<template>
  <Layout>
    <Header>
      <Menu mode="horizontal" theme="dark">
        <router-link class="layout-logo" to="/"><img src="../assets/logo.png"/></router-link>
        <div class="layout-nav">
          <MenuItem name="1">
            <router-link to="/"><Icon type="md-folder"/>文件管理</router-link>
          </MenuItem>
          <MenuItem name="2">
            <router-link to="/download"><Icon type="md-cloud"/>上传下载管理</router-link>
          </MenuItem>
          <MenuItem name="share" @click.native="modalShareFlag = true">
            <Icon type="md-share"/>分享管理
          </MenuItem>
          <Submenu name="4">
            <template slot="title"><Icon type="md-person"/>{{user.name}}</template>
            <MenuItem name="profile" @click.native="showProfile">简介~</MenuItem>
            <MenuItem name="set" @click.native="startSet">设置</MenuItem>
            <MenuItem name="update" @click.native="startUpdate">
              <Badge dot v-if="updateFlag">更新</Badge>
              <span v-else>更新</span>
            </MenuItem>
            <MenuItem name="logout" @click.native="logout">退出</MenuItem>
          </Submenu>
        </div>
      </Menu>
    </Header>

    <Modal v-model="modalShareFlag" :width="800">
      <v-share v-if="modalShareFlag"/>
      <div slot="footer">
        <Button type="info" @click="modalShareFlag = false">确认</Button>
      </div>
    </Modal>

    <Modal v-model="modalSettingFlag" @on-ok="updateSetting">
      <div style="height: 68vh; overflow: auto;">
        <Row type="flex" justify="center" align="middle" v-if="quotaData.flag">
          <i-col span="5">
            <p style="font-size: 16px">百度云存储</p>
          </i-col>
          <i-col span="5">
            <i-circle :percent="quotaData.data.percent" :size="80">
              <span style="font-size:16px">{{quotaData.data.percent}}%</span>
              <div style="font-size:10px">还剩 {{quotaData.data.un_used}}</div>
            </i-circle>
          </i-col>
        </Row>
        <Form style="margin-top: 16px" ref="settingForm" :model="formData" :label-width="110">
          <FormItem :label="item.name" v-for="(item, i) of formData.config" :key="i">
            <i-input v-model="item.value"></i-input>
            <p>{{item.desc}}</p>
          </FormItem>
        </Form>
      </div>
    </Modal>
  </Layout>
</template>

<script>
  import {mapState} from 'vuex'
  import VShare from '../views/Share'

  export default {
    data() {
      return {
        modalShareFlag: false,
        modalSettingFlag: false,
        quotaData: {
          flag: false,
          data: {}
        },
        formData: { config: [] },
        notices: [],
        updateVersion: [],
        updateFlag: false
      }
    },
    computed: {
      ...mapState(['user', 'login'])
    },
    components: { VShare },
    methods: {
      showProfile() {
        this.$Modal.success({
          title: 'BaiduPCS-Go Web版本',
          content: `<i class="ivu-icon ivu-icon-ios-mail" style="font-size: 24px"></i> liuzhuoling2011@hotmail.com <br />
                                  <i class="ivu-icon ivu-icon-logo-github" style="font-size: 24px"></i> <a href="https://github.com/liuzhuoling2011/baidupcs-web" target="_blank">https://github.com/liuzhuoling2011/baidupcs-web</a> <br />
                                  <br />
                                  感谢 iikira 提供了高速, 稳定可靠的百度云后台服务<br />
                                  <i class="ivu-icon ivu-icon-logo-github" style="font-size: 24px"></i> <a href="https://github.com/iikira/BaiduPCS-Go" target="_blank">https://github.com/iikira/BaiduPCS-Go</a>`
        })
      },
      async startSet() {
        this.modalSettingFlag = true
        const quota = await $axios.get('quota').catch(this.error)
        if (quota.data.code === 0) {
          this.quotaData.data = JSON.parse(quota.data.data)
          this.quotaData.flag = true
        }

        const setting = await $axios.get('setting?method=get').catch(this.error)
        if (setting.data.code === 0) {
          this.formData.config = setting.data.data
          // this.formData.config.shift()
        }
      },
      async updateSetting() {
        let settings = this.$refs['settingForm'].model.config;
        let params = "";
        for (let i = 0; i < settings.length; i++) {
          params += '&' + settings[i].en_name + '=' + settings[i].value;
        }
        const body = await $axios.get(`setting?method=set${params}`).catch(this.error)
        if (body.data.code === -1) {
          this.$Message.error({
            content: body.data.msg,
            duration: 10
          })
          return
        }
        this.$Message.success("配置保存成功")
      },
      startUpdate() {
        let version = ''
        for (let i = 1; i < this.updateVersion.length; i++) {
          let url = `http://${this.updateVersion[i]}`
          version += '<a href="' + url + '">' + url + '</a><br />'
        }
        if (version === '') {
          version = '您目前使用的版本是最新的, 无需更新!'
        }
        this.$Modal.info({
          width: 600,
          title: "可以升级的版本如下, 下载后请替换本程序",
          content: version
        })
      },
      logout() {
        this.$Modal.confirm({
          title: '退出登录',
          async onOk() {
            await $axios.get('logout')
            location.reload()
          }
        })
      },
      async getUpdate() {
        const body = await $axios.get('setting?method=update').catch(this.error)
        if (body.data.code === 0) {
          this.updateVersion = JSON.parse(body.data.data).data.filename
          if (this.updateVersion.length > 1) {
            this.updateFlag = true
          }
        }
      },
      async getNotice() {
        const body = await $axios.get('setting?method=notice').catch(this.error)
        if (body.data.code === 0) {
          let storage_key = 'baidupcs_notice_time'
          this.notices = JSON.parse(body.data.data).data
          for (let i = 0; i < this.notices.length; i++) {
            if (localStorage[storage_key] == null || localStorage[storage_key] < this.notices[i].CreatedAt) {
              localStorage.setItem(storage_key, this.notices[i].CreatedAt);
              this.$Notice.info({
                top: 50,
                duration: 10,
                title: this.notices[i].Msg
              })
            }
          }
        }
      }
    },
    mounted() {
      this.getUpdate()
      this.getNotice()
    }
  }
</script>

<style lang="less" scoped>
  a {
    display: block;
    color: rgba(255, 255, 255, .7);
    line-height: 60px;
    transition: color .2s;

    &:hover {
      color: white;
    }

    &.router-link-exact-active {
      color: #2d8cf0;
    }
  }

  .layout {
    border: 1px solid #d7dde4;
    background: #f5f7f9;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
  }

  .layout-logo {
    height: 100%;

    img {
      height: 100%;
    }
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