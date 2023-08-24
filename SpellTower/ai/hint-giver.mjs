import { Cell, Game } from "../game-engine/index.mjs";
import { findWords } from "./index.mjs";
import Word from "./word.mjs";

export default class HintGiver {

    constructor(game) {
        // unchanging
        this._game = game;
        this._board = game.currentBoard;
        this._trie = game.trie;
        this._colWeights = this.calcColWeights();
        // changed externally 
        this._usedWords = game.usedWords;
        // changed locally 
        this._options = [];
        this._dangerCols = new Set();
        this._colHeights = Array(Number(this._board.width));
        this._enablingUs;
    }

    static newRowValues = {
        plaintext: '<ADD ROW>',
        path: [],
        score: 0,
        minLength: 0,
        lengthReqs: new Map(),
        alreadyPlayed: false,
        blockNeighbourCount: 0,
        edgeProportion: 0,
        basicShapeRating: 0,
        robbedQs: 0,
    }

    /**
     * Calculates multipliers for each column that allow prioritising edge 
     * columns more than central columns. Left- and rightmost columns have 
     * a value of 1, and central columns (of an odd-width board) have a 
     * value of 0. 
     * 
     * @returns an array of weights for the columns of the board. 
     */
    calcColWeights() {
        let colVals = new Array(this._board.width).fill(0);
        let width = this._board.width;
        let midpoint = (width - 1) / 2;
        for (let col = 0; col < width; col++) {
            colVals[col] = Math.abs(col - midpoint) / midpoint;
        }
        return colVals;
    }


    /*/////////////////////////////////////////////////////////////////*/
    /* Start of findX methods, called on a per-board-arrangement basis */
    /*/////////////////////////////////////////////////////////////////*/

    /**
     * Finds the height of each column and updates this object accordingly. 
     */
    findColHeights() {
        this._colHeights.fill(this._board.height);
        for (let row of this._board.rows) {
            for (let col = 0; col < row.length; col++) {
                if (row[col].letter == Cell.emptyCharacter) {
                    this._colHeights[col]--;
                }
            }
        }
    }

    /**
     * Finds the columns that are close to the top of the board and 
     * updates this object accordingly. 
     */
    findDangerCols() {
        this._dangerCols.clear();
        const dangerHeight = this._board.height - Word.dangerZone;
        for (let col = 0; col < this._colHeights.length; col++) {
            if (this._colHeights[col] > dangerHeight) {
                this._dangerCols.add(col);
            }
        }
    }

    /**
     * Almost all instances of Q in the English language are followed by 
     * a U. It therefore seems sensible to preserve Us that could be used
     * to play a Q, defined as the Us that are in the same or an adjacent 
     * column to one or more Qs on the board. This methods finds all such 
     * Us and the Qs that they enable, updating this object accordingly. 
     * 
     */
    findEnablingUs() {
        const qCoords = [];
        const uCoords = [];
        for (let rowIndex = 0; rowIndex < this._board.length; rowIndex++) {
            for (let colIndex = 0; colIndex < this._board[rowIndex].length; colIndex++) {
                let cell = this._board[rowIndex][colIndex];
                if (cell.letter == "Q") {
                    qCoords.push([rowIndex, colIndex]);
                } else if (cell.letter == "U") {
                    uCoords.push([rowIndex, colIndex]);
                }
            }
        }

        this._enablingUs = new Map(
            uCoords.map(uCoord =>
                [
                    uCoord.join(","),
                    qCoords.filter(qCoord => Math.abs(qCoord[1] - uCoord[1]) <= 1)
                        .map(coord => coord.join(","))
                ]
            ));
    }

    /*/////////////////////////////////////////////////////////////////*/
    /*       Start of calcX methods, called on a per-word basis        */
    /*/////////////////////////////////////////////////////////////////*/


    /**
     * Finds the minimum length of a word based on the length requirements
     * of the word cells, and also finds the number of cells with length 
     * requirements among both the word and neighbour cells. The former is 
     * used to check that a word is playable, and the latter is used for 
     * heuristic evaluation of words. 
     * 
     * @param {*} wordCells the cells of the word itself.
     * @param {*} neighbourCells the cells of the neighbours. 
     * @returns a two-item [Number, Map<Number,Number>] array of the word's minimum length and its tiles' length requirements. 
     */
    static calcLengthReqs(wordCells, neighbourCells) {
        let minLength = 0;
        let lengthReqs = new Map();
        for (let cell of wordCells) {
            minLength = Math.max(minLength, cell.minLength);
            lengthReqs.set(cell.minLength, (lengthReqs.get(cell.minLength) ?? 0) + 1);
        }
        for (let cell of neighbourCells) {
            // minLength = Math.max(minLength, cell.minLength); // this should not have been there
            lengthReqs.set(cell.minLength, (lengthReqs.get(cell.minLength) ?? 0) + 1);
        }
        return [minLength, lengthReqs];
    }

    /**
     * Calculates a value representative of how close to the edge a word
     * is, with vertical words in an edgemost column being 1 and vertical
     * words in the middle column (of an odd-width board) being 0. 
     * @param {*} path the cells to be removed by playing a word. 
     * @returns a value between 0 and 1.
     */
    calcEdgeProportion(path) {
        let edgeProportion = 0;
        for (let [_, col] of path) {
            edgeProportion += Number(this._colWeights[col]);
        }
        return (edgeProportion / path.length) ?? 0;
    }

    /** 
     * Determines if the word has a good shape assuming the board starts 
     * flat. A good shape is one where columns are shorter than their 
     * inward neighbour, and a bad shape is the opposite. The difference 
     * between outer columns is weighted higher than the difference 
     * between inner columns.
     * 
     *              _
     * |          _| |_          | 
     * |        _|     |_        |
     * |      _|         |_      |
     * |    _|             |_    |
     * |  _|                 |_  |
     * |_|                     |_|
     * |_________________________| good 
     * 
     * |_                       _|
     * | |_                   _| |
     * |   |_               _|   |
     * |     |_           _|     |
     * |       |_       _|       |
     * |         |_   _|         |
     * |___________|_|___________| bad
     * 
     * @param {*} path the cells to be removed by playing a word. 
     * @returns [badDiff, goodDiff] scaled to sum to one 
     */
    calcBasicShapeRating(path) {
        const colCounts = new Array(this._board.width).fill(0);
        for (let [_, col] of path) {
            colCounts[col] += 1;
        }
        var [badDiff, goodDiff] = [0, 0];
        let middle = (colCounts.length - 1) / 2;

        // calculate rating for left side of board 
        for (let i = 0; i < Math.floor(middle); i++) {
            let diff = colCounts[i] - colCounts[i + 1];
            if (diff > 0) {
                goodDiff += diff;
            } else if (diff < 0) {
                badDiff -= diff;
            }
        }

        // intentionally miss comparing middle two columns for even width boards

        // calculate rating for right side of board 
        for (let i = Math.ceil(middle); i < colCounts.length - 1; i++) {
            let diff = colCounts[i] - colCounts[i + 1];
            if (diff < 0) {
                goodDiff -= diff;
            } else if (diff > 0) {
                badDiff += diff;
            }
        }

        let length = path.length;
        return [badDiff, goodDiff].map(x => x / length);
    }


    /**
     * Calculates the heights the columns would be after playing a given word. 
     */
    calcNewColHeights(path) {
        var newColHeights = this._colHeights.map(x => Number(x) + this.getRowIncrement(path)); // new row will be added
        for (let [_, col] of path) {
            newColHeights[col]--;
        }
        return newColHeights;
    }

    /**
     * Determines if a word would add 1 new row, or 2. If the word is 
     * actually adding a new row (i.e. path == []) then it would always 
     * add 1 new row, but all other words add 2 rows iff the game mode is 
     * Double Puzzle. 
     * 
     * @param {*} path the path of the word to play. 
     * @returns 1 or 2. 
     */
    getRowIncrement(path) {
        if (path.length == 0 || this._game.mode != Game.doublePuzzle) {
            return 1;
        } else {
            return 2;
        }
    }


    /** 
     * Calculates a rating of the resulting board shape after playing a 
     * given word. A good shape is one where columns are shorter than their 
     * inward neighbour, and a bad shape is the opposite. Good ratings are 
     * positive, bad ratings are negative, and degrees of good and bad are
     * captured by rating magnitude.  The difference between outer columns
     * is weighted higher than the difference between inner columns.
     * 
     * N.B. returns false if playing the word would lose the game.  
     * 
     *              _
     * |          _| |_          | 
     * |        _|     |_        |
     * |      _|         |_      |
     * |    _|             |_    |
     * |  _|                 |_  |
     * |_|                     |_|
     * |_________________________| good 
     * 
     * |_                       _|
     * | |_                   _| |
     * |   |_               _|   |
     * |     |_           _|     |
     * |       |_       _|       |
     * |         |_   _|         |
     * |___________|_|___________| bad
     * 
     * @param {*} path the cells to be removed by playing a word. 
     * @returns a rating, or false if playing the word would lose the game. 
     */
    calcBoardShapeRating(path) {
        const newColHeights = this.calcNewColHeights(path);

        if (newColHeights.filter(x => x > this._board.height).length > 0) {
            // playing the word would lose the game 
            return false;
        }

        var rating = 0;
        let middle = (newColHeights.length - 1) / 2;

        // find rating for left side of board 
        for (let i = 0; i < Math.floor(middle); i++) {
            rating += Math.min(1, newColHeights[i + 1] - newColHeights[i]) * this._colWeights[i];
        }

        // intentionally miss comparing middle two columns for even-width boards

        // find rating for right side of board 
        for (let i = Math.ceil(middle); i < newColHeights.length - 1; i++) {
            rating += Math.min(1, newColHeights[i] - newColHeights[i + 1]) * this._colWeights[i + 1];
        }

        return rating;
    }

    /**
     * Counts how many of the cells in path are in columns that are 
     * close to the top of the board. 
     * 
     * @param {*} path the cells that would be removed by playing a word. 
     * @returns the number of cells in path that are in danger columns. 
     */
    calcDangerColCount(path) {
        let count = 0;
        for (let [_, col] of path) {
            if (this._dangerCols.has(col)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Calculates how many Qs the given path would rob of an enabling U. 
     * Note that if a Q is enabled by multiple Us and more than one of 
     * those Us are included in the path then the Q will be counted once
     * for each enabling U that is in the path. Also note that this means 
     * if a Q has two enabling Us and only 1 is taken then this will still
     * count as a robbed Q. 
     * 
     * @param {*} path 
     * @returns 
     */
    calcRobbedQCount(path) {
        // find Us in the path that enable one or more Qs
        const possibleEnablers = path.filter(coord =>
            this._enablingUs.has(coord.join(",")));

        // determine how many Qs those Us would be robbed from  
        const robbedQs = [];
        for (let uCoord of possibleEnablers) {
            robbedQs.push(...this._enablingUs.get(uCoord.join(","))
                .filter(qCoord =>
                    !path.map(coord => coord.join(",")).includes(qCoord))
            );
        }

        return robbedQs.length;
    }

    /**
     * Finds how many words pass through each non-empty cell on the grid. 
     * 
     * I can think of a few ways to use this information directly:
     * - Prioritise words that pass through low-density cells 
     * - Prioritise words underneath low-density cells, hopefully shifting 
     * them 
     * 
     * This is an attempt to mimic human players spotting bad tile 
     * arrangements (e.g. adjacent i's, or blocks of consonants) and 
     * trying to break them up, but I doubt it will be as useful as that. 
     * @returns 
     */
    calcWordDensity() {
        const occurrencesInPaths = this._board.rows
            .map(row => row.map(cell => {
                if (cell._letter == Cell.emptyCharacter
                    || cell._letter == Cell.blockCharacter) {
                    return -1;
                } else {
                    return 0;
                }
            }));
        const foundWords = findWords(this._board, this._trie);
        foundWords.map(el => {
            let path = el[1];
            for (let [row, col] of path) {
                occurrencesInPaths[row][col]++;
            }
        });
        let max = Math.max(...occurrencesInPaths.flat());
        const densities = occurrencesInPaths
            .map(row => row.map(x => x < 0 ? x : x / max));
        return densities;
    }

    /**
     * Sorts short, non-empty paths to the end of a list.
     * @param {*} threshold the maximum length of a short list. 
     * @returns 
     * 
     * N.B. FOUND TO BE INEFFECTIVE; NOT IN ACTIVE USE
     */
    sendShortyToTheBack(threshold) {
        return (a, b) => {
            const lengthA = a._path.length > 0 ? a._path.length : threshold + 1;
            const lengthB = b._path.length > 0 ? b._path.length : threshold + 1;
            if (lengthA <= threshold && lengthB <= threshold
                || lengthA > threshold && lengthB > threshold) {
                return b._value - a._value;
            } else if (lengthA <= threshold) {
                return 1;
            } else {
                return -1;
            }
        }
    }

    generateOptions() {
        const foundWords = findWords(this._board, this._trie);
        this.findColHeights();
        this.findDangerCols();
        this.findEnablingUs();

        this._options = foundWords.map(el => {
            let plaintext = el[0];
            let path = el[1];
            let neighbourCoords = this._board.getWordNeighbours(path);
            let allCoords = path.concat(neighbourCoords);
            let wordCells = path.map(coord => this._board.rows[coord[0]][coord[1]]);
            let neighbourCells = neighbourCoords.map(coord => this._board.rows[coord[0]][coord[1]]);
            let [wordScore, scoreMult] = this._game.calcWordScore(wordCells, neighbourCells);
            let [minLength, lengthReqs] = HintGiver.calcLengthReqs(wordCells, neighbourCells);
            let blockNeighbourCount = neighbourCells.filter(x => x.letter == Cell.blockCharacter).length;
            let edgeProportion = this.calcEdgeProportion(allCoords);
            let [badDiff, goodDiff] = this.calcBasicShapeRating(allCoords);
            let basicShapeRating = goodDiff - badDiff;
            let dangerColCount = this.calcDangerColCount(allCoords);
            let boardShapeRating = this.calcBoardShapeRating(allCoords);
            let robbedQs = this.calcRobbedQCount(allCoords);

            return new Word({
                plaintext: plaintext,
                path: path,
                score: wordScore * scoreMult,
                minLength: minLength,
                lengthReqs: lengthReqs,
                alreadyPlayed: this._usedWords.includes(plaintext),
                blockNeighbourCount: blockNeighbourCount,
                edgeProportion: edgeProportion,
                basicShapeRating: basicShapeRating,
                dangerColCount: dangerColCount,
                boardShapeRating: boardShapeRating,
                robbedQs: robbedQs,
            })
        });

        // add new row as an option 
        this._options.push(new Word({
            ...HintGiver.newRowValues,
            dangerColCount: this.calcDangerColCount([]),
            boardShapeRating: this.calcBoardShapeRating([]),
        }));

        // remove unplayable words 
        this._options = this._options.filter(word => word._value !== false);

        this._options.sort((a, b) => b._value - a._value);
        // this.tieredSort(); 
    }

    /**
     * Instead of sorting by the combined heuristic value, tieredSort 
     * applies successive sorts per heuristic measure. Essentially, 
     * lower-priority metrics are only used to tie-break between words 
     * that are equal for all higher-priority metrics. This relies on 
     * a stable implementation of sort, as in ECMAScript 2019. 
     * 
     * After other metrics, it forces words with danger columns to the 
     * front. 
     * 
     * N.B. FOUND TO BE INEFFECTIVE; NOT IN ACTIVE USE 
     */
    tieredSort() {
        /* high priority items first */
        const prioritisedMetrics = [
            "_boardShapeRating",
            "_dangerColCount",
            "_minLength",
            "_edgeProportion",
            "_basicShapeRating",
            "_score",
            "_length",
            "_blockNeighbourCount",
        ]
        prioritisedMetrics.reverse();

        // remove unplayable words 
        this._options = this._options.filter(word => word._value !== false);

        for (const metric of prioritisedMetrics) {
            this._options.sort((a, b) => b[metric] - a[metric]);
        }

        this._options.sort((a, b) => {
            if (a._dangerCols == 0 && b._dangerCols == 0) {
                return 0;
            } else if (a._dangerCols > 0 && b._dangerCols > 0) {
                return 0;
            } else {
                return b._dangerCols - a._dangerCols;
            }
        });
    }

    /**
     * Accessor method for sorted list of options to be used as hints. 
     * @param {*} howMany how many hints to get. 
     * @returns the top howMany options from the sorted list. 
     */
    getHints(howMany) {
        return this._options.slice(0, howMany);
    }

}