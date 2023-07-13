// import localforage from 'https://cdn.skypack.dev/localforage';

//create database instances
// const apiKey = "MVGVZRMV3XAC5QTHWJWG";
const apiKey = "TEST";
const baseUrl = "https://api.fantasynerds.com/v1/nfl/";
const dbName = 'localforage';
// const players = localforage.createInstance({
//     name: dbName,
//     storeName: "players"
// })

//populate database with player information
async function getItems(endpoint){
    try{
        const response = await fetch(`${baseUrl}${endpoint}`);
        return await response.json();
    } catch(error){
        console.log("An error occurred in the API request." + error);
    }
}


