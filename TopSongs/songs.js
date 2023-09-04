// Commented the original part to stop the error occurs during fetching.
// We will load the JSON manually in the seperate file called jsonFile.js.

/*
fetch("songs.json")
    .then(response => response.json())
    .then(data => { 
             console.log(data); 
             selectAllYears(data);
         }).catch(error => console.log(error));

function selectAllYears(data) {
    document.getElementById("selectYearStart").value = "START";
    document.getElementById("selectYearEnd").value = "END";
    console.log(data);
}
*/

// 1. MAKE THE DEFAULT SONG LIST 

// 1.1 Get Data From JSON
var songsJSON=JSON.parse(jsonData);
var songsList=songsJSON.songs;

// 1.2 Make The Data A Table
var table=document.getElementById("songTable");
for(var i=0;i<songsList.length;i++){
    var row=table.insertRow(-1);
    var j=0;
    for(key in songsList[i]){
        row.insertCell(j).innerHTML=songsList[i][key];
        j++;
    }
}

// 2. YEAR SELECTION

// 2.1 Find Earliest Year and The Current Year
var yearList=[];
for(var i=0;i<songsList.length;i++){
    yearList.push(songsList[i]["year"])
};
var minYear=Math.min.apply(Math,yearList);
var maxYear=new Date().getFullYear();

// * Variances Declaration
var startYear=document.getElementById("selectYearStart");
var endYear=document.getElementById("selectYearEnd");
var pageButtons=document.getElementById("pageButtons");
var stats1=document.getElementById("resultStats1");
var stats2=document.getElementById("resultStats2");
var pageNumber;

// 2.2 Initialise The Options For Both
for (var i=minYear;i<=maxYear;i++){
    var startOpt=document.createElement("option");
    var endOpt=document.createElement("option");
    startOpt.value=i;
    endOpt.value=i;
    startOpt.innerHTML=i;
    endOpt.innerHTML=i;
    startYear.appendChild(startOpt);
    // the latest year will be automatically chosen
    if(i==maxYear){
        endOpt.setAttribute("selected","selected");
    };
    endYear.appendChild(endOpt);
};
stats1.innerHTML="1~25";
stats2.innerHTML=table.rows.length-1;
updatePageButtons();
assignButton();
resultsOfPage(1);


// 2.3 Make The End Year Options Change According To Start Year Selection

// 2.3.1 funtion that removes all the options
// since we are removing, use reverse index
function removeOptions(selectionTag){
    var optLen=selectionTag.options.length -1;
    for(var i=optLen;i>=0;i--){
        selectionTag.remove(i);
    }
};

// 2.3.2 variables and functions that take the year selected 
var selectedStart=minYear;
function changeSelectedStart(){
    selectedStart=parseInt(startYear.options[startYear.selectedIndex].value);
//    console.log(selectedStart);
};
var selectedEnd=maxYear;
function changeSelectedEnd(){
    selectedEnd=parseInt(endYear.options[endYear.selectedIndex].value);
//    console.log(selectedEnd);
};

// 2.3.3 let the variables change when user changes the selected year
startYear.addEventListener("change",changeSelectedStart);
endYear.addEventListener("change",changeSelectedEnd);

// 2.3.4 function that changes the end year options when start year has been selected
function changeEndOptions(){
    removeOptions(endYear);
    for(var index=selectedStart; index<=maxYear; index++){
        var newEndOpt=document.createElement("option");
        newEndOpt.value=index;
        newEndOpt.innerHTML=index;
        // the latest year will be automatically chosen
        if(index==maxYear){
            newEndOpt.setAttribute("selected","selected");
        };
        endYear.appendChild(newEndOpt);
    };
};
startYear.addEventListener("change",changeEndOptions);

// 3. TEXT INPUT

// 3.1 Initialise And Put A Random Artist As Recommended Search
var textBox=document.getElementById("selectArtist");

var randomIndex=Math.floor(Math.random()*songsList.length);
var recommendedArtist=songsList[randomIndex]["artist"]
textBox.placeholder="Try: "+songsList[randomIndex]["artist"];

// 3.2. Take The Input Value

// 3.2.1 variable and function that take the input value
var textInput="";
function changeTextInput(){
    textInput=textBox.value;
//    console.log(textInput);
};

// 3.2.2 let the variable change when user puts input
textBox.addEventListener("input",changeTextInput);
// ** Make Enter Key The Same As Pressing Go Button
document.addEventListener("keypress",function(event){
    if(event.key=="Enter"){
        event.preventDefault();
        document.getElementById("goButton").click();
    }
});

// 4. SEARCH AND RE-TABLE

// 4.1 Function That Remake The List According To Year And Artist

// 4.1.2 function that format a string to ignore spaces and cases
function formatted(x){
    return x.toString().replace(/\s/g, "").toLowerCase();
};

// 4.1.3 function that delete unwanted rows in the table
// again, since we are removing, use inverse index here
function deleteUnwantedRows(x){
    for(var i=table.rows.length-1;i>x;i--){
        table.deleteRow(i);
    }
};

// 4.1.4 function that make big table according to song list length
function initialiseTable(){
    deleteUnwantedRows(0);
    for(var i=0;i<songsList.length;i++){
        var row=table.insertRow(-1);
        var j=0;
        for(key in songsList[0]){
            row.insertCell(j).innerHTML="";
            j++;
        }
    }
};

// 4.1.5 function that update the table according to the restrains
var rowIndex=songsList.length;
function updateTable(){
    initialiseTable();
    rowIndex=1;
    for(var listIndex=0;listIndex<songsList.length;listIndex++){
        if(songsList[listIndex]["year"]>=selectedStart && songsList[listIndex]["year"]<=selectedEnd){
            if(formatted(songsList[listIndex]["artist"]).includes(formatted(textInput)) || formatted(textInput)==""){
                var columnIndex=0;
                for(key in songsList[listIndex]){
                    table.rows[rowIndex].cells[columnIndex].innerHTML=songsList[listIndex][key];
                    columnIndex++;
                };
                rowIndex++;
            };
        };
    };
    deleteUnwantedRows(rowIndex-1);
    updatePageButtons();
    assignButton();
    resultsOfPage(1);
    stats2.innerHTML=rowIndex-1;
    if(pageNumber==0){
        stats1.innerHTML=0;
    }else{
        stats1Func(1);
    }
};

// 5. SPLIT RESULTS AND DISPLAY STATS

// 5.1 Update Page Buttons

// 5.1.1 function that removes all the current page buttons
function removeButtons(){
    var buttonLength=pageButtons.children.length -1;
    for(var i=buttonLength;i>=0;i--){
        pageButtons.removeChild(pageButtons.children[i]);
    }
};

// 5.1.2 function that removes buttons first then generate new buttons
function updatePageButtons(){
    removeButtons();
    pageNumber=Math.ceil((table.rows.length-1)/25);
    for (var i=0;i<pageNumber;i++){
        var pageButton=document.createElement("button");
        pageButton.innerHTML=i+1;
        pageButtons.appendChild(pageButton);
        if(i==0){
            pageButton.setAttribute("class","active");
        };
    };
};

// 5.2 Assign Each Buttons Its Functions
// (Color Selected + Show Corresponding Table + Update Result Stats)

// 5.2.1 function that cancel the current selection state and select the new one
function makeNewSelection(x){
    for(var jj=0;jj<pageNumber;jj++){
        pageButtons.children[jj].removeAttribute("class");
    };
    pageButtons.children[x].className+="active";
};

// 5.2.2 function that show the corresponding number results in the table
function resultsOfPage(n){
    for(var i=1;i<table.rows.length;i++){
        if(i<=n*25-25 || i>n*25){
            table.rows[i].setAttribute("style","display:none;");
        }else{
            table.rows[i].removeAttribute("style");
        }
    }
};

// 5.2.3 assign functions to the buttons 
function assignButton(){
    for(let btIndex=0;btIndex<pageNumber;btIndex++){
        pageButtons.children[btIndex].addEventListener("click",function(){
            makeNewSelection(btIndex);});
        pageButtons.children[btIndex].addEventListener("click",function(){
            resultsOfPage(btIndex+1);});
        pageButtons.children[btIndex].addEventListener("click",function(){
            stats1Func(btIndex+1);});
    };
}

// 5.3 Function That Generate The Results Stats
function stats1Func(x){
    pageNumber=Math.ceil((table.rows.length-1)/25);
    var startNum=(x-1)*25+1;
    var endNum;
    if(x!==pageNumber){
        endNum=startNum+24;
        stats1.innerHTML=startNum+"~"+endNum;
    }else{
        endNum=table.rows.length-1;
        if(startNum==endNum){
            stats1.innerHTML=startNum;
        }else{
            stats1.innerHTML=startNum+"~"+endNum;
        };
    };
};

