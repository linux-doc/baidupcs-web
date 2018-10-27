<template>
  <div>
    <Input v-model="curPath" search clearable @on-search="searchPath" style="font-size: 14px"
           placeholder="请输入目录路径, 支持相对路径">
      <span slot="prepend">目录路径</span>
    </Input>
    <CheckboxGroup style="overflow: auto; height: 60vh;" v-model="checkGroup"
                   @on-change="checkAllGroupChange">
      <Row style="margin-top: 10px">
        <Col span="1">
          <Checkbox :indeterminate="indeterminate" :value="checkAll" @click.prevent.native="handleCheckAll"><span></span></Checkbox>
        </Col>
        <Col span="11">文件名</Col>
        <Col span="4">大小</Col>
        <Col span="8">修改时间</Col>
      </Row>
      <Row class="file_list" @dblclick.native="dblClickFolder(item)" v-for="item in fileData">
        <Col span="1">
          <Checkbox :label="item.path"><span></span></Checkbox>
        </Col>
        <Col span="11">
          <div :title="item.title" style="overflow-x: hidden;white-space: nowrap;text-overflow: ellipsis;">
            <Icon type="ios-folder-outline" size="24" v-if="item.isdir"/>
            <Icon type="ios-document" size="24" v-if="!item.isdir"/>
            {{item.name}}
          </div>
        </Col>
        <Col span="4">{{item.size}}</Col>
        <Col span="8">{{item.date.substr(0,19)}}</Col>
      </Row>
    </CheckboxGroup>
  </div>
</template>

<script>
  import {mapState} from 'vuex'

  export default {
    name: 'v-file-select',
    data() {
      return {
        checkAll: false,
        indeterminate: false,
        fileData: [],
        checkGroup: [],
        curPath: ''
      }
    },
    computed: {
      ...mapState(['globals'])
    },
    watch: {
      'globals.press_back_key'(cur_val) {
        if (cur_val) {
          let count = 0;
          let index = 0;
          for (let i = 0; i < this.curPath.length; i++) {
            if (this.curPath[i] === '/') {
              count += 1;
              index = i;
            }
          }
          if (count === 1) {
            this.getFileList(this.curPath.substring(0, index + 1));
          } else {
            this.getFileList(this.curPath.substring(0, index));
          }

          this.globals.press_back_key = false;
        }
      }
    },
    methods: {
      async getFileList(path) {
        this.checkGroup = []
        this.indeterminate = false
        const result = await $axios.get(`local_file?method=list&path=${encodeURIComponent(path)}`).catch(this.error)
        if (result.data.code === 0) {
          this.fileData = result.data.data
          let tpath = this.fileData[0].path
          this.curPath = tpath.substring(0, tpath.lastIndexOf('/'))
        } else {
          this.error(result.data.msg)
        }
      },
      checkAllGroupChange(data) {
        if (data.length === this.fileData.length) {
          this.indeterminate = false
          this.checkAll = true
        } else if (data.length > 0) {
          this.indeterminate = true
          this.checkAll = false
        } else {
          this.indeterminate = false
          this.checkAll = false
        }
      },
      handleCheckAll() {
        if (this.indeterminate) {
          this.checkAll = false
        } else {
          this.checkAll = !this.checkAll
        }
        this.indeterminate = false

        if (this.checkAll) {
          const tmp = []
          for (let i = 0; i < this.fileData.length; i++) {
            tmp.push(this.fileData[i].path)
          }
          this.checkGroup = tmp
        } else {
          this.checkGroup = []
        }
      },
      dblClickFolder(item) {
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