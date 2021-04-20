<template>
  <div id="table-draws" class="text-center">
    <div>{{ errorText }}</div>
    <div v-if="!lastTrick || lastTrick.length <= 0">
      <div v-for="(card, idx) in currentDraw" :key='card.id' class="cardontable" v-bind:style="'left:-'+(idx*3)+'%;'">
        <img v-bind:src="'resources/' + card.image" class="playingcard" v-bind:title="card.playedBy" v-on:click="cardClicked(card);" draggable="false">
        <div>{{card.playedBy}}</div>
      </div>
    </div>

    <div id="last-trick-show" v-if="lastTrick && lastTrick.length > 0">
      <p>Letzter Stich: <span style="font-size:smaller;">(Karten anklicken zum Verbergen)</span></p>
      <div v-for="(draw, idx) in lastTrick" :key='draw.id' class="cardontable" v-bind:style="'left:-'+(idx*4.5)+'%;'">
        <img v-bind:src="'resources/' + getDrawById(draw.id).image" class="playingcard" v-bind:title="getDrawById(draw.id).playedBy" v-on:click="showLastTrickClicked()" draggable="false">
      </div>
    </div>

    <b-modal id="takeTrickModal" title="Stich nehmen?" @hide="onModalHide">
      <template #modal-cancel="{}">Stich nehmen</template>
      <template #modal-ok="{}">Karte zurücknehmen</template>
      <div class="modal-body">Möchtest Du Deinen Stich an Dich nehmen oder Deine gespielte Karte zurücknehmen?</div>
    </b-modal>

  </div>
</template>

<script>
export default {
  name: 'TableDraws',
  data: function() {
    return {
        errorText: "",
        showWaitSpinner: false,
        drawedCards: [],
        currentDraw: [], // { draw.id, draw.round, draw.position, card.image, card.color, card.value, playedById, playedBy, wonByPlayerId, rank, trump, points }
        lastTrick: []
    }
  },
  methods: {
    getDraws: function() {
      const playerId = this.$parent.playerId;
      this.axios
      .get('/draws?playerId='+playerId)
      .then(response => {
        if (response.data.status === undefined) {
          this.drawedCards = response.data;
          this.currentDraw = this.drawedCards.filter(elm => elm.wonByPlayerId == undefined)
          this.$parent.hasTricks = (this.drawedCards.findIndex(elm => elm.wonByPlayerId == playerId) !== -1);
        }
        else {
          this.errorText = "getDraws(): Error: " + response.data.statustext;
          console.log(response.data);
        }
      })
      .catch(error => {
        console.log(error);
        this.errorText = "There has been an error contacting the card play server. Please try again. We are sorry for the inconvenience!";
      })
      .finally(() => this.showWaitSpinner = false)
    },
    getDrawById: function(drawId) {
      return this.drawedCards.find(card => card.id == drawId);
    },
    getWinnerCard: function() {
      // TODO: Right now, only rules for a trick in "Doppelkopf" is implemented
      let winnerCard = this.currentDraw.find(card => card.position == 1);  // first card on table gets in front win opportunity
      this.currentDraw.forEach((card, index, arr) => {
        if  (card.trump > winnerCard.trump || // trump beats no-trump
            (card.trump == 1 && winnerCard.trump == 1 && card.rank > winnerCard.rank) ||  // higher-rank trump beats lower-rank trump
            (card.trump == 1 && winnerCard.trump == 1 && card.rank == winnerCard.rank && card.color == "Herz" && card.value == "10" && card.position > winnerCard.position) ||  // second Herz10 beats
            (card.trump == 0 && winnerCard.trump == 0 && card.color == winnerCard.color && card.rank > winnerCard.rank) ||  // higher-rank card beats lower-rank card of same color
            (card.rank == winnerCard.rank && card.color == winnerCard.color && card.position < winnerCard.position)  // first card on table beats same rank of same color
           )
          winnerCard = card;
      });
      //console.log("WinnerCard: ", winnerCard);
      return winnerCard;
    },
    getCurrentRound: function() {
      const roundOfLastTrick = 
        this.drawedCards.reduce((round, card) => round = ((card.wonByPlayerId && card.round > round) ? card.round : round), 0);
      return roundOfLastTrick + 1;
    },
    cardClicked: function(card) {
      const playerId = this.$parent.playerId;

      // last played card can be revoked by the one who played it
      if (this.lastCard.playedById == playerId) {
        // if this was the last card, take back or take the trick?
        if (this.currentDraw.length == this.$parent.getNumPlayersInRound()) {
          this.$bvModal.show('takeTrickModal');
          return;  // action is done asynchronously via the modal event handler
        }
        else {
          this.takeBackCard();
          return;
        }
      }

      // if the winner clicks, he gets the trick
      if (this.currentDraw.length == this.$parent.getNumPlayersInRound() && this.getWinnerCard().playedById == playerId) {
        this.takeTrick();
      }
    },
    takeBackCard: function() {
      this.axios
      .put('/takeback/'+this.lastCard.id)
      .then(response => {
        if (response.data.status == "OK") {
          this.currentDraw.splice(this.currentDraw.length-1, 1);
          this.$parent.refresh();
        }
        else {
          this.errorText = "call /takeback Error: " + response.data.statustext;
          console.log(response.data);
        }
      })
      .catch(error => {
        console.log(error);
        this.errorText = "There has been an error contacting the card play server. Please try again. We are sorry for the inconvenience!";
      })
    },
    takeTrick: function() {
      const playerId = this.$parent.playerId;
      this.axios
      .put('/taketrick/'+playerId)
      .then(response => {
        if (response.data.status == "OK") {
          this.getDraws();
        }
        else {
          this.errorText = "call /taketrick Error: " + response.data.statustext;
          console.log(response.data);
        }
      })
      .catch(error => {
        console.log(error);
        this.errorText = "There has been an error contacting the card play server. Please try again. We are sorry for the inconvenience!";
      })
    },
    onModalHide: function(bvEvent) {
      if (bvEvent.trigger == "ok")
        this.takeBackCard();
      else
        this.takeTrick();
    },
    getPoints: function() {
      const myPoints = this.drawedCards.filter(card => card.wonByPlayerId == this.$parent.playerId)
      .reduce((sum, card) => sum + card.points, 0);
      return myPoints;
    },
    showLastTrickClicked: function() {
      this.lastTrick = [];
    }
  },
  computed: {
    lastCard: function() {
      if (this.currentDraw.length > 0)
        return this.currentDraw[this.currentDraw.length-1];
      else
        return undefined;
    }
  },
  mounted() {
  },
  sockets: {
    showLastTrick(drawIds) {
      this.lastTrick = drawIds;
    }
  }
}
</script>

<style scoped>
#table-draws {
  width:100%;
}

.cardontable {
    vertical-align: middle;
    display: table-cell;
    position: relative;
}

.cardontable img {
    width: 200%;
    max-width: 200px;
}

#last-trick-show {
  background-color: whitesmoke;
  border: 2px solid red;
}
</style>