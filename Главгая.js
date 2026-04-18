const movies = [
    {
        title: "Байцоўскі клуб",
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
            placeholder.innerHTML = `<div class="movie-card-placeholder" style="display:flex; justify-content:center; align-items:center; height:100%; color:rgba(255,255,255,0.2); font-size:24px; font-weight:600;">Хутка</div>`;
            grid.appendChild(placeholder);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('legalModal');
    const openBtn = document.getElementById('openLegal');


    openBtn.onclick = () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    };


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
    const section = document.getElementById('continue-watching-section'); 
    
    if (!container || !section) return;

    const rawData = localStorage.getItem('continueWatching');
    const savedData = JSON.parse(rawData);
    const ids = Object.keys(savedData);

    section.style.display = 'block';
    container.innerHTML = '';

    ids.forEach(id => {
        const item = savedData[id];
        if (!item.path || !item.duration) return; 

        const progressPercent = (item.time / item.duration) * 100;

        const card = document.createElement('div');
        card.className = 'continue-card-wrapper';
        card.innerHTML = `
            <div class="movie-container">
                <div class="poster-frame" style="background-image: url('poster/${id}.jpg');">
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <a href="${item.path}" class="click-shield"></a>
            </div>
        `;
        container.appendChild(card);
    });
}


renderContinueWatching();
