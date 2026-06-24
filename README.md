# GamersAnonimos

GamersAnonimos es una app para buscar, ordenar y guardar juegos favoritos con una interfaz en español y estilo gamer.

## Qué hace

- Busca juegos por nombre.
- Ordena resultados de A-Z y Z-A.
- Muestra detalles del juego en un modal.
- Permite guardar favoritos desde la interfaz.
- Carga datos desde una API local que consume FreeToGame.

## Tecnologías

- Frontend vanilla HTML, CSS y JavaScript.
- Backend Node.js con `http` nativo.
- API externa de FreeToGame: `https://www.freetogame.com/api`.

## Estructura

- `frontend/index.html`: interfaz principal.
- `frontend/css/styles.css`: estilos visuales.
- `frontend/js/app.js`: lógica de búsqueda, orden y favoritos.
- `backend/server.js`: servidor local con los endpoints de la app.

## Requisitos

- Node.js instalado.
- Navegador moderno.

## Cómo ejecutar

1. Inicia el backend:

```bash
node backend/server.js
```

2. Abre el frontend en tu navegador. Si usas VS Code, puedes abrir `frontend/index.html` con Live Server o servir la carpeta `frontend` con tu método preferido.

El frontend se conecta por defecto a `http://localhost:3000/api`.

## Endpoints locales

- `GET /api/games`: devuelve la lista de juegos.
- `GET /api/favorites`: devuelve los favoritos guardados.
- `POST /api/favorites`: guarda un juego como favorito.

## Notas

- El proyecto aún no usa `package.json` ni un pipeline de build.
- La interfaz está pensada para mantener la estética gamer/comics del proyecto.