<template>
  <Layout>
    <Sider hide-trigger :style="{background: '#fff'}">
      <Menu theme="light" width="auto" :open-names="['1']" :active-name="select_menu_name" @on-select="getMenuName">
        <Submenu name="1">
          <template slot="title"><Icon type="ios-cloud-download"></Icon>我的下载</template>
          <MenuItem name="1-1">正在下载</MenuItem>
          <MenuItem name="1-2">已经完成</MenuItem>
        </Submenu>
        <Submenu name="2">
          <template slot="title"><Icon type="ios-cloud-upload"></Icon>我的上传</template>
          <MenuItem name="2-1">正在上传</MenuItem>
          <MenuItem name="2-2">已经完成</MenuItem>
        </Submenu>
        <Submenu name="3">
          <template slot="title"><Icon type="ios-link"/>离线下载</template>
          <MenuItem name="3-1">正在下载</MenuItem>
          <MenuItem name="3-2">已经完成</MenuItem>
        </Submenu>
      </Menu>
    </Sider>
    <Layout :style="{padding: '24px'}">
      <div style="margin-bottom: 8px;" v-if="select_menu_name === '1-1' && (globals.downloading.length || globals.pending_download.length)">
        <Button size="small" type="error" ghost @click="cancelAll">全部取消</Button>
      </div>
      <!--下载相关-->
      <v-download-process-item :items="globals.downloading" :itype="1" :istatus="2"
                               v-show="select_menu_name === '1-1'"></v-download-process-item>
      <v-download-process-item :items="globals.pending_download" :itype="1" :istatus="1"
                               v-show="select_menu_name === '1-1'"></v-download-process-item>
      <v-finished :items="globals.downloaded" :itype="1" v-if="select_menu_name === '1-2'"></v-finished>

      <!--上传相关-->
      <v-download-process-item :items="globals.uploading" :itype="2" :istatus="2"
                               v-show="select_menu_name === '2-1'"></v-download-process-item>
      <v-download-process-item :items="globals.pending_upload" :itype="2" :istatus="1"
                               v-show="select_menu_name === '2-1'"></v-download-process-item>
      <v-finished :items="globals.uploaded" :itype="2" v-if="select_menu_name === '2-2'"></v-finished>

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
            <Col :title="item.taskname" span="6" style="overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">
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
            <Col :title="item.taskname" span="6" style="overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">
              {{item.taskname}}
            </Col>
            <Col span="2">{{item.status_text}}</Col>
            <Col span="2">{{item.file_size}}</Col>
            <Col :title="item.path" span="8" style="overflow: hidden;white-space: nowrap;">{{item.path}}</Col>
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
  import VDownloadProcessItem from "./DownloadProcessItem"
  import VFinished from '../components/Finished'
  import config from '../config'
  import utils from '../libs/util'
  import {mapState, mapMutations} from 'vuex'

  export default {
    name: 'v-download',
    data() {
      return {
        select_menu_name: "1-1",
        base_url: config.base_url,
        ws_url: config.ws_url,
        modalDetailFlag: false,
        offline_downloaded: [],
        offline_downloading: []
      }
    },
    computed: {
      ...mapState(['globals', 'websocket'])
    },
    components: { VDownloadProcessItem, VFinished },
    methods: {
      ...mapMutations(['initWS']),
      initWebSocket() {
        if (this.websocket === null) this.initWS()
      },
      getMenuName(name) {
        this.select_menu_name = name
        if (name === '3-1' || name === '3-2') {
          this.getOfflineTask()
        }
      },
      async deleteTask(item) {
        let method = 'delete'
        if (item.status !== 0) method = 'cancel'

        const result = await $axios.get(`offline_download?method=${method}&id=${item.taskid}`).catch(this.error)
        if (result.data.code === 0) {
          this.$Message.success("删除成功")
          this.getOfflineTask()
        } else {
          this.$Message.error({
            content: result.data.msg,
            duration: 10,
            closable: true
          })
        }
      },
      async getOfflineTask() {
        const result = await $axios.get('offline_download?method=list').catch(this.error)
        if (result.data.code === 0) {
          const fdata = result.data.data;
          let finishedData = [];
          let downloadingData = [];
          for (var i = 0; i < fdata.length; i++) {
            var fd = fdata[i];
            if (fd.Status === 0) {
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
              let percent = ((fd.FinishedSize * 1) / (fd.FileSize * 1) * 100).toFixed(2);
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
          })
        }
      },
      cancelAll() {
        this.$Modal.confirm({
          title: '删除任务后无法恢复, 确定吗?',
          onOk: async () => {
            const ids = [
              ...this.globals.downloading.map(item => item.LastID),
              ...this.globals.pending_download.map(item => item.LastID)
            ]
            let body
            for (let i = 0; i < ids.length; i++) {
              do {
                await utils.sleep()
                body = await $axios.get(`download?method=cancel&id=${ids[i]}`).catch(this.error)
              } while (body.data.code !== 0)
              await utils.sleep()
            }
          }
        })
      }
    },
    created() {
      this.initWebSocket()
    }
  }
</script>