<template>
  <div class="child-finished">
    <Card :bordered="false" v-for="item in items">
      <p slot="title">{{item.name}}
        <Divider type="vertical"/>
        <span>{{item.total_size}}</span>
      </p>
      <Row>
        <Col span="1"><Icon type="md-checkmark-circle" size="24" color="#19be6b" /></Col>
        <Col span="20">
          <span>平均速度: {{item.avg_speed}}/s</span>
          <Divider type="vertical"/>
          <span>已用时间: {{item.time_used}}</span>
          <Divider type="vertical"/>
          <span v-if="itype === 1">保存本地</span>
          <span v-if="itype === 2">保存云端</span>&nbsp;
          <span>路径: {{item.save_path}}</span>
          <Divider type="vertical"/>
          <Button @click="openFolder(item.save_path)" v-if="itype === 1" type="success" size="small" ghost>
            <Icon type="ios-redo"/>打开下载目录
          </Button>
        </Col>
      </Row>
    </Card>
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
