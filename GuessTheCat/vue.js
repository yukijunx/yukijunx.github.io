window.onload = () => {
    const app = Vue.createApp({
        data: function () {
            return {
                instruction: false,
                leaderboard: false,
                gamepage: false,
                area_newgame: false,
                area_pickdiff: false,

                AllStore: [],
                TempeStore: [],
                TempeOpt: [],
                BreedsStore: [],
                IdStore: [],
                TempeInfo: {},
                HintList: [],
                correctIndex: undefined,
                GameInfo: {
                    "CorrectAnswer": "",
                    "NumberOfBreeds": 0,
                    "NumberOfGuess": 0,
                    "NumberOfHint": 0,
                    "NumberOfAsk": 0
                },

                selectedNum: undefined,
                ImgStore: [],
                gameover: false,
                selectedChar: undefined,
                selectedBreed: undefined,
                rightClass:[],
                wrongClass:[],
                record:['?','?','?','?'],
                highscore: [false,false,false,false],
            }
        },
        methods: {
            backtomenu: function () {
                if (confirm('Are you sure you want to go back? \nCurrent game will be lost!')) {
                    this.gamepage = false;
                } else {
                    return;
                }
            },

            /**
             * Four functions for mouse-hovering of new game menu.
             */
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
            },

            getRecord: async function () {
                await fetch('https://fixed-silver-cough.glitch.me/catrecord', {
                    method: "get",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                    .then((res) => res.json())
                    .then((resjson) => {
                        this.record = resjson;
                    })
                    .catch(err => { console.log('get cat record error: ', err) })
            },
            postRecord: async function () {
                await fetch(`https://fixed-silver-cough.glitch.me/catnewrecord/${this.record[0]}/${this.record[1]}/${this.record[2]}/${this.record[3]}`, {
                    method: "get",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                    .then((res) => res.text())
                    .then(function (res) {
                        console.log(res);
                    })
                    .catch(err => { console.log('post cat record error: ', err) })
            },

            /**
             * Format a string in a way that it is in lower case and without any spaces.
             * @param {string} s The string that needs to be formatted.
             * @returns The formatted string.
             */
            formatted: function (s) {
                return s.toString().replace(/\s/g, "").toLowerCase()
            },
            /**
             * Count for how many times each temperament appears, store in object TempeInfo,
             * and store temperaments in TempeOpt as a list without any repetition.
             */
            tidyTempe: function () {
                let TempeList = [];
                for (let i = 0; i < this.TempeStore.length; i++) {
                    let SplittedTempe = this.TempeStore[i].split(",");
                    for (let j = 0; j < SplittedTempe.length; j++) {
                        TempeList.push(this.formatted(SplittedTempe[j]));
                    }
                };
                TempeList.forEach(function (x) { this.TempeInfo[x] = (this.TempeInfo[x] || 0) + 1; });
                for (let keys in this.TempeInfo) {
                    this.TempeOpt.push(keys);
                };
            },
            /**
             * Clear all the current memory of temperaments and breeds, 
             * reload according to AllStore.
             */
            updateStore: function () {
                this.TempeStore = [];
                this.TempeOpt = [];
                this.BreedsStore = [];
                this.IdStore = [];
                this.TempeInfo = {};
                this.HintList = [];
                this.selectedChar=undefined;
                this.selectedBreed=undefined;
                this.highscore = [false,false,false,false];
                for (let i = 0; i < this.AllStore.length; i++) {
                    this.BreedsStore.push(this.AllStore[i]["name"]);
                    this.TempeStore.push(this.AllStore[i]["temperament"]);
                    this.IdStore.push(this.AllStore[i]["id"]);
                };
                this.tidyTempe();
            },
            /**
             * Fetch selected number of cats and store the informations.
             */
            fetchInfo: async function () {
                this.GameInfo["NumberOfBreeds"] = this.selectedNum;
                await fetch(`https://fixed-silver-cough.glitch.me/catinfo`, {
                    method: "get",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                    .then((res) => res.json())
                    .then((resjson) => {
                        let RandIndexList = [];
                        for (let i = 0; i < this.selectedNum;) {
                            let RandIndex = Math.floor(Math.random() * resjson.length);
                            if (!RandIndexList.includes(RandIndex)) {
                                this.AllStore.push(resjson[RandIndex]);
                                RandIndexList.push(RandIndex);
                                i++;
                            };
                        };
                        this.updateStore();
                    })
                    .catch(err => { console.log('Getting cat image error... ', err) });
            },
            /**
             * Fetch an image of a given breed and insert into the given DOM.
             * @param {string} breedid The breed id that we want an image for.
             */
            fetchImg: async function () {
                for (let i =0; i < this.IdStore.length; i++){
                    consolg.log('getting image '+i+' ...');
                    await fetch(`https://fixed-silver-cough.glitch.me/catimage/${this.IdStore[i]}`, {
                        method: "get",
                        headers: {
                            "Content-Type": "application/json"
                        },
                    })
                        .then((res) => res.json())
                        .then((resjson) => {
                            if (resjson.length == 0) {
                                this.ImgStore.push("noimage.jpg");
                            } else {
                                this.ImgStore.push(resjson[0].url);
                            }
                        })
                        .catch(err => {
                            console.log('Getting '+breedid+' cat image error... ', err);
                            this.ImgStore.push("noimage.jpg");
                        });
                }
            },
            /**
             * Decide the correct answer randomly based on the breeds we have fetched.
             * Call after fetchInfo().
             */
            rollAnswer: function () {
                let RandIndex = Math.floor(Math.random() * this.BreedsStore.length);
                this.correctIndex = RandIndex;
                this.GameInfo["CorrectAnswer"] = this.BreedsStore[RandIndex];
            },


            /**
             * Compare the weighted count of two temperaments.
             * @param {string} a first temperament. 
             * @param {string} b second temperament.
             * @returns -1 if a has lower weighted count, 1 if a has higher weighted count, 
             * 0 if a and b have the same weighted count.
             */
            compareByCount: function (a, b) {
                if (this.TempeInfo[a] < this.TempeInfo[b]) {
                    return (-1)
                };
                return (this.TempeInfo[a] > this.TempeInfo[b] ? 1 : 0);
            },
            /**
             * Make and sort a list of temperaments according to the usefulness of the hint.
             */
            updateHintList: function () {
                let ind = this.BreedsStore.indexOf(this.GameInfo["CorrectAnswer"]);
                for (let keys in this.TempeInfo) {
                    this.HintList.push(keys);
                    if (!this.formatted(this.TempeStore[ind]).includes(this.formatted(keys))) {
                        this.TempeInfo[keys] = this.BreedsStore.length - this.TempeInfo[keys];
                    };
                };
                this.HintList.sort(this.compareByCount);
            },
            /**
             * Gives a hint that has not been used, prioritise the more useful ones.
             * @returns None.
             */
            hintButton: function () {
                if (gameover) {
                    return;
                }
                if (this.GameInfo["NumberOfHint"]==0){
                    if (!confirm("If you use a hint you cannot enter the leaderboard,\ndo you wish to continue?")){
                        return;
                    }
                }
                for (let i = 0; i < this.HintList.length; i++) {
                    if (this.formatted(this.TempeOpt).includes(this.formatted(this.HintList[i]))) {
                        alert("Try ask me if my cat is " + this.HintList[i] + "!");
                        this.GameInfo["NumberOfHint"] = i + 1;
                        return;
                    };
                }
                alert("You have used up all the hints!"); 
            },

            /**
             * If the guess is right, check if hint is used, 
             * compare and register the new high score.
             * @returns None.
             */
            victory: function () {
                // Check if hint is used, if yes, return without store record.
                if (GameInfo["NumberOfHint"] != 0) {
                    return;
                };
                let finalscore = parseInt(GameInfo["NumberOfAsk"]) + parseInt(GameInfo["NumberOfHint"]) + parseInt(GameInfo["NumberOfGuess"]);
                let correspondInd = GameInfo["NumberOfBreeds"] / 4 - 1;
                if (this.record[correspondInd]=='?' || finalscore < this.record[correspondInd]){
                    this.record[correspondInd]=finalscore;
                    this.highscore[correspondInd]=true;
                    this.postRecord();
                }
                this.leaderboard = true;
            },

            /**
             * Check if the selected breed is correct, 
             * and update the select options if it is incorrect.
             * @returns None.
             */
            guessButton: function () {
                if (gameover){
                    return;
                }
                this.GameInfo["NumberOfGuess"]++;
                if (this.formatted(this.selectedBreed) == this.formatted(this.GameInfo["CorrectAnswer"])) {
                    this.rightClass.push(this.selectedBreed);
                    alert(`Yes, my cat is ${this.selectedBreed}! You win!
                    \nYou have asked ${GameInfo["NumberOfAsk"]} questions,
                    \nused ${GameInfo["NumberOfHint"]} hints,  
                    \nmade ${GameInfo["NumberOfGuess"]} guesses.
                    \nYour score is ${parseInt(GameInfo["NumberOfAsk"]) + parseInt(GameInfo["NumberOfHint"]) + parseInt(GameInfo["NumberOfGuess"])}!`);
                    this.gameover = true;
                    this.victory();
                    return;
                };
                for (let i = 0; i < this.AllStore.length; i++) {
                    if (this.AllStore[i]["name"] == this.selectedBreed) {
                        this.AllStore.splice(i, 1);
                        this.wrongClass.push(this.BreedsStore[i]);
                        alert("No, my cat is not " + this.selectedBreed + "!");
                    }
                };
                this.updateStore();
                this.updateHintList();
            },

            /**
             * Tell if the cat has the selected temperament 
             * and update the select options to eliminate the asked temperament and the breeds with/without it.
             */
            askButton: function () {
                if (gameover){
                    return;
                }
                let ind = this.BreedsStore.indexOf(this.GameInfo["CorrectAnswer"]);
                if (this.formatted(this.TempeStore[ind]).includes(this.formatted(this.selectedChar))) {
                    alert("Yes, my cat is " + this.selectedChar + " !");
                    for (let i = this.AllStore.length - 1; i >= 0; i--) {
                        if (!this.formatted(this.TempeStore[i]).includes(this.formatted(this.selectedChar))) {
                            this.AllStore.splice(i, 1);
                            this.wrongClass.push(this.BreedsStore[i]);
                        }
                    }
                } else {
                    alert("No, my cat is not " + this.selectedChar + " !");
                    for (let i = this.AllStore.length - 1; i >= 0; i--) {
                        if (this.formatted(this.TempeStore[i]).includes(this.formatted(this.selectedChar))) {
                            this.AllStore.splice(i, 1);
                            this.wrongClass.push(this.BreedsStore[i]);
                        }
                    }
                };
                this.updateStore();
                this.updateHintList();
            },
            /**
             * Get the id of the card being clicked, change the guess value and make the guess.
             * @param {string} clickedId 
             */
            cardButton: function (clickedId) {
                let theInd = this.IdStore.indexOf(clickedId);
                this.selectedBreed = this.BreedsStore[theInd];
                this.guessButton();
            },

            /**
             * Start a new game.
             */
            newGameButton: async function() {
                this.gamepage = true;
                this.AllStore = [];
                this.ImgStore = [];
                this.TempeStore = [];
                this.TempeOpt = [];
                this.BreedsStore = [];
                this.IdStore = [];
                this.TempeInfo = {};
                this.HintList = [];
                this.selectedChar=undefined;
                this.selectedBreed=undefined;
                this.highscore = [false,false,false,false];
                console.log('starting new game...')
                await this.fetchInfo();
                await this.fetchImg();
                this.rollAnswer();
                this.updateHintList();
            }

        },
        mounted: function () {
            this.getRecord();
        },

    });
    app.mount('#body-container');
};