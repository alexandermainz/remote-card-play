<template>
  <div id="app">
    <div class="container-fluid">
      <div class="row" id="header-line"><div class="col-md-12"><h2>Kartenspielserver</h2></div></div>
      <login-form />

      <div class="row" id="row-play-table">
          <div id="playerlist" class="col-md-2">
              <p>Spieler:</p>
          </div>
          <div id="playtable" class="col-md-7">
              <table-draws ref="refPlayTable" />
          </div>
          <div id="trickstack" class="col-md-3">
              
          </div>
      </div>

      <div id="playershand" class="row"><div class="col-md-12">
      <card-hand ref="refCardHand" />
      </div></div>
      <div class="row"><div class="col-md-12"><p>Fusszeile.</p></div></div>
    </div>
  </div>
</template>

<script>
import LoginForm from './components/LoginForm.vue'
import CardHand from './components/CardHand.vue'
import TableDraws from './components/TableDraws.vue'

export default {
  name: 'App',
  components: {
    LoginForm,
    CardHand,
    TableDraws
  },
  methods: {
    getHand: function() {
      this.$refs.refCardHand.getHand();
    }
  }/*,
  mounted: function() {
    console.log("Vue app created.");
    this.$refs.refCardHand.getHand();
  }*/
}
</script>

<style>
#header-line {
    background-color: lightblue;
    margin-bottom: 10px;
}

.right {
    text-align: right;
}

.center {
    text-align: center;
}

#playershand {
    margin-top: 0.5cm;
}

#playtable {
    background-color: azure;
}

#playerlist {
    background-color: beige;
}

#trickstack {
    background-color: darkgrey;
}

img.playingcard {
    border: 1px solid black;
}
</style>
