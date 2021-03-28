/*
 * https://cli.vuejs.org/guide/
 * https://travishorn.com/getting-started-with-vue-single-file-components-f29765a771a3 für später?
 * https://github.com/axios/axios#axiosgeturl-config
 * https://www.npmjs.com/package/vue-cookies
 * https://www.npmjs.com/package/vue-socket.io
 */

import Vue from 'vue'
import App from './App.vue'
import VueCookies from 'vue-cookies'
import axios from 'axios'
import VueSocketIO from 'vue-socket.io'

Vue.use(VueCookies)
Vue.use(axios);
Vue.use(new VueSocketIO({
  debug: true,
  connection: 'http://localhost:80'
}));

Vue.config.productionTip = false

Vue.$cookies.config("7d", "/", "", "", "Strict");  // default: expireTimes = 1d, path = '/', domain = '', secure = '', sameSite = 'Lax'

//const apiUrl = 'https://api-cardplay.ash-soft.de';
axios.defaults.baseURL = 'http://localhost:80';

var TheApp = new Vue({
  render: function (h) { return h(App) },
}).$mount('#app')
