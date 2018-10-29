<template>
  <div style="height: 60vh; overflow: auto; margin-top: 30px">
    <Row>
      <Col span="9">文件名</Col>
      <Col span="2">密码</Col>
      <Col span="11">链接</Col>
      <Col span="2">操作</Col>
    </Row>
    <Row class="file_list" style="margin-top: 8px; line-height: 30px;" v-for="item of shareData">
      <Col :title="item.name" span="9" style="overflow-x: hidden;white-space: nowrap;text-overflow: ellipsis;">
        <Icon type="ios-folder-outline" size="24" v-if="item.isDir && !item.isDel"/>
        <Icon type="ios-document" size="24" v-if="!item.isDir && !item.isDel"/>
        <Icon type="md-close" size="24" v-if="item.isDel"/>
        {{item.name}}
      </Col>
      <Col span="2">{{item.password}}</Col>
      <Col span="11">{{item.link}}</Col>
      <Col span="2"><Button icon="md-close" type="error" ghost @click="cancelShare(item.id)"></Button></Col>
    </Row>
  </div>
</template>

<script>
  import {mapState} from 'vuex'

  export default {
    name: 'v-share',
    data() {
      return {
        shareData: []
      }
    },
    computed: {
      ...mapState(['globals'])
    },
    methods: {
      guessDirType(name) {
        let index = name.lastIndexOf('.');
        return !(index !== -1 && (name.length - index === 4 || name.length - index === 5));
      },
      async getShareList() {
        const result = await $axios.get('share?method=list').catch(this.error)
        if (result.data.code === 0) {
          this.shareData = []
          let shares = result.data.data
          shares.forEach(share => {
            const name = share.typicalPath.split('/').pop()
            let multi = ''
            if (share.fsIds.length > 1) multi = ' 等'

            this.shareData.push({
              id: share.shareId,
              name: name + multi,
              password: share.passwd || '无',
              link: share.shortlink,
              isDir: this.guessDirType(name),
              path: share.typicalPath,
              isDel: share.typicalPath === '分享的文件已被删除' || share.typicalPath === '分享已过期'
            })
          })
        } else {
          this.error(result.data.msg)
        }
      },
      async cancelShare(id) {
        const result = await $axios.get(`share?method=cancel&id=${id}`).catch(this.error)
        if (result.data.code === 0) {
          this.$Message.success('取消分享成功')
          for (let i = 0; i < this.shareData.length; i++) {
            if (this.shareData[i].id === id) {
              this.shareData.splice(i, 1)
              break
            }
          }
        } else {
          this.$Message.error(result.data.msg)
        }
      }
    },
    mounted() {
      this.getShareList()
    }
  }
</script>

<style scoped>
  .ivu-btn {
    padding: 0 3px 0 3px;
  }
</style>