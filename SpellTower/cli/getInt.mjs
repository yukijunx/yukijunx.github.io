import PromptSync from 'prompt-sync';

const prompt = PromptSync({
    sigint: true
});

/**
 * Gets a positive integer from the user. 
 * 
 * @param {*} question the question to pose. 
 * @param {*} allowUndefined true if empty input is valid.
 * @returns a Number or undefined. 
 */
export default function getInt(question, allowUndefined = true) {
    var int = prompt(question, undefined);
    while (!(allowUndefined && !int) && !Number.isInteger(+int)) {
        int = prompt(question, undefined);
    }
    if (allowUndefined && !int) {
        // for default values 
        return undefined;
    }
    return Number(int);
}
