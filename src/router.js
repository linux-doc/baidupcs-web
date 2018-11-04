import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Login from './views/Login'
import Nav from './components/Nav'
import Lock from './views/Lock.vue'

Vue.use(Router)

const router = new Router({
  // mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      components: {
        default: Home,
        nav: Nav
      }
    },
    { path: '/login', component: Login },
    { path: '/lock', component: Lock },
    {
      path: '/download',
      components: {
        default: () => import(/* webpackChunkName: "download" */ './views/Download'),
        nav: Nav
      }
    }
  ]
})

/*router.beforeEach((to, from, next) => {
  iView.LoadingBar.start()
  Util.title(to.meta.title)
  next()
})

router.afterEach((to, from, next) => {
  iView.LoadingBar.finish()
  window.scrollTo(0, 0)
})*/

export default router