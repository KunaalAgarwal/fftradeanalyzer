import localforage from 'https://cdn.skypack.dev/localforage';

//create database instances
// const apiKey = "MVGVZRMV3XAC5QTHWJWG";
const apiKey = "TEST";
const baseUrl = "https://api.fantasynerds.com/v1/nfl/";
const dbName = 'localforage';
const players = localforage.createInstance({
    name: dbName,
    storeName: "players"
})

//populate database with player information
async function getPlayerData(playerName){
    const cacheResponse = await players.getItem(playerName);
    if (cacheResponse !== null){
        return cacheResponse.json();
    }
    const playerObj = {};
    const [playerInfo, projections, injuryRisk] = await Promise.all([
        getPlayerInfo(playerName),
        getProjections(playerName),
        getInjuryRisk(playerName)
    ]);
    Object.assign(playerObj, playerInfo);
    playerObj.projection = projections;
    playerObj.injuryRisk = injuryRisk;
    players.setItem(playerName.toUpperCase(), playerObj);
    return playerObj;
}

async function getItems(endpoint){
    try{
        const response = await fetch(`${baseUrl}${endpoint}`);
        return await response.json();
    } catch(error){
        console.log("An error occurred in the API request." + error);
    }
}

async function getPlayerInfo(playerName){
    const response = await getItems(`draft-rankings?apikey=${apiKey}`);
    const playerObj = response["players"].filter(player => player.name === playerName);
    if (playerObj.length > 0){
        delete playerObj[0]["playerId"];
        delete playerObj[0]["injury_risk"];
        return playerObj[0];
    }
}

async function getProjections(playerName){
    const response = await getItems(`ros?apikey=${apiKey}`);
    const projections = Object.values(response["projections"]).flat();
    const playerObj = projections.filter(player => player.name.toUpperCase() === playerName.toUpperCase());
    if (playerObj.length > 0){
        return parseFloat(playerObj[0]["proj_pts"]);
    }
}
async function getInjuryRisk(playerName){
    const injuryRiskMap = {
        low: 1.0,
        medium: 3.0,
        high: 5.0
    }
    const response = await getItems(`draft-rankings?apikey=${apiKey}`)
    const playerObj =  response["players"].filter(player => player.name.toUpperCase() === playerName.toUpperCase());
    if (playerObj.length > 0){
        return injuryRiskMap[playerObj[0]["injury_risk"]];
    }
}

async function clearCache(){
    players.clear();
}

export {
    getPlayerData,
    clearCache
}
