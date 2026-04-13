const movies = [
    {
        title: "Байцоўскі клуб",
        description: "Супрацоўнік страхавой кампаніі пакутуе хранічнай бессанню і адчайна спрабуе вырвацца з пакутліва сумнай жыцця. Аднойчы ў чарговай камандзіроўцы ён сустракае нейкага Тайлера Дэрдена-харызматычнага гандляра мылам з перакручанай філасофіяй. Тайлер упэўнены, што самаўдасканаленне — доля слабых, а адзінае, дзеля чаго варта жыць, — самаразбурэнне.", 
        poster: "Бойцовский клуб (1999)/Релиз/poster.jpg",
        link: "Бойцовский клуб (1999)/Релиз/BelSDUMБойцовский клуб (1999).HTML"
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
        
        // Добавляем обертку для инфо-блока
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" draggable="false">
            <div class="movie-info">
                <h3 class="info-title">${movie.title}</h3>
                <p class="info-desc">${movie.description}</p>
            </div>
        `;
        
        grid.appendChild(card);
    });

    // Отрисовка заглушек (оставляем без изменений)
    const minCards = 14;
    if (shuffled.length < minCards) {
        for (let i = shuffled.length; i < minCards; i++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'movie-card empty';
            placeholder.innerHTML = `<div class="movie-card-placeholder" style="display:flex; justify-content:center; align-items:center; height:100%; color:rgba(255,255,255,0.2); font-size:24px; font-weight:600;">Хутка</div>`;
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
        // Если клик был именно по оверлею, а не по контейнеру с текстом
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Возвращаем скролл
        }
    };
});

// Запускаем при загрузке
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
