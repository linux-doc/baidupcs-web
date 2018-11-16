<template>
  <div style="height: 60vh; overflow: auto; margin-top: 30px">
    <Row>
      <Col span="8">文件名</Col>
      <Col span="2">文件大小</Col>
      <Col span="8">文件路径</Col>
      <Col span="2">剩余时间</Col>
      <Col span="2">还原</Col>
      <Col span="2">删除</Col>
    </Row>
    <Row class="file_list" style="margin-top: 8px; line-height: 30px;" v-for="item of recycleData">
      <Col :title="item.name" span="8" style="overflow-x: hidden;white-space: nowrap;text-overflow: ellipsis;">
        {{item.name}}
      </Col>
      <Col span="2">{{item.size}}</Col>
      <Col span="8" :title="item.path" style="overflow-x: hidden;white-space: nowrap;text-overflow: ellipsis;">{{item.path}}</Col>
      <Col span="2">{{item.leftTime}}</Col>
      <Col span="2"><Button icon="md-undo" type="info" ghost @click="restoreRecycle(item.fid)"></Button></Col>
      <Col span="2"><Button icon="md-close" type="error" ghost @click="deleteRecycle(item.fid)"></Button></Col>
    </Row>
  </div>
</template>

<script>
  import utils from '../libs/util'
  import {mapState} from 'vuex'

  export default {
    name: 'v-recycle',
    data() {
      return {
        recycleData: []
      }
    },
    computed: {
      ...mapState(['globals'])
    },
    methods: {
      async getRecycleList() {
        const result = await $axios.get('recycle?method=list').catch(this.error)
        if (result.data.code === 0) {
          this.recycleData = []
          let recycles = result.data.data
          recycles.forEach(recycle => {
            this.recycleData.push({
              fid: recycle.fs_id,
              name: recycle.server_filename,
              leftTime: recycle.leftTime + ' 天',
              size: utils.bytesToSize(recycle.size),
              path: recycle.path,
            })
          })
        } else {
          this.error(result.data.msg)
        }
      },
      async restoreRecycle(fid) {
          const result = await $axios.get(`recycle?method=restore&fid=${fid}`).catch(this.error)
          if (result.data.code === 0) {
              this.$Message.success('还原回收站文件成功')
              for (let i = 0; i < this.recycleData.length; i++) {
                  if (this.recycleData[i].fid === fid) {
                      this.recycleData.splice(i, 1)
                      break
                  }
              }
          } else {
              this.$Message.error(result.data.msg)
          }
      },
      async deleteRecycle(fid) {
        const result = await $axios.get(`recycle?method=delete&fid=${fid}`).catch(this.error)
        if (result.data.code === 0) {
          this.$Message.success('删除回收站文件成功')
          for (let i = 0; i < this.recycleData.length; i++) {
            if (this.recycleData[i].fid === fid) {
              this.recycleData.splice(i, 1)
              break
            }
          }
        } else {
          this.$Message.error(result.data.msg)
        }
      }
    },
    mounted() {
      this.getRecycleList()
    }
  }
</script>

<style scoped>
  .ivu-btn {
    padding: 0 3px 0 3px;
  }
</style>