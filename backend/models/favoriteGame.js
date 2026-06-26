// Representa un juego guardado en favoritos con la fecha en que fue almacenado.
class FavoriteGame {

    #id;
    #title;
    #genre;
    #platform;
    #thumbnail;
    #savedAt;

    constructor(game) {
        // Se copian los datos necesarios y se conserva la fecha de guardado.
        this.#id = game.id;
        this.#title = game.title;
        this.#genre = game.genre;
        this.#platform = game.platform;
        this.#thumbnail = game.thumbnail;
        this.#savedAt = new Date().toISOString();
    }

    // Lectura controlada de los datos privados.
    get id() {
        return this.#id;
    }

    get title() {
        return this.#title;
    }

    get genre() {
        return this.#genre;
    }

    get platform() {
        return this.#platform;
    }

    get thumbnail() {
        return this.#thumbnail;
    }

    get savedAt() {
        return this.#savedAt;
    }

    // Mantiene la salida JSON estable para persistencia y respuestas HTTP.
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            genre: this.genre,
            platform: this.platform,
            thumbnail: this.thumbnail,
            savedAt: this.savedAt
        };
    }
}

module.exports = FavoriteGame;