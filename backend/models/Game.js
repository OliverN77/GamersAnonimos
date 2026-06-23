class Game {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.genre = data.genre;
        this.platform = data.platform;
        this.thumbnail = data.thumbnail;
        this.description = data.short_description;
        this.developer = data.developer;
        this.publisher = data.publisher;
        this.releaseDate = data.release_date;
        this.gameUrl = data.game_url;
    }
}

module.exports = Game;