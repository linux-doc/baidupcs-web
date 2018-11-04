<template>
  <div id="app">
    <router-view name="nav"/>
    <router-view/>
  </div>
</template>
<script>
  import {mapState} from 'vuex'

  export default {
    data() {
      return {
        isShowLockModal: true,
        lockPwd: ''
      }
    },
    computed: {
      ...mapState(['login', 'isLock'])
    },
    created() {
      if (!this.login) {
        this.$router.push('/login')
      } else if (this.isLock) {
        this.$router.push('/lock')
      }
    }
  }
</script>