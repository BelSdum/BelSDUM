import { CloudDB } from '../cloud.js';

// База (как в оригинале)
const movies = [
    {
        title: "fight_club",
        name: "Байцоўскі клуб",
        poster: "poster/poster_fight_club.jpg",
        link: "release.html?id=fight_club"
    },
    {
        title: "No_Country_for_Old_Men",
        name: "Старым тут не месца",
        poster: "poster/poster_No_Country_for_Old_Men.jpg",
        link: "release.html?id=No_Country_for_Old_Men"
    }
];

// --- 1. Працягнуць прагляд (с плашкой Прагледжана) ---
function renderContinueWatching() {
    const container = document.getElementById('continue-watching-container');
    if (!container) return;

    const rawData = localStorage.getItem('continueWatching');
    const savedData = rawData ? JSON.parse(rawData) : {};

    if (Object.keys(savedData).length === 0) {
        container.innerHTML = `
        <div class="m-movie-container m-empty-card-apple">
            <div class="m-empty-placeholder-text">Чакаем першага прагляду</div>
        </div>
        `;
        return;
    }

    container.innerHTML = '';

    Object.keys(savedData).forEach(id => {
        const item = savedData[id];
        if (!item.duration || item.duration === 0) return;

        // Расчет процентов по логике оригинала (item.time / item.duration)
        const progressPercent = Math.min((item.time / item.duration) * 100, 100);
        const isFinished = progressPercent >= 95;
        
        const cardHTML = `
        <div class="m-movie-container ${isFinished ? 'movie-finished' : ''}" data-id="${id}">
            <div class="m-poster-frame" style="background-image: url('../poster/${id}.jpg');">
                ${isFinished ? '<div class="m-finished-badge">Прагледжана</div>' : ''}
                <div class="m-progress-container">
                    <div class="m-progress-bar" style="width: ${progressPercent}% !important; ${isFinished ? 'background: #ffffff;' : ''}"></div>
                </div>
            </div>
            <a href="../player.html?id=${id}" class="m-click-shield"></a>
            <button class="m-delete-history-btn" onclick="deleteFromHistory('${id}')">✕</button>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Глобальная функция удаления
window.deleteFromHistory = function(id) {
    const rawData = localStorage.getItem('continueWatching');
    if (rawData) {
        const savedData = JSON.parse(rawData);
        delete savedData[id];
        localStorage.setItem('continueWatching', JSON.stringify(savedData));
        renderContinueWatching(); 
    }
};

// --- 2. Калекцыя + "Хутка" ---
function renderMovieGrid() {
    const grid = document.getElementById('movieGrid');
    if (!grid) return;

    grid.innerHTML = "";
    // Перемешиваем как в оригинале
    const shuffled = [...movies].sort(() => Math.random() - 0.5);

    // Рисуем доступные фильмы
    shuffled.forEach(movie => {
        const card = document.createElement('a');
        card.href = `../${movie.link}`;
        card.className = 'm-movie-card';
        card.innerHTML = `
            <div class="m-poster-box">
                <img src="../${movie.poster}" alt="${movie.name}" draggable="false">
            </div>
            <span class="m-card-title">${movie.name}</span>
        `;
        grid.appendChild(card);
    });

    // Добиваем пустыми карточками "Хутка" до 12 штук
    const minCards = 12;
        if (shuffled.length < minCards) {
            for (let i = shuffled.length; i < minCards; i++) {
                const placeholder = document.createElement('div');
                placeholder.className = 'm-movie-card empty';
                placeholder.innerHTML = `
                    <div class="m-poster-box">
                        <div class="m-movie-card-placeholder">Хутка</div>
                    </div>
                    <span class="m-card-title">&nbsp;</span>
                `;
                grid.appendChild(placeholder);
            }
        }
}

// --- 3. Буду глядзець ---
function renderFavorites() {
    const section = document.getElementById('favorites-section');
    const row = document.getElementById('homeFavoritesRow');
    if (!section || !row) return;

    const favorites = JSON.parse(localStorage.getItem('myFavorites')) || [];
    if (favorites.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    row.innerHTML = favorites.map(movie => `
    <a href="../release.html?id=${movie.id}" class="m-movie-card">
        <div class="m-poster-box">
            <img src="../${movie.poster}" alt="${movie.title}" draggable="false">
        </div>
        <span class="m-card-title">${movie.title}</span>
    </a>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderContinueWatching();
    renderMovieGrid();
    renderFavorites();
});