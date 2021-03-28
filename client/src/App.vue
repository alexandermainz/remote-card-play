<template>
  <div id="app">
    <div class="container-fluid">
      <div class="row" id="header-line"><div class="col-md-12"><h2>Kartenspielserver</h2></div></div>
      <login-form ref="refLoginForm" />

      <div class="row" id="row-play-table">
          <div id="playerlist" class="col-md-2">
              <p>Spieler:</p>
              <ol>
              <li v-for="(player) in players" :key='player.id' v-bind:class="{ playerinround: player.inCurrentRound }">
                {{player.nickname}}
              </li></ol><br>
              <p>Runde {{ getRound() }}</p>
              <p>Nächster:<br><b>{{ getNextPlayerName() }}</b></p>
          </div>
          <div id="playtable" class="col-md-8">
              <table-draws ref="refPlayTable" />
          </div>
          <div id="trickstack" class="col-md-2">
              <p>Stiche:</p>
              <img v-if="hasTricks" src="resources/BACK.svg" class="playingcard tricks" draggable="false">
              <p></p>
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
import axios from 'axios';
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
  data: function() {
    return {
      hasTricks: false,
      players: []
    }
  },
  methods: {
    getHand: function() {
      this.$refs.refCardHand.getHand();
    },
    getPlayers: function() {
      const playerId = this.$cookies.get('user').playerId;
      axios
      .get('/players?playerId='+playerId)
      .then(response => {
        if (response.data.status === undefined) {
          this.players = response.data;
        }
        else {
          this.errorText = "getPlayers(): Error: " + response.data.statustext;
          console.log(response.data);
        }
      })
      .catch(error => {
        console.log(error);
        this.errorText = "There has been an error contacting the card play server. Please try again. We are sorry for the inconvenience!";
      })
    },
    getRound: function() {
      return (this.$refs.refPlayTable && this.$refs.refPlayTable.lastCard ? this.$refs.refPlayTable.lastCard.round : 0);
    },
    getNumPlayersInRound: function() {
      return this.players.filter(elm => elm.inCurrentRound).length;
    },
    getNextPlayerName: function() {
      if (this.$refs.refPlayTable && this.$refs.refPlayTable.lastCard && this.players.length > 0) {
        if (!this.isRoundReady()) {
          const playerId = this.$refs.refPlayTable.lastCard.playedById;
          const indx = this.players.findIndex(elm => elm.id == playerId);
          let nextIndx = (indx+1) % this.players.length;
          while (!this.players[nextIndx].inCurrentRound)
            nextIndx = (nextIndx+1) % this.players.length;
          return this.players[nextIndx].nickname;
        }
        else {
          const winnerCard = this.$refs.refPlayTable.getWinnerCard();
          return (winnerCard.playedBy + " (Stich gemacht!)");
        }
      }

      return "";
    },
    isRoundReady: function() {
      if (this.$refs.refPlayTable && this.$refs.refPlayTable.lastCard && this.players.length > 0)
        if (this.$refs.refPlayTable.currentDraw.length >= this.getNumPlayersInRound())
          return true;
      return false;
    },
    playCard: function(handCard) {
      axios
      .put('/playhand/'+handCard.id)
      .then(response => {
        if (response.data.status === "OK") {
          const drawId = response.data.drawId;
          console.log("drawed: " + drawId);
          this.$refs.refPlayTable.getDraws();
        }
        else {
          this.errorText = "playCard(): Error: " + response.data.statustext;
          console.log(response.data);
        }
      })
      .catch(error => {
        console.log(error);
        this.errorText = "There has been an error contacting the card play server. Please try again. We are sorry for the inconvenience!";
      })

    }
  },
  sockets: {
    connect() {
      // Fired when the socket connects.
      console.log("socket connected");
    },

    disconnect() {
      console.log("socket disconnect");
    },

    // Fired when the server sends something on the "messageChannel" channel.
    refreshTable(data) {
      this.$refs.refPlayTable.getDraws();
    }
  },
  computed: {
  },
  mounted: function() {
    console.log("Vue app created.");
    const cookie = this.$cookies.get('user');
    if (cookie && cookie.playerId > 0) {
      this.$refs.refLoginForm.displayLogin = "none";
      this.$refs.refCardHand.getHand();
      this.$refs.refPlayTable.getDraws();
      this.getPlayers();
    }
  }
}
</script>

<style>
ol {
  padding-inline-start: 25px;
}

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

.playerinround {
  font-size: larger;
  font-weight: bold;
}

.playerinturn {
  color: greenyellow;
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

img.tricks {
    max-width: 200px;
    width: 100%;
}
</style>
