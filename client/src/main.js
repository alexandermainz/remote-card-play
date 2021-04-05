/*
 * https://cli.vuejs.org/guide/
 * https://travishorn.com/getting-started-with-vue-single-file-components-f29765a771a3 für später?
 * https://github.com/axios/axios#axiosgeturl-config
 * https://www.npmjs.com/package/vue-axios
 * https://www.npmjs.com/package/vue-cookies
 * https://www.npmjs.com/package/vue-socket.io
 * https://bootstrap-vue.org/docs/
 * https://www.npmjs.com/package/vuejs-jwt
 */

import Vue from 'vue'
import App from './App.vue'
import VueCookies from 'vue-cookies'
import axios from 'axios'
import VueAxios from 'vue-axios'
import VueSocketIO from 'vue-socket.io'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import VueJWT from 'vuejs-jwt'

Vue.use(VueCookies)
Vue.use(VueAxios, axios);
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

const serverURL = process.env.VUE_APP_SERVER_URL;
Vue.use(new VueSocketIO({
  debug: false,
  connection: serverURL
}));

//Vue.config.productionTip = false;
console.log(serverURL, process.env.NODE_ENV, process.env.BASE_URL)

const jwtPublicKey = Buffer.from(process.env.VUE_APP_JWT_PUBLIC_KEY, 'base64').toString('ascii');
Vue.use(VueJWT, {
  signKey: jwtPublicKey,
  storage: "cookie",
  keyName: "jwtauth",
});

Vue.$cookies.config("7d", "/", "", "", "Strict");  // default: expireTimes = 1d, path = '/', domain = '', secure = '', sameSite = 'Lax'

axios.defaults.baseURL = serverURL;
axios.defaults.withCredentials = true;

var TheApp = new Vue({
  render: function (h) { return h(App) },
}).$mount('#app')
