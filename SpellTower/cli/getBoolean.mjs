import PromptSync from 'prompt-sync';

const prompt = PromptSync({
    sigint: true
});

/**
 * Poses a yes or no question to the user via prompt-sync. 
 * @param {*} question question to pose. 
 * @returns true or false. 
 */
export default function getBoolean(question) {
    var answer = prompt(question);
    while (!["y", "n", "yes", "no"].includes(answer)) {
        answer = prompt(question);
    }
    return answer[0] == "y";
}
