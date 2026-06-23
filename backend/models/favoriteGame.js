class FavoriteGame {
    constructor(game) {
        this.id = game.id;
        this.title = game.title;
        this.genre = game.genre;
        this.platform = game.platform;
        this.thumbnail = game.thumbnail;
        this.savedAt = new Date().toISOString();
    }
}

module.exports = FavoriteGame;