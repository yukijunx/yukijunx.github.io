window.onload = () => {
    const app = Vue.createApp({
        data: function () {
            return {
                instruction: false,
                leaderboard: false,
                gamepage: false,
                area_newgame: false,
                area_pickdiff: false
            }
        },
        methods: {
            backtomenu: function(){
                if (confirm('Are you sure you want to go back? \nCurrent game will be lost!')){
                    this.gamepage = false;
                } else{
                    return;
                }
            },
            enterAreanewgame() {
                this.area_newgame = true;
            },
            leaveAreanewgame() {
                this.area_newgame = false;
            },
            enterAreapickdiff() {
                this.area_pickdiff = true;
            },
            leaveAreapickdiff() {
                this.area_pickdiff = false;
            }
        },
        mounted: function () {
        },

    });
    app.mount('#body-container');
};