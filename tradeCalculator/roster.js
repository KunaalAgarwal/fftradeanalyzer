import {getPlayerData} from "./playerDatabase.js";
async function getStartingRoster(roster, rosterConstruction, scoringFormat) {
    const startingRoster = {};
    for (let position in rosterConstruction) {
        let count = 0;
        const players = await filterRoster(roster, position, scoringFormat);
        while (rosterConstruction[position] !== getPositionSlotsFilled(startingRoster, position)) {
            if (players.length > 0){
                if (Object.values(startingRoster).filter(player => player.name === players[count].name).length === 0) {
                    startingRoster[position] = players[count];
                }
                count++;
            } else {
                break;
            }
        }
    }
    return Object.values(startingRoster);
}

async function filterRoster(roster, position, scoringFormat){
    const players= await Promise.all(roster.map(player => getPlayerData(player, scoringFormat)));
    let filteredPlayers;
    if (position === "FLEX"){
        filteredPlayers = players.filter(player => player.position !== "QB");
    } else {
        filteredPlayers = players.filter(player => player.position === position);
    }
    return filteredPlayers.sort((a,b) => b.projection- a.projection);
}

function getPositionSlotsFilled(roster, position){
    return Object.keys(roster).filter(p => p === position).length;
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
