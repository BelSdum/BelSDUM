document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    const movie = typeof movieDB !== 'undefined' ? movieDB[movieId] : null;

    let currentTrack = null;
    let currentSkipTime = 0;
    let idleTimer;
    let lastSaveTime = 0;

    const ICONS = {
        play: '../icon/PLAY.png',
        pause: '../icon/Pause.png'
    };

    const $ = (id) => document.getElementById(id);

    const video = $('video'), audio = $('externalAudio'), player = $('mainPlayer');
    const controls = $('controlsPanel'), loader = $('videoLoader');
    const qualityMenu = $('qualityMenu'), qualityItems = document.querySelectorAll('.quality-item');

    const fsBtn = $('fullscreenBtn');
    const fsIcon = $('fsIcon');
    const playBtn = $('playBtn');
    const rewindBtn = $('rewindBtn'), forwardBtn = $('forwardBtn');
    const pipBtn = $('pipBtn'), settingsBtn = $('settingsBtn');
    const progress = $('progress'), curTimeText = $('currentTime'), durText = $('duration');
    const skipBtn = $('skipBtn'), backBtn = $('backBtn');

    const ambientCanvas = $('ambientCanvas');
    const ctx = ambientCanvas ? ambientCanvas.getContext('2d', { alpha: false }) : null;
    const musicBanner = $('musicBanner'), musicModal = $('musicModal');

    const shareBtnIcon = $('shareBtnIcon'), shareModal = $('shareModal');
    const shareInputLink = $('shareInputLink'), copyLinkBtn = $('copyLinkBtn'), copyBtnText = $('copyLinkBtn').querySelector('span:last-child');

    if (!movie) {
        alert("Фільм не знойдзены!");
        window.location.href = "Mrelease.html";
        return;
    }

    document.title = `BelSDUM | ${movie.title}`;
    if (backBtn) backBtn.href = `Mrelease.html?id=${movieId}`;
    
    video.src = movie.videoSrc;
    audio.src = movie.audioSrc;
    video.load();
    audio.load();

    currentSkipTime = movie.skipTime || 0;

    const mainTitle = document.querySelector('.main-title');
    const subTitle = document.querySelector('.sub-title');
    if (mainTitle) mainTitle.innerText = movie.title;
    if (subTitle) subTitle.innerText = `${movie.titleOriginal} • ${movie.year}`;

    // Настройка меню качества
    qualityItems.forEach(item => {
        const q = item.dataset.quality;
        if (movie.quality && movie.quality[q]) item.dataset.src = movie.quality[q];

        item.onclick = (e) => {
            e.stopPropagation();
            const newSrc = item.dataset.src;
            if (!newSrc || newSrc === video.src) { qualityMenu.classList.add('hide'); return; }

            const currentTime = video.currentTime;
            const isPaused = video.paused;

            qualityItems.forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            video.src = newSrc;
            video.load();

            video.addEventListener('loadedmetadata', () => {
                video.currentTime = currentTime;
                if (!isPaused) {
                    video.play();
                    audio.currentTime = currentTime;
                    audio.play();
                }
            }, { once: true });
            
            qualityMenu.classList.add('hide');
            showUI();
        };
    });

    const toggleFS = () => {
    if (!document.documentElement.fullscreenElement && !document.fullscreenElement) {
        // Запрос полноэкранного режима для контейнера плеера
        const requestFS = player.requestFullscreen || player.webkitRequestFullscreen;
        if (requestFS) {
            requestFS.call(player).catch(err => console.log(err));
        }
        
        // Попытка принудительно развернуть ориентацию в альбомную при входе в фулскрин
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }

        if (fsIcon) fsIcon.src = '../icon/Union 2.png'; // Иконка выхода из фулскрина (если есть)
    } else {
        const exitFS = document.exitFullscreen || document.webkitExitFullscreen;
        if (exitFS) {
            exitFS.call(document).catch(err => console.log(err));
        }
        if (fsIcon) fsIcon.src = '../icon/Union.png';
    }
    };

    if (fsBtn) {
        fsBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFS();
        };
    }

    setTimeout(() => document.body.classList.add("loaded"), 100);

    const formatTime = (s) => {
        if (isNaN(s) || s < 0) return "00:00";

        const totalSeconds = Math.floor(s);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (num) => num.toString().padStart(2, '0');

        if (hours > 0) {
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }

        return `${pad(minutes)}:${pad(seconds)}`;
    };

    const paintProgress = (el, val, max = 100) => {
        const p = max === 0 ? 0 : (val / max) * 100;
        el.style.background = `linear-gradient(to right, #ffffff ${p}%, rgba(255, 255, 255, 0.2) ${p}%)`;
    };

    const togglePlay = () => {
        if (video.paused) {
            video.play().catch(() => {});
            audio.play().catch(() => {});
            playBtn.src = ICONS.pause;
        } else {
            video.pause();
            audio.pause();
            playBtn.src = ICONS.play;
        }
        showUI();
    };

    rewindBtn.onclick = (e) => { e.stopPropagation(); video.currentTime = Math.max(0, video.currentTime - 10); audio.currentTime = video.currentTime; showUI(); };
    forwardBtn.onclick = (e) => { e.stopPropagation(); video.currentTime = Math.min(video.duration, video.currentTime + 10); audio.currentTime = video.currentTime; showUI(); };

    if (document.pictureInPictureEnabled) {
        pipBtn.onclick = async (e) => {
            e.stopPropagation();
            try {
                if (document.pictureInPictureElement) await document.exitPictureInPicture();
                else await video.requestPictureInPicture();
            } catch (err) { console.log("PiP Error", err); }
        };
    } else {
        pipBtn.style.display = 'none';
    }

    const isUIHidden = () => controls.classList.contains('hide');

    const showUI = () => {
        controls.classList.remove('hide');
        if (video.currentTime < currentSkipTime) skipBtn.classList.add('show');
        
        clearTimeout(idleTimer);
        if (!video.paused) {
            idleTimer = setTimeout(() => {
                if (qualityMenu.classList.contains('hide')) {
                    controls.classList.add('hide');
                    skipBtn.classList.remove('show');
                }
            }, 3500);
        }
    };

    const saveProgress = () => {
        if (!movieId || video.currentTime <= 5) return;
        localStorage.setItem('video_pos_' + movieId, video.currentTime);
    };

    const hideLoader = () => loader.classList.add('hide');
    const showLoader = () => loader.classList.remove('hide');
    const safetyLoaderTimer = setTimeout(hideLoader, 4000);

    video.addEventListener('loadedmetadata', () => {
        clearTimeout(safetyLoaderTimer);
        hideLoader();

        if (movie.rating === "18+") {
            video.addEventListener('play', () => {
                const warningOverlay = $('overlayImage');
                if (warningOverlay) {
                    warningOverlay.classList.add('visible');
                    setTimeout(() => warningOverlay.classList.remove('visible'), 10000);
                }
            }, { once: true });
        }

        const savedTime = localStorage.getItem('video_pos_' + movieId);
        if (savedTime) {
            const time = parseFloat(savedTime);
            if (time > 0 && time < video.duration - 5) {
                video.currentTime = time;
                audio.currentTime = time;
            }
        }
        durText.innerText = formatTime(video.duration);
    }, { once: true });

    video.addEventListener('timeupdate', () => {
        const cur = video.currentTime;
        const dur = video.duration || 0;
        
        progress.value = (cur / dur) * 100 || 0;
        curTimeText.innerText = formatTime(cur);
        paintProgress(progress, cur, dur);

        if (cur - lastSaveTime > 2 || cur < lastSaveTime) {
            saveProgress();
            lastSaveTime = cur;
        }

        if (Math.abs(audio.currentTime - cur) > 0.5) audio.currentTime = cur;
        if (cur >= currentSkipTime) skipBtn.classList.remove('show');
    });

    video.addEventListener('seeking', () => { showLoader(); audio.pause(); });
    video.addEventListener('waiting', () => { showLoader(); audio.pause(); });
    // Сінхранізуем іконкі UI з рэальным станам відэа (важна для PiP)
    video.addEventListener('playing', () => { 
        hideLoader(); 
        audio.currentTime = video.currentTime; 
        audio.play().catch(()=>{}); 
        if (playBtn) playBtn.src = ICONS.pause; 
    });
    
    video.addEventListener('pause', () => { 
        audio.pause(); 
        saveProgress(); 
        if (playBtn) playBtn.src = ICONS.play; 
    });
    video.addEventListener('canplay', hideLoader);

    playBtn.onclick = (e) => { e.stopPropagation(); togglePlay(); };
    $('playBtnContainer').onclick = (e) => { e.stopPropagation(); togglePlay(); };

    player.onclick = (e) => { 
        if (e.target === player || e.target === video || e.target.classList.contains('ambient-light') || e.target.closest('.m-center-controls') === null) {
            if (isUIHidden()) showUI(); 
            else { controls.classList.add('hide'); qualityMenu.classList.add('hide'); }
        }
    };

    settingsBtn.onclick = (e) => { e.stopPropagation(); qualityMenu.classList.toggle('hide'); };
    skipBtn.onclick = (e) => { 
        e.stopPropagation(); 
        video.currentTime = currentSkipTime + 0.5; 
        audio.currentTime = currentSkipTime + 0.5;
        skipBtn.classList.remove('show'); 
    };

    progress.oninput = () => {
        const time = (progress.value / 100) * video.duration;
        video.currentTime = time;
        audio.currentTime = time;
        paintProgress(progress, progress.value, 100);
    };

    if (shareBtnIcon && shareModal) {
        shareBtnIcon.onclick = (e) => {
            e.stopPropagation();
            const currentUrl = window.location.href;
            shareInputLink.value = currentUrl;
            const shareTG = $('shareTG');
            if (shareTG) shareTG.href = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}`;
            shareModal.classList.add('active');
        };
        shareModal.onclick = (e) => { if (e.target === shareModal) shareModal.classList.remove('active'); };
        if (copyLinkBtn) {
            copyLinkBtn.onclick = () => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    if (copyBtnText) copyBtnText.innerText = "Скапіявана";
                    setTimeout(() => { if (copyBtnText) copyBtnText.innerText = "Капіяваць"; }, 3000);
                });
            };
        }
    }

    if (ctx) {
        const updateAmbientLight = () => {
            ctx.drawImage(video, 0, 0, ambientCanvas.width, ambientCanvas.height);
            if (!video.paused && !video.ended) requestAnimationFrame(updateAmbientLight);
        };
        video.addEventListener('play', updateAmbientLight);
        video.addEventListener('seeked', updateAmbientLight);
        video.addEventListener('loadeddata', () => {
            ambientCanvas.width = 160;
            ambientCanvas.height = 90;
            updateAmbientLight();
        });
    }

    const timeToSec = (str) => {
        if (typeof str === 'number') return str;
        const parts = str.split(':');
        if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        return parseFloat(str) || 0;
    };

    const checkTrack = () => {
        if (!movie || !movie.soundtrack) return;
        const cur = video.currentTime;
        const track = movie.soundtrack.find(t => cur >= timeToSec(t.start) && cur <= timeToSec(t.end));

        if (track) {
            if (currentTrack !== track) {
                currentTrack = track;
                $('bannerTrackTitle').innerText = track.title;
                $('bannerTrackArtist').innerText = track.artist;
                $('bannerTrackCover').src = `../${track.cover}`;
            }
            if (!isUIHidden()) musicBanner.classList.remove('hide');
            else musicBanner.classList.add('hide');
        } else {
            currentTrack = null; 
            musicBanner.classList.add('hide');
        }
    };

    video.addEventListener('timeupdate', checkTrack);
    video.addEventListener('seeking', checkTrack);

    const uiObserver = new MutationObserver(() => { checkTrack(); });
    if (controls) uiObserver.observe(controls, { attributes: true, attributeFilter: ['class'] });

    musicBanner.onclick = (e) => {
        e.stopPropagation();
        if (currentTrack && currentTrack.url) {
            // Калі відэа грае, ставім яго на паўзу перад пераходам
            if (!video.paused) {
                togglePlay();
            }
            // Адкрываем спасылку на Яндэкс Музыку ў новай укладцы
            window.open(currentTrack.url, '_blank');
        }
    };
    musicModal.onclick = (e) => { if (e.target === musicModal) musicModal.classList.remove('active'); };

    // --- Логика стартового полноэкранного оверлея ---
// --- Логіка стартавага поўнаэкраннага аверлэя ---
// --- Логіка стартавага поўнаэкраннага аверлэя ---
// --- Логіка стартавага поўнаэкраннага аверлэя ---
    const startOverlay = $('startOverlay');
    const startPlayBtn = $('startPlayBtn');

    if (startPlayBtn && startOverlay) {
        // Праверкі на прылады выдалены — плашка працуе ўсюды

        startPlayBtn.onclick = (e) => {
            e.stopPropagation();
            // 1. Уключаем поўнаэкранны рэжым
            toggleFS();
            // 2. Хаваем аверлэй
            startOverlay.classList.add('hide');
        };

        // Агульная функцыя для вяртання плашкі і паўзы
        const handleFullscreenExit = () => {
            startOverlay.classList.remove('hide');
            if (!video.paused) {
                video.pause();
                audio.pause();
                if (playBtn) playBtn.src = ICONS.play; // вяртаем абразок Play
                showUI();
            }
        };

        // Стандартнае адсочванне (Android, Windows)
        const handleFullscreenChange = () => {
            const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
            if (!isFullscreen) {
                handleFullscreenExit();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        // ВАЖНА: Спецыяльны слухач для iOS/iPadOS (Apple)
        // Спрацоўвае, калі карыстальнік закрывае натыўны плэер на планшэце/тэлефоне
        video.addEventListener('webkitendfullscreen', handleFullscreenExit);
    }

    // --- Інтэграцыя з сістэмным плэерам (Media Session API) ---
    // Гэта паправіць кіраванне праз акно PiP і на экране блакіроўкі
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: movie.title,
            artist: movie.titleOriginal ? `${movie.titleOriginal} • ${movie.year}` : 'BelSDUM',
            // Калі ёсць вокладка фільма ў базе, можна выкарыстоўваць яе. Пакуль ставім лагатып:
            artwork: [
                { src: '../LogoBelSDUMPNG.png', sizes: '512x512', type: 'image/png' }
            ]
        });

        // Прывязваем сістэмныя кнопкі да нашых функцый
        navigator.mediaSession.setActionHandler('play', () => { 
            video.play(); 
        });
        navigator.mediaSession.setActionHandler('pause', () => { 
            video.pause(); 
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => { 
            video.currentTime = Math.max(0, video.currentTime - 10); 
        });
        navigator.mediaSession.setActionHandler('seekforward', () => { 
            video.currentTime = Math.min(video.duration, video.currentTime + 10); 
        });
    }

});



