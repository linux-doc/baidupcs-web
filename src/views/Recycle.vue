<template>
  <div class="page-recycle">
    <table class="table">
      <colgroup>
        <col style="width: 30%;">
        <col style="width: 10%;">
        <col style="width: 30%;">
        <col style="width: 10%;">
        <col style="width: 10%;">
        <col style="width: 10%;">
      </colgroup>
      <thead>
      <tr>
        <th>文件名</th>
        <th>文件大小</th>
        <th>文件路径</th>
        <th>剩余时间</th>
        <th>还原</th>
        <th>删除</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="item of recycleData">
        <td><div class="col-long" :title="item.name">{{item.name}}</div></td>
        <td>{{item.size}}</td>
        <td><div class="col-long" :title="item.path">{{item.path}}</div></td>
        <td>{{item.leftTime}}</td>
        <td>
          <Button icon="md-undo" type="info" ghost @click="restoreRecycle(item.fid)"></Button>
        </td>
        <td>
          <Button icon="md-close" type="error" ghost @click="deleteRecycle(item.fid)"></Button>
        </td>
      </tr>
      </tbody>
    </table>
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