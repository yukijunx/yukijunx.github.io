import Cell from "./cell.mjs";

// Declared outside of the class so they can be constants 
const defaultWidth = 8;
const defaultHeight = 12;

/** the minimum length of word to eliminate neighbour cells */
const neighbourThreshold = 5;

class InvalidPathError extends Error {
    constructor(path) {
        super(`${path} is not a valid path`)
    }
}

/**
 * This class captures the grid of letters. The grid is represented as a 
 * 2D array of rows of Cell objects. The last element of the array is the 
 * bottom row of the grid. 
 */
class Board {

    /**
     * Used by the constructor to initialise the board's rows with all 
     * "?" (i.e. empty) cells. 
     * 
     * @param {number} height the number of rows.
     * @param {number} width the number of columns. 
     * @returns a 2D array of Cell objects.
     */
    static makeDefaultRows(height, width) {
        const defaultRows = [];
        for (let i = 0; i < height; i++) {
            const row = [];
            for (let j = 0; j < width; j++) {
                row.push(new Cell({ letter: Cell.emptyCharacter }))
            }
            defaultRows.push(row);
        }
        return defaultRows;
    }

    constructor(height = defaultHeight, width = defaultWidth, rows) {
        this._height = height;
        this._width = width;
        this._rows = rows || Board.makeDefaultRows(height, width);
    }

    get rows() {
        return this._rows;
    }

    set rows(newRows) {
        this._rows = newRows;
    }

    get height() {
        return this._height;
    }

    get width() {
        return this._width;
    }

    static fromJSON(json) {
        const deserializedRows = json._rows.map(row => row.map(cellJson => Cell.fromJSON(cellJson)));
        const board = new Board(json._height, json._width, deserializedRows);
        return board;
    }

    /**
     * Adds a new, randomised row to the bottom of the grid, and removes 
     * the top row from the grid to maintain the overall grid height. 
     * 
     * @returns the top row, which has been removed from the grid. 
     */
    insertRandomRow(getMinLength = undefined) {
        const newRow = [];
        for (let i = 0; i < this._width; i++) {
            newRow.push(new Cell({ getMinLength: getMinLength }));
        }
        // Insert new row
        this._rows.push(newRow);
        // Delete the top row and return the removed row
        return this._rows.shift();
    }

    /**
     * Finds the (up to 8) non-empty neighbours of a cell (given by (x,y) 
     * coordinate). If the given cell is empty then the empty list is 
     * returned. 
     * 
     * @param {number} row the row of the cell (zero-indexed).
     * @param {number} col the column of the cell (zero-indexed). 
     * @returns a list of non-empty cells neighbouring the one given and their [row, col] coordinates; [[[rowIndex, colIndex], neighbour]]. 
     */
    getNonEmptyNeighbours(row, col) {
        let neighbours = [];
        const emptyCellCharacters = [Cell.blockCharacter, Cell.emptyCharacter];
        if (emptyCellCharacters.includes(this._rows[row][col].letter)) {
            // don't care about neighbours of empty cell
            return neighbours;
        }
        for (let rowIndex = row - 1, rowLimit = +row + 1; rowIndex <= rowLimit; rowIndex++) {
            if (0 <= rowIndex && rowIndex < this._rows.length) { // do not reference rows that do not exist 
                let rowArr = this._rows[rowIndex]; // neighbours' row     
                for (let colIndex = col - 1, colLimit = +col + 1; colIndex <= colLimit; colIndex++) {
                    if (!(colIndex == col && rowIndex == row) // do not include the original cell 
                        && 0 <= colIndex && colIndex < rowArr.length  // do not include columns outwith bounds of row 
                    ) {
                        let neighbour = rowArr[colIndex];
                        if (!emptyCellCharacters.includes(neighbour._letter)) {
                            // ignore empty neighbours 
                            neighbours.push([[rowIndex, colIndex], neighbour]);
                        }
                    }
                }
            }
        }
        return neighbours;
    }

    /**
     * Returns the coordinates of the orthogonal neighbours of a given
     * cell. 
     * 
     * @param {number} row the row of the cell (zero-indexed).
     * @param {number} col the column of the cell (zero-indexed). 
     * @returns a list of [row, col] coordinates.
     */
    getOrthogonalNeighbours(row, col) {
        let neighbours = [[row - 1, col], [+row + 1, col], [row, col - 1], [row, +col + 1]];
        return neighbours.filter(coord => {
            return 0 <= coord[0] && coord[0] < this._height
                && 0 <= coord[1] && coord[1] < this._width
        });
    }

    removeCell(row, col) {
        this._rows[row][col] = new Cell({ letter: Cell.emptyCharacter });
    }

    removePath(path) {
        for (let coord of path) {
            this.removeCell(coord[0], coord[1]);
        }
    }

    /**
     * If any non-empty cell is above an empty cell, drop it until it is 
     * not. Think of it as applying gravity to the letter tiles. 
     */
    applyGravity() {
        for (let col = 0; col < this._width; col++) {
            let groundRow = this._height; // the lowest block that we know isn't floating
            while (groundRow > 0) {
                let fallingRow = groundRow - 1; // the first non-empty block above ground 
                while (fallingRow >= 0
                    && this._rows[fallingRow][col].letter == Cell.emptyCharacter
                ) {
                    fallingRow--;
                }
                if (fallingRow < 0) {
                    // only empty space above ground 
                    break;
                } else if (fallingRow == groundRow - 1) {
                    // falling is already touching ground 
                    groundRow--;
                } else {
                    // falling is dropped to be touching ground 
                    this._rows[groundRow - 1][col] = this._rows[fallingRow][col];
                    this._rows[fallingRow][col] = new Cell({ letter: Cell.emptyCharacter });
                    groundRow--;
                }
            }
        }
    }

    /**
     * Determines if a sequence of coordinates a is a valid, acyclic 
     * path within the bounds of the board. 
     *  
     * @param {*} path the sequence of coordinates. 
     * @returns true or false. 
     */
    isPath(path) {
        if (new Set(path.map(x => x.join(","))).size != path.length) {
            // path is cyclic 
            return false;
        }
        for (let i = 0; i < path.length - 1; i++) {
            if (path[i][0] < 0 || path[i][0] >= this._height || path[i][1] < 0 || path[i][1] >= this._width) {
                // coordinate outside of board 
                return false;
            } else if (Math.abs(path[i][0] - path[i + 1][0]) > 1 || Math.abs(path[i][1] - path[i + 1][1]) > 1) {
                // next tile not adjacent to current 
                return false;
            }
        }

        return true;
    }

    /**
     * Returns the plaintext string formed from a given path through the 
     * grid. 
     * @param {*} path an array of [row, col] coordinates. 
     * @returns a string. 
     */
    getWordFromPath(path) {
        if (!this.isPath(path)) {
            throw new InvalidPathError(`[${path.map(x => x.join(",")).join("], [")}]`);
        }
        return path.map(coord => this._rows[coord[0]][coord[1]].letter).join("");
    }

    /**
     * Determines if a proposed path violates minimum word length 
     * constraints of the cells it passes through. 
     * 
     * @param {*} path an array of [row, col] coordinates. 
     * @returns true is long enough, otherwise false.  
     */
    longEnough(path) {
        let minLength = 0;
        for (let coord of path) {
            minLength = Math.max(minLength, this._rows[coord[0]][coord[1]].minLength);
        }
        return minLength <= path.length;
    }

    /**
     * 
     * @param {Number} row the index of the row.  
     * @returns a list of the [row,col] coordinates in the given row. 
     */
    getWholeRowCoords(row) {
        let coords = [];
        for (let col = 0; col < this.width; col++) {
            coords.push([row, col]);
        }
        return coords;
    }

    /**
     * Determines which neighbouring letters would be removed by playing a
     * word. N.B. Does not include the word itself. 
     * 
     * @param {*} path the word to be played. 
     * @returns a list of the neighbours' [row, col] coordinates. 
     */
    getWordNeighbours(path) {
        var neighbourCoords = []; // list of coordinates 
        var wholeRowsToInclude = new Set(); // sets work for numbers, not so much for [row, col] lists 

        for (let coord of path) {
            // build the list of neighbouring coordinates 
            neighbourCoords = neighbourCoords.concat(this.getOrthogonalNeighbours(coord[0], coord[1]));

            // track whole rows to include 
            if (this._rows[coord[0]][coord[1]].wholeRow) {
                wholeRowsToInclude.add(+coord[0]);
            }
        }

        // add whole rows as needed 
        for (let row of wholeRowsToInclude.values()) {
            neighbourCoords.push(...this.getWholeRowCoords(row));
        }

        // remove duplicates from the neighbours list 
        neighbourCoords = [...new Set(neighbourCoords.map(x => x.join(",")))].map(x => x.split(","));
        // remove elements of the original word in the neighbours list 
        neighbourCoords = neighbourCoords.map(x => x.join(",")).filter(x => !path.map(x => x.join(",")).includes(x)).map(x => x.split(",").map(x => Number(x)));

        // filter neighbours based on word length, cell contents and whole rows to include 
        neighbourCoords = neighbourCoords.filter(coord =>
            (path.length >= neighbourThreshold
                || wholeRowsToInclude.has(coord[0])
                || this._rows[coord[0]][coord[1]].letter == Cell.blockCharacter)
            && this._rows[coord[0]][coord[1]].letter != Cell.emptyCharacter
        );

        return neighbourCoords;
    }

    /**
     * Plays a word in the game. This removes tiles, and drops 
     * now-floating cells to fill any created gaps. 
     * 
     * @param {*} path a list of [row, column] coordinates. 
     * @returns a pair of the cells of the word itself, and of the deleted neighbour cells. Used for score calculations. 
     */
    playWord(path) {
        var word = path.map(coord => this._rows[coord[0]][coord[1]]); // list of cells 
        var neighbourCoords = this.getWordNeighbours(path); // list of coordinates 
        var neighbours = neighbourCoords.map(coord => this._rows[coord[0]][coord[1]]); // list of cells
        var toDelete = path.concat(neighbourCoords); // list of coordinates 

        this.removePath(toDelete);
        this.applyGravity();

        return [word, neighbours];
    }

    toString() {
        let string = ""
        for (let row of this._rows) {
            string += row.map(x => x.letter).join(" ") + "\n";
        }
        return string;
    }
}

export default Board;
export { InvalidPathError };
