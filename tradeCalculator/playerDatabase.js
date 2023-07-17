import localforage from 'https://cdn.skypack.dev/localforage';

const apiKey = "80c1b2c71a4a4dd1aaf5db7cdd4e36d3";
const baseUrl = "https://api.sportsdata.io/api/nfl/fantasy/json/";
const year =  new Date().getFullYear();
const dbName = 'localforage';
const players = localforage.createInstance({
    name: dbName,
    storeName: "players"
})

async function getPlayerData(playerName, scoringFormat) {
    try {
        if (scoringFormat.toUpperCase() === "STANDARD"){
            scoringFormat = "";
        }
        const cacheKey = `${playerName.toUpperCase()}${scoringFormat}`;
        const cacheResponse = await players.getItem(cacheKey);
        if (cacheResponse !== null) {
            return cacheResponse;
        }
        const [playerObj, upside] = await Promise.all([
            getProjections(playerName, scoringFormat),
            getUpside(playerName, scoringFormat)
        ]);
        playerObj["upside"] = upside;
        players.setItem(cacheKey, playerObj);
        return playerObj;
    } catch (error) {
        console.log("An error occurred in the API request: " + error);
    }
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
        auctionValue: playerObj[0][`AuctionValue${scoringFormat}`]
    }
}

async function getUpside(playerName, scoringFormat = ""){
    const [maxWeek, playerPosition] = await Promise.all([
        getMaxWeekScore(playerName, scoringFormat),
        getPosition(playerName)
    ]);
    switch (playerPosition){
        case "QB": return normalizeGrade(maxWeek, 15, 35);
        case "WR": return normalizeGrade(maxWeek, 12, 33);
        case "RB": return normalizeGrade(maxWeek, 10, 30);
        case "TE": return normalizeGrade(maxWeek, 8, 25);
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
    const cacheKey = `PlayerSeasonProjectionStats/${year}REG`;
    const cacheResponse = await players.getItem(cacheKey);
    if (cacheResponse !== null) {
        return cacheResponse;
    }
    const response = await getItems(`PlayerSeasonProjectionStats/${year}REG`);
    const playerList = response.map(playerObj => playerObj.Name);
    players.setItem(cacheKey, playerList);
    return playerList;
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