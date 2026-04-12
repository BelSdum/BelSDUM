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

                // Добавляем класс исчезновения
                document.body.classList.add("fade-out");

                // Ждем окончания анимации (600мс) и переходим
                setTimeout(() => {
                    window.location.href = destination;
                }, 600);
            }
        });
    });
});

function renderMovies() {

    const grid = document.getElementById('movieGrid');
    
    // 2. Перемешиваем список (алгоритм Фишера-Йетса)
    const shuffled = [...movies].sort(() => Math.random() - 0.5);

    // 3. Очищаем сетку и вставляем перемешанные фильмы
    grid.innerHTML = "";
    
    shuffled.forEach(movie => {
        const card = document.createElement('a');
        card.href = movie.link;
        card.className = 'movie-card';
        
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" draggable="false">
        `;
        
        grid.appendChild(card);
    });

    // 4. Добавляем пустые заглушки "Хутка", если фильмов мало (например, до 6 штук)
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


