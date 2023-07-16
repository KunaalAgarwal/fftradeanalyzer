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

