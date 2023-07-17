import {normalizeGrade} from "./playerDatabase.js";
import {getStartingRoster, getAverageProjection, getTotalProjection, getAverageADP, getAverageValue, getAverageUpside} from "./roster.js";
async function getRosterStats(roster, rosterConstruction, scoringFormat) {
    const rosterSize = Object.values(rosterConstruction).reduce((total, value) => total + value, 0);
    const startingRoster = await getStartingRoster(roster, rosterConstruction, scoringFormat);
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
    const preTradeRoster1 = await getRosterStats(roster1, rosterConstruction, scoringFormat);
    const preTradeRoster2 = await getRosterStats(roster2, rosterConstruction, scoringFormat);
    const postTradeRoster1 = await getRosterStats(executeTrade(roster1, playersLost, playersGained), rosterConstruction, scoringFormat);
    const postTradeRoster2 = await getRosterStats(executeTrade(roster2, playersGained, playersLost), rosterConstruction, scoringFormat);
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

async function getTradeWinner(rosterConstruction, playersLost, playersGained, roster1, roster2, scoringFormat){
    const overallTradeGrades = [];
    const normalizedValues = await getTradeResults(rosterConstruction, playersLost, playersGained, roster1, roster2, scoringFormat);
    Object.values(normalizedValues).forEach(rosterValues => {
        const normalizedGradeSum = Object.values(rosterValues).reduce((total, value) => total + value, 0);
        const normalizedGradeAvg = normalizedGradeSum/Object.values(rosterValues).length;
        overallTradeGrades.push(normalizedGradeAvg);
    })
    let tradeWinner;
    if (overallTradeGrades[0] > overallTradeGrades[1]){
        tradeWinner = "Your Team"
    } else {
        tradeWinner = "Trade Partner's Team"
    }
    return {
        Winner: tradeWinner,
        ["Your Team Overall Trade Grade"]: `${overallTradeGrades[0]}/10`,
        ["Trade Partner's Overall Trade Grade"]: `${overallTradeGrades[1]}/10`,
    }
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

// let rosCon = {"QB": 1, "FLEX": 1};
// let a = ["Josh Allen", "Christian McCaffrey"];
// let b = ["Patrick Mahomes", "J.K. Dobbins"];
// // console.log(await filterRoster(a, "RB", "PPR"));
// // getStartingRoster(a, rosCon, "PPR").then(r => console.log(r))
//
// // executeTrade(["Christian McCaffery"], ["J.K. Dobbins"], a, b)
// // getRosterStats(a, rosCon).then(r => console.log(r));
//
// let asd = await getTradeResults(rosCon,["Christian McCaffrey"], ["J.K. Dobbins"], a, b);
// console.log(asd);
// getTradeWinner(rosCon,["Christian McCaffrey"], ["J.K. Dobbins"], a, b).then(r => console.log(r));
// // getTradeWinner(rosCon,["Patrick Mahomes"], ["Josh Allen"], a, b).then(r => console.log(r))
