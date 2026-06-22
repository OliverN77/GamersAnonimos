const API_BASE = 'https://www.freetogame.com/api';

const state = {
	allGames: [],
	filteredGames: [],
	query: '',
	sortMode: 'az',
	selectedGame: null,
	visibleCount: 20
};

const elements = {};
const PAGE_SIZE = 20;
let loadMoreObserver = null;

function normalizeText(value) {
	return String(value)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

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

function setLoading(isLoading) {
	elements.loading.style.display = isLoading ? 'block' : 'none';
}

function setError(message) {
	elements.error.textContent = message;
	elements.error.style.display = message ? 'block' : 'none';
}

function setNoResults(isVisible) {
	elements.noResults.style.display = isVisible ? 'block' : 'none';
}

function updateInfo(count) {
	const queryText = state.query.trim();
	const totalCount = state.filteredGames.length;
	const visibleCount = Math.min(state.visibleCount, totalCount);

	if (!state.allGames.length) {
		elements.infoText.textContent = '';
		return;
	}

	if (queryText) {
		elements.infoText.textContent = `${visibleCount} resultado${visibleCount === 1 ? '' : 's'} de ${totalCount} para "${queryText}" · Orden ${state.sortMode === 'az' ? 'A-Z' : 'Z-A'}`;
		return;
	}

	elements.infoText.textContent = `${visibleCount} juego${visibleCount === 1 ? '' : 's'} visibles de ${totalCount} · Orden ${state.sortMode === 'az' ? 'A-Z' : 'Z-A'}`;
}

function ensureLoadMoreSentinel() {
	if (!elements.loadMoreSentinel) {
		elements.loadMoreSentinel = document.createElement('div');
		elements.loadMoreSentinel.id = 'loadMoreSentinel';
		elements.loadMoreSentinel.className = 'load-more-sentinel';
		elements.gamesContainer.insertAdjacentElement('afterend', elements.loadMoreSentinel);
	}
}

function updateLoadMoreObserver() {
	if (!loadMoreObserver || !elements.loadMoreSentinel) {
		return;
	}

	loadMoreObserver.disconnect();
	loadMoreObserver.observe(elements.loadMoreSentinel);
}

function renderGames(games, { append = false } = {}) {
	const visibleGames = games.slice(0, state.visibleCount);

	if (!visibleGames.length) {
		elements.gamesContainer.innerHTML = '';
		setNoResults(true);
		updateInfo(0);
		updateLoadMoreObserver();
		return;
	}

	setNoResults(false);
	const markup = visibleGames.map((game) => {
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
						<div>
							<dt>Desarrollador</dt>
							<dd>${escapeHtml(game.developer)}</dd>
						</div>
						<div>
							<dt>Publisher</dt>
							<dd>${escapeHtml(game.publisher)}</dd>
						</div>
					</dl>
					<div class="game-footer">
						<div class="game-status">Free to Play</div>
						${gameLinkMarkup}
					</div>
				</div>
			</article>
		`;
	}).join('');

	if (append) {
		elements.gamesContainer.insertAdjacentHTML('beforeend', markup);
	} else {
		elements.gamesContainer.innerHTML = markup;
	}

	updateInfo(visibleGames.length);
	updateLoadMoreObserver();
}

function loadMoreGames() {
	if (state.visibleCount >= state.filteredGames.length) {
		updateLoadMoreObserver();
		return;
	}

	state.visibleCount += PAGE_SIZE;
	renderGames(state.filteredGames);
}

function getGameById(gameId) {
	return state.allGames.find((game) => String(game.id) === String(gameId)) || null;
}

function renderModalBadges(game) {
	return [
		`<span class="game-modal__badge game-modal__badge--primary">${escapeHtml(game.genre)}</span>`,
		`<span class="game-modal__badge">${escapeHtml(game.platform)}</span>`,
		`<span class="game-modal__badge">${escapeHtml(game.releaseDate)}</span>`
	].join('');
}

function openGameModal(game) {
	state.selectedGame = game;
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

function guardarEnBackend() {
	if (!state.selectedGame) {
		return;
	}

	elements.gameModalStatus.textContent = 'Botón preparado: falta conectar la carpeta backend.';
}

function applyFilters() {
	const query = normalizeText(state.query.trim());

	let games = state.allGames.filter((game) => {
		if (!query) {
			return true;
		}

		return game.searchTitle.includes(query);
	});

	games.sort((left, right) => {
		const comparison = left.title.localeCompare(right.title, 'es', { sensitivity: 'base' });
		return state.sortMode === 'za' ? -comparison : comparison;
	});

	state.filteredGames = games;
	state.visibleCount = PAGE_SIZE;
	renderGames(games);
}

function updateSortButtons() {
	document.querySelectorAll('.sort-button').forEach((button) => {
		const isActive = button.textContent.trim().toLowerCase() === (state.sortMode === 'az' ? 'a-z' : 'z-a');
		button.classList.toggle('active', isActive);
	});
}

async function loadGames() {
	setLoading(true);
	setError('');

	try {
		const response = await fetch(`${API_BASE}/games`);

		if (!response.ok) {
			throw new Error(`No se pudo cargar la API (${response.status})`);
		}

		const data = await response.json();
		state.allGames = Array.isArray(data) ? data.map(normalizeGame) : [];
		applyFilters();
	} catch (error) {
		elements.gamesContainer.innerHTML = '';
		setNoResults(false);
		setError('No fue posible cargar los juegos. Intenta de nuevo más tarde.');
		elements.infoText.textContent = '';
	} finally {
		setLoading(false);
	}
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

function setupEvents() {
	elements.searchInput.addEventListener('input', () => {
		state.query = elements.searchInput.value;
		applyFilters();
	});

	elements.searchInput.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			buscarJuegos();
		}
	});

	elements.gamesContainer.addEventListener('click', (event) => {
		const card = event.target.closest('.game-card');

		if (!card || event.target.closest('a')) {
			return;
		}

		const game = getGameById(card.dataset.gameId);

		if (game) {
			openGameModal(game);
		}
	});

	elements.gamesContainer.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}

		const card = event.target.closest('.game-card');

		if (!card) {
			return;
		}

		event.preventDefault();
		const game = getGameById(card.dataset.gameId);

		if (game) {
			openGameModal(game);
		}
	});

	elements.gameModal.addEventListener('click', (event) => {
		if (event.target.matches('[data-modal-close]')) {
			closeGameModal();
		}
	});

	elements.gameModalClose.addEventListener('click', closeGameModal);
	elements.saveGameButton.addEventListener('click', guardarEnBackend);
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && elements.gameModal.classList.contains('is-open')) {
			closeGameModal();
		}
	});
}

document.addEventListener('DOMContentLoaded', () => {
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
	ensureLoadMoreSentinel();
	loadMoreObserver = new IntersectionObserver((entries) => {
		if (entries.some((entry) => entry.isIntersecting)) {
			loadMoreGames();
		}
	}, {
		root: null,
		rootMargin: '200px 0px',
		threshold: 0.1
	});

	setupEvents();
	updateSortButtons();
	loadGames();
});

window.buscarJuegos = buscarJuegos;
window.ordenarPor = ordenarPor;

