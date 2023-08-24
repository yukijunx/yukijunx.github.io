import PromptSync from 'prompt-sync';

const prompt = PromptSync({
    sigint: true
});


export default function getPositiveInt(question, allowUndefined = true) {
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
