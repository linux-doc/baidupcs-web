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
    <Layout :style="{padding: '0 24px 24px'}">
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

        this.websocket.onmessage = this.receiveData
      },
      receiveData(e) {
        const redata = JSON.parse(e.data)
        if (redata.code !== 0) {
          this.$Message.error({
            content: redata.msg,
            duration: 10,
            closable: true
          })
        }

        let pos = 0
        let ditem = {}
        const data = JSON.parse(redata.data.replace(/\\/g, '/'))

        //下载任务
        if (redata.type === 2) {
          switch (redata.status) {
            case 1: //添加到下载任务列表
              let fd_names = data.path.split('/')
              this.globals.downloading.push({
                LastID: data.LastID,
                path: data.path,
                name: fd_names.pop(),
                speed: '0KB',
                avg_speed: '0KB',
                time_used: '0s',
                download_size: '0KB',
                total_size: '--KB',
                time_left: '--s',
                percent: 0,
                is_pause: false,
                status: redata.status,
              });
              break;
            case 2:
              this.removeDownloadingList(data.path)
              break
            case 5: //正在下载
              ditem = this.globals.downloading.find(item => item.LastID === data.LastID)
              if (!ditem) {
                data.status = redata.status
                this.globals.downloading.push(data)
              } else {
                if (!ditem.is_pause) {
                  ditem.speed = data.speed
                  ditem.avg_speed = data.avg_speed
                  ditem.time_used = data.time_used
                  ditem.download_size = data.download_size
                  ditem.total_size = data.total_size
                  ditem.time_left = data.time_left
                  ditem.percent = data.percent
                  ditem.status = redata.status
                }
              }
              break
            case 6: //任务暂停
              ditem = this.globals.downloading.find(item => item.LastID === data.LastID)
              ditem.is_pause = true
              ditem.speed = '0KB'
              ditem.avg_speed = '0KB'
              ditem.time_left = '--s'
              ditem.status = redata.status
              break
            case 7: //任务恢复
              ditem = this.globals.downloading.find(item => item.LastID === data.LastID)
              ditem.is_pause = false
              ditem.status = redata.status
              break
            case 8: //任务删除
              pos = this.getIndexFromArray(this.globals.downloading, data.LastID);
              this.globals.downloading.splice(pos, 1);
              break
            case 9: //任务完成
              pos = this.globals.downloading.findIndex(item => item.LastID === data.LastID)
              if (pos >= 0) {
                ditem = this.globals.downloading[pos]
                this.globals.downloaded.push({
                  LastID: ditem.LastID,
                  path: ditem.path,
                  name: ditem.name,
                  speed: ditem.speed,
                  avg_speed: ditem.avg_speed,
                  time_used: ditem.time_used,
                  download_size: ditem.download_size,
                  total_size: ditem.total_size,
                  time_left: '0s',
                  percent: 100,
                  status: redata.status,
                  save_path: data.savePath,
                })
                this.globals.downloading.splice(pos, 1)
              }
              break
          }
        }

        //上传任务
        if (redata.type === 3) {
          switch (redata.status) {
            case 1: //添加到上传任务中
              let fd_names = data.path.split('/')
              this.globals.uploading.push({
                LastID: data.LastID,
                path: data.path,
                name: fd_names.pop(),
                speed: '0KB',
                avg_speed: '0KB',
                time_used: '0s',
                uploaded_size: '0KB',
                total_size: '--KB',
                time_left: '--s',
                percent: 0,
                is_pause: false,
                status: redata.status,
              })
              break
            case 2:
              break
            case 3: //秒传成功
              pos = this.globals.uploading.findIndex(item => item.LastID === data.LastID)
              ditem = this.globals.uploading[pos]
              ditem.percent = 100
              ditem.status = redata.status
              ditem.save_path = data.savePath
              this.globals.uploaded.push(ditem)
              this.globals.uploading.splice(pos, 1)
              break
            case 4: //正在上传
              ditem = this.globals.uploading.find(item => item.LastID === data.LastID)
              ditem.speed = data.speed
              ditem.avg_speed = data.avg_speed
              ditem.time_used = data.time_used
              ditem.uploaded_size = data.uploaded_size
              ditem.total_size = data.total_size
              ditem.time_left = data.time_left
              ditem.percent = data.percent
              ditem.status = redata.status
              break
            case 5: //上传完成
              pos = this.globals.uploading.findIndex(item => item.LastID === data.LastID)
              ditem = this.globals.uploading[pos]
              this.globals.uploaded.push({
                LastID: ditem.LastID,
                path: ditem.path,
                name: ditem.name,
                speed: ditem.speed,
                avg_speed: ditem.avg_speed,
                time_used: ditem.time_used,
                uploaded_size: ditem.uploaded_size,
                total_size: ditem.total_size,
                time_left: '0s',
                percent: 100,
                status: redata.status,
                save_path: data.savePath
              })
              this.globals.uploading.splice(pos, 1)
              break
          }
        }
      },
      getMenuName(name) {
        this.select_menu_name = name
        if (name === '3-1' || name === '3-2') {
          this.getOfflineTask()
        }
      },
      removeDownloadingList(path) {
        for (let i = 0; i < this.globals.downloading.length; i++) {
          if (path === this.globals.downloading[i].path) {
            this.globals.downloading.splice(i, 1)
            break
          }
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
      }
    },
    created() {
      this.initWebSocket()
    }
  }
</script>