import {normalizeGrade} from "./playerDatabase.js";
import Plotly from 'https://cdn.jsdelivr.net/npm/plotly.js-dist/+esm';


import {
    getAverageADP,
    getAverageProjection,
    getAverageUpside,
    getAverageValue,
    getStartingRoster,
    getTotalProjection
} from "./roster.js";

async function getRosterStats(roster, rosterConstruction, scoringFormat) {
    const startingRoster = await getStartingRoster(roster, rosterConstruction, scoringFormat);
    const rosterSize = startingRoster.length;
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
    let rosterCopy = [...roster]
    playersLost.forEach(player => {removePlayer(rosterCopy, player)})
    playersGained.forEach(player => {rosterCopy.push(player)})
    return rosterCopy;
}

async function getTradeResults(rosterConstruction, playersLost, playersGained, roster1, roster2, scoringFormat) {
    const [preTradeRoster1, preTradeRoster2, postTradeRoster1, postTradeRoster2] = await Promise.all([
        getRosterStats(roster1, rosterConstruction, scoringFormat),
        getRosterStats(roster2, rosterConstruction, scoringFormat),
        getRosterStats(executeTrade(roster1, playersLost, playersGained), rosterConstruction, scoringFormat),
        getRosterStats(executeTrade(roster2, playersGained, playersLost), rosterConstruction, scoringFormat)
    ]);
    const resultsRoster1 = Object.fromEntries(
        Object.keys(preTradeRoster1).map(metric => [metric, normalize(metric, postTradeRoster1[metric] - preTradeRoster1[metric])])
    );
    const resultsRoster2 = Object.fromEntries(
        Object.keys(preTradeRoster2).map(metric => [metric, normalize(metric, postTradeRoster2[metric] - preTradeRoster2[metric])])
    );
    return {resultsRoster1, resultsRoster2};
}

async function getTradeWinner(rosterConstruction, playersLost, playersGained, roster1, roster2, scoringFormat) {
    const normalizedValues = await getTradeResults(rosterConstruction, playersLost, playersGained, roster1, roster2, scoringFormat);
    const overallGrades = [];
    Object.values(normalizedValues).forEach(allGrades => {
        const ros = Object.values(allGrades);
        const sum = ros.reduce((total, value) => total + value, 0);
        overallGrades.push(sum/ros.length);
    })

    const [yourTeamGrade, tradePartnerGrade] = overallGrades;
    const tradeWinner = yourTeamGrade > tradePartnerGrade ? "Your Team" : "Trade Partner's Team";
    return {
        Winner: tradeWinner,
        "Your Team Overall Trade Grade": `${yourTeamGrade.toFixed(2)}/10`,
        "Trade Partner's Overall Trade Grade": `${tradePartnerGrade.toFixed(2)}/10`,
    };
}

async function generateTradeGraphs(tradeResults){
     const metrics = Object.keys(tradeResults);
     const values = Object.values(tradeResults);
     return {x: metrics, y: values}
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
    getTradeWinner,
    Plotly
}

