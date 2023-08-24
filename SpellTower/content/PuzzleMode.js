import { GameOverError, Board, Game } from '../game-engine/index.mjs';
import { Trie, HintGiver, Word } from '../ai/index.mjs';

window.onload = () => {
    const app = Vue.createApp({
        data: function () {
            return {
                // Core game-play
                game: new Game(new Board(), new Trie()),
                trie: new Trie(),
                chosenCoordinates: [],
                chosenWord: ``,
                chosenScore: [0, 1],
                gamelabel: ``,
                highestRecord: 0,

                // Other functions
                buttonRunning: { 'animation': false, 'save': false },
                loading: true,

                instruction: true,
                displayInfo: false,

                mouseDown: false,
                enterTimeout: undefined,

                saveEnabled: true,

                // Visual cues and animation
                colourtheme: 0,
                svgPoints: [], // (as set of svg point strings)
                redNeighbours: [],
                isWord: false,

                transposeRows: [],

                // hint
                hintGiver: undefined,
                heuristicMultipliers: {
                    lengthMult: 1,
                    lengthReqMults: new Map([[3, 0], [4, 1], [5, 1.5], [6, 2]]),
                    shortThreshold: 4,
                    shortPenalty: 10,
                    log10ScoreMult: 0.5,
                    blocksMult: 1.25,
                    edgeProportionMult: 0,
                    basicShapeRatingMult: 1.25,
                    dangerColBoost: 15,
                    dangerColMult: 1,
                    boardShapeRatingMult: 7,
                    dangerZone: 2,
                    addNewRowBoost: 5
                },
            }
        },
        methods: {

            // CORE GAME PLAY

            /**
             * Get the highest record from the server and save it in highestRecord.
             */
            getHigh: async function () {
                await fetch('https://fixed-silver-cough.glitch.me/getHigh', {
                    method: "get",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                    .then((res) => res.json())
                    .then((resjson) => {
                        if (resjson.key != 'nodata') {
                            this.highestRecord = parseInt(resjson.key.highscore);
                        } else {
                            this.highestRecord = this.game.score;
                        }
                    })
                    .catch(err => { console.log('Getting high score error: ', err) });
            },

            /**
             * Get the dictionary from the server and build the trie.
             */
            getTrie: async function () {
                await fetch('https://fixed-silver-cough.glitch.me/dictionary', {
                    method: "get",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                    .then((res) => res.json())
                    .then((dict) => {
                        const dictArray = Object.values(dict);
                        console.log('Initialising dictionary...')
                        for (var word of dictArray) {
                            if (word.includes(' ')) {
                                console.error("!Whitespace in line - only single words are expected.")
                            }
                            this.trie.addWord(word)
                        };
                        this.game.trie = this.trie;
                    })
                    .catch(err => { console.log('Make trie error: ', err) });
            },

            /**
             * Upload current game data to the database.
             */
            saveGame: async function () {
                if (!this.saveEnabled) {
                    return;
                }
                this.buttonRunning.save = true;
                let gamedata = {
                    _id: 1,
                    game: this.game
                };
                let gameJSON = JSON.stringify(gamedata);
                fetch('https://fixed-silver-cough.glitch.me/save', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: gameJSON
                })
                    .then(res => res.text())
                    .then(function (res) {
                        console.log(res);
                    })
                    .catch(err => { console.log('saveGame error: ', err) })
                    .finally(() => {
                        this.buttonRunning.save = false;
                        this.hintGiver.generateOptions();
                    })
            },

            /**
             * Save the current score to the database.
             */
            saveHigh: async function () {
                if (this.game.score > this.highestRecord) {
                    this.highestRecord = this.game.score;
                    let newHigh = { '_id': 2, 'highscore': parseInt(this.game.score) };
                    let newHighJSON = JSON.stringify(newHigh);
                    fetch('https://fixed-silver-cough.glitch.me/saveHigh', {
                        method: 'post',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: newHighJSON
                    })
                        .then(res => res.text())
                        .then(function (res) {
                            console.log(res);
                        })
                        .catch(err => { console.log('save high score error: ', err) })
                }

            },

            /**
             * Initialise a board and game, 
             * then call fiveRandomRows() and saveGame().
             */
            newGame: async function () {
                if (this.buttonRunning.save || this.buttonRunning.animation) {
                    if (this.buttonRunning.save) {
                        this.shake(document.getElementById("br-loading-container"));
                    }
                    return;
                };
                console.log("Starting a new game!")
                // this.resetAll();
                this.game = new Game(new Board(), this.trie);
                this.fiveRandomRows();
                this.saveGame();
                this.setHintGiver();
                this.hintGiver.generateOptions();
                this.updateBoard();
            },

            /**
             * Retrieve unfinished game data from database, 
             * if there is no data, call newGame() to start one and save
             */
            getGame: async function () {
                await fetch('https://fixed-silver-cough.glitch.me/get', {
                    method: "get",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                    .then((res) => res.json())
                    .then((gamedata) => {
                        if (gamedata.key != 'nodata') {
                            this.game = Game.fromJSON(gamedata.game)
                            this.game.trie = this.trie;
                            console.log('Game data retrieved!')
                            this.transposeRows = this.transposeMatrix(this.game.currentBoard.rows)
                            this.loading = false;
                        } else {
                            this.newGame();
                        };
                    })
                    .catch(err => { console.log('getGame error: ', err) })

            },

            /**
             * Insert five random rows.
             */
            fiveRandomRows: function () {
                for (let i = 0; i < 5; i++) {
                    this.game.insertRandomRow();
                };
            },

            /**
             * call game.insertRandomRow and save the game, 
             * check if game ends.
             */
            newRow: async function () {
                if (this.buttonRunning.save || this.buttonRunning.animation) {
                    if (this.buttonRunning.save) {
                        this.shake(document.getElementById("br-loading-container"));
                    }
                    return;
                };
                try {
                    this.resetAll();
                    await this.game.insertRandomRow();
                    this.saveGame();
                    this.hintGiver.generateOptions();
                    this.animatedAddRow();
                } catch (e) {
                    if (e instanceof GameOverError) {
                        this.gameOver();
                    } else {
                        throw e
                    }
                }
            },

            /**
             * Reset the temporary data stored for current chosen word.
             */
            resetAll: function () {
                this.chosenCoordinates = [];
                this.chosenWord = "";
                this.chosenScore = [0, 1];
                this.redNeighbours = [];
                this.isWord = false;
                this.gamelabel = "";
                this.svgPoints = [];
            },

            /**
             * What happens after a tile is clicked: check for validation of tiles and take corresponding actions.
             * @param {string} cellId 
             * @returns 
             */
            cellClick: async function (cellId) {
                if (this.buttonRunning.animation) {
                    return;
                };
                this.cleanStyle();
                this.isWord = false;
                this.gamelabel = "";
                this.redNeighbours = [];
                // this.chosenScore = [0, 1];
                let coordinate = cellId.split('-').map(Number);
                // If it's a black tile clear all
                let cell = this.game.currentBoard.rows[coordinate[0]][coordinate[1]];
                if (cell._letter == '?' || cell._letter == '0') {
                    this.resetAll();
                    return
                }
                // If it's the same as last coordinate
                var lastCoordinate = this.chosenCoordinates[this.chosenCoordinates.length - 1];
                var secondLastCoord = this.chosenCoordinates[this.chosenCoordinates.length - 2];
                if (lastCoordinate && JSON.stringify(coordinate) == JSON.stringify(lastCoordinate)) {
                    // If length of current chosen tiles less than three clear all
                    if (this.chosenCoordinates.length < 3) {
                        this.resetAll();
                        return
                    }
                    // else play the word
                    if (this.buttonRunning.save) {
                        // shake the loading icon
                        this.shake(document.getElementById("br-loading-container"));
                        return
                    } else {
                        console.log('Playing the word...')
                        if (this.game.usedWords.includes(this.chosenWord)) {
                            // Shake gamelabel
                            this.checkWords();
                            this.shake(document.getElementById('game-label'));
                        } else if (this.game._trie.contains(this.chosenWord)) {
                            var wordCells = this.getCells(this.chosenCoordinates)[0];
                            let len = this.chosenCoordinates.length;
                            if (wordCells.every(cell => len >= cell.minLength)) {
                                // get the necessary information from the board before it has been changed by playWord.
                                let redStr = this.game.currentBoard.getWordNeighbours(this.chosenCoordinates);
                                let red = redStr.map(innerArray => innerArray.map(Number));
                                let deleting = this.chosenCoordinates.concat(red);
                                let [tempScore, tempCell] = this.saveTempWord();
                                try {
                                    await this.game.playWord(this.chosenCoordinates);
                                    await this.saveHigh();
                                    if (tempScore >= this.game.bestWord.score) {
                                        this.game.bestWord.score = tempScore;
                                        this.game.bestWord.cell = tempCell;
                                    }
                                    this.saveGame();
                                    this.hintGiver.generateOptions();
                                    this.animatedPlayWord(deleting);
                                    this.svgPoints = [];
                                    this.resetAll();
                                } catch (e) {
                                    if (e instanceof GameOverError) {
                                        this.gameOver();
                                    } else {
                                        throw e
                                    }
                                }
                            } else {
                                // Shake gamelabel (not satisfied)
                                this.checkWords();
                                this.shake(document.getElementById('gamelabel'));
                            }
                        } else {
                            // Shake word
                            this.shake(document.getElementsByClassName('game-word')[0]);
                        }

                        return
                    }
                };
                // The case when it's not the same as last coordinate, check if it's adjacent
                let dx = typeof (lastCoordinate) == "undefined" ? 0 : Math.abs(coordinate[0] - lastCoordinate[0]);
                let dy = typeof (lastCoordinate) == "undefined" ? 0 : Math.abs(coordinate[1] - lastCoordinate[1]);
                if (!(dx <= 1 && dy <= 1)) {
                    // If it's not adjacent clear all
                    this.resetAll();
                    return
                };
                // Given it's adjacent check if it's the same as the second last coordinate
                if (secondLastCoord && JSON.stringify(coordinate) == JSON.stringify(secondLastCoord)) {
                    // if the same remove last one
                    this.chosenCoordinates.pop();
                    this.chosenWord = this.chosenWord.slice(0, -1);
                    this.checkWords();
                    this.getSvgPoints();
                    return
                }
                // not the same as the second last, check if the tile is used
                let repeated = this.chosenCoordinates.some(arr => arr[0] === coordinate[0] && arr[1] === coordinate[1]);
                if (repeated) {
                    this.resetAll();
                    return
                };
                // else, add new coordinate
                this.chosenCoordinates.push(coordinate);
                this.chosenWord += cell._letter;
                this.checkWords();
                this.getSvgPoints();
                return
            },

            /**
             * Given a coordinate path (array of arrays), returns the word cells and neighbour cells.
             * @param {Array} path 
             * @returns Array of word cells (array) and neighbour cells (array)
             */
            getCells: function (path) {
                var wordCells = [];
                for (let i = 0; i < path.length; i++) {
                    let coord = path[i];
                    let cell = this.game.currentBoard.rows[coord[0]][coord[1]];
                    wordCells.push(cell);
                };
                let redStr = this.game.currentBoard.getWordNeighbours(path);
                var neighbourCoords = redStr.map(innerArray => innerArray.map(Number));
                var neighbourCells = [];
                for (let i = 0; i < neighbourCoords.length; i++) {
                    let coord = neighbourCoords[i];
                    let cell = this.game.currentBoard.rows[coord[0]][coord[1]];
                    neighbourCells.push(cell);
                };
                return [wordCells, neighbourCells]
            },

            /**
             * After a new coordinate is in, check if it forms valid words to play
             */
            checkWords: function () {
                var wordCells = this.getCells(this.chosenCoordinates)[0];
                let len = this.chosenCoordinates.length;
                if (len >= 3) {
                    if (this.game.usedWords.includes(this.chosenWord)) {
                        this.gamelabel = `${this.chosenWord} is already used!`
                    } else if (this.game._trie.contains(this.chosenWord)) {
                        // calculate score and display
                        var neighbourCells = this.getCells(this.chosenCoordinates)[1];
                        let scoreList = this.game.calcWordScore(wordCells, neighbourCells);
                        this.chosenScore[0] = scoreList[0];
                        this.chosenScore[1] = scoreList[1];
                        if (wordCells.every(cell => len >= cell.minLength)) {
                            let redStr = this.game.currentBoard.getWordNeighbours(this.chosenCoordinates);
                            this.redNeighbours = redStr.map(innerArray => innerArray.map(Number));
                            this.isWord = true;
                            this.gamelabel = `Tap '${this.chosenWord[this.chosenWord.length - 1]}' again to submit`;
                        } else {
                            this.gamelabel = `Minimum length is not satisfied!`;
                        }
                    } else {
                        this.chosenScore = [0, 1];
                    }
                }
            },

            /**
             * Return the information of the current chosen score.
             * @returns [Score of the word, Array of cells of the word]
             */
            saveTempWord: function () {
                let thisScore = this.chosenScore[0] * this.chosenScore[1];
                let thisWordCells = [];
                for (let i = 0; i < this.chosenCoordinates.length; i++) {
                    let coord = this.chosenCoordinates[i];
                    thisWordCells.push(this.game.currentBoard.rows[coord[0]][coord[1]])
                };
                return [thisScore, thisWordCells]
            },

            /**
             * When game is over this function is called.
             */
            gameOver: function () {
                this.saveHigh();
                alert('Game Over!');
                this.newGame();
                // TODO:
                // Something allows the user to choose from 
                // a new game or back to main menu
            },

            // HINT

            /**
             * Set up the hint giver.
             */
            setHintGiver: function () {
                this.hintGiver = new HintGiver(this.game);
                Word.setHyperParams(this.heuristicMultipliers);
            },

            /**
             * Get one hint from the hintGiver and show it as text and animation
             */
            hintButton: function () {
                if (this.buttonRunning.save || this.buttonRunning.animation) {
                    if (this.buttonRunning.save) {
                        this.shake(document.getElementById("br-loading-container"));
                    };
                    return;
                };
                this.resetAll();
                let hint = this.hintGiver.getHints(1)[0]
                let hintCoords = hint._path;
                let hintWord = "";
                let label = document.getElementById("gamelabel");
                if (hintCoords.length == 0) {
                    hintWord = `add a new row`
                } else {
                    hintWord = hint._plaintext;
                }
                label.setAttribute("style", "opacity:0;");
                this.gamelabel = `try ${hintWord}...`
                gsap.to(label, {
                    opacity: 1,
                    duration: 3,
                    ease: "power4",
                    yoyo: true,
                    repeat: 1,
                    onComplete: (() => {
                        this.gamelabel = '';
                        gsap.set(label, { clearProps: "opacity" })
                    })
                })
                if (hintCoords.length != 0) {
                    this.buttonRunning.animation = true;
                    let animationCounter = 0;
                    for (let i = 0; i < hintCoords.length; i++) {
                        let tile = document.getElementById(`${hintCoords[i][0]}-${hintCoords[i][1]}`);
                        // highlight
                        let rootStyles = getComputedStyle(document.documentElement);
                        let colour = rootStyles.getPropertyValue('--color-tileisword');
                        gsap.to(tile, {
                            backgroundColor: colour,
                            duration: 1.5,
                            delay: i / 5 + 1,
                            yoyo: true,
                            repeat: 1,
                            onComplete: () => {
                                animationCounter++;
                                if (animationCounter == hintCoords.length) {
                                    setTimeout(() => {
                                        let alltiles = document.querySelectorAll('.grid-cell');
                                        alltiles.forEach(function (tile) {
                                            tile.style.backgroundColor = null;
                                        });
                                        this.cleanStyle();
                                        this.buttonRunning.animation = false;
                                    }, 80)
                                }
                            }
                        });
                    };
                }

            },


            // VISUAL

            /**
             * Check if a tile is the last one of the current chosen word.
             * @param {Array} coord coordinate of the cell that is being checked.
             * @returns boolean of whether it is the last letter.
             */
            isLastElement: function (coord) {
                let len = this.chosenCoordinates.length
                return (
                    len > 0 && (coord[0] == this.chosenCoordinates[len - 1][0] && coord[1] == this.chosenCoordinates[len - 1][1])
                )
            },

            /**
             * Push line segments into svg lists
             * @returns 
             */
            getSvgPoints: function () {
                this.svgPoints = [];
                if (this.chosenCoordinates.length == 1) {
                    let pt = this.chosenCoordinates[0];
                    this.svgPoints.push(this.svgCoordsByLine(pt, pt));
                    return
                };
                for (let i = 1; i < this.chosenCoordinates.length; i++) {
                    let pt1 = this.chosenCoordinates[i - 1];
                    let pt2 = this.chosenCoordinates[i];
                    this.svgPoints.push(this.svgCoordsByLine(pt1, pt2));
                }
            },

            /**
             * Given a cell coordinate in array, return its position and dimension
             * @param {Array} coord 
             * @returns [x(left), y(top), w(width), h(height)]
             */
            getRect: function (coord) {
                let id = `${coord[0]}-${coord[1]}`;
                let tile = document.getElementById(id);
                let tileRect = tile.getBoundingClientRect();
                let [x, y, w, h] = [tileRect.left, tileRect.top, tileRect.width, tileRect.height];
                return [x, y, w, h]
            },

            /**
             * Give two coordinates, return the svg coordinates
             * @param {Array} pt1 
             * @param {Array} pt2 
             * @returns a string of svg polygon coordinates
             */
            svgCoordsByLine: function (pt1, pt2) {
                const svgContainer = document.getElementById('svg-container');
                let line = pt2.map((num, ind) => num - pt1[ind]);
                let [x1, y1, w, h] = this.getRect(pt1);
                let [x2, y2] = [this.getRect(pt2)[0], this.getRect(pt2)[1]];
                x1 -= svgContainer.getBoundingClientRect().left;
                x2 -= svgContainer.getBoundingClientRect().left;
                y1 -= svgContainer.getBoundingClientRect().top;
                y2 -= svgContainer.getBoundingClientRect().top;
                let [dW, dH] = [0.35 * w, 0.35 * h];
                let pt1coord = ``;
                let pt2coord = ``;
                // make sure points for all rect go anti-clockwise
                if (line.toString() === [-1, 1].toString()) {
                    // going top right
                    pt1coord = ` ${x1 + dW},${y1 + dH} ${x1 + dW},${y1 + h - dH} ${x1 + w - dW},${y1 + h - dH} `; //↖️↙️↘️
                    pt2coord = ` ${x2 + w - dW},${y2 + h - dH} ${x2 + w - dW},${y2 + dH} ${x2 + dW},${y2 + dH} `; //↘️↗️↖️
                } else if (line.toString() === [1, 1].toString()) {
                    // going bottom right
                    pt1coord = ` ${x1 + w - dW},${y1 + dH} ${x1 + dW},${y1 + dH} ${x1 + dW},${y1 + h - dH} `;
                    pt2coord = ` ${x2 + dW},${y2 + h - dH} ${x2 + w - dW},${y2 + h - dH} ${x2 + w - dW},${y2 + dH} `;
                } else if (line.toString() === [1, -1].toString()) {
                    // going bottom left
                    pt1coord = ` ${x1 + w - dW},${y1 + h - dH} ${x1 + w - dW},${y1 + dH} ${x1 + dW},${y1 + dH} `; //↘️↗️↖️
                    pt2coord = ` ${x2 + dW},${y2 + dH} ${x2 + dW},${y2 + h - dH} ${x2 + w - dW},${y2 + h - dH} `; //↖️↙️↘️
                } else if (line.toString() === [-1, -1].toString()) {
                    // going top left
                    pt1coord = ` ${x1 + dW},${y1 + h - dH} ${x1 + w - dW},${y1 + h - dH} ${x1 + w - dW},${y1 + dH} `;
                    pt2coord = ` ${x2 + w - dW},${y2 + dH} ${x2 + dW},${y2 + dH} ${x2 + dW},${y2 + h - dH} `;
                } else if (line.toString() === [0, 1].toString()) {
                    // going right
                    pt1coord = ` ${x1 + dW},${y1 + dH} ${x1 + dW},${y1 + h - dH} `;
                    pt2coord = ` ${x2 + w - dW},${y2 + h - dH} ${x2 + w - dW},${y2 + dH} `;
                } else if (line.toString() === [1, 0].toString()) {
                    // going down
                    pt1coord = ` ${x1 + w - dW},${y1 + dH} ${x1 + dW},${y1 + dH} `;
                    pt2coord = ` ${x2 + dW},${y2 + h - dH} ${x2 + w - dW},${y2 + h - dH} `;
                } else if (line.toString() === [0, -1].toString()) {
                    // going left
                    pt1coord = ` ${x1 + w - dW},${y1 + h - dH} ${x1 + w - dW},${y1 + dH} `;
                    pt2coord = ` ${x2 + dW},${y2 + dH}  ${x2 + dW},${y2 + h - dH} `;
                } else if (line.toString() === [-1, 0].toString()) {
                    // going up
                    pt1coord = ` ${x1 + dW},${y1 + h - dH} ${x1 + w - dW},${y1 + h - dH} `;
                    pt2coord = ` ${x2 + w - dW},${y2 + dH} ${x2 + dW},${y2 + dH} `;
                } else if (line.toString() === [0, 0].toString()) {
                    // same point
                    pt1coord = ` ${x1 + dW},${y1 + dH} ${x1 + dW},${y1 + h - dH} `;
                    pt2coord = ` ${x1 + w - dW},${y1 + h - dH} ${x1 + w - dW},${y1 + dH} `;
                }
                return pt1coord + pt2coord
            },

            /**
             * Change the colour theme.
             */
            changeColour: function () {
                this.colourtheme += 1;
                this.colourtheme = this.colourtheme % 3;
                var colourtheme = document.getElementById('colour');
                colourtheme.href = `colours${this.colourtheme}.css`;
                sessionStorage.setItem('theme', this.colourtheme);
            },

            /**
             * Get the colour theme saved in sessionStorage.
             */
            getColour: function () {
                var theme = sessionStorage.getItem('theme');
                if (theme) {
                    let colourtheme = document.getElementById('colour');
                    let themeNumber = parseInt(theme);
                    colourtheme.href = `colours${themeNumber}.css`;
                }
            },

            // ANIMATIONS

            /**
             * Update the new board to the html DOM.
             */
            updateBoard: function () {
                this.transposeRows = this.transposeMatrix(this.game.currentBoard.rows)
            },

            /**
             * Function used to transpose the board rows to columns.
             * @param {Array} matrix the matrix to be transposed.
             * @returns transposed matrix as array.
             */
            transposeMatrix: function (matrix) {
                const rows = matrix.length;
                const cols = matrix[0].length;

                // Create a new transposed matrix with dimensions cols x rows
                const transposedMatrix = Array(cols)
                    .fill(null)
                    .map(() => Array(rows));

                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        transposedMatrix[i][j] = matrix[j][i];
                    }
                }

                return transposedMatrix;
            },

            /**
             * lift everything by one unit up and refresh the board
             */
            animatedAddRow: function () {
                let timeline = gsap.timeline();
                let tiles = document.getElementsByClassName('grid-cell');
                let height = document.getElementById('0-0').offsetHeight;
                timeline.fromTo(tiles, {
                    transform: 'translate3d(0px, 0px, 0px)'
                }, {
                    y: `-=${height}px`,
                    duration: 0.4,
                    ease: 'linear',
                }, 0)
                timeline.call(this.cleanStyle, [], '>');
                timeline.call(this.updateBoard, [], '<');
                timeline.play();
            },

            /**
             * Shake the given DOM element to indicate that there are relevant invalid actions.
             * @param {*} dom the DOM element to be shaked.
             */
            shake(dom) {
                gsap.fromTo(dom, {
                    x: -6,
                    ease: 'sine.inOut',
                    duration: 0.3,
                }, {
                    x: 6,
                    yoyo: true,
                    repeat: 3,
                    duration: 0.1,
                    ease: 'sine.inOut',
                    onComplete: function () {
                        gsap.to(dom, {
                            x: 0,
                            duration: 0.1,
                            ease: 'sine.inOut',
                            onComplete: (() => {
                                gsap.set(dom, { clearProps: 'transform' })
                            })
                        })
                    }
                }
                );
            },

            /**
             * Let the deleted tiles disappear and let the tiles on top fall down and refresh the board.
             */
            animatedPlayWord: async function (deleting) {
                let timeline = gsap.timeline();
                let columnGroups = {};
                let alltiles = document.getElementsByClassName('grid-cell');
                // reset position
                timeline.set(alltiles, { transform: 'translate3d(0px, 0px, 0px)' }, 0)
                // disappear
                for (let i = 0; i < deleting.length; i++) {
                    let coordinate = deleting[i];
                    let columnNumber = coordinate[1];
                    let id = `${coordinate[0]}-${coordinate[1]}`;
                    let tile = document.getElementById(id);
                    if (columnGroups[columnNumber]) {
                        columnGroups[columnNumber].push(coordinate);
                    } else {
                        columnGroups[columnNumber] = [coordinate];
                    };
                    timeline.fromTo(tile, { transform: 'translate3d(0px, 0px, 0px)' }, {
                        opacity: 0,
                        ease: Power2.easeInOut,
                        duration: 0.3,
                    }, 0.1);
                };
                let atile = document.getElementById('0-0');
                let height = atile.offsetHeight;
                for (let j = 0; j < this.game.currentBoard.rows[0].length; j++) {
                    let colArray = columnGroups[j.toString()] || [];
                    colArray = colArray.filter((coordinate, index, self) =>
                        index === self.findIndex((c) => c[0] === coordinate[0] && c[1] === coordinate[1])
                    );
                    for (let i = 0; i < this.game.currentBoard.rows.length; i++) {
                        let numMove = colArray.filter(element => element[0] > i).length;
                        let indeleting = deleting.some(coords => coords[0] == i && coords[1] == j);
                        let tile2 = document.getElementById(`${i}-${j}`);
                        let move = parseFloat(height * numMove);
                        // tiles that need to fall
                        if (!indeleting && numMove != 0) {
                            timeline.fromTo(tile2, { transform: 'translate3d(0px, 0px, 0px)' }, {
                                y: `+=${move}px`,
                                duration: 0.4,
                                ease: Power2.easeInOut,
                            }, 0.5);
                        };
                        // all tiles goes up
                        timeline.fromTo(tile2, {
                            transform: `translate3d(0px, ${move}px, 0px)`
                        }, {
                            y: `-=${height}px`,
                            duration: 0.3,
                            ease: 'linear'
                        }, 1);
                    }
                };
                timeline.call(this.cleanStyle, [], 1.3);
                timeline.call(this.updateBoard, [], 1.3);
                timeline.play();
            },

            /**
             * Clear the styles of tiles.
             */
            cleanStyle: function () {
                let alltiles = document.querySelectorAll('.grid-cell');
                alltiles.forEach(function (tile) {
                    tile.style.transition = 'none';
                    // tile.style.opacity=null;
                    // tile.style.transform=null;
                    // tile.style.removeProperty('transition');
                    tile.style.removeProperty('opacity');
                    tile.style.removeProperty('transform');
                    tile.style.removeProperty('translate');
                    tile.style.removeProperty('rotate');
                    tile.style.removeProperty('scale');
                    tile.style.removeProperty('display');
                });
            },


            // OTHER FUNCTIONS

            getWordDefinition: async function (word, ind, size) {
                let def = document.getElementById(`${size}def${ind}`);
                const WORDurl = `https://wordsapiv1.p.rapidapi.com/words/${word}/definitions`;
                const WORDoptions = {
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': '0eb5495b80msh0d410c2fd2f965dp1cdf41jsn770a74cb75a9',
                        'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
                    }
                };
                try {
                    const response = await fetch(WORDurl, WORDoptions);
                    const result = await response.json();
                    if (result.definitions && result.definitions.length != 0) {
                        def.innerHTML = result.definitions[0].definition
                    } else {
                        def.innerHTML = 'No available definition...'
                    }

                } catch (error) {
                    console.error(error);
                }
            },

            enableSlide() {
                let container = document.getElementById('grid-container');
                container.addEventListener('mousedown', () => { this.mouseDown = true });
                container.addEventListener('mouseup', () => { this.mouseDown = false });
                let gridCells = document.getElementsByClassName('grid-cell');
                Array.from(gridCells).forEach((gridCell) => {
                    gridCell.addEventListener('mousedown', () => {
                        this.cellClick(gridCell.id)
                    })
                    gridCell.addEventListener('mouseenter', () => {
                        if (this.mouseDown) {
                            this.enterTimeout = setTimeout(() => {
                                this.cellClick(gridCell.id)
                            }, 60);
                        }
                    })
                    gridCell.addEventListener('mouseleave', () => {
                        if (this.mouseDown) {
                            clearTimeout(this.enterTimeout);
                        }
                    })
                })
            },


        },
        mounted: async function () {
            this.getColour();
            try {
                await this.getHigh();
                await this.getTrie();
                await this.getGame();
                this.setHintGiver();
                this.hintGiver.generateOptions();
                setTimeout(async () => {
                    await this.enableSlide();
                    console.log('Initialization complete!');
                }, 5000)
            } catch (error) {
                console.error('Error during initialization:', error);
            }
            window.addEventListener('resize', this.getSvgPoints);
        },

    });
    app.mount('body');
};
