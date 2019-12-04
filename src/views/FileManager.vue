<template>
  <div class="page-file-manager">
    <Modal v-model="modalFlag">
      <v-file-select ref="fileSelect"/>
      <div slot="footer">
        <Button type="success" long @click="confirmUpload"><Icon type="md-cloud-upload"></Icon>上传</Button>
      </div>
    </Modal>

    <Sider :width="300" hide-trigger>
      <Tree :data="folders" :load-data="loadData" @on-select-change="treeSelect"></Tree>
    </Sider>
    <div class="p-main">
      <Breadcrumb>
        <BreadcrumbItem to="/" @click.native="clickBreadItem(-1)"><Icon type="ios-home-outline"></Icon>主目录</BreadcrumbItem>
        <BreadcrumbItem to="/" @click.native="clickBreadItem(index)" v-for="(item, index) in bread_item" :key="index">{{item}}</BreadcrumbItem>
      </Breadcrumb>

      <div class="p-content">
        <Spin size="large" fix v-if="spin_show"></Spin>
        <div class="row-tools">
          <div class="t-l">
            <label class="v-checkbox"><input type="checkbox" v-model="isCheckAll"><span></span></label>
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
<!--            <Button style="margin-left: 8px" @click="offlineDownload"><Icon type="md-link"></Icon>离线下载</Button>-->
          </div>

          <div class="t-r">
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
          </div>
        </div>

        <!--文件列表表格-->
        <div class="table-wrap">
          <table class="table files-table">
            <colgroup>
              <col style="width: 2%;">
              <col style="width: 50%;">
              <col style="width: 20%;">
              <col style="width: 20%;">
            </colgroup>
            <thead>
            <tr>
              <th></th>
              <th>文件名</th>
              <th>大小</th>
              <th>修改时间</th>
            </tr>
            </thead>

            <tbody>
            <tr v-for="item of current_folders">
              <td>
                <label class="v-checkbox"><input type="checkbox" :value="item.path" name="filePath" v-model="checkedFiles"><span></span></label>
              </td>
              <td>
                <div class="item-title" :class="{'is-dir': item.isdir}">
                  <div class="t-content" @click="openDir(item)">
                    <Icon type="ios-folder-outline" size="24" v-if="item.isdir"/>
                    <Icon type="ios-document" size="24" v-if="!item.isdir"/>
                    <span>{{item.title}}</span>
                  </div>
                  <div class="t-buttons">
                    <Button class="ivu-col-rename-btn" size="small" type="text" @click.stop="renameFunc(item.title)">重命名</Button>
                    <Button class="ivu-col-rename-btn" size="small" type="text" @click.stop="removeFile(item.path)">删除</Button>
                    <Button class="ivu-col-rename-btn" size="small" type="text" @click.stop="downloadFile(item.path)">下载</Button>
                  </div>
                </div>
              </td>
              <td>{{item.size}}</td>
              <td>{{item.mtime}}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
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
        isCheckAll: false,
        indeterminate: false,
        new_folder_name: '',
        modalFlag: false,
        searchKey: '',
        downloadLink: '',
        new_file_name: '',
        checkedFiles: []
      }
    },
    computed: {
      ...mapState(['globals', 'websocket'])
    },
    components: { VFileSelect },
    watch: {
      isCheckAll(val) {
        this.checkedFiles = val ? this.current_folders.map(item => item.path) : []
      }
    },
    methods: {
      ...mapMutations(['initWS']),
      async getPathData(path, func, only_folder = false, orderby = 'none', order = 'none') {
        this.spin_show = true
        if (localStorage['baidupcs_file_sort'] == null) {
            if (orderby === 'none') {
                orderby = 'name'
                order = 'asc'
            }
        } else {
            let names = localStorage['baidupcs_file_sort'].split('-');
            orderby = names[0]
            order = names[1]
        }

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
        this.isCheckAll = false
        this.checkedFiles = []
      },
      setCurrentFolder(data) {
        this.current_folders = data
        this.resetCheckGroup()
      },
      setBreadPath(path) {
        this.bread_item = path.split('/');
        this.bread_item.splice(0, 1);
      },
      openDir(item) {
        if (!item.isdir) return

        this.getPathData(item.path, this.setCurrentFolder)
        this.setBreadPath(item.path)
      },
      clickBreadItem(index) {
        var path = '/';
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
      fileSort(name) {
        localStorage.setItem('baidupcs_file_sort', name)
        let names = name.split('-');
        let cur_dir = "/" + this.bread_item.join('/');
        this.getPathData(cur_dir, this.setCurrentFolder, false, names[0], names[1]);
      },
      addItemToClipboard(method) {
        if (this.checkedFiles.length === 0) {
          this.$Message.warning('请至少选择一个文件或者文件夹')
          return false
        }

        this.clipboard = this.checkedFiles.slice()
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
      async confirmUpload() {
        const curDir = `/${this.bread_item.join('/')}`
        this.globals.pending_upload_data.push(curDir)
        const fileSelect = this.$refs.fileSelect

        if (fileSelect.checkedFiles.length === 0) {
          this.$Message.error('请至少选择一个文件')
          return
        }

        if (this.websocket === null) this.initWS()

        if (this.websocket.readyState !== 1) await utils.sleep(500)

        this.websocket.send(JSON.stringify({
          type: 3,
          paths: fileSelect.checkedFiles,
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
      async getFiles(path) {
        this.spin_show = true
        const Data = [], Data1 = []
        let orderby = '', order = ''
        if (localStorage['baidupcs_file_sort'] == null) {
            orderby = 'name'
            order = 'asc'
        } else {
            let names = localStorage['baidupcs_file_sort'].split('-');
            orderby = names[0]
            order = names[1]
        }
        const result = await $axios.get(`files?path=${encodeURIComponent(path)}&order_by=${orderby}&order=${order}`).catch(this.error)
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
      },
      async getWorkingDir() {
        const result = await $axios.get(`setting?method=get`).catch(this.error)
        let ret = ''
        if (result.data.code !== 0) {
          this.error(result.data.msg)
          return ret
        }
        const data = result.data.data
        for(let i = 0; i < data.length; i++) {
          if(data[i].en_name === 'workdir') {
            ret = data[i].value
          }
        }
        return ret
      },
    },
    async mounted() {
      let path = await this.getWorkingDir()

      if (path !== '') {
        this.setBreadPath(path)
        this.getFiles(path)
      }
    }
  }
</script>
