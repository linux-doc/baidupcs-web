<template>
    <Layout>
        <Modal
                v-model="modalFlag"
                @on-visible-change="modelVisible">
            <FileSelectComponent :global_data="global_data"></FileSelectComponent>
            <div slot="footer">
                <Button type="success" long @click="confirmUpload">
                    <Icon type="md-cloud-upload"></Icon>
                    上传
                </Button>
            </div>
        </Modal>
        <Sider :width="300" hide-trigger style="padding: 10px;overflow-y: auto;overflow-x: hidden;background: #fff">
            <Tree :data="folders" :load-data="loadData" @on-select-change="treeSelect"></Tree>
        </Sider>
        <Layout :style="{padding: '0 24px 24px'}">
            <Breadcrumb :style="{margin: '24px 0'}">
                <BreadcrumbItem to="/" @click.native="clickBreadItem(-1)">
                    <Icon type="ios-home-outline"></Icon>
                    主目录
                </BreadcrumbItem>
                <BreadcrumbItem to="/" @click.native="clickBreadItem(index)" v-for="(item, index) in bread_item">
                    {{item}}
                </BreadcrumbItem>
            </Breadcrumb>
            <Content
                    :style="{position: 'relative', padding: '24px', overflow: 'hidden', minHeight: '280px', background: '#fff'}">
                <Spin size="large" fix v-if="spin_show"></Spin>
                <Row :gutter="12">
                    <Col span="7">
                        <Checkbox
                                :indeterminate="indeterminate"
                                :value="checkAll"
                                @click.prevent.native="handleCheckAll">全选
                        </Checkbox>
                        <Button @click="changeViewMode" type="text">
                            <Icon type="md-reorder" size="24" v-if="files_view_mode === 1"></Icon>
                            <Icon type="md-apps" size="24" v-if="files_view_mode === 2"></Icon>
                        </Button>
                        <Dropdown @on-click="fileSort" style="margin-right: 16px;">
                            <a href="javascript:void(0)">
                                <Icon type="md-swap" size="24"></Icon>
                            </a>
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
                        <Button style="margin-top: 8px" @click="offlineDownload">
                            <Icon type="md-link"></Icon>
                            离线下载
                        </Button>
                    </Col>
                    <Col span="17" style="text-align: right;">
                        <ButtonGroup>
                            <Button @click="addItemToClipboard('copy')">
                                <Icon type="md-copy"></Icon>
                                复制
                            </Button>
                            <Button @click="addItemToClipboard('move')">
                                <Icon type="md-cut"></Icon>
                                剪切
                            </Button>
                            <Button @click="pasteClipboard">
                                <Icon type="md-clipboard"></Icon>
                                粘贴
                            </Button>
                            <Button @click="shareFiles">
                                <Icon type="md-share"></Icon>
                                分享
                            </Button>
                            <Button type="info" @click="mkdirFunc">
                                <Icon type="md-add"></Icon>
                                新建
                            </Button>
                            <Button type="error" @click="removeFiles">
                                <Icon type="md-trash"></Icon>
                                删除
                            </Button>
                            <Button type="success" @click="uploadClick">
                                <Icon type="md-cloud-upload"></Icon>
                                上传
                            </Button>
                            <Button type="primary" @click="downloadFiles">
                                <Icon type="md-download"></Icon>
                                下载
                            </Button>
                        </ButtonGroup>
                    </Col>
                </Row>
                <Divider/>
                <div class="icons">
                    <CheckboxGroup style="overflow: auto; height: 100%;" v-model="checkGroup"
                                   @on-change="checkAllGroupChange">
                        <Card v-show="files_view_mode === 1" :bordered="false" class="icons-item"
                              @dblclick.native="DClickFolder(item)" v-for="item in current_folders">
                            <Checkbox :label="item.path" style="position: absolute; top: 0; left: 0;"><span></span>
                            </Checkbox>
                            <Icon type="ios-folder-outline" size="32" v-if="item.isdir"/>
                            <Icon type="ios-document" size="32" v-if="!item.isdir"/>
                            <p style="overflow: hidden;">{{item.title}}</p>
                        </Card>
                        <div v-show="files_view_mode === 2">
                            <Row style="margin-bottom: 10px">
                                <Col span="15" offset="1">文件名</Col>
                                <Col span="3">大小</Col>
                                <Col span="5">修改时间</Col>
                            </Row>
                            <Row class="file_list" @dblclick.native="DClickFolder(item)"
                                 v-for="item in current_folders">
                                <Col span="1">
                                    <Checkbox :label="item.path"><span></span></Checkbox>
                                </Col>
                                <Col span="13" style="overflow: hidden;white-space: nowrap;">
                                    <Icon type="ios-folder-outline" size="24" v-if="item.isdir"/>
                                    <Icon type="ios-document" size="24" v-if="!item.isdir"/>
                                    {{item.title}}
                                </Col>
                                <Col span="2">
                                    <Button @click="jumpToFolder(item.folder)" v-if="item.folder" type="success"
                                            size="small" ghost>
                                        <Icon type="ios-redo"/>
                                        目录
                                    </Button>
                                    <span v-if="!item.folder">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </span>
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
    import axios from 'axios'
    import FileSelectComponent from './file_select'
    import pcsConfig from '../config/pcsconfig.js'
    import utils from '../libs/util'
    export default {
        name: "file_manager",
        data() {
            return {
                spin_show: false,
                base_url: pcsConfig.base_url,
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
                clipboard_method: "",
                checkAll: false,
                indeterminate: false,
                new_folder_name: "",
                modalFlag: false,
                searchKey: "",
                downloadLink: "",
            }
        },
        components: {FileSelectComponent},
        props: ['global_data'],
        methods: {
            getPathData(path, func, only_folder = false, orderby = 'name', order = 'asc') {
                this.spin_show = true;
                var Data = [];
                axios.get(this.base_url + 'api/v1/files?path=' + encodeURIComponent(path) + '&order_by=' + orderby + '&order=' + order)
                    .then(result => {
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
                    });
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
            DClickFolder(item) {
                if (!item.isdir) {
                    return;
                }

                this.getPathData(item.path, this.setCurrentFolder);
                this.setBreadPath(item.path);
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
                    this.$Message.warning('请至少选择一个文件或者文件夹');
                    return false;
                }

                this.clipboard = this.checkGroup.slice();
                this.clipboard_method = method;
                return true;
            },
            pasteClipboard(add_cur_dir = true) {
                var paths = this.clipboard.join('|');
                var cur_dir = "/" + this.bread_item.join('/');
                if (add_cur_dir) {
                    paths += '|' + cur_dir;
                }
                axios.get(this.base_url + 'api/v1/file_operation?method=' + this.clipboard_method + '&paths=' + encodeURIComponent(paths))
                    .then(result => {
                        if (result.data.code !== 0) {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10
                            });
                        } else {
                            this.getPathData(cur_dir, this.setCurrentFolder);
                        }
                    });
            },
            removeFiles() {
                this.$Modal.confirm({
                    title: '确认删除吗?',
                    content: '<p>将会把文件移至百度云回收站</p>',
                    okText: '确认',
                    cancelText: '取消',
                    onOk: () => {
                        this.addItemToClipboard('remove');
                        this.pasteClipboard(false);
                        this.resetCheckGroup();
                    }
                });
            },
            uploadClick() {
                this.modalFlag = true;
            },
            pressBackKey(e) {
                if (e.keyCode === 8) {
                    this.global_data.press_back_key = true;
                }
            },
            modelVisible(v) {
                if (v) {
                    window.addEventListener('keydown', this.pressBackKey)
                } else {
                    window.removeEventListener('keydown', this.pressBackKey)
                }
            },
            confirmUpload() {
                let cur_dir = "/" + this.bread_item.join('/');
                this.global_data.pending_upload_data.push(cur_dir);
                this.global_data.send_upload_signal = 1;
                this.modalFlag = false;
            },
            downloadFiles() {
                if (this.addItemToClipboard('') === false) {
                    return
                }
                for (let i = 0; i < this.clipboard.length; i++) {
                    this.global_data.pending_download_data.push(this.clipboard[i])
                }
                this.global_data.send_download_signal = true;
                this.$Message.success('已经添加到下载队列!');
                this.resetCheckGroup();
            },
            shareFiles() {
                if (this.addItemToClipboard('') === false) {
                    return
                }
                let paths = "";
                for (let i = 0; i < this.clipboard.length; i++) {
                    paths += this.clipboard[i] + "|";
                }
                paths = paths.substr(0, paths.length - 1);
                axios.get(this.base_url + 'api/v1/share?method=set&paths=' + encodeURIComponent(paths))
                    .then(result => {
                        if (result.data.code === 0) {
                            this.$Message.success({
                                content: '分享成功, 链接: ' + result.data.msg,
                                duration: 10
                            });
                            this.resetCheckGroup();
                            this.global_data.share_refresh = true;
                        } else {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10
                            });
                        }
                    });
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
                    onOk: () => {
                        var cur_dir = "/" + this.bread_item.join('/');
                        var new_folder = cur_dir + "/" + this.new_folder_name;
                        console.log(new_folder);
                        axios.get(this.base_url + 'api/v1/mkdir?path=' + encodeURIComponent(new_folder))
                            .then(result => {
                                this.$Modal.remove();
                                this.new_folder_name = "";
                                if (result.data.code !== 0) {
                                    this.$Message.error({
                                        content: result.data.msg,
                                        duration: 10
                                    });
                                } else {
                                    this.getPathData(cur_dir, this.setCurrentFolder);
                                }
                            });
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
            searchKeyword() {
                if (this.searchKey === "") {
                    this.$Message.warning('请输入搜索关键字');
                    return;
                }

                this.spin_show = true;
                let cur_dir = "/" + this.bread_item.join('/');
                axios.get(this.base_url + 'api/v1/search?tpath=' + encodeURIComponent(cur_dir) + '&keyword=' + this.searchKey)
                    .then(result => {
                        this.spin_show = false;
                        const fdata = result.data.data;
                        let Data = [];
                        for (var i = 0; i < fdata.length; i++) {
                            var fd = fdata[i];
                            let folder = fd.Path.substring(0, fd.Path.lastIndexOf('/'));
                            Data.push({
                                path: fd.Path,
                                title: fd.Filename,
                                folder: folder,
                                isdir: false,
                                size: utils.bytesToSize(fd.Size),
                                mtime: utils.formatDateTime(fd.Mtime * 1000),
                                ctime: utils.formatDateTime(fd.Ctime * 1000),
                            });
                        }
                        this.setCurrentFolder(Data);
                    });
            },
            jumpToFolder(folder) {
                this.getPathData(folder, this.setCurrentFolder);
                this.setBreadPath(folder);
            },
            offlineDownload() {
                this.$Modal.confirm({
                    render: (h) => {
                        return h('Input', {
                            props: {
                                value: this.downloadLink,
                                autofocus: true,
                                placeholder: '下载到百度云当前目录, 支持http/https/ftp/电驴/磁力链协议'
                            },
                            on: {
                                input: (val) => {
                                    this.downloadLink = val;
                                }
                            }
                        })
                    },
                    loading: true,
                    okText: '确认',
                    cancelText: '取消',
                    onOk: () => {
                        let cur_dir = "/" + this.bread_item.join('/');
                        axios.get(this.base_url + 'api/v1/offline_download?method=add&link=' + encodeURIComponent(this.downloadLink) + '&tpath=' + encodeURIComponent(cur_dir))
                            .then(result => {
                                this.$Modal.remove();
                                this.downloadLink = "";
                                if (result.data.code !== 0) {
                                    this.$Message.error({
                                        content: result.data.msg,
                                        duration: 10
                                    });
                                } else {
                                    this.$Message.success('任务添加成功, ID:' + result.data.msg);
                                }
                            });
                    }
                });
            }
        },
        mounted() {
            this.spin_show = true;
            var Data = [];
            var Data1 = [];
            axios.get(this.base_url + 'api/v1/files?path=/')
                .then(result => {
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
                            Data1.push({
                                path: fd.path,
                                title: fd.server_filename,
                                isdir: true,
                                size: utils.bytesToSize(fd.size),
                                mtime: utils.formatDateTime(fd.server_mtime * 1000),
                                ctime: utils.formatDateTime(fd.server_ctime * 1000),
                                loading: false,
                                children: []
                            });
                        } else {
                            Data.push({
                                path: fd.path,
                                title: fd.server_filename,
                                isdir: false,
                                size: utils.bytesToSize(fd.size),
                                mtime: utils.formatDateTime(fd.server_mtime * 1000),
                                ctime: utils.formatDateTime(fd.server_ctime * 1000),
                            });
                        }
                    }
                    this.folders[0].children = Data1;
                    this.current_folders = Data;
                });
        }
    }
</script>

<style scoped>
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
    }

    .file_list {
        padding-top: 12px;
    }

    .file_list:hover {
        box-shadow: 0 1px 6px rgba(0, 0, 0, .2);
        border-color: #eee;
    }
</style>