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

    <Card :bordered="false" v-for="item of items">
      <p slot="title">{{item.name}}
        <Divider type="vertical"/>
        <span v-if="istatus === 1">
          <template v-if="itype === 1">等待下载...</template>
          <template v-if="itype === 2">等待上传...</template>
        </span>
        <span v-else>{{item.total_size}}</span>
      </p>
      <Row v-if="istatus !== 3">
        <Col span="11">
          <Progress :percent="item.percent" status="active"/>
        </Col>
        <Col class="c-action-group" span="3" v-if="itype === 1 && istatus === 2">
          <Button size="small" type="success" ghost v-if="item.is_pause"
                  @click="switchDownloadStatus(item)">
            <Icon type="md-play"></Icon>
          </Button>
          <Button size="small" type="warning" ghost v-else
                  @click="switchDownloadStatus(item)">
            <Icon type="md-pause"></Icon>
          </Button>
          <Button size="small" type="error" ghost @click="cancelTask(item)">
            <Icon type="md-close"></Icon>
          </Button>
          <Button size="small" type="info" ghost @click="detailTask(item)">
            <Icon type="md-barcode"></Icon>
          </Button>
        </Col>
        <Col span="10">
          <span>速度: {{item.speed}}/s</span>
          <Divider type="vertical"/>
          <span v-if="itype === 1">已经下载: {{item.download_size}}</span>
          <span v-if="itype === 2">已经上传: {{item.uploaded_size}}</span>
          <Divider type="vertical"/>
          <span>已用时间: {{item.time_used}}</span>
          <Divider type="vertical"/>
          <span>预计还需: {{item.time_left}}</span>
        </Col>
      </Row>
    </Card>
  </div>
</template>

<script>
  import utils from '../libs/util'

  export default {
    name: 'v-download-process-item',
    //itype:   1 下载   2 上传
    //istatus: 1 等待   2 进行中   3 完成
    props: ['items', 'itype', 'istatus'],
    data() {
      return {
        modalDetailFlag: false,
        taskDetail: [],
      }
    },
    methods: {
      async switchDownloadStatus(item) {
        const method = item.is_pause ? 'resume' : 'pause'
        const result = await $axios.get(`download?method=${method}&id=${item.LastID}`).catch(this.error)
        if (result.data.code === 0) {
          this.$Message.success('操作成功')
        } else {
          this.$Message.error({
            content: result.data.msg,
            duration: 10,
            closable: true
          })
        }
      },
      cancelTask(item) {
        this.$Modal.confirm({
          title: '删除任务后无法恢复, 确定吗?',
          onOk: async () => {
            const result = await $axios.get(`download?method=cancel&id=${item.LastID}`).catch(this.error)
            if (result.data.code === 0) {
              this.$Message.success('操作成功')
            } else {
              this.$Message.error({
                content: result.data.msg,
                duration: 10,
                closable: true
              })
            }
          }
        })
      },
      async getTaskStatus(id) {
        const result = await $axios.get(`download?method=status&id=${id}`).catch(this.error)
        if (result.data.code === 0) {
          this.taskDetail = [];
          let details = result.data.data;
          for (let i = 0; i < details.length; i++) {
            let error = ''
            if (details[i].error !== '<nil>')
              error = details[i].error;
            this.taskDetail.push({
              id: details[i].id,
              status: details[i].status,
              speed: utils.bytesToSize(details[i].speed),
              error: error
            })
          }
          if (this.modalDetailFlag) {
            setTimeout(() => this.getTaskStatus(id), 1000)
          }
        } else {
          this.$Message.info({
            content: result.data.msg,
            duration: 10,
            closable: true
          })
          this.modalDetailFlag = false
        }
      },
      detailTask(item) {
        this.getTaskStatus(item.LastID)
        this.modalDetailFlag = true
      }
    }
  }
</script>
