<template>
<div class="row" id="loginform" v-bind:style="{ display: displayLogin }">
    <div class="col-md-3"><h3>Anmeldung</h3></div>
    <div class="col-md-5">
            <form class="form-floating">
            <div class="form-floating">
                <label for="input-username" class="form-label">Benutzername:</label>
                <input id="input-username" class="form-control" type="text" v-model="user" name="user" placeholder="">
            </div>
            <div class="form-floating">
                <label for="input-password" class="form-label">Kennwort:</label>
                <input id="input-password" class="form-control" type="password" v-model="pass" name="pass" placeholder="">
            </div><br>
            <div class="form-floating">
                <button type="button" class="btn btn-outline-success" v-on:click="doLogin()">Anmelden</button>
                <p>{{errorText}}</p>
            </div></form>
    </div>
    <div class="col-md-4"></div>
</div>
</template>

<script>
export default {
  name: 'LoginForm',
  props: {
    msg: String
  },
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
        this.showWaitSpinner = true;
        this.errorText = "";
        this.axios
        .post('/login', { email: this.user, pass: this.pass })
        .then(response => {
            if (response.data.status === undefined) {
                localStorage.setItem('jwtauth', response.data.token);
                this.$parent.playerId = response.data.playerId;
                this.$parent.playerNick = response.data.nickname;
                this.displayLogin = "none";
                this.$parent.refresh();
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
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
form {
    margin-bottom: 10px;
}

label {
    margin-top: 3px;
}

button {
    margin-inline-start: 10px;
}
</style>
