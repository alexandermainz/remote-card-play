<template>
<div class="row" id="changepassword" v-bind:style="{ display: display }">
    <b-icon class="waitspinner" v-if="showWaitSpinner" icon="three-dots" animation="cylon" font-scale="4"></b-icon>
    <div class="col-md-3"><h3>Kennwort ändern</h3></div>
    <div class="col-md-5">
            <form class="form-floating">
            <div class="form-floating">
                <label for="input-pass1" class="form-label">Neues Kennwort:</label>
                <input id="input-pass1" class="form-control" type="password" v-model="password1" name="password1" placeholder="">
            </div>
            <div class="form-floating">
                <label for="input-pass2" class="form-label">Kennwort wiederholen:</label>
                <input id="input-pass2" class="form-control" type="password" v-model="password2" name="password2" placeholder="">
            </div><br>
            <div class="form-floating">
                <button type="button" class="btn btn-outline-success" v-on:click="doChange()">Ändern</button>
                <button type="button" class="btn btn-outline-warning" v-on:click="doCancel()">Abbrechen</button>
                <br><p class="alert-danger" style="margin-top: 10px;">{{errorText}}</p>
            </div></form>
    </div>
    <div class="col-md-4"></div>
</div>
</template>

<script>
export default {
    name: 'ChangePassword',
    data: function() {
        return {
            display: 'none',
            errorText: '',
            showWaitSpinner: false,
            password1: '',
            password2: ''
        }
    },
    methods: {
        doChange: function() {
            if (this.password1 && this.password1 === this.password2) {
                this.errorText = '';
                this.showWaitSpinner = true;
                this.axios
                .put('/changepassword', { pass: this.password1 })
                .then(response => {
                    if (response.data.status === "OK") {
                        this.doCancel();
                        this.$bvToast.toast(`Dein Kennwort wurde erfolgreich geändert.`, {
                            title: 'Kennwort ändern',
                            autoHideDelay: 5000
                        });                     
                    }
                    else {
                        this.errorText = "Ein Fehler ist aufgetreten: " + response.data.statustext;
                        console.log(response);
                    }
                })
                .catch(error => {
                    console.log(error);
                    if (error.response && error.response.status === 401)
                        this.errorText = "Du bist nicht am System angemeldet. Bitte erst anmelden!";
                    else
                        this.errorText = "Ein unbekannter Fehler ist aufgetreten, das Kennwort konnte nicht geändert werden!";
                })
                .finally(() => this.showWaitSpinner = false)
            }
            else {
                this.errorText = "Die beiden Eingaben stimmen nicht überein!"
            }
        },
        doCancel: function() {
            this.display = 'none';
            this.password1 = '';
            this.password2 = '';
            this.errorText = '';
        }
    }
}
</script>

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

.waitspinner {
    position: absolute;
    left: 50%;
    z-index: 99;
    color: lightblue;
}
</style>
