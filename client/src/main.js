/*
 * https://travishorn.com/getting-started-with-vue-single-file-components-f29765a771a3 für später?
 * https://github.com/axios/axios#axiosgeturl-config
 * https://www.npmjs.com/package/vue-cookies
 */

import Vue from 'vue'
import App from './App.vue'
import VueCookies from 'vue-cookies'
import axios from 'axios'

Vue.use(VueCookies)
Vue.use(axios);

Vue.config.productionTip = false

Vue.$cookies.config("7d", "/", "", "", "Strict");  // default: expireTimes = 1d, path = '/', domain = '', secure = '', sameSite = 'Lax'

//const apiUrl = 'https://api-cardplay.ash-soft.de';
axios.defaults.baseURL = 'http://localhost:80';

var TheApp = new Vue({
  render: function (h) { return h(App) },
}).$mount('#app')
