// declared outside of class so they can be const 
const chanceOfDouble = 0.033;
const emptyCharacter = "?";
const blockCharacter = "0";
const wholeRowCharacters = ["X", "Z", "Q", "J"];
const defaultMinLength = 3;

/**
 * This class captures the tiles of the board. Each Cell has a letter, a 
 * corresponding score, and some game info flags. Cells are ignorant of 
 * their position on the board.  
 */
class Cell {

    constructor({ letter = undefined, getMinLength = () => defaultMinLength, double }) {
        if (!letter) {
            this._letter = Cell.makeRandomLetter();
        } else {
            this._letter = letter.toUpperCase();
        }
        this._score = Cell.scores.get(this._letter) ?? 0; // score defaults to 0
        this._wholeRow = wholeRowCharacters.includes(this._letter);
        this._minLength = getMinLength();
        this._double = double ?? (Math.random() < chanceOfDouble);
    }

    static get emptyCharacter() {
        return emptyCharacter;
    }

    static get blockCharacter() {
        return blockCharacter;
    }

    static get wholeRowCharacters() {
        return wholeRowCharacters;
    }

    static get defaultMinLength() {
        return defaultMinLength;
    }

    get letter() {
        return this._letter;
    }

    get score() {
        return this._score;
    }

    get wholeRow() {
        return this._wholeRow;
    }

    get minLength() {
        return this._minLength;
    }

    get double() {
        return this._double;
    }

    static fromJSON(json) {
        const cell = new Cell({ letter: json._letter, getMinLength: () => json._minLength, double: json._double });
        return cell;
    }

    /**
     * Gives the minimum word length requirement for a cell. 
     * Chance of 5 or 6 should be based on the current score. 
     * 
     * @returns 3, 5 or 6. 
     */
    static getMinLength(currentScore) {
        // TODO 
        return 3;
    }

    /**
     * Uses Scrabble distributions. 
     * @returns a random uppercase letter from the English alphabet. 
     */
    static makeRandomLetter() {
        let randomNumber = Math.floor(Math.random() * 1000);
        let randomLetter = emptyCharacter;
        if (randomNumber < 104) {
            randomLetter = "E";
        } else if (randomNumber >= 104 && randomNumber < 192) {
            randomLetter = "I";
        } else if (randomNumber >= 192 && randomNumber < 276) {
            randomLetter = "S";
        } else if (randomNumber >= 276 && randomNumber < 346) {
            randomLetter = "A"; 
        } else if (randomNumber >= 346 && randomNumber < 406) {
            randomLetter = "N";
        } else if (randomNumber >= 406 && randomNumber < 465) {
            randomLetter = "O";
        } else if (randomNumber >= 465 && randomNumber < 523) {
            randomLetter = "R";
        }else if (randomNumber >= 523 && randomNumber < 580){
            randomLetter = blockCharacter;
        } else if (randomNumber >= 580 && randomNumber < 633) {
            randomLetter = "T";
        } else if (randomNumber >= 633 && randomNumber < 677) {
            randomLetter = "L";
        } else if (randomNumber >= 677 && randomNumber < 717) {
            randomLetter = "C";
        } else if (randomNumber >= 717 && randomNumber < 753) {
            randomLetter = "P";
        } else if (randomNumber >= 753 && randomNumber < 788) {
            randomLetter = "U";
        } else if (randomNumber >= 788 && randomNumber < 821) {
            randomLetter = "D";
        } else if (randomNumber >= 821 && randomNumber < 848) {
            randomLetter = "M";
        } else if (randomNumber >= 848 && randomNumber < 874) {
            randomLetter = "G";
        } else if (randomNumber >= 874 && randomNumber < 898) {
            randomLetter = "H";
        } else if (randomNumber >= 898 && randomNumber < 914) {
            randomLetter = "Y";
        } else if (randomNumber >= 914 && randomNumber < 930) {
            randomLetter = "B";
        } else if (randomNumber >= 930 && randomNumber < 946) {
            randomLetter = "F";
        } else if (randomNumber >= 946 && randomNumber < 955) {
            randomLetter = "X";
        } else if (randomNumber >= 955 && randomNumber < 964) {
            randomLetter = "K";
        } else if (randomNumber >= 964 && randomNumber < 973) {
            randomLetter = "Q";
        } else if (randomNumber >= 973 && randomNumber < 981) {
            randomLetter = "J";
        } else if (randomNumber >= 981 && randomNumber < 989) {
            randomLetter = "W";
        } else if (randomNumber >= 989 && randomNumber < 996) {
            randomLetter = "Z";
        } else{
            randomLetter = "V";
        }
        return randomLetter
    }

    static scores = new Map([
        ["A", 1],
        ["B", 4],
        ["C", 4],
        ["D", 3],
        ["E", 1],
        ["F", 5],
        ["G", 3],
        ["H", 5],
        ["I", 1],
        ["J", 9],
        ["K", 6],
        ["L", 2],
        ["M", 4],
        ["N", 2],
        ["O", 1],
        ["P", 4],
        ["Q", 12],
        ["R", 2],
        ["S", 1],
        ["T", 2],
        ["U", 1],
        ["V", 5],
        ["W", 5],
        ["X", 9],
        ["Y", 5],
        ["Z", 11]
    ])

}

export default Cell;
