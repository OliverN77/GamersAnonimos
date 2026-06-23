const http = require('http');

const gameService = require('./services/gameService');
const favoriteService = require('./services/favoriteService');

const server = http.createServer(async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // GAMES
    if (req.method === 'GET' && req.url === '/api/games') {

        try {

            const games = await gameService.getAllGames();

            res.writeHead(200, {
                'Content-Type': 'application/json'
            });

            return res.end(JSON.stringify(games));

        } catch (error) {

            res.writeHead(500, {
                'Content-Type': 'application/json'
            });

            return res.end(JSON.stringify({
                message: error.message
            }));
        }
    }

    // FAVORITOS
    if (req.method === 'GET' && req.url === '/api/favorites') {

        try {

            const favorites =
                await favoriteService.getFavorites();

            res.writeHead(200, {
                'Content-Type': 'application/json'
            });

            return res.end(
                JSON.stringify(favorites)
            );

        } catch (error) {

            res.writeHead(500, {
                'Content-Type': 'application/json'
            });

            return res.end(
                JSON.stringify({
                    message: error.message
                })
            );
        }
    }

    // GUARDAR FAVORITO
    if (req.method === 'POST' && req.url === '/api/favorites') {

        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', async () => {

            try {

                const game =
                    JSON.parse(body);

                const favorite =
                    await favoriteService.saveFavorite(game);

                res.writeHead(201, {
                    'Content-Type': 'application/json'
                });

                return res.end(
                    JSON.stringify(favorite)
                );

            } catch (error) {

                res.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                return res.end(
                    JSON.stringify({
                        message: error.message
                    })
                );
            }
        });

        return;
    }

    // 404 AL FINAL
    res.writeHead(404, {
        'Content-Type': 'application/json'
    });

    res.end(
        JSON.stringify({
            message: 'Ruta no encontrada'
        })
    );

});

server.listen(3000, () => {
    console.log(
        'Servidor ejecutándose en puerto 3000'
    );
});