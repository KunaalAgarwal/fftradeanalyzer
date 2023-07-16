import {normalizeGrade} from "./playerDatabase.js";
import {getStartingRoster, getAverageProjection, getTotalProjection, getAverageADP, getAverageValue, getAverageUpside} from "./roster.js";
async function getRosterStats(roster, rosterConstruction) {
    const rosterSize = Object.values(rosterConstruction).reduce((total, value) => total + value, 0);
    const startingRoster = await getStartingRoster(roster, rosterConstruction);
    const [
        totalProj,
        avgProj,
        avgUpside,
        avgValue,
        avgADP
    ] = await Promise.all([
        getTotalProjection(startingRoster),
        getAverageProjection(startingRoster, rosterSize),
        getAverageUpside(startingRoster, rosterSize),
        getAverageValue(startingRoster, rosterSize),
        getAverageADP(startingRoster, rosterSize),
        getAverageProjection(startingRoster, rosterSize),

    ]);
    return {
        totalProj,
        avgProj,
        avgUpside,
        avgValue,
        avgADP
    };
}
function executeTrade(roster, playersLost, playersGained){
    playersLost.forEach(player => {removePlayer(roster, player)})
    playersGained.forEach(player => {roster.push(player)})
    return roster;
}
async function getTradeResults(rosterConstruction, playersLost, playersGained, roster1, roster2) {
    const preTradeRoster1 = await getRosterStats(roster1, rosterConstruction);
    const preTradeRoster2 = await getRosterStats(roster2, rosterConstruction);
    const postTradeRoster1 = await getRosterStats(executeTrade(roster1, playersLost, playersGained), rosterConstruction);
    const postTradeRoster2 = await getRosterStats(executeTrade(roster2, playersGained, playersLost), rosterConstruction);
    const resultsRoster1 = {};
    const resultsRoster2 = {};
    Object.keys(preTradeRoster1).forEach(metric => {
        resultsRoster1[metric] = normalize(metric,postTradeRoster1[metric] - preTradeRoster1[metric]);
    });
    Object.keys(preTradeRoster2).forEach(metric => {
        resultsRoster2[metric] = normalize(metric, postTradeRoster2[metric] - preTradeRoster2[metric]);
    })
    return {resultsRoster1, resultsRoster2};
}

async function getTradeWinner(rosterConstruction, playersLost, playersGained, roster1, roster2){
    const overallTradeGrades = [];
    const normalizedValues = await getTradeResults(rosterConstruction, playersLost, playersGained, roster1, roster2);
    Object.values(normalizedValues).forEach(rosterValues => {
        const normalizedGradeSum = Object.values(rosterValues).reduce((total, value) => total + value, 0);
        const normalizedGradeAvg = normalizedGradeSum/Object.values(rosterValues).length;
        overallTradeGrades.push(normalizedGradeAvg);
    })
    return overallTradeGrades;
}

function normalize(metric, value){
    switch (metric){
        case "avgADP": return 10 - normalizeGrade(value, -22, 22);
        case "totalProj": return normalizeGrade(value, -100, 100);
        case "avgProj": return normalizeGrade(value, -25, 25);
        case "avgValue": return normalizeGrade(value, -25, 25);
        case "avgUpside": return normalizeGrade(value, -3,3);
    }
}

function removePlayer(roster, player) {
    const index = roster.findIndex(x => x.toUpperCase() === player.toUpperCase());
    if (index !== -1) {
        roster.splice(index, 1);
    }
}

export {
    getRosterStats,
    executeTrade,
    getTradeResults,
    getTradeWinner
}

// let rosCon = {"QB": 1};
// let a = ["Patrick Mahomes"];
// let b = ["Josh Allen"];
// getRosterStats(a, rosCon).then(r => console.log(r));
// executeTrade(["Patrick Mahomes"], ["Josh Allen"], a, b)
// getRosterStats(a, rosCon).then(r => console.log(r));

// let asd = await getTradeResults(rosCon,["Patrick Mahomes"], ["Josh Allen"], a, b);
// console.log(asd);
// getTradeWinner(rosCon,["Patrick Mahomes"], ["Josh Allen"], a, b).then(r => console.log(r))
