# ukenglish.txt
From http://www.gwicks.net/dictionaries.htm, accessed 06/06/2023. UK English 82,000 words. Words with accented letters, and words of fewer than 3 letters have been removed. 

# stringhamdict.txt
From https://github.com/stringham/Spell-tower-solver, accessed 05/06/2023. dict.txt. Words with fewer than 3 letters have been removed. 

# combined.txt
The above two word lists in a single file. Duplicate words are not removed. 

# combined-auto.txt
The above two word lists in a single file. Duplicate words are removed. All words are alphabetised and lowercase. 

# combined-Xin10.txt
Built from combined-auto.txt using analysis/word-list-operations.reduce(). 

# combined-average.txt
Built from combined-auto.txt using analysis/word-list-operations.reduce(). 

# combined-strat-average.txt
Built from combined-auto.txt using analysis/word-list-operations.stratifiedReduce(). This is the 46750-word list used in my [Gabriel's] final evaluation of the AI player. 

# shakespeare
Source files from https://www.nltk.org/nltk_data/, accessed 18/07/2023. License: public domain. Built using analysis/word-list-operations.wordListFromCorpusFolder().

# state_union
Source files from https://www.nltk.org/nltk_data/, accessed 18/07/2023. License: public domain. Built using analysis/word-list-operations.wordListFromCorpusFolder(). Some words from 1974-Nixon.txt contained unrecognised characters and were manually removed. 

# gutenberg
Source files from https://www.nltk.org/nltk_data/, accessed 18/07/2023. License: public domain. Built using analysis/word-list-operations.wordListFromCorpusFolder().
