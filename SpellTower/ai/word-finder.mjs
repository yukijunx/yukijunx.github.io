import { Board } from "../game-engine/index.mjs";
import Trie from "./trie.mjs";

/**
 * Builds a 2D list of neighbours of each cell in the board. 
 * Empty cells are ignored (they are not neighbours and have empty 
 * neighbour lists). 
 * 
 * @param {Board} board the state of the board.  
 * @returns a 2D list of [[row, col], cell] entries with the same dimensions as the board parameter. 
 */
function buildNeighbours(board) {
    let neighbours = [];
    for (var row = 0; row < board.rows.length; row++) {
        let rowNeighbours = [];
        for (var col = 0; col < board.rows[row].length; col++) {
            rowNeighbours.push(board.getNonEmptyNeighbours(row, col));
        }
        neighbours.push(rowNeighbours);
    }
    return neighbours;
}

/**
 * Performs a depth-first traversal of the board to find all words. 
 * 
 * @param {Board} board 
 * @param {Trie} trie 
 * @returns a list of found words, where each word is a plaintext string and a list of tile coordinates. 
 */
function dftWrapper(board, trie) {
    const neighbours = buildNeighbours(board);
    var words = [];
    for (let row = 0; row < board.rows.length; row++) {
        let rowArr = board.rows[row];
        for (let col = 0; col < rowArr.length; col++) {
            words = words.concat(dft(+row, +col, neighbours, board, trie.getChild(board.rows[row][col]._letter)));
        }
    }
    return words;
}

/**
 * Recursively performs a depth-first traversal of the board starting from
 * a given [row, col] coordinate. 
 * 
 * @param {Number} row the row coordinate of search.
 * @param {Number} col the column coordinate of search.
 * @param {*} neighbours a 2D array of lists of neighbours, to reduce redundant work. 
 * @param {Board} board the grid of tiles. 
 * @param {Trie} trie the trie that acts as a dictionary. 
 * @param {*} path the path preceding the current [row, col]. 
 * @returns a list of found words, where each word is a plaintext string and a list of tile coordinates. 
 */
function dft(row, col, neighbours, board, trie, path = []) {
    if (!trie) {
        return [];
    }

    const localNeighbours = neighbours[row][col];
    path.push([row, col]);

    var foundWords = [];
    if (trie.endOfWord) {
        foundWords = foundWords.concat([[board.getWordFromPath(path), path.slice()]]);
    }

    for (let [[neighbourRow, neighbourCol], neighbourCell] of localNeighbours) {
        const nextTrie = trie.getChild(neighbourCell._letter);
        const visited = !!path.find(coord => coord[0] == neighbourRow && coord[1] == neighbourCol); // visited if path contains the neighbour's coordinates 
        if (nextTrie && !visited) {
            foundWords = foundWords.concat(dft(neighbourRow, neighbourCol, neighbours, board, nextTrie, path.slice()));
        }
    }
    return foundWords;
}

export default dftWrapper; 