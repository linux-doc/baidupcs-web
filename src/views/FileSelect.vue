<template>
  <div>
    <Input v-model="curPath" search @on-search="searchPath" style="font-size: 14px"
           placeholder="请输入目录路径, 支持相对路径">
      <span slot="prepend">目录路径</span>
      <span slot="append" style="cursor: pointer;" @click="backToParent">上级目录</span>
    </Input>
    <div class="file-list" style="margin-top: 10px;">
      <div class="l-row" style="display: flex;align-items: center;height: 36px;">
        <div class="r-col ivu-col-span-1" style="width: calc(1/24*100%);">
          <label class="v-checkbox"><input type="checkbox" v-model="isCheckAll"><span></span></label>
        </div>
        <div class="r-col ivu-col-span-11" style="width: calc(11/24*100%);">文件名</div>
        <div class="r-col ivu-col-span-4" style="width: calc(4/24*100%);">大小</div>
        <div class="r-col ivu-col-span-8" style="width: calc(8/24*100%);">修改时间</div>
      </div>

      <div class="l-row" style="display: flex;align-items: center;height: 36px;" v-for="item of fileData">
        <div class="r-col ivu-col-span-1" style="width: calc(1/24*100%);">
          <label class="v-checkbox"><input type="checkbox" :value="item.path" name="filePath" v-model="checkedFiles"><span></span></label>
        </div>
        <div class="r-col ivu-col-span-11" style="width: calc(11/24*100%);overflow-x: hidden;white-space: nowrap;text-overflow: ellipsis;" @dblclick="dblClickFolder(item)">{{item.name}}</div>
        <div class="r-col ivu-col-span-4" style="width: calc(4/24*100%);">{{item.size}}</div>
        <div class="r-col ivu-col-span-8" style="width: calc(8/24*100%);">{{item.date.substr(0,19)}}</div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'v-file-select',
    data() {
      return {
        isCheckAll: false,
        fileData: [],
        checkedFiles: [],
        curPath: ''
      }
    },
    watch: {
      isCheckAll(val) {
        if (val) {
          this.checkedFiles = this.fileData.map(item => item.path)
        } else {
          this.checkedFiles = []
        }
      }
    },
    methods: {
      backToParent() {
        let slashIndex = this.curPath.lastIndexOf('/')
        if (slashIndex === -1) return

        this.curPath = this.curPath.substring(0, slashIndex)
        this.getFileList(this.curPath)
      },
      async getFileList(path) {
        this.checkedFiles = []
        const result = await $axios.get(`local_file?method=list&path=${encodeURIComponent(path)}`).catch(this.error)
        if (result.data.code === 0) {
          this.fileData = result.data.data
          let tpath = this.fileData[0].path
          this.curPath = tpath.substring(0, tpath.lastIndexOf('/'))
        } else {
          this.error(result.data.msg)
        }
      },
      dblClickFolder(item) {
        if (!item.isdir) return
        this.getFileList(item.path)
      },
      searchPath() {
        this.getFileList(this.curPath)
      }
    },
    mounted() {
      this.getFileList('.')
    }
  }
</script>