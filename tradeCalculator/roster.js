import {getPlayerData} from "./playerDatabase.js";
async function getStartingRoster(roster, rosterConstruction, scoringFormat) {
    try{
        const startingRoster = {};
        for (let position in rosterConstruction) {
            if (!(rosterConstruction[position] > 0)){
                continue;
            }
            const players = await filterRoster(roster, position, scoringFormat);
            const filteredPlayers = players.filter(player => startingRoster[player.name] === undefined);
            for (let i = 0; i < rosterConstruction[position]; i++){
                if (!(filteredPlayers.length > 0) || filteredPlayers[i] === undefined){
                    break;
                }
                startingRoster[filteredPlayers[i].name] = filteredPlayers[i]
            }
        }
        return Object.values(startingRoster);
    } catch (error){
        console.log("An error occurred filling the starting roster." + error);
    }
}

export async function filterRoster(roster, position, scoringFormat){
    const players= await Promise.all(roster.map(player => getPlayerData(player, scoringFormat)));
    let filteredPlayers;
    if (position === "FLEX"){
        filteredPlayers = players.filter(player => player.position !== "QB");
    } else {
        filteredPlayers = players.filter(player => player.position === position);
    }
    return filteredPlayers.sort((a,b) => b.projection - a.projection);
}

function getTotalProjection(startingRoster){
    return startingRoster.reduce((totalProj, player) => totalProj + player.projection, 0);
}

function getAverageProjection(startingRoster, rosterSize){
    return getTotalProjection(startingRoster)/rosterSize;
}

function getAverageADP(startingRoster, rosterSize){
    const totalRank = startingRoster.reduce((total, player) => total + player["ADP"], 0);
    return totalRank/rosterSize;
}

function getAverageValue(startingRoster, rosterSize){
    const totalValue = startingRoster.reduce((total, player) => total + player["auctionValue"], 0);
    return totalValue/rosterSize;
}

function getAverageUpside(startingRoster, rosterSize){
    const totalUpside = startingRoster.reduce((total, player) => total + player["upside"], 0);
    return totalUpside/rosterSize;
}

function setRosterConstruction(rosterSlots){
    return {
        "QB": rosterSlots[0],
        "RB": rosterSlots[1],
        "WR": rosterSlots[2],
        "TE": rosterSlots[3],
        "FLEX": rosterSlots[4]
    }
}

export {
    getStartingRoster,
    getTotalProjection,
    getAverageProjection,
    getAverageADP,
    getAverageValue,
    getAverageUpside,
    setRosterConstruction
}
