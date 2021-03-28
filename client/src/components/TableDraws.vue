<template>
  <div id="table-draws" class="text-center">
    <div v-for="(card, idx) in currentDraw" :key='card.id' class="cardontable" v-bind:style="'left:-'+(idx*3)+'%;'">
      <img v-bind:src="'resources/' + card.image" class="playingcard" v-bind:title="card.playedBy" v-on:click="cardClicked(card);" draggable="false">
    </div>
    <div>{{ errorText }}</div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'TableDraws',
  data: function() {
    return {
        errorText: "",
        showWaitSpinner: false,
        drawedCards: [],
        currentDraw: []
    }
  },
  methods: {
    getDraws: function() {
      const playerId = this.$cookies.get('user').playerId;
      axios
      .get('/draws?playerId='+playerId)
      .then(response => {
        if (response.data.status === undefined) {
          this.drawedCards = response.data;
          this.currentDraw = this.drawedCards.filter(elm => elm.wonByPlayerId == undefined)
          this.$parent.hasTricks = (this.drawedCards.findIndex(elm => elm.wonByPlayerId == playerId) !== undefined);
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
    getWinnerCard: function() {
      let winnerCard;
      this.currentDraw.forEach((card, index, arr) => {
        if (!winnerCard || (winnerCard.trump == card.trump && card.rank > winnerCard.rank) || card.trump > winnerCard.trump)
          winnerCard = card;
      });
      return winnerCard;
    },
    getNumCards: function() {

    },
    cardClicked: function(card) {
      const playerId = this.$cookies.get('user').playerId;
      // last played card can be revoked by the one who played it
      if (this.lastCard.playedById == playerId) {
        console.log("take back card"); console.log(this.lastCard);
        axios
        .put('/takeback/'+this.lastCard.id)
        .then(response => {
          if (response.data.status == "OK") {
            this.currentDraw.splice(this.currentDraw.length-1, 1);
            this.$parent.getHand();
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
      }
      // if the winner clicks, he gets the trick
      if (this.currentDraw.length == this.$parent.getNumPlayersInRound() && this.getWinnerCard().playedById == playerId) {
        console.log("take the trick");
        axios
        .put('/taketrick/'+playerId)
        .then(response => {
          if (response.data.status == "OK") {

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
      }
    }
  },
  computed: {
    lastCard: function() {
      return this.currentDraw[this.currentDraw.length-1];
    }
  }
}
</script>

<style scoped>
#table-draws {
  width:75%;
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
</style>