const http = require('http');

const gameService = require('./services/gameService');
const favoriteService = require('./services/favoriteService');

// Servidor HTTP mínimo que expone la API del backend
const server = http.createServer(async (req, res) => {

    // Encabezados comunes para permitir consumo desde el frontend.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Respuesta rápida para peticiones CORS preflight.
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // GAMES
    // Devuelve la lista de juegos consultando la API externa.
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
    // Devuelve los juegos guardados en el archivo local.
    if (req.method === 'GET' && req.url === '/api/favorites') {

        try {

            const favorites = await favoriteService.getFavorites();

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
    // Recibe un juego desde el frontend y lo persiste como favorito.
    if (req.method === 'POST' && req.url === '/api/favorites') {

        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', async () => {

            try {

                const game = JSON.parse(body);

                const favorite = await favoriteService.saveFavorite(game);

                console.log(
                    `Favorito guardado: ${favorite.title} (ID: ${favorite.id})`
                );

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

    // Borra un favorito por id usando el último segmento de la URL.
    if (req.method === 'DELETE' && req.url.startsWith('/api/favorites/')) {

        const gameId = req.url.split('/').pop();

        try {

            await favoriteService.deleteGameFromFavorites(gameId);

            console.log(
                `Favorito eliminado: ID ${gameId}`
            );

            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            return res.end(
                JSON.stringify({
                    message: 'Juego eliminado de favoritos'
                })
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

    // 404 AL FINAL
    // Si no coincide ninguna ruta, devolvemos un error uniforme.
    res.writeHead(404, {
        'Content-Type': 'application/json'
    });

    res.end(
        JSON.stringify({
            message: 'Ruta no encontrada'
        })
    );

});

// El backend escucha en el puerto 3000.
server.listen(3000, () => {
    console.log(
        'Servidor ejecutándose en puerto 3000'
    );
});