/*
 * https://travishorn.com/getting-started-with-vue-single-file-components-f29765a771a3 für später?
 * https://github.com/axios/axios#axiosgeturl-config
 * https://www.npmjs.com/package/vue-cookies
 */

Vue.$cookies.config("7d", "/", "", "", "Strict");  // default: expireTimes = 1d, path = '/', domain = '', secure = '', sameSite = 'Lax'

//const apiUrl = 'https://api-cardplay.ash-soft.de';
axios.defaults.baseURL = 'http://localhost:80';

var LoginForm = Vue.component('login-form', {
    data: function() {
        return {
            displayLogin: "flex",
            errorText: "",
            showWaitSpinner: false,
            user: "",
            pass: ""
        }
    },
    methods: {
        doLogin: function() {
            //console.log(this.user);
            this.showWaitSpinner = true;
            this.errorText = "";
            axios
            .post('/login', { email: this.user, pass: this.pass })
            .then(response => {
                if (response.data.status === undefined) {
                    Vue.$cookies.set('user', { id: response.data.playerId, token: "" });
                    this.displayLogin = "none";
                }
                else {
                    this.errorText = "Ein Fehler ist aufgetreten: " + response.data.statustext;
                    console.log(response);
                }
            })
            .catch(error => {
                console.log(error);
                if (error.response && error.response.status === 401)
                    this.errorText = error.response.data.statustext;
                else
                    this.errorText = "There has been an error contacting the card play server. Please try again. We are sorry for the inconvenience!";
            })
            .finally(() => this.showWaitSpinner = false)

        }
    }
});

var CardHand = Vue.component('card-hand', {
    data: function() {
      return {
          errorText: "Hello World!",
          showWaitSpinner: false,
          playersHand: []
      }
    },
    methods: {
        getHand: function() {
            console.log("getHand("+this.playerId+")");
            axios
            .get('/player/1/hand')
            .then(response => {
              if (response.data.status === undefined) {
                this.playersHand = response.data;
                this.errorText = "Loaded " + this.playersHand.length;              
              }
              else {
                this.errorText = "getHand(): Error: " + response.data.statustext;
                console.log(response.data);
              }
            })
            .catch(error => {
              console.log(error);
              this.errorText = "There has been an error contacting the card play server. Please try again. We are sorry for the inconvenience!";
            })
            .finally(() => this.showWaitSpinner = false)
        },
        cardClicked: function(index) {
            console.log("Card clicked: " + index);
            if (!this.playersHand[index].clicked)
            {
                this.playersHand.forEach((card, index, arr) => card.clicked = 0 );
                this.playersHand[index]["clicked"] = 1;
            }
            else
                console.log("TODO play card");
        },
        startDrag: (evt, item) => {
            evt.dataTransfer.dropEffect = 'move'
            evt.dataTransfer.effectAllowed = 'move'
            evt.dataTransfer.setData('itemID', item.id)
        },
        onDrop (evt, toIndex) {
            const itemID = evt.dataTransfer.getData('itemID')
            const itemIndex = this.playersHand.findIndex(item => item.id == itemID)
            const tausch = this.playersHand[itemIndex];
            this.playersHand.splice(itemIndex, 1);
            this.playersHand.splice(toIndex, 0, tausch);
        }
    }
});

var RemoteCardPlay = new Vue({
    el: '#remote-card-play',
    data: {
        playerId: 1  //temp
    },
    components: {
        'card-hand': CardHand,
        'login-form': LoginForm
    },
    mounted: function() {
        console.log("Vue created.");
        this.$refs.refCardHand.getHand();
    }
});
