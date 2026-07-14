document.addEventListener("DOMContentLoaded", () => {
    // Получаем ID фильма из URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    // Находим фильм в базе данных
    const movie = movieDB[movieId];

    // Если фильм не найден — возвращаем на главную
    if (!movie) {
        window.location.href = "index.html";
        return;
    }

    // Заполнение страницы данными из movieDB
    document.getElementById('page-title').innerText = `BelSDUM | ${movie.title}`;
    document.getElementById('rel-poster').src = movie.posterRelease;
    document.getElementById('rel-title').innerHTML = `${movie.title} <span class="age-rating">${movie.rating}</span>`;
    document.getElementById('rel-subtitle').innerText = `${movie.titleOriginal} | ${movie.year} | Агучка | Мой родны гук`;
    document.getElementById('rel-score').innerText = movie.score;
    document.getElementById('rel-duration').innerText = movie.duration;
    document.getElementById('rel-desc').innerHTML = movie.description;
    
    // Настраиваем ссылку на плеер
    document.getElementById('watch-btn').href = `player.html?id=${movie.id}`; 

    // Загрузка трейлера
    const videoElement = document.getElementById('previewVideo');
    videoElement.innerHTML = `<source src="${movie.trailerSrc}" type="video/mp4">`;
    videoElement.load();

    // Заполнение ссылки для окна "Поделиться"
    const shareLinkElem = document.getElementById('shareLink');
    if (shareLinkElem) {
        shareLinkElem.innerText = window.location.href;
    }

    // Логика кнопки "В избранное"
    const favBtn = document.getElementById('fav-btn');
    if (favBtn && movie) {
        let favorites = JSON.parse(localStorage.getItem('myFavorites')) || [];
        const isFav = favorites.some(m => m.id === movie.id);
        
        // Устанавливаем активный класс, если фильм уже в избранном
        if (isFav) {
            favBtn.classList.add('active');
        }

        // Обработка клика по лайку
        favBtn.addEventListener('click', () => {
            favorites = JSON.parse(localStorage.getItem('myFavorites')) || [];
            const index = favorites.findIndex(m => m.id === movie.id);

            if (index > -1) {
                // Удаляем из избранного
                favorites.splice(index, 1);
                favBtn.classList.remove('active');
            } else {
                // Добавляем в избранное
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

    // Запуск дополнительных визуальных эффектов страницы
    initReleaseInteractivity(movie);
});

// Функция для работы с анимациями, холстом и модальными окнами
// ДОБАВЛЕНО: аргумент movie в скобках
function initReleaseInteractivity(movie) {
    
    // Плавное появление контента после загрузки
    setTimeout(() => { 
        document.body.classList.add("loaded"); 
    }, 100);

    // 3D-эффект наклона постера при движении мыши
    const posterImg = document.getElementById('rel-poster');
    if (posterImg) {
        posterImg.addEventListener('mousemove', (e) => {
            const rect = posterImg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;
            
            posterImg.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            posterImg.style.zIndex = "10"; 
        });
        
        posterImg.addEventListener('mouseleave', () => {
            posterImg.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
            posterImg.style.zIndex = "1";
        });
    }

    // Логика трейлера и фонового свечения (Ambilight)
    const container = document.getElementById('trailerBox');
    const video = document.getElementById('previewVideo');
    const ambientCanvas = document.getElementById('ambientCanvas');
    
    if (container && video && ambientCanvas) {
        const overlayText = container.querySelector('.play-overlay');
        const ctx = ambientCanvas.getContext('2d', { alpha: false });

        // Включение/выключение звука в трейлере
        container.onclick = () => {
            if (video.muted) {
                video.muted = false;
                video.volume = 0.5; 
                if (overlayText) overlayText.innerText = "Націсніце, каб выключыць гук"; 
            } else {
                video.muted = true;
                if (overlayText) overlayText.innerText = "Націсніце, каб уключыць гук"; 
            }
        };

        // Функция отрисовки кадров видео на Canvas для фонового свечения
        function updateAmbientLight() {
            ctx.drawImage(video, 0, 0, ambientCanvas.width, ambientCanvas.height);
            if (!video.paused && !video.ended) {
                requestAnimationFrame(updateAmbientLight);
            }
        }

        video.addEventListener('loadeddata', () => {
            ambientCanvas.width = 160; 
            ambientCanvas.height = 90;
            updateAmbientLight(); 
        });
        
        video.addEventListener('play', updateAmbientLight);
        video.addEventListener('seeked', updateAmbientLight);
    }

    // окно "Поделиться"
    const shareBtn = document.getElementById('shareBtn');
    const shareModal = document.getElementById('shareModal');
    const closeShareBtn = document.getElementById('closeShareBtn');
    const shareInputLink = document.getElementById('shareInputLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const copyBtnText = document.getElementById('copyBtnText');
    const shareTG = document.getElementById('shareTG');
    const shareX = document.getElementById('shareX');

    if (shareBtn && shareModal && movie) {
        const currentUrl = window.location.href;

        // Вставляем текущий URL в поле ввода
        if (shareInputLink) shareInputLink.value = currentUrl;

        const shareText = ``;
        if (shareTG) {
            shareTG.href = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
        }
        if (shareX) {
            shareX.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
        }

        // Открытие окна
        shareBtn.onclick = () => shareModal.classList.add('active');

        // Функция закрытия окна
        const closeModal = () => shareModal.classList.remove('active');

        if (closeShareBtn) closeShareBtn.onclick = closeModal;
        shareModal.onclick = (e) => { if (e.target === shareModal) closeModal(); };

        // Продвинутое интерактивное копирование ссылки
        if (copyLinkBtn) {
            copyLinkBtn.onclick = () => {
                navigator.clipboard.writeText(currentUrl).then(() => {
                    if (copyBtnText) copyBtnText.innerText = "Скапіявана";
                    
                    setTimeout(() => {
                        if (copyBtnText) copyBtnText.innerText = "Капіяваць";
                        // Возвращаем исходный белый стиль
                        copyLinkBtn.style.background = "#ffffff";
                        copyLinkBtn.style.color = "#050505";
                        copyLinkBtn.style.boxShadow = "";
                    }, 4000);
                }).catch(err => {
                    console.error("Не удалось скопировать ссылку: ", err);
                });
            };
        }
    }
} 