const Game = require('../models/Game');

async function getAllGames() {

    const response = await fetch('https://www.freetogame.com/api/games');

    if (!response.ok) {
        throw new Error('Error al consultar la API');
    }

    const data = await response.json();

    return data.map(game => new Game(game));
}

module.exports = {
    getAllGames
};