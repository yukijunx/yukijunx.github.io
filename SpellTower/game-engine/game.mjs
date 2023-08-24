import { Trie } from "../ai/index.mjs";
import Board from "./board.mjs";
import Cell from "./cell.mjs";

class GameOverError extends Error {
    constructor(msg) {
        super(msg);
    }
}

class TooShortError extends Error {
    constructor(word) {
        super(`${word} is too short`);
    }
}

class AlreadyPlayedError extends Error {
    constructor(word) {
        super(`${word} has already been played`);
    }
}

class NotAWordError extends Error {
    constructor(word) {
        super(`${word} is not a word`);
    }
}

// const minLengthBounds = {
//     4: [2000, 5000],
//     5: [3500, 7000],
//     6: [5000, Number.MAX_SAFE_INTEGER]
// }

const minLengthBounds = {
    4: [0, 1000],
    5: [0, 2000],
    6: [750, Number.MAX_SAFE_INTEGER]
}

/** For probablity calculations; the score at which the chance of max-length word limits is maximised. */
const upperReasonableLimit = 10000; // 


class Game {

    static get puzzle() { return "puzzle"; }
    static get doublePuzzle() { return "double puzzle"; }

    constructor(currentBoard, trie, mode = Game.puzzle) {
        this._currentBoard = currentBoard;
        this._score = 0;
        this._usedWords = [];
        this._trie = trie;
        this._mode = mode;
        this._bestWord = {"score":0,"cell":[]};
    }

    get bestWord(){
        return this._bestWord
        this._mode = mode;
    }

    get currentBoard() {
        return this._currentBoard;
    }
    get score() {
        return this._score;
    }
    get usedWords() {
        return this._usedWords;
    }

    get mode() {
        return this._mode;
    }

    get trie() {
        return this._trie;
    }

    set bestWord(newBest){
        this._bestWord = newBest;
    }

    set currentBoard(newBoard) {
        this._currentBoard = newBoard;
    }
    set score(newScore) {
        this._score = newScore;
    }
    set usedWords(newUsedWords) {
        this._usedWords = newUsedWords;
    }

    /**
     * @param {Trie} trie
     */
    set trie(trie) {
        this._trie = trie;
    }

    static fromJSON(json) {
        const game = new Game();
        game.currentBoard = Board.fromJSON(json._currentBoard);
        game.score = json._score;
        game.usedWords = json._usedWords;
        game.bestWord = json._bestWord;
        game._mode = json._mode ?? Game.puzzle; 
        return game;
    }

    /**
     * 
     * @param {*} wordCells 
     * @param {*} neighbourCells 
     * @returns a [score, extraMult] pair, with the extraMult coming from double score letters. 
     */
    calcWordScore(wordCells, neighbourCells) {
        let multiplier = wordCells.length;
        let score = 0;
        let extraMult = 1;
        for (let cell of wordCells) {
            if (cell.double) {
                extraMult = extraMult * 2;
            }
            score += cell.score;
        }
        for (let cell of neighbourCells) {
            score += cell.score;
        }
        score = score * multiplier;
        return [score, extraMult];
    }

    /**
     * Inserts a new row at the bottom of the grid and removes the top row.
     * If that top row contained a non-empty cell, throws a GameOverError. 
     */
    insertRandomRow() {
        let shiftedRow = this._currentBoard.insertRandomRow(() => this.getMinLength());
        if (shiftedRow.filter(x => x.letter != Cell.emptyCharacter).length > 0) {
            throw new GameOverError;
        }
    }

    /**
     * Randomly determines the minimum length requirement of a cell. The 
     * default is 3. The higher to the upper score bound of a length 
     * requirement the current score is, the higher the chance of that 
     * length requirement. The liklihood of any non-3 requirement being
     * applied at all is based off of the sum of the individual liklihoods. 
     * 
     * @returns 3, 4, 5 or 6. 
     */
    getMinLength() {
        const minChance = 0.05;
        const maxChance = 0.125;
        let baseProbabilities = {};
        for (let [minLength, [lowerBound, upperBound]] of Object.entries(minLengthBounds)) {
            if (lowerBound <= this._score && this._score <= upperBound) {
                baseProbabilities[minLength] = (this._score - lowerBound) / (Math.min(upperReasonableLimit, upperBound) - lowerBound);
            }
        }
        if (Object.keys(baseProbabilities).length == 0) {
            return Cell.defaultMinLength;
        }
        let sumOfBaseProbabilities = Object.values(baseProbabilities).reduce((a, b) => a + b);
        let probabilityOfLimit = Math.max(minChance, Math.min(maxChance, sumOfBaseProbabilities / Object.entries(baseProbabilities).length));
        if (Math.random() <= probabilityOfLimit) {
            let probabilityScale = 1 / sumOfBaseProbabilities;
            let scaledProbabilities = Object.entries(baseProbabilities).map(el => [el[0], el[1] * probabilityScale]);
            let randomChance = Math.random();
            let bound = 0;
            for (let [minLength, scaledProbability] of scaledProbabilities) {
                bound += scaledProbability;
                if (randomChance <= bound) {
                    return +minLength;
                }
            }
        }
        return Cell.defaultMinLength;
    }


    /**
     * (Attempts to) play a word on the grid. Throws errors if the word 
     * is invalid, or if the word was valid but playing it lost the game. 
     * 
     * Note: you might want to split this function into a few smaller 
     * ones to more easily animate stuff, e.g. the new row being added. 
     * 
     * @param {*} path a list of [row, column] coordinates. If an empty list, an empty row is inserted.
     */
    playWord(path) {
        if (path.length == 0) {
            this.insertRandomRow();
            return;
        }
        let word = this._currentBoard.getWordFromPath(path);
        if (!this._currentBoard.longEnough(path)) {
            throw new TooShortError(word);
        } else if (this._usedWords.includes(word)) {
            throw new AlreadyPlayedError(word);
        } else if (!this._trie.contains(word)) {
            throw new NotAWordError(word);
        } else {
            let [wordCells, neighbourCells] = this._currentBoard.playWord(path);
            let wordScore = this.calcWordScore(wordCells, neighbourCells)[0] * this.calcWordScore(wordCells, neighbourCells)[1];
            this._score += wordScore;
            this._usedWords.push(word);
            this.insertRandomRow();
            if (this._mode == Game.doublePuzzle) {
                this.insertRandomRow();
            }
        }

    }

}

export default Game;
export { GameOverError, TooShortError, AlreadyPlayedError, NotAWordError };
