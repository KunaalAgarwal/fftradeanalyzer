import {getPlayerData} from "./playerDatabase.js";
async function getStartingRoster(roster, rosterConstruction) {
    const startingRosterNames = new Set();
    const startingRoster = {};
    for (let position in rosterConstruction) {
        let count = 0;
        const players = await filterRoster(roster, position);
        while (rosterConstruction[position] !== getPositionSlotsFilled(startingRoster, position)) {
            if (players.length > 0){
                if (!startingRosterNames.has(players[count].name)) {
                    startingRosterNames.add(players[count].name);
                    startingRoster[JSON.stringify(players[count])] = position;
                }
                count++;
            } else {
                break;
            }
        }
    }
    return Object.keys(startingRoster).map(player => JSON.parse(player));
}
async function filterRoster(roster, position){
    const players= await Promise.all(roster.map(player => getPlayerData(player)));
    let filteredPlayers;
    if (position === "FLEX"){
        filteredPlayers = players.filter(player => player.position !== "QB");
    } else {
        filteredPlayers = players.filter(player => player.position === position);
    }
    return filteredPlayers.sort((a,b) => b.projection - a.projection);
}

function getPositionSlotsFilled(roster, position){
    return Object.values(roster).filter(p => p === position).length;
}

function getTotalProjection(startingRoster){
    return startingRoster.reduce((totalProj, player) => totalProj + player.projection, 0);
}

function getAverageProjection(startingRoster, rosterConstruction){
    const rosterSlots = Object.values(rosterConstruction).reduce((total, value) => total + value, 0);
    return getTotalProjection(startingRoster)/rosterSlots;
}

function getAverageInjuryRisk(startingRoster, rosterConstruction){
    const rosterSlots = Object.values(rosterConstruction).reduce((total, value) => total + value, 0);
    const totalInjuryRisk = startingRoster.reduce((total, player) => total + player.injuryRisk, 0);
    return totalInjuryRisk/rosterSlots;
}

function getAverageRank(startingRoster, rosterConstruction){
    const rosterSlots = Object.values(rosterConstruction).reduce((total, value) => total + value, 0);
    const totalRank = startingRoster.reduce((total, player) => total + player["rank"], 0);
    return totalRank/rosterSlots;
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
    getAverageInjuryRisk,
    getAverageRank,
    setRosterConstruction
}
