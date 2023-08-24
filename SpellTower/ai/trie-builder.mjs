import { readFileSync } from "fs";

import Trie from "./trie.mjs";

function buildTrieFromFile(path) {
    var trie = new Trie();

    const content = readFileSync(path, 'utf8');
    var lines = content.split('\n');
    for (var line of lines) {
        if (line.includes(' ')) {
            console.error("! Whitespace in line - only single words are expected")
        }
        trie.addWord(line)
    }

    return trie;
}

export default buildTrieFromFile; 
