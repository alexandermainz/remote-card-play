<template>
<div id="cardhand">
    <div v-for="(onecard, idx) in playersHand" :key='onecard.id' class="cardindeck" v-bind:style="'left:-'+(idx*3)+'%;'" v-bind:class="{ cardclicked: onecard.clicked }" draggable @dragstart='startDrag($event, onecard)' @drop='onDrop($event, idx)' @dragover.prevent @dragenter.prevent>
        <img v-bind:src="'resources/' + onecard.image" class="playingcard" v-on:click="cardClicked(idx);">
        <p>{{onecard.clicked}}</p>
    </div>
</div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CardHand',
    data: function() {
      return {
          errorText: "",
          showWaitSpinner: false,
          playersHand: []
      }
    },
    methods: {
        getHand: function() {
            const playerId = this.$cookies.get('user').playerId;
            console.log("getHand("+playerId+")");
            axios
            .get('/player/'+playerId+'/hand')
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

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#cardhand {
    margin-left: 1cm;
    width: 100%;
    display: table;
    white-space: nowrap;
}

.cardindeck {
    vertical-align: middle;
    display: table-cell;
    position: relative;
}

.cardindeck img {
    width: 300%;
    max-width: 300px;
}

.cardclicked {
    top: -40px;
}

</style>