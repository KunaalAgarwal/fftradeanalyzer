import * as tc from "../export.js"
const ids = ["sf", "ros", "oppros", "tc", "results"];
let scoringFormat;
let currPageId = "sf";
let rosterConstruction = {"QB": 0, "RB": 0, "WR": 0, "TE": 0, "FLEX": 0, "BENCH": 0};
let ros = new Set();
let oppros = new Set();
displayPage("tc");

const nextButton = document.getElementById("next");
const prevButton = document.getElementById("prev");
const pprButton = document.getElementById("ppr");
const standardButton = document.getElementById("standard");
const addButton = document.getElementById("userAdd-player");
const removeButton = document.getElementById("userRemove-player");
const oppAddButton = document.getElementById("oppAdd-player");
const oppRemoveButton = document.getElementById("oppRemove-player");

function displayPage(id) {
    currPageId = id;
    navbarUnderline(id);
    ids.forEach(page => {
        document.getElementById(`${page}content`).style.display = id === page ? "block" : "none";
    });
    document.getElementById("prev").style.display = currPageId === "sf" ? "none" : "block";
    document.getElementById("next").style.display = currPageId === "results" ? "none" : "block";
}

function navbarUnderline(id) {
    ids.forEach(x => {
        const element = document.getElementById(x);
        element.style.borderBottom = x === id ? "3px solid black" : "";
    });
}

nextButton.addEventListener("click", async () => {
    const currIndex = ids.indexOf(currPageId);
    if (currPageId === "sf" && sfNextCheck()) return;
    if (currPageId === "ros" && await rosNextCheck()) return;
    if (currPageId === "oppros" && await rosNextCheck()) return;
    if (currIndex + 1 < ids.length) {
        if (currPageId === "oppros") setPlayerSelect();
        displayPage(ids[currIndex + 1]);
    }
})

prevButton.addEventListener("click", () => {
    const currIndex = ids.indexOf(currPageId);
    if (currPageId === "oppros") ros.clear(); //one page ahead
    if (currPageId === "tc") oppros.clear(); //one page ahead
    if (currIndex - 1 >= 0) {
        const newPage = ids[currIndex - 1];
        displayPage(newPage);
    }
})

pprButton.addEventListener("click", () => {
    scoringFormat = "PPR"
    const scoringButtons = document.querySelectorAll(".scoringButton");
    scoringButtons.forEach(button => {
        button.style.borderRadius = button.id === "ppr" ? "18px" : "10px";
        button.style.color = button.id === "ppr" ? "#fff" : "#666666";
    });
})

standardButton.addEventListener("click", () => {
    scoringFormat = "STANDARD"
    const scoringButtons = document.querySelectorAll(".scoringButton");
    scoringButtons.forEach(button => {
        button.style.borderRadius = button.id === "standard" ? "18px" : "10px";
        button.style.color = button.id === "standard" ? "#fff" : "#666666";
    });
})

function sfNextCheck(){
    let hasErrors = false;
    if (scoringFormat === undefined){
        document.getElementById("scoringButton-error").textContent = "Please select a scoring format."
    } else {
        document.getElementById("scoringButton-error").textContent = "";
    }
    setRosterConstruction();
    document.querySelectorAll(".error-message").forEach(error => { if (!(error.textContent === "")) hasErrors = true;})
    return hasErrors;
}

function parseRosterCon(id) {
    const element = document.getElementById(id);
    const positionSlots = parseInt(element.value);
    if (positionSlots < element.min || positionSlots > element.max || isNaN(positionSlots)) {
        document.getElementById(`${id}-error`).textContent = "Please enter a valid number.";
    } else {
        document.getElementById(`${id}-error`).textContent = "";
    }
    return positionSlots;
}

function setRosterConstruction() {
    for (let position in rosterConstruction) {
        rosterConstruction[position] = parseRosterCon(`${position.toLowerCase()}-slots`);
    }
}

let playerCounter = 1;
let oppPlayerCounter = 1;
addButton.addEventListener("click", () => {
    if (playerCounter <= 10) {
        const newPlayerInput = createPlayerInput(playerCounter);
        document.getElementById("ros-cons").appendChild(newPlayerInput);
        playerCounter++;
    }
});

removeButton.addEventListener("click", () => {
    if (playerCounter > 1){
        playerCounter--;
        const lastPlayerInput = document.getElementById("ros-cons").lastChild;
        document.getElementById("ros-cons").removeChild(lastPlayerInput);
    }
});

oppAddButton.addEventListener("click", () => {
    if (oppPlayerCounter <= 10) {
        const newPlayerInput = createPlayerInput(playerCounter);
        document.getElementById("oppros-cons").appendChild(newPlayerInput);
        oppPlayerCounter++;
    }
});

oppRemoveButton.addEventListener("click", () => {
    if (oppPlayerCounter > 1){
        oppPlayerCounter--;
        const lastPlayerInput = document.getElementById("oppros-cons").lastChild;
        document.getElementById("oppros-cons").removeChild(lastPlayerInput);
    }
});

function createPlayerInput(counter) {
    const newPlayerInput = document.createElement("div");
    newPlayerInput.classList.add("formInput");
    newPlayerInput.classList.add(`${currPageId}Player`);

    const input = document.createElement("input");
    input.type = "text";
    input.id = `${currPageId}${counter}`;
    input.required = true;

    const label = document.createElement("label");
    label.htmlFor = `${currPageId}${counter}`;
    label.textContent = "Enter a player";

    const errorParagraph = document.createElement("p");
    errorParagraph.className = "error-message";
    errorParagraph.id = `${currPageId}${counter}Error`;

    newPlayerInput.appendChild(input);
    newPlayerInput.appendChild(label);
    newPlayerInput.appendChild(errorParagraph);

    return newPlayerInput;
}

async function rosNextCheck(){
    let hasErrors = false;
    const playerList = new Set(await tc.getPlayersList());
    const playerInputs = document.querySelectorAll(`.${currPageId}Player`);
    playerInputs.forEach(player => {
        const val = player.querySelector("input").value
        const errorSpan = player.querySelector(".error-message");
        if (!playerList.has(val) || ros.has(val) || oppros.has(val)){
            errorSpan.textContent = "Please enter a valid player name or check spelling."
            if (currPageId === "ros") ros.clear();
            if (currPageId === "oppros") oppros.clear();
            hasErrors = true;
        } else {
            errorSpan.textContent = "";
            if (currPageId === "ros") ros.add(val);
            if (currPageId === "oppros") oppros.add(val);
        }
    })
    return hasErrors;
}

function setPlayerSelect(){
    populateColumn(document.getElementById("tradeaway"), ros);
    populateColumn(document.getElementById("tradefor"), oppros);
}

function populateColumn(column, dataset) {
    for (let item of dataset){
        const itemElement = document.createElement("div");
        itemElement.classList.add("item");
        itemElement.textContent = item;
        itemElement.addEventListener("click", toggleSelection);
        column.appendChild(itemElement);
    }
}

function toggleSelection(event) {
    const itemElement = event.target;
    itemElement.classList.toggle("selected");
}