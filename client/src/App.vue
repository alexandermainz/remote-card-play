<template>
  <div id="app">
    <div class="container-fluid">
      <div class="row alert-danger" v-if="errorText != ''">{{ errorText }}</div>
      <div class="row" id="header-line"><div class="col-md-9">
        <img id="favicon" style="margin: 3px;" src="favicon.png" align="left">
        <h2 style="line-height: 66px;">KartenPlayer.de</h2>
      </div><div class="col-md-3" style="align-self: flex-end;">
        <p class="text-right align-bottom"><span class="link" v-on:click="logout()">Abmelden</span></p>
        <p class="text-right align-bottom"><span class="link" v-on:click="changePassword()">Kennwort ändern</span></p>
      </div></div>
      
      <login-form ref="refLoginForm" />

      <change-password ref="refChangePassword" />

      <div class="row" id="row-play-table">
          <div id="playerlist" class="col-md-2">
            <p>Spieler:</p>
            <ol>
            <li v-for="(player) in players" :key='player.id' v-bind:class="{ playerinround: player.inCurrentRound }">
              {{player.nickname}}
            </li></ol>
            <p>Runde {{ getRound() }}</p>
            <p>Nächster:<br><b>{{ getNextPlayerName() }}</b></p>
            <div v-if="isGameReady()" style="margin-bottom: 10px;">
              <b-button variant="outline-success" size="sm" v-b-modal.choosePlayers>Neu geben</b-button>
            </div>
          </div>

          <div id="playtable" class="col-md-8">
              <table-draws ref="refPlayTable" />
          </div>

          <div id="trickstack" class="col-md-2">
              <p>Stiche von {{ playerNick }}:</p>
              <img v-if="hasTricks" v-on:click="tricksClicked()" src="resources/BACK.svg" class="playingcard tricks" draggable="false">
              <p></p>
              <div v-if="myPoints > -1" class="mypoints">Punkte: {{ myPoints }}</div>
          </div>
      </div>

      <div id="playershand" class="row"><div class="col-md-12">
        <card-hand ref="refCardHand" />
      </div></div>

      <div class="row" style="margin-top: 20px;"><div class="col-md-12">
        <div>
          <b-button v-b-toggle.collapse-1 size="sm" variant="outline-info">Anleitung
            <span class="when-closed"><b-icon icon="chevron-down" aria-hidden="true"></b-icon></span>
            <span class="when-open"><b-icon icon="chevron-up" aria-hidden="true"></b-icon></span>
          </b-button>
          <b-collapse id="collapse-1" class="mt-2">
            <b-card>
              <p class="card-text">Sortiere die Karten auf Deiner Hand mittels "Drag & Drop" (Klicken und ziehen).</p>
              <p class="card-text">Klicke auf eine Karte um sie zu selektieren, klicke auf die selektierte Karte, um diese auszuspielen.</p>
              <p class="card-text">Deine gespielte Karte kannst Du zurücknehmen, so lange der nächste Spieler noch nicht ausgespielt hat. Klicke hierzu auf Deine Karte auf dem Spieltisch.</p>
              <p class="card-text">Du kannst jederzeit den letzten Stich nochmal aufrufen, indem Du auf den Stichestapel rechts neben dem Spieltisch klickst. Alle Mitspieler sehen dann den letzten Stich auf dem Spieltisch. Mit Klick auf eine Karte auf dem Tisch kannst Du den letzten Stich wieder verbergen. Bitte beachte: Wenn Dein Display sehr schmal ist, werden die einzelnen Bereiche automatisch untereinander anstatt nebeneinander angeordnet.</p>
              <p class="card-text">Wenn Du einen Stich gemacht hast, klicke auf eine Karte auf dem Kartentisch, um den Stich an Dich zu nehmen. Falls Deine Karte die latze Karte in dem Stich war, wird KartenPlayer Dich sicherheitshalber fragen, ob Du den Stich nehmen oder die gespielte Karte zurücknehmen möchtest.</p>
              <p class="card-text">Links neben dem Spieltisch siehst Du die Namen aller Spieler am Spieltisch sowie die Reihenfolge, in der die Spieler am Tisch sitzen. Die Teilnehmer am aktuellen Spiel sind <b>fett</b> gedruckt. Unter der Namensliste wird angezeigt, wer als nächster am Zug ist.</p>
              <p class="card-text">Ist das aktuelle Spiel zuende, kannst Du Deine Punkte zählen, indem Du auf Deinen Stichestapel klickst. Unter der Namensliste erscheint ein Button zum neuen Geben der Karten.</p>
              <p class="card-text">Beim Geben kannst Du ankreuzen, welche Spieler am Spieltisch im nächsten Spiel Karten bekommen sollen.</p>
            </b-card>
          </b-collapse>
        </div>
        <br><br>
      </div></div>

      <b-modal id="choosePlayers" title="Spieler auswählen" @ok="createNewGame">
        <template #modal-cancel="{}">Abbrechen</template>
        <template #modal-ok="{}">Karten geben</template>
        <div class="modal-body">An wen sollen Karten gegeben werden?<br>
          <b-form-checkbox-group
          id="checkbox-group"
          v-model="selectedPlayers"
          name="flavour-2"
          >
            <b-form-checkbox
            v-for="(player) in players" :key='player.id' v-bind:value="player.id">{{player.nickname}}</b-form-checkbox>
          </b-form-checkbox-group>
        </div>
      </b-modal>      

  </div>
</div>
</template>

<script>
import LoginForm from './components/LoginForm.vue'
import CardHand from './components/CardHand.vue'
import TableDraws from './components/TableDraws.vue'
import ChangePassword from './components/ChangePassword.vue'

export default {
  name: 'App',
  components: {
    LoginForm,
    CardHand,
    TableDraws,
    ChangePassword
  },
  data: function() {
    return {
      errorText: '',
      hasTricks: false,
      players: [],
      playerNick: '',
      playerId: 0,
      selectedPlayers: [],
      myPoints: -1
    }
  },
  methods: {
    refresh: function() {
      this.$refs.refCardHand.getHand();
      this.$refs.refPlayTable.getDraws();
      this.getPlayers();
    },
    getPlayers: function() {
      this.axios
      .get('/players?playerId='+this.playerId)
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
      if (this.$refs.refPlayTable)
        return this.$refs.refPlayTable.getCurrentRound();
      else
        return 0;
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
    isGameReady: function() {
      if (this.players && this.players.length > 0 &&
          this.$refs.refPlayTable && this.$refs.refPlayTable.currentDraw.length == 0 &&
          this.$refs.refCardHand.playersHand.length == 0 && 
          this.players.find(pl => pl.id == this.playerId).inCurrentRound) {
        return true;
      }
      else
        return false;
    },
    playCard: function(handCard) {
      this.axios
      .put('/playhand/'+handCard.id)
      .then(response => {
        if (response.data.status === "OK") {
          const drawId = response.data.drawId;
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
    },
    createNewGame: function() {
      this.axios
      .post('/createGame', { giverId: this.playerId, players: this.selectedPlayers })
      .then(response => {
        if (response.status === 204) {
          console.log("new game created.");
          localStorage.removeItem('handsort');
          this.myPoints = -1;
          this.refresh();
        }
        else {
          this.errorText = "createNewGame(): Error: " + response.data.statustext;
          console.log(response.data);
        }
      })
      .catch(error => {
        console.log(error);
        this.errorText = "There has been an error contacting the card play server. Please try again. We are sorry for the inconvenience!";
      })
    },
    tricksClicked: function() {
      if (this.isGameReady()) {
        // count points
        this.myPoints = this.$refs.refPlayTable.getPoints();
      }
      else {
        // show last trick
        this.axios
        .get('/showlast')
        .then(response => {
          if (response.status !== 200) {
            this.errorText = "showlast(): Error: " + response.data.statustext;
            console.log("Error!", response.data);
          }
        })
      }
    },
    logout: function() {
      this.$cookies.remove('jwtauth');
      this.playerId = 0;
      this.nickname = '';
      this.$refs.refLoginForm.displayLogin = "flex";
    },
    changePassword: function() {
      this.$refs.refChangePassword.display = "flex";
    }
  },
  sockets: {
    connect() {
      // Fired when the socket connects.
      //console.log("socket connected");
    },

    disconnect() {
      //console.log("socket disconnect");
    },

    // Fired when the server sends something on the "refreshTable" channel.
    refreshTable(data) {
      this.$refs.refPlayTable.getDraws();
    }
  },
  computed: {

  },
  mounted: function() {
    console.log("Vue app created. Try to get playerId and Nickname from JWT...");
    const jwtAuth = this.$cookies.get('jwtauth');
    if (jwtAuth) {    // TODO: Ablauf des JWT prüfen
      this.$refs.refLoginForm.displayLogin = "none";
      const decoded = this.$jwt.decode();
      this.playerId = decoded.playerId;
      this.playerNick = decoded.nickname;
      this.refresh();
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
    margin-bottom: 8px;
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
    background-color: lightblue;
}

#trickstack {
    background-color: lightblue;
}

img.playingcard {
    border: 1px solid black;
    border-radius: 6px;
    width: 100%;
}

img.tricks {
    max-width: 200px;
    width: 100%;
}

.mypoints {
  background-color: black;
  color: white;

}

.b-icon {
  margin-left: 15px;
  margin-right: 5px;
}

.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

.link {
  cursor: pointer;
}
</style>
