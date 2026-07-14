import { CloudDB } from './cloud.js';

// Массив доступных фильмов
const movies = [
    {
        title: "fight_club",
        search: "fight club бойцовский клуб байцоўскі клуб",
        name: "Байцоўскі клуб",
        poster: "poster/poster_fight_club.jpg",
        link: "release.html?id=fight_club"
    },
    {
        title: "No_Country_for_Old_Men",
        search: "no country for old men старикам тут не место старым тут не месца",
        name: "Старым тут не месца",
        poster: "poster/poster_No_Country_for_Old_Men.jpg",
        link: "release.html?id=No_Country_for_Old_Men"
    }
];

// Проверка соединения при загрузке и отслеживание статуса сети
if (!navigator.onLine) {
    window.location.href = '404.html';
}

window.addEventListener('offline', function() {
    console.log("Внимание: Междупланетная связь потеряна!");
    window.location.href = '404.html';
});

// Инициализация аватара текущего пользователя
const currentUser = localStorage.getItem('currentUser');
const navAvatarContainer = document.getElementById('navAvatarContainer');

if (currentUser && navAvatarContainer) {
    CloudDB.getAllUsers().then(usersDB => {
        const myData = usersDB[currentUser];
        if (myData && myData.avatar) {
            const avatarData = myData.avatar;
            
            if (avatarData.startsWith('data:image')) {
                navAvatarContainer.innerHTML = `<img src="${avatarData}" class="nav-custom-avatar-img" alt="Avatar">`;
            } else {
                navAvatarContainer.innerHTML = avatarData;
            }
        } else {
            navAvatarContainer.innerHTML = "✨";
        }
    }).catch(err => {
        console.error("Ошибка загрузки аватара в навигацию:", err);
        navAvatarContainer.innerHTML = "✨"; 
    });
}

// Глобальная функция обновления аватара (вызывается из других мест)
window.updateNavAvatar = async function() {
    const navAvatarContainer = document.getElementById('navAvatarContainer');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!navAvatarContainer) return;
    
    if (!currentUser) {
        navAvatarContainer.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        return;
    }

    try {
        const usersDB = await CloudDB.getAllUsers();
        const myData = usersDB[currentUser];
        
        if (myData && myData.avatar) {
            if (myData.avatar.startsWith('data:image')) {
                navAvatarContainer.innerHTML = `<img src="${myData.avatar}" class="nav-custom-avatar-img">`;
            } else {
                navAvatarContainer.innerHTML = myData.avatar;
            }
        }
    } catch (err) {
        console.error("Памылка абнаўлення аватара:", err);
    }
};

// Функция отрисовки карточек фильмов
function renderMovies() {
    const grid = document.getElementById('movieGrid');
    const shuffled = [...movies].sort(() => Math.random() - 0.5);
    grid.innerHTML = "";
    
    shuffled.forEach(movie => {
        const card = document.createElement('a');
        card.href = movie.link;
        card.className = 'movie-card';
        card.setAttribute('data-title', movie.title); 
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" draggable="false" class="movie-card-image">
            <div class="movie-info"></div>
            <div class="movie-card-overlay">
                <h3 class="movie-card-title">${movie.name}</h3>
            </div>
        `;
        grid.appendChild(card);
    });

    const minCards = 14;
    if (shuffled.length < minCards) {
        for (let i = shuffled.length; i < minCards; i++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'movie-card empty';
            placeholder.innerHTML = `<div class="movie-card-placeholder" style="display:flex; justify-content:center; align-items:center; height:100%; color:rgba(255,255,255,0.15); font-size:24px; font-weight:600;">Хутка</div>`;
            grid.appendChild(placeholder);
        }
    }
}

// Рендер секции "Продолжить просмотр" из localStorage
function renderContinueWatching() {
    const container = document.getElementById('continue-watching-container');
    if (!container) return;

    const rawData = localStorage.getItem('continueWatching');
    const savedData = rawData ? JSON.parse(rawData) : {};

    if (Object.keys(savedData).length === 0) {
        container.innerHTML = `
        <div class="movie-container empty-card-apple">
            <div class="empty-placeholder-text">Чакаем першага прагляду</div>
        </div>
        `;
        return;
    }

    container.innerHTML = '';

    Object.keys(savedData).forEach(id => {
        const item = savedData[id];
        if (!item.duration || item.duration === 0) return;

        const progressPercent = Math.min((item.time / item.duration) * 100, 100);
        const isFinished = progressPercent >= 95;
        const card = document.createElement('div');
        
        card.className = 'continue-card-wrapper';
        card.innerHTML = `
        <div class="movie-container ${isFinished ? 'movie-finished' : ''}" data-id="${id}">
            <div class="poster-frame" style="background-image: url('poster/${id}.jpg');">
                ${isFinished ? '<div class="finished-badge">Прагледжана</div>' : ''}
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progressPercent}% !important; ${isFinished ? 'background: #ffffff;' : ''}"></div>
                </div>
            </div>
            <a href="player.html?id=${id}" class="click-shield"></a>
            <button class="delete-history-btn" onclick="deleteFromHistory('${id}')">✕</button>
        </div>
        `;
        container.appendChild(card);
    });
}

// Глобальная функция для удаления фильма из истории просмотра
window.deleteFromHistory = function(id) {
    const rawData = localStorage.getItem('continueWatching');
    if (rawData) {
        const savedData = JSON.parse(rawData);
        delete savedData[id];
        localStorage.setItem('continueWatching', JSON.stringify(savedData));
        renderContinueWatching(); 
    }
};

// Отрисовка списка "Буду смотреть" на главной странице
function renderHomeFavorites() {
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
        <a href="release.html?id=${movie.id}" class="movie-card" data-title="${movie.title}">
            <img src="${movie.poster}" alt="${movie.title}" draggable="false" class="movie-card-image">
            <div class="movie-info"></div>
            <div class="movie-card-overlay">
                <h3 class="movie-card-title">${movie.title}</h3>
            </div>
        </a>
    `).join('');
}

// Запуск функций отрисовки
window.onload = renderMovies;

// Глобальная функция для показа красивых уведомлений в стиле Apple
window.showToast = function(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'apple-toast';
    toast.textContent = message;

    container.appendChild(toast);
    toast.offsetHeight; // Форсируем перерисовку
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 3500);
};

// Основной блок инициализации событий на странице
document.addEventListener("DOMContentLoaded", () => {
    // --- Плавное появление страницы и переход по ссылкам ---
    setTimeout(() => {
        document.body.classList.add("loaded");
    }, 100);

    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.hostname === window.location.hostname && !this.hash && this.target !== "_blank") {
                e.preventDefault(); 
                const destination = this.href;

                document.body.classList.add("fade-out");

                setTimeout(() => {
                    window.location.href = destination;
                }, 600);
            }
        });
    });

    // --- Логика кнопки скролла "Наверх" ---
    const scrollBtn = document.getElementById('scrollToTop');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollBtn.classList.add('is-visible');
            } else {
                scrollBtn.classList.remove('is-visible');
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- Логика модального окна "Пользовательское соглашение" ---
    const legalModal = document.getElementById('legalModal');
    const openLegalBtn = document.getElementById('openLegal');
    
    if (openLegalBtn && legalModal) {
        openLegalBtn.onclick = () => {
            legalModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        legalModal.onclick = (e) => {
            if (e.target === legalModal) {
                legalModal.classList.remove('active');
                document.body.style.overflow = ''; 
            }
        };
    }

    // --- Логика поиска ---
    const searchModal = document.getElementById('searchModal');
    const openSearchBtn = document.getElementById('openSearch');
    const searchInput = document.getElementById('searchInput');
    const resultsGrid = document.getElementById('searchResults');
    const closeSearchBtn = document.querySelector('.close-search-btn') || document.querySelector('.cross-icon'); 

    if (openSearchBtn && searchModal && searchInput && resultsGrid) {
        openSearchBtn.onclick = () => {
            searchModal.classList.add('active');
            setTimeout(() => searchInput.focus(), 100);
        };

        searchModal.onclick = (e) => {
            if (e.target.id === 'searchModal' || e.target.classList.contains('search-overlay')) {
                searchModal.classList.remove('active');
            }
        };

        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase().trim(); 
            resultsGrid.innerHTML = "";

            if (query.length < 1) return;
                const filtered = movies.filter(m => m.search && m.search.toLowerCase().includes(query));

            if (filtered.length === 0) {
                resultsGrid.innerHTML = `
                    <div class="no-results-message" style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.4); padding: 2rem; font-size: 1.2rem;">
                        Нічога не знойдзена
                    </div>`;
                return;
            }

    // Выводим результаты
        filtered.forEach(movie => {
            const card = document.createElement('a');
            card.href = movie.link;
            card.className = 'search-result-card';
            card.innerHTML = `
                <img src="${movie.poster}" class="result-poster" draggable="false">
                <div class="result-movie-title" style="margin-top: 0.5rem; font-size: 1rem; color: #fff; font-weight: 500;">
                    ${movie.name}
                </div>
            `;
        resultsGrid.appendChild(card);
    });
    };
}

    // Рендер элементов при загрузке DOM
    renderContinueWatching();
    renderHomeFavorites();
});