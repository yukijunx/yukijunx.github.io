import { argv, stdout } from 'node:process';
import PromptSync from 'prompt-sync';

import { findWords, HintGiver, Word } from '../ai/index.mjs';
import buildTrieFromFile from '../ai/trie-builder.mjs';
import { weightObjects } from '../analysis/common-values.mjs';
import { Board, Game, GameOverError, InvalidPathError } from "../game-engine/index.mjs";
import complete from './complete.mjs';
import getBoolean from './getBoolean.mjs';
import getInt from './getInt.mjs';
import printBoard from './printBoard.mjs';

/** The number of found words to display for the "find" command */
const displayedWords = 10;

const heuristicWeights = weightObjects.refinedGuess4; 

export const prompt = PromptSync({
    sigint: true,
    autocomplete: complete([
        "add",
        "find",
        "hint",
        "hint-details",
        "hint-full",
        "cheat",
        "params"
    ])
});

const debugging = argv.includes("-d") || argv.includes("-debug");

/**
 * Creates the trie for word recognition and lookup, giving the option for
 * a non-default word list path.
 * @returns the trie. 
 */
function buildTrie() {
    var trie;
    while (!trie) {
        const defaultWordListPath = "./resources/ukenglish.txt";
        var wordListPath = prompt("Word list path> ", defaultWordListPath);
        try {
            trie = buildTrieFromFile(wordListPath);
        } catch (e) {
            stdout.write(e.message);
            trie = undefined;
        }
    }
    return trie;
}

/**
 * Converts a string of of comma-seperated coordinates to an array. 
 *
 * @param string a string of the form "[x,y], ..., [a,b]".
 * @returns an array of coordinates, represented as two-item arrays. 
 */
function listFromString(string) {
    let cleaned = string.replaceAll(" ", "").slice(1, -1);
    let list = cleaned.split("],[");
    return list.map(x => x.split(","));
}

function gameLoop() {
    const width = getInt("Board width> ")
    const height = getInt("Board height> ");
    const trie = buildTrie();
    const board = new Board(height, width);
    for (let i = 0; i < board.height / 2; i++) {
        board.insertRandomRow();
    }

    let doubleTrouble = getBoolean("Do you want to play Double Puzzle?> ");
    const game = new Game(board, trie, doubleTrouble ? Game.doublePuzzle : undefined);
    const hintGiver = new HintGiver(game);
    Word.setHyperParams(heuristicWeights);
    if (debugging) stdout.write(`\ncolWeights: ${hintGiver._colWeights.join(", ")}\n`);
    var ongoing = true;

    while (ongoing) {
        stdout.write("\n");
        stdout.write(`Current score: ${game.score}\n`);
        printBoard(board);
        hintGiver.generateOptions();
        var path;
        var word;
        const input = prompt("Word path to play (or \"add\", \"find\")> ", "add")
        try {
            switch (input.toLowerCase()) {
                case "add":
                    game.insertRandomRow();
                    break;
                case "find":
                    let words = findWords(board, trie);
                    let randomSample = [];
                    for (let i = 0; i < Math.min(displayedWords, words.length); i++) {
                        randomSample.push(words[Math.floor(Math.random() * words.length)][0]);
                    }
                    stdout.write(`Found ${words.length} words, including: ${randomSample.join(", ")}\n`);
                    break;
                case "hint":
                    let options = hintGiver.getHints(5).map(x => x._plaintext);
                    stdout.write(`Top 5 suggested words: ${options.join(", ")}\n`);
                    break;
                case "hint-details":
                    stdout.write(`dangerCols: ${Array.from(hintGiver._dangerCols.values()).join(", ")}\n`);
                    stdout.write(`colHeights: ${hintGiver._colHeights.join(", ")}\n`);
                    let detailedOptions = hintGiver.getHints(5).map(x => JSON.stringify(x));
                    stdout.write(`Top 5 suggested words: \n${detailedOptions.join("\n\n")}\n`);
                    break;
                case "hint-full":
                    stdout.write(`dangerCols: ${Array.from(hintGiver._dangerCols.values()).join(", ")}\n`);
                    stdout.write(`colHeights: ${hintGiver._colHeights.join(", ")}\n`);
                    let optionsFull = hintGiver.getHints(undefined).map(x => JSON.stringify(x));
                    stdout.write(`All options: \n${optionsFull.join("\n\n")}\n`);
                    break;
                case "cheat":
                    if (hintGiver._options[0]?._value) {
                        stdout.write(`Playing '${hintGiver._options[0]._plaintext}'\n`);
                        game.playWord(hintGiver._options[0]._path);
                    } else {
                        stdout.write(`No playable words found; adding new row\n`);
                        game.insertRandomRow();
                    }
                    break;
                case "params":
                    Array.from(Object.entries(Word)).forEach(
                        (keyVal) => {
                            const key = keyVal[0];
                            const val = keyVal[1];
                            if (val instanceof Map) {
                                console.log(`  ${key}: ${[...val].map(x => x.join("->")).join(";")}`)
                            } else {
                                console.log(`  ${key}: ${val}`)
                            }
                        }
                    );
                    break;
                default:
                    try {
                        path = listFromString(input);
                        word = board.getWordFromPath(path);
                    } catch (e) {
                        if (e instanceof InvalidPathError) {
                            stdout.write(e.message + "\n");
                        } else {
                            stdout.write(`Oops! ${input} doesn't seem to be a parsable path or known command.\n`);
                        }
                        continue;
                    }
                    if (getBoolean(`Do you want to play ${word}? (y/n)> `)) {
                        game.playWord(path);
                    }
                    break;
            }
        } catch (e) {
            if (e instanceof GameOverError) {
                stdout.write("Game Over!\n");
                stdout.write(`Final score: ${game.score}\n`);
                ongoing = false;
            } else {
                throw e;
            }
        }
    }
}

gameLoop();
