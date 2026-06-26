// Representa un juego traído desde la API externa y expone una vista segura para el resto de la app.
class Game {

    #id;
    #title;
    #genre;
    #platform;
    #thumbnail;
    #description;
    #developer;
    #publisher;
    #releaseDate;
    #gameUrl;

    constructor(data) {
        // Guardamos los datos en campos privados para evitar que se modifiquen desde fuera.
        this.#id = data.id;
        this.#title = data.title;
        this.#genre = data.genre;
        this.#platform = data.platform;
        this.#thumbnail = data.thumbnail;
        this.#description = data.short_description;
        this.#developer = data.developer;
        this.#publisher = data.publisher;
        this.#releaseDate = data.release_date;
        this.#gameUrl = data.game_url;
    }

    // Getters públicos para leer el estado sin exponer los campos internos.
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

    get description() {
        return this.#description;
    }

    get developer() {
        return this.#developer;
    }

    get publisher() {
        return this.#publisher;
    }

    get releaseDate() {
        return this.#releaseDate;
    }

    get gameUrl() {
        return this.#gameUrl;
    }

    // Define la forma exacta que se serializa al responder por JSON.
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            genre: this.genre,
            platform: this.platform,
            thumbnail: this.thumbnail,
            description: this.description,
            developer: this.developer,
            publisher: this.publisher,
            releaseDate: this.releaseDate,
            gameUrl: this.gameUrl
        };
    }
}

module.exports = Game;