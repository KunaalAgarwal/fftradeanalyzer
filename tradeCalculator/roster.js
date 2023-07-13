import {getPlayerData} from "./playerDatabase.js";
async function getStartingRoster(roster, rosterConstruction) {
    const startingRosterNames = new Set();
    const startingRoster = {};
    for (let position in rosterConstruction) {
        let count = 0;
        const players = await filterRoster(roster, position);
        while (rosterConstruction[position] !== getPositionSlotsFilled(startingRoster, position)) {
            if (!startingRosterNames.has(players[count].name)) {
                startingRosterNames.add(players[count].name);
                startingRoster[JSON.stringify(players[count])] = position;
            }
            count++;
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

export {
    getStartingRoster
}