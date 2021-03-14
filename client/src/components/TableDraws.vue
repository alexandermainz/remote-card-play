<template>
  <div id="table-draws" class="text-center">
    <div v-for="(card, idx) in drawedCards" :key='card.id' class="cardindeck" v-bind:style="'left:-'+(idx*3)+'%;'">
      <img v-bind:src="'resources/' + card.image" class="playingcard">
    </div>
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
        drawedCards: []
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
  }
}
</script>

<style scoped>

</style>