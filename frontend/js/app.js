// =======================================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// =======================================================

const API_BASE = 'http://localhost:3000/api';
const PAGE_SIZE = 20;

// Estado central: todo lo que se ve en pantalla depende de aquí.
const state = {
	allGames: [],
	filteredGames: [],
	query: '',
	sortMode: 'az',
	selectedGame: null,
	visibleCount: PAGE_SIZE, // cuántos juegos se muestran (scroll infinito)
	favorites: []
};

const elements = {}; // referencias al DOM, se llenan en cacheElements()
let loadMoreObserver = null;


// =======================================================
// UTILIDADES
// =======================================================

// Quita tildes y pasa a minúsculas para que la búsqueda no distinga acentos.
function normalizeText(value) {
	return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Escapa caracteres especiales antes de insertarlos como HTML (evita inyección de código).
function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Convierte un juego "crudo" de la API a un formato consistente, con valores
// por defecto si faltan datos.
function normalizeGame(game) {
	return {
		id: game.id,
		title: game.title || game.name || 'Sin título',
		genre: game.genre || 'Sin género',
		platform: game.platform || 'Plataforma no disponible',
		thumbnail: game.thumbnail || '',
		description: game.short_description || game.description || 'Sin descripción disponible.',
		developer: game.developer || 'Desarrollador no disponible',
		publisher: game.publisher || 'Publisher no disponible',
		releaseDate: game.release_date || 'Fecha no disponible',
		gameUrl: game.game_url || '',
		searchTitle: normalizeText(game.title || game.name || '')
	};
}

function getGameById(gameId) {
	return state.allGames.find((game) => String(game.id) === String(gameId)) || null;
}


// =======================================================
// RENDERIZADO DE JUEGOS + SCROLL INFINITO
// =======================================================

// Actualiza el texto con cuántos juegos se ven y bajo qué orden/búsqueda.
function updateInfo() {
	if (!state.allGames.length) {
		elements.infoText.textContent = '';
		return;
	}

	const queryText = state.query.trim();
	const visibleCount = Math.min(state.visibleCount, state.filteredGames.length);
	const totalCount = state.filteredGames.length;
	const orderLabel = state.sortMode === 'az' ? 'A-Z' : 'Z-A';

	elements.infoText.textContent = queryText
		? `${visibleCount} resultado${visibleCount === 1 ? '' : 's'} de ${totalCount} para "${queryText}" · Orden ${orderLabel}`
		: `${visibleCount} juego${visibleCount === 1 ? '' : 's'} visibles de ${totalCount} · Orden ${orderLabel}`;
}

// Crea (si no existe) el elemento invisible al final de la lista que el
// IntersectionObserver vigila para saber cuándo cargar más juegos.
function ensureLoadMoreSentinel() {
	if (!elements.loadMoreSentinel) {
		elements.loadMoreSentinel = document.createElement('div');
		elements.loadMoreSentinel.id = 'loadMoreSentinel';
		elements.loadMoreSentinel.className = 'load-more-sentinel';
		elements.gamesContainer.insertAdjacentElement('afterend', elements.loadMoreSentinel);
	}
}

// Hay que re-observar el centinela cada vez que se renderiza, porque el
// observer se desconecta antes de cada actualización.
function updateLoadMoreObserver() {
	if (!loadMoreObserver || !elements.loadMoreSentinel) return;
	loadMoreObserver.disconnect();
	loadMoreObserver.observe(elements.loadMoreSentinel);
}

function buildGameCardHTML(game) {
	const imageMarkup = game.thumbnail
		? `<img class="game-image" src="${escapeHtml(game.thumbnail)}" alt="${escapeHtml(game.title)}">`
		: `<div class="game-image game-image--fallback" aria-hidden="true"></div>`;
	const gameLinkMarkup = game.gameUrl
		? `<a class="game-link" href="${escapeHtml(game.gameUrl)}" target="_blank" rel="noopener noreferrer">Ver juego</a>`
		: '';

	return `
		<article class="game-card" data-game-id="${escapeHtml(game.id)}" tabindex="0" role="button" aria-label="Ver detalles de ${escapeHtml(game.title)}">
			<div class="game-art">
				${imageMarkup}
				<div class="game-badges">
					<span class="game-badge game-badge--primary">${escapeHtml(game.genre)}</span>
					<span class="game-badge">${escapeHtml(game.platform)}</span>
				</div>
			</div>
			<div class="game-info">
				<div class="game-heading">
					<h2 class="game-title">${escapeHtml(game.title)}</h2>
					<p class="game-release">${escapeHtml(game.releaseDate)}</p>
				</div>
				<p class="game-description">${escapeHtml(game.description)}</p>
				<dl class="game-meta">
					<div><dt>Desarrollador</dt><dd>${escapeHtml(game.developer)}</dd></div>
					<div><dt>Publisher</dt><dd>${escapeHtml(game.publisher)}</dd></div>
				</dl>
				<div class="game-footer">
					<div class="game-status">Free to Play</div>
					${gameLinkMarkup}
				</div>
			</div>
		</article>
	`;
}

// Pinta la lista de juegos. Si "append" es true, agrega tarjetas al final
// (scroll infinito); si no, reemplaza todo (búsqueda/orden).
function renderGames(games, { append = false } = {}) {
	const visibleGames = games.slice(0, state.visibleCount);

	if (!visibleGames.length) {
		elements.gamesContainer.innerHTML = '';
		elements.noResults.style.display = 'block';
		updateInfo();
		updateLoadMoreObserver();
		return;
	}

	elements.noResults.style.display = 'none';
	const markup = visibleGames.map(buildGameCardHTML).join('');

	if (append) {
		elements.gamesContainer.insertAdjacentHTML('beforeend', markup);
	} else {
		elements.gamesContainer.innerHTML = markup;
	}

	updateInfo();
	updateLoadMoreObserver();
}

// Se ejecuta cuando el usuario llega al final de la lista (centinela visible).
function loadMoreGames() {
	if (state.visibleCount >= state.filteredGames.length) {
		updateLoadMoreObserver();
		return;
	}
	state.visibleCount += PAGE_SIZE;
	renderGames(state.filteredGames);
}


// =======================================================
// MODAL DE DETALLE DE JUEGO
// =======================================================

function renderModalBadges(game) {
	return [
		`<span class="game-modal__badge game-modal__badge--primary">${escapeHtml(game.genre)}</span>`,
		`<span class="game-modal__badge">${escapeHtml(game.platform)}</span>`,
		`<span class="game-modal__badge">${escapeHtml(game.releaseDate)}</span>`
	].join('');
}

// Llena los campos del modal con los datos del juego seleccionado.
function fillGameModalContent(game) {
	elements.gameModalImage.src = game.thumbnail || '';
	elements.gameModalImage.alt = game.title;
	elements.gameModalImage.style.display = game.thumbnail ? 'block' : 'none';
	elements.gameModalTitle.textContent = game.title;
	elements.gameModalRelease.textContent = game.releaseDate;
	elements.gameModalDescription.textContent = game.description;
	elements.gameModalDeveloper.textContent = game.developer;
	elements.gameModalPublisher.textContent = game.publisher;
	elements.gameModalPlatform.textContent = game.platform;
	elements.gameModalGenre.textContent = game.genre;
	elements.gameModalBadges.innerHTML = renderModalBadges(game);
	elements.gameModalLink.href = game.gameUrl || '#';
	elements.gameModalLink.style.pointerEvents = game.gameUrl ? 'auto' : 'none';
	elements.gameModalLink.style.opacity = game.gameUrl ? '1' : '0.5';
	elements.gameModalLink.textContent = game.gameUrl ? 'Ver juego' : 'Sin enlace';
	elements.gameModalStatus.textContent = 'Listo para guardar cuando conectemos el backend.';
}

function openGameModal(game) {
	state.selectedGame = game;
	fillGameModalContent(game);
	elements.gameModal.classList.add('is-open');
	elements.gameModal.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
	window.setTimeout(() => elements.gameModalClose.focus(), 0);
}

function closeGameModal() {
	state.selectedGame = null;
	elements.gameModal.classList.remove('is-open');
	elements.gameModal.setAttribute('aria-hidden', 'true');
	document.body.classList.remove('modal-open');
}

// Guarda el juego seleccionado como favorito en el backend.
async function guardarEnBackend() {
	if (!state.selectedGame) return;

	try {
		const response = await fetch(`${API_BASE}/favorites`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(state.selectedGame)
		});
		const data = await response.json();

		if (!response.ok) throw new Error(data.message);

		elements.gameModalStatus.textContent = 'Juego guardado correctamente';
	} catch (error) {
		elements.gameModalStatus.textContent = error.message;
	}
}


// =======================================================
// FAVORITOS (solo lectura: sin opción de eliminar)
// =======================================================

async function loadFavorites() {
	try {
		const response = await fetch(`${API_BASE}/favorites`);
		if (!response.ok) throw new Error(`No se pudo cargar los favoritos (${response.status})`);

		const data = await response.json();
		state.favorites = Array.isArray(data) ? data.map(normalizeGame) : [];
	} catch (error) {
		console.error('Error cargando favoritos:', error);
		state.favorites = [];
	}
}

function buildFavoriteCardHTML(game) {
	const imageMarkup = game.thumbnail
		? `<img class="favorites-image" src="${escapeHtml(game.thumbnail)}" alt="${escapeHtml(game.title)}">`
		: `<div class="favorites-image" style="background: linear-gradient(135deg, rgba(72, 215, 255, 0.08), rgba(181, 109, 255, 0.1));" aria-hidden="true"></div>`;

	return `
		<article class="favorites-card" data-favorite-id="${escapeHtml(game.id)}">
			${imageMarkup}
			<div class="favorites-info">
				<h3 class="favorites-title">${escapeHtml(game.title)}</h3>
				<div class="favorites-meta">
					<div class="favorites-genre">${escapeHtml(game.genre)}</div>
					<div class="favorites-platform">${escapeHtml(game.platform)}</div>
				</div>
			</div>
		</article>
	`;
}

function renderFavorites() {
	elements.favoritesContainer.innerHTML = state.favorites.length
		? state.favorites.map(buildFavoriteCardHTML).join('')
		: '<div class="favorites-empty">No tienes juegos favoritos aún</div>';
}

function openFavoritesModal() {
	loadFavorites().then(() => {
		renderFavorites();
		elements.favoritesModal.classList.add('is-open');
		elements.favoritesModal.setAttribute('aria-hidden', 'false');
		document.body.classList.add('modal-open');
		window.setTimeout(() => elements.favoritesModalClose.focus(), 0);
	});
}

function closeFavoritesModal() {
	elements.favoritesModal.classList.remove('is-open');
	elements.favoritesModal.setAttribute('aria-hidden', 'true');
	document.body.classList.remove('modal-open');
}


// =======================================================
// BÚSQUEDA Y ORDEN
// =======================================================

// Aplica búsqueda + orden sobre todos los juegos y vuelve a renderizar.
function applyFilters() {
	const query = normalizeText(state.query.trim());

	const games = state.allGames
		.filter((game) => !query || game.searchTitle.includes(query))
		.sort((left, right) => {
			const comparison = left.title.localeCompare(right.title, 'es', { sensitivity: 'base' });
			return state.sortMode === 'za' ? -comparison : comparison;
		});

	state.filteredGames = games;
	state.visibleCount = PAGE_SIZE;
	renderGames(games);
}

function updateSortButtons() {
	const activeLabel = state.sortMode === 'az' ? 'a-z' : 'z-a';
	document.querySelectorAll('.sort-button').forEach((button) => {
		button.classList.toggle('active', button.textContent.trim().toLowerCase() === activeLabel);
	});
}

function buscarJuegos() {
	state.query = elements.searchInput.value;
	applyFilters();
}

function ordenarPor(mode) {
	state.sortMode = mode === 'za' ? 'za' : 'az';
	updateSortButtons();
	applyFilters();
}


// =======================================================
// CARGA INICIAL Y EVENTOS
// =======================================================

async function loadGames() {
	elements.loading.style.display = 'block';
	elements.error.style.display = 'none';

	try {
		const response = await fetch(`${API_BASE}/games`);
		if (!response.ok) throw new Error(`No se pudo cargar la API (${response.status})`);

		const data = await response.json();
		state.allGames = Array.isArray(data) ? data.map(normalizeGame) : [];
		applyFilters();
	} catch (error) {
		elements.gamesContainer.innerHTML = '';
		elements.infoText.textContent = '';
		elements.error.textContent = 'No fue posible cargar los juegos. Intenta de nuevo más tarde.';
		elements.error.style.display = 'block';
	} finally {
		elements.loading.style.display = 'none';
	}
}

// Abre el modal de un juego al hacer clic o presionar Enter/espacio sobre su
// tarjeta (pero no si el clic fue sobre el link "Ver juego").
function handleGameCardActivation(event) {
	const card = event.target.closest('.game-card');
	if (!card || event.target.closest('a')) return;

	const game = getGameById(card.dataset.gameId);
	if (game) openGameModal(game);
}

function setupEvents() {
	elements.searchInput.addEventListener('input', buscarJuegos);
	elements.searchInput.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			buscarJuegos();
		}
	});

	elements.gamesContainer.addEventListener('click', handleGameCardActivation);
	elements.gamesContainer.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleGameCardActivation(event);
		}
	});

	elements.gameModal.addEventListener('click', (event) => {
		if (event.target.matches('[data-modal-close]')) closeGameModal();
	});
	elements.gameModalClose.addEventListener('click', closeGameModal);
	elements.saveGameButton.addEventListener('click', guardarEnBackend);

	elements.favoritesModal.addEventListener('click', (event) => {
		if (event.target.matches('[data-favorites-modal-close]')) closeFavoritesModal();
	});
	elements.favoritesModalClose.addEventListener('click', closeFavoritesModal);

	// Escape cierra cualquier modal que esté abierto.
	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') return;
		if (elements.gameModal.classList.contains('is-open')) closeGameModal();
		if (elements.favoritesModal.classList.contains('is-open')) closeFavoritesModal();
	});
}


// =======================================================
// ARRANQUE DE LA APP
// =======================================================

// Guarda en "elements" las referencias al DOM usadas en el resto del archivo.
function cacheElements() {
	elements.searchInput = document.getElementById('searchInput');
	elements.infoText = document.getElementById('infoText');
	elements.loading = document.getElementById('loading');
	elements.error = document.getElementById('error');
	elements.noResults = document.getElementById('noResults');
	elements.gamesContainer = document.getElementById('gamesContainer');

	elements.gameModal = document.getElementById('gameModal');
	elements.gameModalImage = document.getElementById('gameModalImage');
	elements.gameModalBadges = document.getElementById('gameModalBadges');
	elements.gameModalTitle = document.getElementById('gameModalTitle');
	elements.gameModalRelease = document.getElementById('gameModalRelease');
	elements.gameModalDescription = document.getElementById('gameModalDescription');
	elements.gameModalDeveloper = document.getElementById('gameModalDeveloper');
	elements.gameModalPublisher = document.getElementById('gameModalPublisher');
	elements.gameModalPlatform = document.getElementById('gameModalPlatform');
	elements.gameModalGenre = document.getElementById('gameModalGenre');
	elements.gameModalLink = document.getElementById('gameModalLink');
	elements.gameModalStatus = document.getElementById('gameModalStatus');
	elements.gameModalClose = document.querySelector('.game-modal__close');
	elements.saveGameButton = document.getElementById('saveGameButton');

	elements.favoritesModal = document.getElementById('favoritesModal');
	elements.favoritesContainer = document.getElementById('favoritesContainer');
	elements.favoritesModalClose = document.querySelector('.favorites-modal__close');
}

// Observa el centinela final de la lista para activar el scroll infinito.
function setupLoadMoreObserver() {
	ensureLoadMoreSentinel();
	loadMoreObserver = new IntersectionObserver((entries) => {
		if (entries.some((entry) => entry.isIntersecting)) loadMoreGames();
	}, { root: null, rootMargin: '200px 0px', threshold: 0.1 });
}

document.addEventListener('DOMContentLoaded', () => {
	cacheElements();
	setupLoadMoreObserver();
	setupEvents();
	updateSortButtons();
	loadGames();
});

// Funciones llamadas directamente desde el HTML (onclick, etc.)
window.buscarJuegos = buscarJuegos;
window.ordenarPor = ordenarPor;
window.openFavoritesModal = openFavoritesModal;