<template>
  <Layout>
    <Modal v-model="isShowModal" :width="800">
      <i-input type="password" placeholder="输入锁定密码" v-model="lockPwd"></i-input>
      <div slot="footer">
        <Button type="info" @click="lock">确认</Button>
      </div>
    </Modal>
  </Layout>
</template>

<script>
  export default {
    data() {
      return {
        isShowModal: true,
        lockPwd: ''
      }
    },
    methods: {
      async lock() {
        const body = await $axios.get(`password?method=verify&password=${this.lockPwd}`).catch(this.error)
        if (body === undefined) return

        if (body.data.code === 0) {
          if (body.data.data) {
            this.$router.push('/')
            localStorage.lastUnlockTime = new Date().getTime()
          } else {
            this.$Message.error('密码错误')
          }
        }
      }
    }
  }
</script>