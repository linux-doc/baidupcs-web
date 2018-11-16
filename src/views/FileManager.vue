<template>
  <Layout>
    <Modal v-model="modalFlag" @on-visible-change="modelVisible">
      <v-file-select ref="fileSelect"/>
      <div slot="footer">
        <Button type="success" long @click="confirmUpload"><Icon type="md-cloud-upload"></Icon>上传</Button>
      </div>
    </Modal>

    <Sider :width="300" hide-trigger>
      <Tree :data="folders" :load-data="loadData" @on-select-change="treeSelect"></Tree>
    </Sider>
    <Layout :style="{padding: '0 24px 24px'}">
      <Breadcrumb :style="{margin: '24px 0'}">
        <BreadcrumbItem to="/" @click.native="clickBreadItem(-1)"><Icon type="ios-home-outline"></Icon>主目录</BreadcrumbItem>
        <BreadcrumbItem to="/" @click.native="clickBreadItem(index)" v-for="(item, index) in bread_item" :key="index">{{item}}</BreadcrumbItem>
      </Breadcrumb>

      <Content>
        <Spin size="large" fix v-if="spin_show"></Spin>
        <Row :gutter="12">
          <Col span="10">
            <Checkbox :indeterminate="indeterminate" :value="checkAll" @click.prevent.native="handleCheckAll">全选</Checkbox>
            <Button @click="changeViewMode" type="text">
              <Icon type="md-reorder" size="24" v-if="files_view_mode === 1"></Icon>
              <Icon type="md-apps" size="24" v-if="files_view_mode === 2"></Icon>
            </Button>
            <Dropdown @on-click="fileSort" style="margin-right: 16px;">
              <Icon type="md-swap" size="24" style="cursor: pointer"></Icon>
              <DropdownMenu slot="list">
                <DropdownItem name="name-asc">名称 - 升序</DropdownItem>
                <DropdownItem name="name-desc">名称 - 降序</DropdownItem>
                <DropdownItem name="size-asc">大小 - 升序</DropdownItem>
                <DropdownItem name="size-desc">大小 - 降序</DropdownItem>
                <DropdownItem name="time-asc">时间 - 升序</DropdownItem>
                <DropdownItem name="time-desc">时间 - 降序</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Input v-model="searchKey" @on-search="searchKeyword" suffix="ios-search" search clearable
                   placeholder="在当前文件夹下搜索..." style="width: auto"/>
            <Button style="margin-left: 8px" @click="offlineDownload"><Icon type="md-link"></Icon>离线下载</Button>
          </Col>
          <Col span="14" style="text-align: right;">
            <ButtonGroup class="c-btn-group">
              <Button @click="addItemToClipboard('copy')"><Icon type="md-copy"></Icon>复制</Button>
              <Button @click="addItemToClipboard('move')"><Icon type="md-cut"></Icon>剪切</Button>
              <Button @click="pasteClipboard"><Icon type="md-clipboard"></Icon>粘贴</Button>
              <Button @click="shareFiles"><Icon type="md-share"></Icon>分享</Button>
              <Button type="info" @click="mkdirFunc"><Icon type="md-add"></Icon>新建</Button>
              <Button type="error" @click="removeFiles"><Icon type="md-trash"></Icon>删除</Button>
              <Button type="success" @click="modalFlag = true"><Icon type="md-cloud-upload"></Icon>上传</Button>
              <Button type="primary" @click="downloadFiles"><Icon type="md-download"></Icon>下载</Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Divider/>
        <div class="icons">
          <CheckboxGroup style="overflow: auto; height: 100%;" v-model="checkGroup"
                         @on-change="checkAllGroupChange">
            <Card v-show="files_view_mode === 1" :bordered="false" class="icons-item"
                  @click.native="openDir(item)" v-for="(item, i) of current_folders" :key="i">
              <Checkbox :label="item.path" style="position: absolute; top: 0; left: 0;"><span></span></Checkbox>
              <Icon type="ios-folder-outline" size="32" v-if="item.isdir"/>
              <Icon type="ios-document" size="32" v-if="!item.isdir"/>
              <p :title="item.title" style="overflow: hidden;">{{item.title}}</p>
            </Card>
            <div v-show="files_view_mode === 2">
              <Row style="margin-bottom: 10px">
                <Col span="15" offset="1">文件名</Col>
                <Col span="3">大小</Col>
                <Col span="5">修改时间</Col>
              </Row>
              <Row class="file_list" v-for="(item, i) of current_folders" :key="i">
                <Col span="1">
                  <Checkbox :label="item.path"><span></span></Checkbox>
                </Col>
                <Col span="13" :class="{'ivu-col-dirname': item.isdir, 'ivu-col-filename': !item.isdir}" @click.native="openDir(item)">
                  <div :title="item.title" style="overflow-x: hidden;white-space: nowrap;text-overflow: ellipsis;">
                    <Icon type="ios-folder-outline" size="24" v-if="item.isdir"/>
                    <Icon type="ios-document" size="24" v-if="!item.isdir"/>
                    {{item.title}}
                    <Button class="ivu-col-rename-btn" size="small" type="text" @click.stop="renameFunc(item.title)">重命名</Button>
                    <Button class="ivu-col-rename-btn" size="small" type="text" @click.stop="removeFile(item.path)">删除</Button>
                    <Button class="ivu-col-rename-btn" size="small" type="text" @click.stop="downloadFile(item.path)">下载</Button>
                  </div>
                </Col>
                <Col span="2">
                  <Button @click="jumpToFolder(item.folder)" v-if="item.folder" type="success" size="small" ghost>
                    <Icon type="ios-redo"/>目录
                  </Button>
                  <span v-else>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </span>
                </Col>
                <Col span="3"> {{item.size}}</Col>
                <Col span="5"> {{item.mtime}}</Col>
              </Row>
            </div>
          </CheckboxGroup>
        </div>
      </Content>
    </Layout>
  </Layout>
</template>

<script>
  import VFileSelect from './FileSelect'
  import utils from '../libs/util'
  import {mapState, mapMutations} from 'vuex'

  export default {
    name: 'v-file-manager',
    data() {
      return {
        spin_show: false,
        folders: [
          {
            title: '主目录',
            path: '/',
            loading: false,
            expand: true,
            children: []
          }
        ],
        files_view_mode: 2,
        current_folders: [],
        bread_item: [],
        checkGroup: [],
        clipboard: [],
        clipboard_method: '',
        checkAll: false,
        indeterminate: false,
        new_folder_name: '',
        modalFlag: false,
        searchKey: '',
        downloadLink: '',
        new_file_name: '',
      }
    },
    computed: {
      ...mapState(['globals', 'websocket'])
    },
    components: { VFileSelect },
    methods: {
      ...mapMutations(['initWS']),
      async getPathData(path, func, only_folder = false, orderby = 'name', order = 'asc') {
        this.spin_show = true
        const Data = []
        const result = await $axios.get(`files?path=${encodeURIComponent(path)}&order_by=${orderby}&order=${order}`).catch(this.error)
        this.spin_show = false;
        const fdata = result.data.list;
        for (var i = 0; i < fdata.length; i++) {
          var fd = fdata[i];
          if (fd.isdir === 1) {
            Data.push({
              path: fd.path,
              title: fd.server_filename,
              isdir: true,
              size: utils.bytesToSize(fd.size),
              mtime: utils.formatDateTime(fd.server_mtime * 1000),
              ctime: utils.formatDateTime(fd.server_ctime * 1000),
              loading: false,
              children: []
            });
          } else if (only_folder === false) {
            Data.push({
              path: fd.path,
              title: fd.server_filename,
              size: utils.bytesToSize(fd.size),
              mtime: utils.formatDateTime(fd.server_mtime * 1000),
              ctime: utils.formatDateTime(fd.server_ctime * 1000),
              isdir: false
            });
          }
        }
        func(Data);
      },
      resetCheckGroup() {
        this.checkAll = false;
        this.checkGroup = [];
        this.indeterminate = false;
      },
      setCurrentFolder(data) {
        this.current_folders = data;
        this.resetCheckGroup();
      },
      setBreadPath(path) {
        this.bread_item = path.split("/");
        this.bread_item.splice(0, 1);
      },
      openDir(item) {
        if (!item.isdir) return

        this.getPathData(item.path, this.setCurrentFolder)
        this.setBreadPath(item.path)
      },
      clickBreadItem(index) {
        var path = "/";
        var tmp = this.bread_item;
        while (tmp.length > index + 1) {
          tmp.pop();
        }
        path += tmp.join('/');
        this.getPathData(path, this.setCurrentFolder);
        this.setBreadPath(path);
      },
      treeSelect(item) {
        if (item.length === 0) {
          return;
        }

        this.getPathData(item[0].path, this.setCurrentFolder);
        this.setBreadPath(item[0].path);
      },
      loadData(item, callback) {
        this.getPathData(item.path, callback, true);
      },
      handleCheckAll() {
        if (this.indeterminate) {
          this.checkAll = false;
        } else {
          this.checkAll = !this.checkAll;
        }
        this.indeterminate = false;

        if (this.checkAll) {
          var tmp = [];
          for (var i = 0; i < this.current_folders.length; i++) {
            tmp.push(this.current_folders[i].path)
          }
          this.checkGroup = tmp;
        } else {
          this.checkGroup = [];
        }
      },
      fileSort(name) {
        let names = name.split('-');
        let cur_dir = "/" + this.bread_item.join('/');
        this.getPathData(cur_dir, this.setCurrentFolder, false, names[0], names[1]);
      },
      checkAllGroupChange(data) {
        if (data.length === this.current_folders.length) {
          this.indeterminate = false;
          this.checkAll = true;
        } else if (data.length > 0) {
          this.indeterminate = true;
          this.checkAll = false;
        } else {
          this.indeterminate = false;
          this.checkAll = false;
        }
      },
      addItemToClipboard(method) {
        if (this.checkGroup.length === 0) {
          this.$Message.warning('请至少选择一个文件或者文件夹')
          return false
        }

        this.clipboard = this.checkGroup.slice()
        this.clipboard_method = method
        const msg = method === 'copy' ? '复制' : '剪切'
        if (method !== '' && method !== 'remove') {
          this.$Message.success('已经' + msg + '到粘贴板')
        }
        return true
      },
      async pasteClipboard(add_cur_dir = true) {
        let paths = this.clipboard.join('|')
        let cur_dir = `/${this.bread_item.join('/')}`
        if (add_cur_dir) {
          paths += '|' + cur_dir
        }
        const result = await $axios.get(`file_operation?method=${this.clipboard_method}&paths=${encodeURIComponent(paths)}`).catch(this.error)
        if (result.data.code !== 0) {
          this.$Message.error(result.data.msg)
        } else {
          this.getPathData(cur_dir, this.setCurrentFolder)
        }
      },
      removeFiles() {
        this.$Modal.confirm({
          title: '确认删除吗?',
          content: '<p>将会把文件移至百度云回收站</p>',
          onOk: () => {
            this.addItemToClipboard('remove')
            this.pasteClipboard(false)
            this.resetCheckGroup()
          }
        })
      },
      removeFile(path) {
        this.$Modal.confirm({
          title: '确认删除吗?',
          content: '<p>将会把文件移至百度云回收站</p>',
          onOk: async () => {
            let cur_dir = `/${this.bread_item.join('/')}`
            const result = await $axios.get(`file_operation?method=remove&paths=${encodeURIComponent(path)}`).catch(this.error)
            if (result.data.code !== 0) {
              this.$Message.error(result.data.msg)
            } else {
              this.getPathData(cur_dir, this.setCurrentFolder)
            }
          }
        })
      },
      pressBackKey(e) {
        if (e.keyCode === 8) {
          this.globals.press_back_key = true
        }
      },
      modelVisible(v) {
        v ? window.addEventListener('keydown', this.pressBackKey) : window.removeEventListener('keydown', this.pressBackKey)
      },
      async confirmUpload() {
        const curDir = `/${this.bread_item.join('/')}`
        this.globals.pending_upload_data.push(curDir)
        const fileSelect = this.$refs.fileSelect

        if (fileSelect.checkGroup.length === 0) {
          this.$Message.error('请至少选择一个文件')
          return
        }

        if (this.websocket === null) this.initWS()

        if (this.websocket.readyState !== 1) await utils.sleep(500)

        this.websocket.send(JSON.stringify({
          type: 3,
          paths: fileSelect.checkGroup,
          tpath: curDir
        }))
        this.$Message.success('已经添加到上传队列!')
        this.modalFlag = false
      },
      async downloadFiles() {
        if (!this.addItemToClipboard('')) return

        if (this.websocket === null) this.initWS()

        if (this.websocket.readyState !== 1) await utils.sleep(500)

        this.websocket.send(JSON.stringify({
          type: 2,
          method: 'download',
          paths: this.clipboard
        }))
        this.$Message.success('已经添加到下载队列!')
        this.resetCheckGroup()
      },
      async downloadFile(path) {
        if (this.websocket === null) this.initWS()

        if (this.websocket.readyState !== 1) await utils.sleep(500)

        let paths = new Array(path)
        this.websocket.send(JSON.stringify({
          type: 2,
          method: 'download',
          paths: paths
        }))
        this.$Message.success('已经添加到下载队列!')
      },
      async shareFiles() {
        if (this.addItemToClipboard('') === false) return

        let paths = ''
        for (let i = 0; i < this.clipboard.length; i++) {
          paths += this.clipboard[i] + '|'
        }
        paths = paths.substr(0, paths.length - 1)

        const result = await $axios.get(`share?method=set&paths=${encodeURIComponent(paths)}`).catch(this.error)
        if (result.data.code === 0) {
          this.$Message.success({
            content: '分享成功, 链接: ' + result.data.msg,
            duration: 10
          })
          this.resetCheckGroup()
          this.globals.share_refresh = true
        } else {
          this.error(result.data.msg)
        }
      },
      mkdirFunc() {
        this.$Modal.confirm({
          render: (h) => {
            return h('Input', {
              props: {
                value: this.new_folder_name,
                autofocus: true,
                placeholder: '请输入文件夹名称...'
              },
              on: {
                input: (val) => {
                  this.new_folder_name = val;
                }
              }
            })
          },
          loading: true,
          okText: '确认',
          cancelText: '取消',
          onOk: async () => {
            const cur_dir = `/${this.bread_item.join('/')}`
            const new_folder = `${cur_dir}/${this.new_folder_name}`
            const result = await $axios.get(`mkdir?path=${encodeURIComponent(new_folder)}`)
            this.$Modal.remove()
            this.new_folder_name = ''
            if (result.data.code !== 0) {
              this.$Message.error(result.data.msg)
            } else {
              this.getPathData(cur_dir, this.setCurrentFolder)
            }
          }
        });
      },
      renameFunc(name) {
        this.$Modal.confirm({
            render: (h) => {
                return h('Input', {
                    props: {
                        value: name,
                        autofocus: true,
                    },
                    on: {
                        input: (val) => {
                            this.new_file_name = val;
                        }
                    }
                })
            },
            loading: true,
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                const cur_dir = `/${this.bread_item.join('/')}`
                const old_name = `${cur_dir}/${name}`
                const new_name = `${cur_dir}/${this.new_file_name}`
                const result = await $axios.get(`file_operation?method=move&paths=${encodeURIComponent(old_name + '|' + new_name)}`)
                this.$Modal.remove()
                this.new_folder_name = ''
                if (result.data.code !== 0) {
                    this.$Message.error(result.data.msg)
                } else {
                    this.getPathData(cur_dir, this.setCurrentFolder)
                }
            }
        });
      },
      changeViewMode() {
        if (this.files_view_mode === 1) {
          this.files_view_mode = 2;
        } else {
          this.files_view_mode = 1;
        }
      },
      async searchKeyword() {
        if (this.searchKey === '') {
          this.$Message.warning('请输入搜索关键字')
          return
        }

        this.spin_show = true
        const cur_dir = `/${this.bread_item.join('/')}`
        const result = await $axios.get(`search?tpath=${encodeURIComponent(cur_dir)}&keyword=${this.searchKey}`).catch(this.error)
        this.spin_show = false
        const fdata = result.data.data
        let Data = []
        for (let i = 0; i < fdata.length; i++) {
          var fd = fdata[i]
          let folder = fd.Path.substring(0, fd.Path.lastIndexOf('/'))
          Data.push({
            path: fd.Path,
            title: fd.Filename,
            folder: folder,
            isdir: false,
            size: utils.bytesToSize(fd.Size),
            mtime: utils.formatDateTime(fd.Mtime * 1000),
            ctime: utils.formatDateTime(fd.Ctime * 1000),
          })
        }
        this.setCurrentFolder(Data)
      },
      jumpToFolder(folder) {
        this.getPathData(folder, this.setCurrentFolder)
        this.setBreadPath(folder)
      },
      offlineDownload() {
        this.$Modal.confirm({
          render: (h) => {
            return h('Input', {
              props: {
                value: this.downloadLink,
                placeholder: '下载到百度云当前目录, 支持http/https/ftp/电驴/磁力链协议'
              },
              on: {
                input: val => this.downloadLink = val
              }
            })
          },
          loading: true,
          onOk: async () => {
            const curDir = `/${this.bread_item.join('/')}`
            const result = await $axios.get(`offline_download?method=add&link=${encodeURIComponent(this.downloadLink)}&tpath=${encodeURIComponent(curDir)}`).catch(this.error)
            this.$Modal.remove()
            this.downloadLink = ''
            if (result.data.code !== 0) {
              this.error(result.data.msg)
            } else {
              this.$Message.success('任务添加成功, ID:' + result.data.msg)
            }
          }
        })
      },
      async getFiles() {
        this.spin_show = true
        const Data = [], Data1 = []
        const result = await $axios.get('files?path=/').catch(this.error)
        this.spin_show = false

        const data = result.data
        if (data.error_code) {
          this.error(data.error_msg)
          return
        }

        const fdata = result.data.list
        for (let i = 0; i < fdata.length; i++) {
          const fd = fdata[i]
          const node = {
            path: fd.path,
            title: fd.server_filename,
            size: utils.bytesToSize(fd.size),
            mtime: utils.formatDateTime(fd.server_mtime * 1000),
            ctime: utils.formatDateTime(fd.server_ctime * 1000)
          }

          if (fd.isdir === 1) {
            Data.push({
              ...node,
              isdir: true,
              loading: false,
              children: []
            })
            Data1.push({
              ...node,
              isdir: true,
              loading: false,
              children: []
            })
          } else {
            Data.push({
              ...node,
              isdir: false
            })
          }
        }
        this.folders[0].children = Data1
        this.current_folders = Data
      }
    },
    mounted() {
      this.getFiles()
    }
  }
</script>

<style scoped>
  .ivu-layout-content {
    position: relative;
    padding: 24px;
    overflow: hidden;
    min-height: 280px;
    background: white;
  }

  .icons-item {
    display: inline-block;
    vertical-align: top;
    margin: 6px 6px 6px 0;
    width: 150px;
    text-align: center;
    list-style: none;
    height: 125px;
    color: #5c6b77;
    transition: all .2s ease;
    position: relative;
    padding-top: 10px;
    cursor: pointer;
  }

  .icons-item p {
    transition: color .2s;
  }

  .icons-item:hover p {
    color: #2d8cf0;
  }

  .file_list {
    padding-top: 12px;
  }

  .file_list:hover {
    box-shadow: 0 1px 6px rgba(0, 0, 0, .2);
    border-color: #eee;
  }

  .ivu-col-dirname {
    cursor: pointer;
    transition: color .2s;
  }

  .ivu-col-dirname:hover {
    color: #2d8cf0;
  }

  .ivu-col-dirname .ivu-col-rename-btn,
  .ivu-col-filename .ivu-col-rename-btn {
    display: none;
  }

  .ivu-col-dirname:hover .ivu-col-rename-btn,
  .ivu-col-filename:hover .ivu-col-rename-btn {
    display: inline-block;
  }
</style>