document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => document.body.classList.add("loaded"), 100);

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.hostname === window.location.hostname && !this.hash && this.target !== "_blank") {
                e.preventDefault(); 
                document.body.classList.add("fade-out");
                setTimeout(() => window.location.href = this.href, 600);
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    // 1. Читаем параметры URL (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    // 2. Если файл открыт без ID
    if (!movieId) {
        document.getElementById('m-rel-title').innerText = "Фільм не абраны";
        document.getElementById('m-rel-subtitle').innerText = "Памылка спасылкі";
        document.getElementById('m-rel-desc').innerHTML = "<p>Вы адкрылі гэтую старонку наўпрост. Калі ласка, абярыце фільм на галоўнай старонцы.</p>";
        return;
    }

    // 3. Достаем фильм из database.js
    const movie = (typeof movieDB !== 'undefined') ? movieDB[movieId] : null;

    if (!movie) {
        document.getElementById('m-rel-title').innerText = "Не знойдзена";
        document.getElementById('m-rel-subtitle').innerText = "Памылка базы дадзеных";
        document.getElementById('m-rel-desc').innerHTML = "<p>Такога фільма няма ў базе дадзеных.</p>";
        return;
    }

    // 4. Заполняем текстовую информацию
    document.title = `BelSDUM | ${movie.title}`;
    
    const titleElem = document.getElementById('m-rel-title');
    const durationElem = document.getElementById('m-rel-duration');
    const scoreElem = document.getElementById('m-rel-score');
    const subtitleElem = document.getElementById('m-rel-subtitle');
    const descElem = document.getElementById('m-rel-desc');
    const watchBtn = document.getElementById('m-watch-btn');

    if (titleElem) titleElem.innerText = movie.title;
    if (durationElem) durationElem.innerText = movie.duration;
    if (scoreElem) scoreElem.innerText = movie.score;
    if (subtitleElem) subtitleElem.innerText = `${movie.titleOriginal} | ${movie.year} | Агучка | Мой родны гук`;
    if (descElem) descElem.innerHTML = movie.description;

    // Ссылка на плеер
    if (watchBtn) watchBtn.href = `Mplayer.html?id=${movie.id}`;

    // 5. ПОДГРУЗКА ВИДЕО ПРОПИСАННЫМ СПОСОБОМ

    // Верхнее фоновое видео
    const heroVideo = document.getElementById('mHeroVideo');
    if (heroVideo) {
        const bgSource = movie.trailerSrc;
        heroVideo.innerHTML = `<source src="${bgSource}" >`;
        heroVideo.load();
    }

    // Нижний полноценный трейлер
    const trailerVideo = document.getElementById('mTrailerVideo');
    if (trailerVideo && movie.trailerSrc) {
        trailerVideo.innerHTML = `<source src="${movie.trailerSrc}" >`;
        trailerVideo.load();
    }

    // 6. Логика кнопки включения/выключения звука в шапке
    const muteBtn = document.getElementById('mMuteBtn');
    if (muteBtn && heroVideo) {
        const iconMuted = muteBtn.querySelector('.icon-muted');
        const iconUnmuted = muteBtn.querySelector('.icon-unmuted');

        muteBtn.addEventListener('click', () => {
            if (heroVideo.muted) {
                heroVideo.muted = false;
                heroVideo.volume = 0.7;
                if (iconMuted) iconMuted.style.display = 'none';
                if (iconUnmuted) iconUnmuted.style.display = 'block';
            } else {
                heroVideo.muted = true;
                if (iconMuted) iconMuted.style.display = 'block';
                if (iconUnmuted) iconUnmuted.style.display = 'none';
            }
        });
    }

    // 7. Логика кнопки "В избранное"
    const favBtn = document.getElementById('m-fav-btn');
    if (favBtn) {
        let favorites = JSON.parse(localStorage.getItem('myFavorites')) || [];
        const isFav = favorites.some(m => m.id === movie.id);

        if (isFav) {
            favBtn.classList.add('active');
        }

        favBtn.addEventListener('click', () => {
            favorites = JSON.parse(localStorage.getItem('myFavorites')) || [];
            const index = favorites.findIndex(m => m.id === movie.id);

            if (index > -1) {
                favorites.splice(index, 1);
                favBtn.classList.remove('active');
            } else {
                favorites.push({
                    id: movie.id,
                    title: movie.title,
                    poster: movie.posterRelease,
                    year: movie.year,
                    rating: movie.rating
                });
                favBtn.classList.add('active');
            }
            localStorage.setItem('myFavorites', JSON.stringify(favorites));
        });
    }

    // 8. Перехват кликов с откликом сжатия перед переходом
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.m-btn-primary, .m-back-btn');
        if (btn && btn.href && btn.getAttribute('href') !== '#') {
            e.preventDefault();
            const destination = btn.href;
            btn.style.transform = 'scale(0.92)';
            btn.style.opacity = '0.8';

            setTimeout(() => {
                window.location.href = destination;
            }, 180);
        }
    });

    // Логика окна "Поделиться"
    const shareBtn = document.getElementById('m-share-btn');
    const shareModal = document.getElementById('m-shareModal');
    const closeShareBtn = document.getElementById('m-closeShareBtn');
    const shareInputLink = document.getElementById('m-shareInputLink');
    const copyLinkBtn = document.getElementById('m-copyLinkBtn');
    const shareTG = document.getElementById('m-shareTG');

    if (shareBtn && shareModal) {
        const currentUrl = window.location.href;

        // Вставляем текущий URL
        if (shareInputLink) shareInputLink.value = currentUrl;

        // Генерация ссылки для Telegram
        if (shareTG) {
            shareTG.href = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}`;
        }

        // Открытие модалки
        shareBtn.addEventListener('click', () => {
            shareModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Блокируем скролл фона
        });

        // Закрытие модалки
        const closeModal = () => {
            shareModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (closeShareBtn) closeShareBtn.addEventListener('click', closeModal);
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) closeModal();
        });

        // Копирование ссылки с визуальной реакцией
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(currentUrl).then(() => {
                    const originalBg = copyLinkBtn.style.background;
                    const originalColor = copyLinkBtn.style.color;
                    
                    // Анимация успешного копирования (зеленая заливка)
                    copyLinkBtn.style.color = "#000";
                    
                    setTimeout(() => {
                        copyLinkBtn.style.background = originalBg;
                        copyLinkBtn.style.color = originalColor;
                    }, 2000);
                }).catch(err => {
                    console.error("Памылка капіявання: ", err);
                });
            });
        }
    }

    // Логика сворачивания / разворачивания описания
// Логика сворачивания / разворачивания описания с динамическим расчетом высоты
    const descBox = document.getElementById('mDescBox');
    const toggleBtn = document.getElementById('mDescToggleBtn');

    if (descBox && toggleBtn && descElem) {
        // Даем браузеру отрисоваться, чтобы получить корректные размеры текста
        setTimeout(() => {
            const collapsedHeight = 120; // Высота свернутого блока в пикселях (~3-4 строки)
            const fullHeight = descElem.scrollHeight + 80;// Реальная высота текста с запасом под отступы

            // Если текст действительно длинный
            if (descElem.scrollHeight > collapsedHeight) {
                // Записываем динамические высоты в CSS-переменные контейнера
                descBox.style.setProperty('--collapsed-height', `${collapsedHeight}px`);
                descBox.style.setProperty('--expanded-height', `${fullHeight}px`);

                // Изначально делаем блок свернутым
                descBox.classList.remove('expanded');
                toggleBtn.style.display = 'inline-block';
                toggleBtn.innerText = "разгарнуць";
            } else {
                // Если текст короткий, кнопка не нужна
                toggleBtn.style.display = 'none';
                descBox.style.setProperty('--collapsed-height', `${fullHeight}px`);
            }
        }, 60);

        toggleBtn.addEventListener('click', () => {
            const isExpanded = descBox.classList.contains('expanded');
            
            if (isExpanded) {
                descBox.classList.remove('expanded');
                toggleBtn.innerText = "разгарнуць";
                
                // Плавный скролл обратно к началу блока, если пользователь ушел ниже при чтении
                const boxTop = descBox.getBoundingClientRect().top + window.pageYOffset - 20;
                if (window.pageYOffset > boxTop) {
                    window.scrollTo({ top: boxTop, behavior: 'smooth' });
                }
            } else {
                descBox.classList.add('expanded');
                toggleBtn.innerText = "згарнуць";
            }
        });
    }


    

    document.addEventListener('contextmenu', (e) => e.preventDefault());
});



