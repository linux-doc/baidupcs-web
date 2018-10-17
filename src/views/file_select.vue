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
                    <Checkbox
                            :indeterminate="indeterminate"
                            :value="checkAll"
                            @click.prevent.native="handleCheckAll"><span></span>
                    </Checkbox>
                </Col>
                <Col span="11">文件名</Col>
                <Col span="4">大小</Col>
                <Col span="8">修改时间</Col>
            </Row>
            <Row class="file_list" @dblclick.native="DClickFolder(item)"
                 v-for="item in fileData">
                <Col span="1">
                    <Checkbox :label="item.path"><span></span></Checkbox>
                </Col>
                <Col span="11">
                    <div :title="item.name" style="overflow-x: hidden;text-overflow:ellipsis;white-space: nowrap;">
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
    import axios from 'axios'
    import pcsConfig from '../config/pcsconfig.js'
    export default {
        name: "file_select",
        data() {
            return {
                base_url: pcsConfig.base_url,
                checkAll: false,
                indeterminate: false,
                fileData: [],
                checkGroup: [],
                curPath: ""
            }
        },
        props: ['global_data'],
        watch: {
            'global_data.press_back_key'(cur_val) {
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

                    this.global_data.press_back_key = false;
                }
            },
            'global_data.send_upload_signal'(cur_val) {
                if (cur_val === 1) {
                    for (; this.global_data.pending_upload_data.length > 1;) {
                        this.global_data.pending_upload_data.pop();
                    }
                    for (let i = 0; i < this.checkGroup.length; i++) {
                        this.global_data.pending_upload_data.push(this.checkGroup[i]);
                    }
                    this.global_data.send_upload_signal = 2;
                }
                if (cur_val === 2) {
                    this.checkGroup = [];
                    this.indeterminate = false;
                }
            }
        },
        methods: {
            getFileList(path) {
                this.checkGroup = [];
                this.indeterminate = false;
                axios.get(this.base_url + 'api/v1/local_file?method=list&path=' + encodeURIComponent(path))
                    .then(result => {
                        if (result.data.code === 0) {
                            this.fileData = result.data.data;
                            let tpath = this.fileData[0].path;
                            this.curPath = tpath.substring(0, tpath.lastIndexOf('/'));
                        } else {
                            this.$Message.error({
                                content: result.data.msg,
                                duration: 10
                            });
                        }
                    })
                    .catch(reason => {
                        this.$Message.error({
                            content: '与服务器联系断开 ' + reason.toString(),
                            duration: 10
                        });
                    });
            },
            checkAllGroupChange(data) {
                if (data.length === this.fileData.length) {
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
            handleCheckAll() {
                if (this.indeterminate) {
                    this.checkAll = false;
                } else {
                    this.checkAll = !this.checkAll;
                }
                this.indeterminate = false;

                if (this.checkAll) {
                    var tmp = [];
                    for (var i = 0; i < this.fileData.length; i++) {
                        tmp.push(this.fileData[i].path)
                    }
                    this.checkGroup = tmp;
                } else {
                    this.checkGroup = [];
                }
            },
            DClickFolder(item) {
                this.getFileList(item.path)
            },
            searchPath() {
                this.getFileList(this.curPath)
            },
        },
        mounted() {
            this.getFileList('.')
        },
    }
</script>

<style scoped>

</style>