<template>
  <div class="child-download-items">
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

    <div class="items-list">
      <div class="item" v-for="item of items">
        <h3 class="i-title">
          <span>{{item.name}}</span>
          <span v-if="istatus === 1">
          <template v-if="itype === 1">等待下载...</template>
          <template v-if="itype === 2">等待上传...</template>
        </span>
          <span v-else>{{item.total_size}}</span>
        </h3>

        <div class="i-body">
          <!--进度条-->
          <div class="b-progress">
            <div class="v-progress" :class="{success: item.percent >= 100}">
              <div class="p-bar">
                <div class="b-fg" :style="`width: ${item.percent}%;`"></div>
              </div>
              <div class="p-text">{{item.percent}}%</div>
            </div>
          </div>
          <!--操作按钮-->
          <div class="b-actions" v-if="itype === 1 && istatus === 2">
<!--            <button type="button" class="ivu-btn ivu-btn-warning ivu-btn-small ivu-btn-ghost" v-if="item.is_pause" @click="switchDownloadStatus(item)"><Icon type="md-play"></Icon></button>-->
<!--            <button type="button" class="ivu-btn ivu-btn-warning ivu-btn-small ivu-btn-ghost" v-else @click="switchDownloadStatus(item)"><Icon type="md-pause"></Icon></button>-->
            <button type="button" class="ivu-btn ivu-btn-error ivu-btn-small ivu-btn-ghost" @click="cancelTask(item)"><Icon type="md-close"></Icon></button>
<!--            <button type="button" class="ivu-btn ivu-btn-info ivu-btn-small ivu-btn-ghost" @click="detailTask(item)"><Icon type="md-barcode"></Icon></button>-->
          </div>
          <!--统计信息-->
          <div class="b-info">
            <span>速度: {{item.speed}}/s</span>
            <span v-if="itype === 1">已经下载: {{item.download_size}}</span>
            <span v-if="itype === 2">已经上传: {{item.uploaded_size}}</span>
            <span>已用时间: {{item.time_used}}</span>
            <span>预计还需: {{item.time_left}}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import utils from '../libs/util'

  export default {
    name: 'v-download-process-item',
    data() {
      return {
        modalDetailFlag: false,
        taskDetail: []
      }
    },
    //itype:   1 下载   2 上传
    //istatus: 1 等待   2 进行中   3 完成
    props: ['items', 'itype', 'istatus'],
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
