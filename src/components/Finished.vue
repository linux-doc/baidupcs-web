<template>
  <div class="child-finished">
    <div class="items-list">
      <div class="item" v-for="item of items">
        <h3 class="i-title">
          <span>{{item.name}}</span>
          <span>{{item.total_size}}</span>
        </h3>

        <div class="i-body">
          <Icon type="md-checkmark-circle" size="24" color="#19be6b"/>
          <span>平均速度: {{item.avg_speed}}/s</span>
          <span>已用时间: {{item.time_used}}</span>
          <span v-if="itype === 1">保存本地</span>
          <span v-if="itype === 2">保存云端</span>
          <span>路径: {{item.save_path}}</span>
          <button type="button" class="ivu-btn ivu-btn-success ivu-btn-small ivu-btn-ghost" @click="openFolder(item.save_path)" v-if="itype === 1">打开下载目录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'v-finished',
    props: {
      items: Array,
      itype: Number
    },
    methods: {
      async openFolder(path) {
        const result = await $axios.get(`local_file?method=open_folder&path=${encodeURIComponent(path)}`).catch(this.error)
        if (result.data.code !== 0) {
          this.$Message.error({
            content: result.data.msg,
            duration: 10,
            closable: true
          })
        }
      }
    }
  }
</script>
