import { stdout } from 'node:process';
import { Board, Cell } from "../game-engine/index.mjs";

/** 4 -> yellow, 5 -> orange, 6 -> red */
export const wordLengthColours = [undefined, undefined, undefined, undefined, 226, 208, 202];
export const colouredText = (colour, string) => `\x1B[38;5;${colour}m${string}\x1B[0m`;
export const underlinedText = (string) => `\x1B[4m${string}\x1B[0m`;

/**
 * Prints a board to the console. Double score letters are underlined. 
 * Letters with minimum word requirements are coloured yellow for 4, 
 * orange for 5 and red for 6. 
 * 
 * @param {*} board the board to print. 
 */
export default function printBoard(board) {
    if (!board instanceof Board) {
        console.error("! Cannot print non-Board objects with printBoard");
    } else {
        let i = 0;
        const iMax = board.height - 1;
        const paddingWidth = ("" + iMax).length;
        const rowSeperator = " ".repeat(paddingWidth) + "+-".repeat(board.width) + "+\n";
        stdout.write(" ".repeat(paddingWidth));
        for (let col = 0; col < board.width; col++) {
            stdout.write(` ${col % 10}`);
        }
        stdout.write("\n");
        for (var row of board.rows) {
            stdout.write(rowSeperator);
            stdout.write(("" + i++).padStart(paddingWidth, " "));
            for (var cell of row) {
                stdout.write("|");
                switch (cell.letter) {
                    case Cell.blockCharacter:
                        stdout.write("-");
                        break;
                    case Cell.emptyCharacter:
                        stdout.write(" ");
                        break;
                    default:
                        let string = cell.double ? underlinedText(cell.letter) : cell.letter;
                        let colourCode = wordLengthColours[cell.minLength];
                        if (colourCode) {
                            stdout.write(colouredText(colourCode, string));
                        } else {
                            stdout.write(string);
                        }
                        break;
                }
            }
            stdout.write("|\n");
        }
        stdout.write(rowSeperator);
    }
}
