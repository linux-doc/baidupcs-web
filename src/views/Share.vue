<template>
  <div class="page-recycle">
    <table class="table">
      <colgroup>
        <col style="width: 40%;">
        <col style="width: 8%;">
        <col style="width: 44%;">
        <col style="width: 8%;">
      </colgroup>
      <thead>
      <tr>
        <th>文件名</th>
        <th>密码</th>
        <th>链接</th>
        <th>操作</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="item of shareData">
        <td>
          <div class="col-long" style="width: 288px;" :title="item.name">
            <Icon type="ios-folder-outline" size="24" v-if="item.isDir && !item.isDel"/>
            <Icon type="ios-document" size="24" v-if="!item.isDir && !item.isDel"/>
            <Icon type="md-close" size="24" v-if="item.isDel"/>
            {{item.name}}
          </div>
        </td>
        <td>{{item.password}}</td>
        <td>
          <div class="col-long" style="width: 350px;">{{item.link}}</div>
        </td>
        <td>
          <Button icon="md-close" type="error" ghost @click="cancelShare(item.id)"></Button>
        </td>
      </tr>
      </tbody>
    </table>
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