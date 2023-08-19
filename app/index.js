const ids = ["sf", "ros", "oppros", "tc", "results"];
let scoringFormat;
let currPageId = "sf";
let rosterConstruction = {"QB": 0, "RB": 0, "WR": 0, "TE": 0, "FLEX": 0, "BENCH": 0};
setup();

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

function next() {
    const currIndex = ids.indexOf(currPageId);
    if (currPageId === "sf" && sfNextCheck()) return;
    if (currIndex + 1 < ids.length) {
        const newPage = ids[currIndex + 1];
        displayPage(newPage);
    }
}

function sfNextCheck(){
    let hasErrors = false;
    if (scoringFormat === undefined){
        document.getElementById("scoringButton-error").textContent = "Please select a scoring format."
    } else {
        document.getElementById("scoringButton-error").textContent = "";
    }
    setRosterConstruction();
    document.querySelectorAll(".error-message").forEach(error => {
        if (!(error.textContent === "")){
            hasErrors = true;
        }
    })
    return hasErrors;
}

function prev() {
    const currIndex = ids.indexOf(currPageId);
    if (currIndex - 1 >= 0) {
        const newPage = ids[currIndex - 1];
        displayPage(newPage);
    }
}

function setup() {
    displayPage("sf");
}

function parseScoringFormat(id) {
    const scoringButtons = document.querySelectorAll(".scoringButton");
    scoringButtons.forEach(button => {
        button.style.borderRadius = button.id === id ? "18px" : "10px";
        button.style.color = button.id === id ? "#fff" : "#666666";
    });
    scoringFormat = id.toUpperCase();
}

function parseRosterCon(id) {
    const element = document.getElementById(id);
    const positionSlots = parseInt(element.value, 10);
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
