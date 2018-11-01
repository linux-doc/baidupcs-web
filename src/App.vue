<template>
  <div id="app">
    <router-view name="nav"/>
    <router-view/>
  </div>
</template>
<script>
  import {mapState} from 'vuex'

  export default {
    computed: {
      ...mapState(['login'])
    },
    created() {
      if (!this.login) this.$router.push('/login')
    }
  }
</script>