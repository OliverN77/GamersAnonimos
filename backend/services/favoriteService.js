const fs = require('fs/promises');
const path = require('path');

const FavoriteGame =
    require('../models/favoriteGame');

const FILE_PATH = path.join(
    __dirname,
    '../data/favorites.json'
);

// Lee los favoritos desde disco y crea el archivo si todavía no existe.
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

// Guarda un juego nuevo en favoritos evitando duplicados por id.
async function saveFavorite(game) {

    const favorites = await getFavorites();

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

// Elimina un favorito por id y persiste la lista actualizada en el archivo JSON.
async function deleteGameFromFavorites(gameId) {
    const favorites = await getFavorites();

    const updatedFavorites = favorites.filter(
        favorite => String(favorite.id) !== String(gameId)
    );

    await fs.writeFile(
        FILE_PATH,
        JSON.stringify(updatedFavorites, null, 2)
    );
}

module.exports = {
    getFavorites,
    saveFavorite,
    deleteGameFromFavorites
};