class Trie {

    /**
     * Trie/trie node constructor. Instantiates with empty children map. 
     * Should be used to create the root node, upon which addWord() and contains() can be called. 
     */
    constructor() {
        this._children = new Map();
        this._endOfWord = false;
    }

    /**
     * 
     * @param {string} letter key of the desired child node. 
     * @returns a child node if it exists, or undefined if it does not. 
     */
    getChild(letter) {
        return this._children.get(letter.toLowerCase());
    }

    get endOfWord() {
        return this._endOfWord;
    }


    /**
     * Wrapper function to ensure word is lower case.
     * 
     * @param {*} word the word to add. 
     */
    addWord(word) {
        this._addWord(word.toLowerCase());
    }

    /**
     * Adds a word to the trie. Works recursively. Adding the empty string has no effect. 
     * 
     * @param {*} word the word to add. Upon recursive calls, this will be all but the first letter of the word in the previous call. 
     */
    _addWord(word) {
        if (word.length == 0) {
            // end of word reached 
            this._endOfWord = true;
            return;
        }

        if (!this._children.has(word[0])) {
            this._children.set(word[0], new Trie());
        }

        this._children.get(word[0])._addWord(word.slice(1));
    }

    /**
     * Wrapper function to ensure that the given word is lower case.
     *    
     * @param {*} word the word to check for in the trie. 
     * @returns true if the word is in the trie, otherwise false. 
     */
    contains(word) {
        return this._contains(word.toLowerCase());
    }

    /**
     * Determines if a word is in the trie. Works recursively. 
     * If the word is a substring of an added word but was not itself 
     * added, this does not count as being in the trie, e.g., if trie t 
     * has only had "foo" added, then t.contains("f") and 
     * t.contains("fo") both return false. 
     *   
     * @param {*} word the word to check for in the trie. Upon recursive calls, this will be all but the first letter of the word in the previous call. 
     * @returns true if the word is in the trie, otherwise false. 
     */
    _contains(word) {
        if (word.length == 0) {
            // end of word reached 
            return this._endOfWord;
        }

        if (!this._children.has(word[0])) {
            return false;
        }

        return this._children.get(word[0])._contains(word.slice(1));
    }

    toString(depth = 0) {
        var string = ""
        for (let key of this._children.keys()) {
            string += "\n" + "|".repeat(depth) + key;
            string += this._children.get(key).endOfWord ? "." : "";
            string += this._children.get(key).toString(depth + 1);
        }
        return string;
    }

    toJSON() {
        const serializedChildren = {};
        for (const [letter, child] of this._children) {
          serializedChildren[letter] = child.toJSON();
        }
        return {
          children: serializedChildren,
          endOfWord: this._endOfWord,
        };
      }
    
      static fromJSON(json) {
        const trie = new Trie();
        for (const [letter, childJSON] of Object.entries(json.children)) {
          const child = Trie.fromJSON(childJSON);
          trie._children.set(letter, child);
        }
        trie._endOfWord = json.endOfWord;
        return trie;
      }
    
}

export default Trie; 