import localforage from 'https://cdn.skypack.dev/localforage';

const apiKey = "80c1b2c71a4a4dd1aaf5db7cdd4e36d3";
const baseUrl = "https://api.sportsdata.io/api/nfl/fantasy/json/";
const year =  new Date().getFullYear();
const dbName = 'localforage';
const players = localforage.createInstance({
    name: dbName,
    storeName: "players"
})

async function getPlayerData(playerName, scoringFormat){
    //need to adjust this error upon .json() and think about storing the scoring format as well
    const cacheResponse = await players.getItem(playerName.toUpperCase());
    if (cacheResponse !== null){
        return cacheResponse;
    }
    const playerObj = await getProjections(playerName, scoringFormat);
    playerObj["Upside"] = await getUpside(playerName, scoringFormat);
    players.setItem(playerName.toUpperCase(), playerObj);
    return playerObj;
}

async function getItems(endpoint){
    try{
        const response = await fetch(`${baseUrl}${endpoint}?key=${apiKey}`);
        return await response.json();
    } catch(error){
        console.log("An error occurred in the API request." + error);
    }
}

async function getProjections(playerName, scoringFormat = ""){
    const response = await getItems(`PlayerSeasonProjectionStats/${year}REG`);
    const playerObj = response.filter(player => player["Name"] === playerName);
    return {
        name: playerObj[0]['Name'],
        team: playerObj[0]['Team'],
        position: playerObj[0]['Position'],
        projection: playerObj[0][`FantasyPoints${scoringFormat}`],
        ADP: playerObj[0][`AverageDraftPosition${scoringFormat}`],
        AuctionValue: playerObj[0][`AuctionValue${scoringFormat}`]
    }
}

async function getUpside(playerName, scoringFormat = ""){
    const maxWeek = await getMaxWeekScore(playerName, scoringFormat);
    const playerPosition = await getPosition(playerName);
    switch (playerPosition){
        case "QB": return normalizeGrade(maxWeek, 18, 45);
        case "WR": return normalizeGrade(maxWeek, 15, 40);
        case "RB": return normalizeGrade(maxWeek, 12, 40);
        case "TE": return normalizeGrade(maxWeek, 8, 30);
    }
}

function normalizeGrade(grade, minGrade, maxGrade) {
    const normalizedScore = (grade - minGrade) / (maxGrade - minGrade) * 10;
    return Math.max(0, Math.min(10, normalizedScore));
}

async function getMaxWeekScore(playerName, scoringFormat = "") {
    let weeklyScores = [];
    let promises = [];
    let week = 1;
    let seasonYear = year;
    let response = await getItems(`PlayerGameStatsByWeek/${seasonYear}REG/${week}`);
    if (response.length === 0){ seasonYear-- }

    while (week <= 18) {
        const fetchPromise = getItems(`PlayerGameStatsByWeek/${seasonYear}REG/${week}`).then(response => {
            let playerObj = response.filter(player => player["Name"] === playerName);
            if (playerObj.length > 0) {
                weeklyScores.push(playerObj[0][`FantasyPoints${scoringFormat}`]);
            }
        })
        promises.push(fetchPromise);
        week++;
    }
    await Promise.all(promises);
    return weeklyScores.reduce((a,b) => Math.max(a,b));
}

async function getPosition(playerName){
    const response = await getItems(`PlayerSeasonProjectionStats/${year}REG`);
    const playerObj = response.filter(player => player["Name"] === playerName);
    return playerObj[0]["Position"];
}

async function getPlayersList(){
    const response = await getItems(`PlayerSeasonProjectionStats/${year}REG`);
    return response.map(playerObj => playerObj.Name);
}

async function clearCache(){
    players.clear();
}

export {
    getPlayerData,
    normalizeGrade,
    getPlayersList,
    clearCache
}

// getPlayerData("Justin Jefferson", "PPR").then(r => console.log(r));