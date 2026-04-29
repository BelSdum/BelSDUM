const movies = [
    {
        title: "fight_club",
        poster: "poster/poster_fight_club.jpg",
        link: "release.html?id=fight_club"
    }
];

document.addEventListener("DOMContentLoaded", () => {

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
});

function renderMovies() {
    const grid = document.getElementById('movieGrid');
    const shuffled = [...movies].sort(() => Math.random() - 0.5);
    grid.innerHTML = "";
    
    shuffled.forEach(movie => {
        const card = document.createElement('a');
        card.href = movie.link;
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" draggable="false">
            <div class="movie-info"></div>
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

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('legalModal');
    const openBtn = document.getElementById('openLegal');

    // Открыть окно
    openBtn.onclick = () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Запрещаем скролл сайта под окном
    };

    // Закрыть при клике на фон
    modal.onclick = (e) => {
        
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; 
        }
    };
});


window.onload = renderMovies;


document.addEventListener("DOMContentLoaded", () => {
    const searchModal = document.getElementById('searchModal');
    const openSearchBtn = document.getElementById('openSearch');
    const searchInput = document.getElementById('searchInput');
    const resultsGrid = document.getElementById('searchResults');

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
        const query = e.target.value.toLowerCase();
        resultsGrid.innerHTML = "";

        if (query.length < 1) return;

        const filtered = movies.filter(m => m.title.toLowerCase().includes(query));

        filtered.forEach(movie => {
            const card = document.createElement('a');
            card.href = movie.link;
            card.className = 'search-result-card';
            card.innerHTML = `
                <img src="${movie.poster}" class="result-poster">
            `;
            resultsGrid.appendChild(card);
        });
    };
});





function renderContinueWatching() {
    const container = document.getElementById('continue-watching-container');
    if (!container) return;

    const rawData = localStorage.getItem('continueWatching');
    const savedData = rawData ? JSON.parse(rawData) : {};

    // Если данных нет, рисуем пустую карточку-копию
    if (Object.keys(savedData).length === 0) {
        container.innerHTML = `
        <div class="movie-container empty-card-apple">
            <div class="empty-placeholder-text">Чакаем першай зоркі</div>
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


window.deleteFromHistory = function(id) {
    const rawData = localStorage.getItem('continueWatching');
    if (rawData) {
        const savedData = JSON.parse(rawData);
        delete savedData[id];
        localStorage.setItem('continueWatching', JSON.stringify(savedData));
        renderContinueWatching(); 
    }
};


document.addEventListener("DOMContentLoaded", renderContinueWatching);


renderContinueWatching();



