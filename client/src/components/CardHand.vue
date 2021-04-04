<template>
<div id="cardhand" v-if="playersHand.length>0">
    <div class="alert-danger" v-if="errorText != ''">{{ errorText }}</div>

    <div v-for="(handId, idx) in sortedHand" :key='idx' class="cardindeck" v-bind:style="'left:-'+(idx*3)+'%;'" v-bind:class="{ cardclicked: playersHand.find(aCard => aCard.id == handId).clicked }" draggable @dragstart='startDrag($event, idx)' @drop='onDrop($event, idx)' @dragover.prevent @dragenter.prevent>
        <img v-bind:src="'resources/' + playersHand.find(aCard => aCard.id == handId).image" class="playingcard" v-on:click="cardClicked(idx);">
    </div>
</div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CardHand',
    data: function() {
      return {
          errorText: '',
          showWaitSpinner: false,
          playersHand: [],
          sortedHand: []
      }
    },
    methods: {
        getHand: function() {
            const playerId = this.$cookies.get('user').playerId;
            axios
            .get('/player/'+playerId+'/hand')
            .then(response => {
              if (response.data.status === undefined) {
                this.playersHand = response.data;
                this.getSortedHand();
              }
              else {
                this.errorText = "getHand(): Error: " + response.data.statustext;
                console.log("Error!", response.data);
              }
            })
            .catch(error => {
              console.log("Error!", error);
              this.errorText = "There has been an error contacting the card play server. Please try again. We are sorry for the inconvenience!";
            })
            .finally(() => this.showWaitSpinner = false)
        },
        cardClicked: function(position) {
            const handId = this.sortedHand[position];
            const index = this.playersHand.findIndex(aCard => aCard.id == handId)
            if (!this.playersHand[index].clicked)
            {
                this.playersHand.forEach((card, index, arr) => card.clicked = 0 );
                this.playersHand[index]["clicked"] = 1;
            }
            else {
                if (!this.$parent.isRoundReady()) {
                    this.$parent.playCard(this.playersHand[index]);
                    this.playersHand.splice(index, 1);
                    this.getSortedHand();
                }
                else
                    this.playersHand[index]["clicked"] = 0;
            }
        },
        startDrag: (evt, item) => {
            evt.dataTransfer.dropEffect = 'move'
            evt.dataTransfer.effectAllowed = 'move'
            evt.dataTransfer.setData('sortIndex', item)
        },
        onDrop (evt, toIndex) {
            const fromIndex = evt.dataTransfer.getData('sortIndex');
            const tausch = this.sortedHand[fromIndex];
            var newSort = this.sortedHand;
            newSort.splice(fromIndex, 1);
            newSort.splice(toIndex, 0, tausch);
            this.sortedHand = newSort;
            const parsed = JSON.stringify(newSort);
            localStorage.setItem('handsort', parsed);
        },
        getSortedHand: function() {
            if (localStorage.getItem('handsort')) {
                const handsort = JSON.parse(localStorage.getItem('handsort'));
                this.sortedHand = handsort.filter((elm) => this.playersHand.find(aCard => aCard.id == elm));
            }
            else {
                this.sortedHand = this.playersHand.map((elm) => elm.id);
                const parsed = JSON.stringify(this.sortedHand);
                localStorage.setItem('handsort', parsed);
            }

            return this.sortedHand;
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
    max-width: 200px;
}

.cardclicked {
    top: -40px;
}

</style>