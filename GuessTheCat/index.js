// CS5003 P1 BY 220009898 'GUESS THE CAT GAME'.

var AllStore = [], TempeStore = [], TempeOpt = [], BreedsStore = [], IdStore = [], TempeInfo = {}, HintList = [], GameInfo = [];
// Stores all the infomation we need later on.
// (everything we fetched, temperaments of each breeds, temperaments with no repeats, 
// breeds, breeds id, temperaments with count, hint list sorted according to usefulness,
// respectively)
var correctIndex;
// Store the index of the correct answer.

var DefaultGameInfo = {
    "CorrectAnswer": "",
    "NumberOfBreeds": 0,
    "NumberOfGuess": 0,
    "NumberOfHint": 0,
    "NumberOfAsk": 0
};
var DefaultRecord = [
    [],
    [],
    [],
    []
]

var MainBlock = document.getElementById("mainblock");
var table = document.getElementById("table");

updateRecord()

/**
 * Removes all the childs of the given parent except the first one.
 * @param {object} parent The parent whose childs need to be removed.
 */
function removeExceptFirst(parent) {
    while (parent.children[1] != undefined) {
        parent.removeChild(parent.children[1])
    }
}

/**
 * Get the local storage of record, if it is null, put in the default value.
 */
function updateRecord() {
    removeExceptFirst(table);
    let StorageObj = JSON.parse(localStorage.getItem("RecordInfo"));
    let DupDefRec = JSON.parse(JSON.stringify(DefaultRecord));
    let record = StorageObj || DupDefRec;
    let len;
    for (let i = 0; i <= 3; i++) {
        len = record[i].length;
        if (len == 0) {
            record[i] = [{ "/": "/" }];
        };
        len = record[i].length;
        for (let j = 0; j < len; j++) {
            let r = document.createElement("tr");
            if (j == 0) {
                let h = document.createElement("th");
                h.innerHTML = (i + 1) * 5;
                h.setAttribute("rowspan", len);
                r.appendChild(h);
            };
            let d1 = document.createElement("td");
            let key = Object.keys(record[i][j])[0];
            d1.innerHTML = key;
            r.appendChild(d1);
            let d2 = document.createElement("td");
            d2.innerHTML = record[i][j][key];
            r.appendChild(d2);
            table.appendChild(r)
        }
    }
};

/**
 * Clear the local storage of record, put in the default value.
 */
function clearRecordButton() {
    localStorage.removeItem("RecordInfo");
    updateRecord();
}

/**
 * Fetch selected number of cats and store the informations.
 */
async function fetchInfo() {
    let SelectedNum = document.querySelector('input[name="Number"]:checked').value;
    GameInfo["NumberOfBreeds"] = SelectedNum;
    // Get everything and save in dat first since we want to know the total number
    // Since it does not have a huge number of breeds we can do this everytime
    await fetch(`https://fixed-silver-cough.glitch.me/catinfo`, {
        method: "get",
        headers: {
            "Content-Type": "application/json"
        },
    })
        .then((res) => res.json())
        .then((resjson) => {
            let RandIndexList = [];
            for (let i = 0; i < SelectedNum;) {
                let RandIndex = Math.floor(Math.random() * resjson.length);
                if (!RandIndexList.includes(RandIndex)) {
                    AllStore.push(resjson[RandIndex]);
                    RandIndexList.push(RandIndex);
                    i++;
                };
            };
        })
        .then(updateStore())
        .catch(err => { console.log('Getting cat image error... ', err) });
}

/**
 * Clear all the current memory of temperaments and breeds, 
 * reload according to AllStore.
 */
function updateStore() {
    TempeStore = [], TempeOpt = [], BreedsStore = [], IdStore = [], TempeInfo = {}, HintList = [];
    for (let i = 0; i < AllStore.length; i++) {
        BreedsStore.push(AllStore[i]["name"]);
        TempeStore.push(AllStore[i]["temperament"]);
        IdStore.push(AllStore[i]["id"]);
    };
    tidyTempe();
}

/**
 * Decide the correct answer randomly based on the breeds we have fetched.
 * Call after fetchInfo().
 */
function rollAnswer() {
    let RandIndex = Math.floor(Math.random() * BreedsStore.length);
    correctIndex = RandIndex;
    GameInfo["CorrectAnswer"] = BreedsStore[RandIndex];
}

/**
 * Fetch an image of a given breed and insert into the given DOM.
 * @param {string} breedid The breed id that we want an image for.
 * @param {object} eachcard The DOM where we are going to insert the image in.
 */
async function fetchImg(breedid, eachcard) {
    await fetch(`https://fixed-silver-cough.glitch.me/catimage/${breedid}`, {
        method: "get",
        headers: {
            "Content-Type": "application/json"
        },
    })
        .then((res) => res.json())
        .then((resjson) => {
            if (resjson.length == 0) {
                let Image = document.createElement("img");
                Image.src = "noimage.jpg";
                Image.style.maxWidth = "100%";
                eachcard.prepend(Image);
            } else {
                let Image = document.createElement("img");
                Image.src = resjson[0].url;
                Image.style.maxWidth = "100%";
                eachcard.prepend(Image);
            }
        })
        .catch(err => { console.log('Getting cat image error... ', err) });
}

/**
 * Remove all the child nodes of the parent.
 * @param {object} parent parent node that we want its children to be removed.
 */
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

/**
 * Add a div as a child of the main block to place all the cards,
 * add given number of cards with breeds and temperaments information to the card div.
 */
function makeCardDiv() {
    let CardDiv = document.createElement("div");
    CardDiv.id = "carddiv";
    for (let i = 0; i < BreedsStore.length; i++) {
        let EachCard = document.createElement("div");
        EachCard.id = "Card" + IdStore[i];
        EachCard.setAttribute("class", "catcard");
        EachCard.setAttribute("onclick", "cardButton(this.id)");
        fetchImg(IdStore[i], EachCard);
        let NameInCard = document.createElement("p");
        NameInCard.setAttribute("class", "catcardname");
        NameInCard.innerHTML = BreedsStore[i];
        EachCard.appendChild(NameInCard);
        let TempeInCard = document.createElement("p");
        TempeInCard.setAttribute("class", "catcardtempe");
        TempeInCard.innerHTML = TempeStore[i];
        EachCard.appendChild(TempeInCard);
        CardDiv.appendChild(EachCard);
        MainBlock.appendChild(CardDiv);
    };
}

/**
 * Add a div as a child of the main block to place the ask & guess interface.
 */
function makeQuesDiv() {
    // Missing button functions /////////////////

    let QuesDiv = document.createElement("div");
    QuesDiv.id = "QuesDiv";

    let QuesStr = document.createElement("p");
    QuesStr.innerHTML = "ASK QUESTIONS!";
    QuesStr.setAttribute("class", "thelabel");
    QuesDiv.appendChild(QuesStr);
    let QuesOpt = document.createElement("select");
    QuesOpt.id = "QuesOpt";
    let QuesOptLabel = document.createElement("label");
    QuesOptLabel.setAttribute("for", "QuesOpt");
    QuesOptLabel.style.fontFamily = "Trattatello, fantasy";
    QuesOptLabel.innerHTML = "Is your cat... ";
    QuesDiv.appendChild(QuesOptLabel);
    QuesDiv.appendChild(QuesOpt);
    let QuesButton = document.createElement("button");
    QuesButton.id = "QuesButton";
    QuesButton.setAttribute("onclick", "askButton()");
    QuesButton.innerHTML = '<i class="fa-solid fa-paw"></i>' + ' ASK ';
    QuesDiv.appendChild(QuesButton);

    let GuesStr = document.createElement("p");
    GuesStr.innerHTML = "MAKE YOUR GUESS!";
    GuesStr.setAttribute("class", "thelabel");
    QuesDiv.appendChild(GuesStr);
    let GuesOpt = document.createElement("select");
    GuesOpt.id = "GuesOpt";
    let GuesOptLabel = document.createElement("label");
    GuesOptLabel.setAttribute("for", "GuesOpt");
    GuesOptLabel.style.fontFamily = "Trattatello, fantasy";
    GuesOptLabel.innerHTML = "Your cat is... ";
    QuesDiv.appendChild(GuesOptLabel);
    QuesDiv.appendChild(GuesOpt);
    let GuesButton = document.createElement("button");
    GuesButton.id = "GuesButton";
    GuesButton.setAttribute("onclick", "guessButton()");
    GuesButton.innerHTML = '<i class="fa-solid fa-paw"></i>' + ' GUESS ';
    QuesDiv.appendChild(GuesButton);

    let HintButton = document.createElement("button");
    HintButton.id = "HintButton";
    HintButton.setAttribute("onclick", "hintButton()");
    HintButton.setAttribute("title", "Note: you cannot enter the leadership if you have asked for a hint!");
    HintButton.innerHTML = '<i class="fa-solid fa-paw"></i>' + ' HINT ';
    QuesDiv.appendChild(HintButton);

    let QuitButton = document.createElement("button");
    QuitButton.id = "QuitButton";
    QuitButton.setAttribute("onclick", "quitButton()");
    QuitButton.innerHTML = '<i class="fa-solid fa-paw"></i>' + ' QUIT ';
    QuesDiv.appendChild(QuitButton);

    MainBlock.appendChild(QuesDiv)

}

/**
 * Put every item of the list into the destination DOM as child nodes.
 * @param {object} lst The list that its items need to be added as childs.
 * @param {object} dest The destination DOM where the childs are to be added to.
 */
function dropdownOpts(lst, dest) {
    removeAllChildNodes(dest);
    for (let i = 0; i < lst.length; i++) {
        let opt = document.createElement("option");
        opt.value = lst[i];
        opt.innerHTML = lst[i];
        dest.appendChild(opt);
    }
}

/**
 * Count for how many times each temperament appears, store in object TempeInfo,
 * and store temperaments in TempeOpt as a list without any repetition.
 */
function tidyTempe() {
    let TempeList = [];
    for (let i = 0; i < TempeStore.length; i++) {
        let SplittedTempe = TempeStore[i].split(",");
        for (let j = 0; j < SplittedTempe.length; j++) {
            TempeList.push(formatted(SplittedTempe[j]));
        }
    };
    TempeList.forEach(function (x) { TempeInfo[x] = (TempeInfo[x] || 0) + 1; });
    for (let keys in TempeInfo) {
        TempeOpt.push(keys);
    };
}

/**
 * Format a string in a way that it is in lower case and without any spaces.
 * @param {string} s The string that needs to be formatted.
 * @returns The formatted string.
 */
function formatted(s) {
    return s.toString().replace(/\s/g, "").toLowerCase()
}

/**
 * Start a new game.
 */
async function newGameButton() {
    GameInfo = JSON.parse(JSON.stringify(DefaultGameInfo));
    AllStore = [];
    removeAllChildNodes(MainBlock);
    await fetchInfo();
    rollAnswer();
    makeCardDiv();
    makeQuesDiv();
    let QuesOpt = document.getElementById("QuesOpt");
    dropdownOpts(TempeOpt, QuesOpt);
    let GuesOpt = document.getElementById("GuesOpt");
    dropdownOpts(BreedsStore, GuesOpt);
    updateHintList()
}

/**
 * Get the id of the card being clicked, change the guess value and make the guess.
 * @param {string} clickedId 
 */
function cardButton(clickedId) {
    let theID = clickedId.slice(-4);
    let theInd = IdStore.indexOf(theID);
    let theGuess = document.getElementById("GuesOpt");
    theGuess.value = BreedsStore[theInd];
    guessButton();
}

/**
 * Check if the selected breed is correct, 
 * and update the select options if it is incorrect.
 * @returns None.
 */
function guessButton() {
    GameInfo["NumberOfGuess"]++;
    let UrGuess = document.getElementById("GuesOpt");
    if (formatted(UrGuess.value) == formatted(GameInfo["CorrectAnswer"])) {
        let ChangeCard = document.getElementsByClassName("catcard")[correctIndex];
        ChangeCard.classList.add("correct");
        alert(`Yes, my cat is ${UrGuess.value}! You win!!! 
        \nYou have asked ${GameInfo["NumberOfAsk"]} questions, used ${GameInfo["NumberOfHint"]} hints,  
        \nYour score is ${GameInfo["NumberOfGuess"]}.`)
        lockButton()
        victory();
        return;
    };
    for (let i = 0; i < AllStore.length; i++) {
        if (AllStore[i]["name"] == UrGuess.value) {
            let ChangeId = AllStore[i]["id"];
            AllStore.splice(i, 1)
            let ChangeCard = document.getElementById('Card' + ChangeId);
            ChangeCard.classList.add("wrong");
            ChangeCard.removeAttribute("onclick");
            alert("No, my cat is not " + UrGuess.value + "!");
        }
    };
    updateStore();
    updateHintList();
    let QuesOpt = document.getElementById("QuesOpt");
    dropdownOpts(TempeOpt, QuesOpt);
    let GuesOpt = document.getElementById("GuesOpt");
    dropdownOpts(BreedsStore, GuesOpt);
}

/**
 * Tell if the cat has the selected temperament 
 * and update the select options to eliminate the asked temperament and the breeds with/without it.
 */
function askButton() {
    GameInfo["NumberOfAsk"]++;
    let UrQuest = document.getElementById("QuesOpt");
    let ind = BreedsStore.indexOf(GameInfo["CorrectAnswer"]);
    if (formatted(TempeStore[ind]).includes(formatted(UrQuest.value))) {
        alert("Yes, my cat is " + UrQuest.value + " !");
        for (let i = AllStore.length - 1; i >= 0; i--) {
            if (!formatted(TempeStore[i]).includes(formatted(UrQuest.value))) {
                let ChangediD = AllStore[i]["id"];
                AllStore.splice(i, 1)
                let ChangeCard = document.getElementById('Card' + ChangediD);
                ChangeCard.classList.add("wrong");
                ChangeCard.removeAttribute("onclick");
            }
        }
    } else {
        alert("No, my cat is not " + UrQuest.value + " !");
        for (let i = AllStore.length - 1; i >= 0; i--) {
            if (formatted(TempeStore[i]).includes(formatted(UrQuest.value))) {
                let ChangediD = AllStore[i]["id"];
                AllStore.splice(i, 1)
                let ChangeCard = document.getElementById('Card' + ChangediD);
                ChangeCard.classList.add("wrong");
                ChangeCard.removeAttribute("onclick");
            }
        }
    };
    updateStore();
    removeItem(UrQuest.value, TempeOpt)
    updateHintList();
    let QuesOpt = document.getElementById("QuesOpt");
    dropdownOpts(TempeOpt, QuesOpt);
    let GuesOpt = document.getElementById("GuesOpt");
    dropdownOpts(BreedsStore, GuesOpt);
}

/**
 * Quit the game, go back to the initial page.
 */
function quitButton() {
    removeAllChildNodes(MainBlock);
    alert("See you again soon!");
}

/**
 * Remove specific item from a list.
 * @param {*} item The item to be removed.
 * @param {*} list The list we want item to be removed from.
 */
function removeItem(item, list) {
    let ind = list.indexOf(item);
    if (ind >= 0) {
        list.splice(ind, 1);
    }
}

/**
 * If the guess is right, check if hint is used, 
 * compare and register the new high score.
 * @returns None.
 */
function victory() {
    // Check if hint is used, if yes, return without store record.
    if (GameInfo["NumberOfHint"] != 0) {
        return;
    };
    // Get the current record, if not exist, use default.
    let StorageObj = JSON.parse(localStorage.getItem("RecordInfo"));
    let DupDefRec1 = JSON.parse(JSON.stringify(DefaultRecord));
    let VicRecord = (StorageObj || DupDefRec1);
    // According the # of breeds, take out the list inside the whole record list.
    let CheckList = VicRecord[GameInfo["NumberOfBreeds"] / 5 - 1];
    // Take the number of question we asked in this game.
    let strAsk = (GameInfo["NumberOfAsk"]).toString();
    // Check if there is no record for this # of breeds, store it straight away.
    let CheckListLen = CheckList.length;
    if (CheckListLen == 0) {
        // Make new object saving this game's # of question and guess, 
        // put it in the # of breeds list.
        let newOb = {};
        newOb[strAsk] = GameInfo["NumberOfGuess"];
        CheckList.push(newOb);
    } else {
        // If there is record for this # of breeds,
        // Check through each record exist.
        for (let i = 0; i < CheckListLen; i++) {
            // Take the # of guess of the given # of question.
            let CheckVal = CheckList[i][strAsk];
            if (CheckVal != undefined) {
                // If there is a record (the i-th) with our # of question, 
                // the value should not be undefined.
                if (GameInfo["NumberOfGuess"] >= CheckVal) {
                    // Check if our # of guess is bigger or equal, 
                    // if so, did not break the record.
                    return;
                };
                // our # of guess is smaller under same # of question, broke the record, 
                // write the new value in.
                CheckVal = GameInfo["NumberOfGuess"];
                CheckList[i][strAsk] = CheckVal;
                break;
            };
            // There is no record with our # of question.
            // Make a new object to store this game's record, put it in the list.
            if (i == CheckListLen - 1) {
                let newOb2 = { [strAsk]: GameInfo["NumberOfGuess"] };
                CheckList.push(newOb2);
            }
            // If the i-th record is not our # of question, the value should be undefined, 
            // we do nothing and keep looking.
        };
    }
    // Store the changed record into local storage
    let StorageStr = JSON.stringify(VicRecord);
    localStorage.setItem("RecordInfo", StorageStr);
    updateRecord()
}

/**
 * Make and sort a list of temperaments according to the usefulness of the hint.
 */
function updateHintList() {
    let ind = BreedsStore.indexOf(GameInfo["CorrectAnswer"]);
    for (let keys in TempeInfo) {
        HintList.push(keys);
        if (!formatted(TempeStore[ind]).includes(formatted(keys))) {
            TempeInfo[keys] = BreedsStore.length - TempeInfo[keys];
        };
    };
    HintList.sort(compareByCount)
}

/**
 * Compare the weighted count of two temperaments.
 * @param {string} a first temperament. 
 * @param {string} b second temperament.
 * @returns -1 if a has lower weighted count, 1 if a has higher weighted count, 
 * 0 if a and b have the same weighted count.
 */
function compareByCount(a, b) {
    if (TempeInfo[a] < TempeInfo[b]) {
        return (-1)
    };
    return (TempeInfo[a] > TempeInfo[b] ? 1 : 0)
}

/**
 * Gives a hint that has not been used, prioritise the more useful ones.
 * @returns None.
 */
function hintButton() {
    for (let i = 0; i < HintList.length; i++) {
        if (formatted(TempeOpt).includes(formatted(HintList[i]))) {
            alert("Try ask me if my cat is " + HintList[i] + "!");
            GameInfo["NumberOfHint"] = i + 1;
            return;
        };
    }
    alert("You have used up all the hints!");
}

/**
 * Remove the button functions of the cards after a game is over 
 * to prevent any further mess up.
 */
function lockButton() {
    let QuesButton = document.getElementById("QuesButton");
    QuesButton.removeAttribute("onclick");
    let GuesButton = document.getElementById("GuesButton");
    GuesButton.removeAttribute("onclick");
    let HintButton = document.getElementById("HintButton");
    HintButton.removeAttribute("onclick");
}