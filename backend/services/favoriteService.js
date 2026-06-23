const fs = require('fs/promises');
const path = require('path');

const FavoriteGame =
    require('../models/FavoriteGame');

const FILE_PATH = path.join(
    __dirname,
    '../data/favorites.json'
);

async function getFavorites() {

    try {

        const data =
            await fs.readFile(
                FILE_PATH,
                'utf8'
            );

        return JSON.parse(data);

    } catch {

        await fs.writeFile(
            FILE_PATH,
            '[]'
        );

        return [];
    }
}

async function saveFavorite(game) {

    const favorites =
        await getFavorites();

    const exists =
        favorites.find(
            favorite =>
                favorite.id === game.id
        );

    if (exists) {
        throw new Error(
            'Este juego ya fue guardado'
        );
    }

    const newFavorite =
        new FavoriteGame(game);

    favorites.push(newFavorite);

    await fs.writeFile(
        FILE_PATH,
        JSON.stringify(
            favorites,
            null,
            2
        )
    );

    return newFavorite;
}

module.exports = {
    getFavorites,
    saveFavorite
};