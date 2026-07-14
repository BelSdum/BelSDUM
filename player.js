/* =========================================
   1. КАНСТАНТЫ І СТАН ПЛЭЕРА
========================================= */
const ICONS = {
    play: 'icon/PLAY.png', pause: 'icon/Pause.png', pip: 'icon/Pip.png',
    volOn: 'icon/SOUND ON.png', volOff: 'icon/SOUND OFF.png',
    fsEnter: 'icon/Union.png', fsExit: 'icon/Union 2.png'
};

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const movie = typeof movieDB !== 'undefined' ? movieDB[movieId] : null;

let currentTrack = null;
let currentSkipTime = 0;
let idleTimer;
let lastVolume = parseFloat(localStorage.getItem('playerVolume')) || 1;
let lastSaveTime = 0;

/* =========================================
   2. DOM-ЭЛЕМЕНТЫ
========================================= */
const $ = (id) => document.getElementById(id);

// Асноўныя элементы
const video = $('video'), audio = $('externalAudio'), player = $('mainPlayer');
const controls = $('controlsPanel'), header = $('videoHeader'), loader = $('videoLoader');
const qualityMenu = $('qualityMenu'), qualityItems = document.querySelectorAll('.quality-item');

// Кнопкі кіравання
const playBtn = $('playBtn'), pipBtn = $('pipBtn'), fsBtn = $('fullscreenBtn'), settingsBtn = $('settingsBtn');
const volBtn = $('volumeBtn'), volRange = $('volumeRange');
const progress = $('progress'), curTimeText = $('currentTime'), durText = $('duration');
const skipBtn = $('skipBtn'), backBtn = $('backBtn');

// Музыка і эфекты
const ambientCanvas = $('ambientCanvas'), ctx = ambientCanvas.getContext('2d', { alpha: false });
const previewContainer = $('preview-container'), previewVideo = $('preview-video');
const musicBanner = $('musicBanner'), musicModal = $('musicModal');

// Акно "Падзяліцца"
const shareBtn = $('shareBtn'), shareModal = $('shareModal');
const shareInputLink = $('shareInputLink'), copyLinkBtn = $('copyLinkBtn'), copyBtnText = $('copyBtnText');
const shareTG = $('shareTG');

/* =========================================
   3. ІНІЦЫЯЛІЗАЦЫЯ ДАДЗЕНЫХ
========================================= */
const preloadImages = (obj) => {
    Object.values(obj).forEach(url => {
        const img = new Image();
        img.src = url;
    });
};

if (movie) {
    document.getElementById('page-title').innerText = `BelSDUM | ${movie.title}`;
    if (backBtn) backBtn.href = `release.html?id=${movieId}`;
    
    // Устаноўка відэа і аўдыё
    video.src = movie.videoSrc;
    audio.src = movie.audioSrc;
    currentSkipTime = movie.skipTime || 0;

    // Тэксты
    const mainTitle = document.querySelector('.main-title');
    const subTitle = document.querySelector('.sub-title');
    if (mainTitle) mainTitle.innerText = movie.title;
    if (subTitle) subTitle.innerText = `${movie.titleOriginal} • ${movie.year}`;

    // Налада меню якасці
    qualityItems.forEach(item => {
        const q = item.dataset.quality;
        if (movie.quality && movie.quality[q]) {
            item.dataset.src = movie.quality[q];
        }

        item.onclick = (e) => {
            e.stopPropagation();
            const newSrc = item.dataset.src;
            
            if (!newSrc || newSrc === video.src) {
                qualityMenu.classList.add('hide');
                return;
            }

            const currentTime = video.currentTime;
            const isPaused = video.paused;

            qualityItems.forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            video.src = newSrc;

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

    preloadImages(ICONS);
} else {
    console.error("Фільм не знойдзены ў базе!");
}

/* =========================================
   4. БАЗАВЫЯ ФУНКЦЫІ ПЛЭЕРА
========================================= */
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
    const p = (val / max) * 100;
    el.style.background = `linear-gradient(to right, #D9D9D9 ${p}%, rgba(255,255,255,0.1) ${p}%)`;
};

const togglePlay = () => {
    if (video.paused) {
        video.play();
        audio.play();
        playBtn.src = ICONS.pause;
    } else {
        video.pause();
        audio.pause();
        playBtn.src = ICONS.play;
    }
    showUI();
};

const toggleFS = () => {
    if (!document.fullscreenElement) {
        player.requestFullscreen().catch(e => console.log(e));
        fsBtn.src = ICONS.fsExit;
    } else {
        document.exitFullscreen();
        fsBtn.src = ICONS.fsEnter;
    }
};

const updateVolUI = () => {
    const isMuted = audio.volume == 0;
    volBtn.style.opacity = isMuted ? '0.3' : '1';
    volBtn.src = isMuted ? ICONS.volOff : ICONS.volOn;
    
    const val = audio.volume * 100;
    const activeColor = isMuted ? 'rgba(255, 255, 255, 0.3)' : '#ffffff';
    volRange.style.background = `linear-gradient(to right, ${activeColor} ${val}%, rgba(255, 255, 255, 0.2) ${val}%)`;
    localStorage.setItem('playerVolume', audio.volume);
};

const toggleMute = () => {
    if (audio.volume > 0) {
        lastVolume = audio.volume;
        audio.volume = 0;
    } else {
        audio.volume = lastVolume || 1;
    }
    volRange.value = audio.volume;
    updateVolUI();
};

const isUIHidden = () => controls.classList.contains('hide');

const showUI = () => {
    controls.classList.remove('hide');
    header.classList.remove('hide');
    if (video.currentTime < currentSkipTime) skipBtn.classList.add('show');
    player.style.cursor = 'default';
    
    clearTimeout(idleTimer);
    if (!video.paused) {
        idleTimer = setTimeout(() => {
            if (!controls.matches(':hover') && !skipBtn.matches(':hover') && qualityMenu.classList.contains('hide')) {
                controls.classList.add('hide');
                header.classList.add('hide');
                skipBtn.classList.remove('show');
                player.style.cursor = 'none';
            }
        }, 2500);
    }
};

/* =========================================
   5. ЗАХАВАННЕ І АДНАЎЛЕННЕ ЧАСУ
========================================= */
const saveProgress = () => {
    if (!movieId || video.currentTime <= 5 || !video.duration) return;
    const data = JSON.parse(localStorage.getItem('continueWatching') || '{}');
    data[movieId] = { time: video.currentTime, duration: video.duration };
    localStorage.setItem('continueWatching', JSON.stringify(data));
};

video.addEventListener('loadedmetadata', () => {
    // 1. Логика плашки 18+ (вынесена отдельно для чистоты)
    const checkAgeWarning = () => {
        // Ждем, пока объект movie появится в глобальной области видимости
        const interval = setInterval(() => {
            if (typeof movie !== 'undefined' && movie) {
                clearInterval(interval);
                
                // Слушатель Play
                video.addEventListener('play', () => {
                    // Увеличили порог до 3 секунд, чтобы плашка точно успела появиться
                    if (movie.rating === "18+") {
                        const warningOverlay = document.getElementById('overlayImage');
                        if (warningOverlay) {
                            console.log("Плашка 18+ активирована");
                            warningOverlay.classList.add('visible');
                            
                            setTimeout(() => {
                                warningOverlay.classList.remove('visible');
                            }, 15000);
                        }
                    }
                }, { once: true });
            }
        }, 500); 
    };

    checkAgeWarning();

    // 2. Восстановление времени
    const savedTime = localStorage.getItem('video_pos_' + movieId);
    if (savedTime) {
        const time = parseFloat(savedTime);
        if (time > 0 && time < video.duration - 5) {
            video.currentTime = time;
            // Если есть отдельный аудио-плеер, синхронизируем его
            if (typeof audio !== 'undefined') audio.currentTime = time;
        }
    }

    durText.innerText = formatTime(video.duration);
    if (typeof audio !== 'undefined') {
        audio.volume = lastVolume;
        volRange.value = lastVolume;
        updateVolUI();
    }
}, { once: true });

/* =========================================
   6. ПАДЗЕІ ВІДЭА
========================================= */
video.addEventListener('timeupdate', () => {
    const cur = video.currentTime;
    const dur = video.duration || 0;
    const p = (cur / dur) * 100 || 0;

    progress.value = p;
    curTimeText.innerText = formatTime(cur);
    paintProgress(progress, p);

    // Захаванне пазіцыі
    if (movieId && cur > 2) localStorage.setItem('video_pos_' + movieId, cur);
    if (cur - lastSaveTime > 2 || cur < lastSaveTime) {
        saveProgress();
        lastSaveTime = cur;
    }

    // Сінхранізацыя аўдыё
    if (Math.abs(audio.currentTime - cur) > 0.5) audio.currentTime = cur;

    // Кнопка прапусціць
    if (cur >= currentSkipTime) skipBtn.classList.remove('show');
    else if (!isUIHidden()) skipBtn.classList.add('show');
});

video.addEventListener('seeking', () => { loader.classList.remove('hide'); audio.pause(); });
video.addEventListener('waiting', () => { loader.classList.remove('hide'); audio.pause(); });
video.addEventListener('playing', () => { loader.classList.add('hide'); audio.currentTime = video.currentTime; audio.play(); });
video.addEventListener('canplay', () => loader.classList.add('hide'));
video.addEventListener('pause', () => { audio.pause(); saveProgress(); });
window.addEventListener('beforeunload', saveProgress);

/* =========================================
   7. КЛІКІ І КІРАВАННЕ
========================================= */
playBtn.onclick = togglePlay;
video.onclick = (e) => { if(e.target === video) togglePlay(); };
fsBtn.onclick = toggleFS;
volBtn.onclick = toggleMute;
player.onmousemove = showUI;

settingsBtn.onclick = (e) => {
    e.stopPropagation();
    qualityMenu.classList.toggle('hide');
};
document.addEventListener('click', () => qualityMenu.classList.add('hide'));

skipBtn.onclick = () => { 
    video.currentTime = currentSkipTime + 0.5; 
    audio.currentTime = currentSkipTime + 0.5;
    skipBtn.classList.remove('show'); 
};

progress.oninput = () => {
    const time = (progress.value / 100) * video.duration;
    video.currentTime = time;
    audio.currentTime = time;
    paintProgress(progress, progress.value);
};

volRange.oninput = () => {
    audio.volume = volRange.value;
    if (audio.volume > 0) lastVolume = audio.volume;
    updateVolUI();
};

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if ([' ', 'k', 'л'].includes(key)) { e.preventDefault(); togglePlay(); }
    if (['f', 'а'].includes(key)) toggleFS();
    if (['m', 'ь'].includes(key)) toggleMute();
    if (key === 'arrowright') { video.currentTime += 10; showUI(); }
    if (key === 'arrowleft') { video.currentTime -= 10; showUI(); }
});

if (document.pictureInPictureEnabled) {
    pipBtn.onclick = async () => {
        try {
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
            else await video.requestPictureInPicture();
        } catch (error) { console.error("Памылка PiP:", error); }
    };
} else {
    pipBtn.style.display = 'none';
}

/* =========================================
   8. АКНО "ПАДЗЯЛІЦЦА" (ВЫПРАЎЛЕНА)
========================================= */
if (shareBtn && shareModal) {
    shareBtn.onclick = () => {
        const currentUrl = window.location.href;
        shareInputLink.value = currentUrl;
        
        if (shareTG) {
            shareTG.href = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}`;
        }
        shareModal.classList.add('active');
    };

    shareModal.onclick = (e) => {
        if (e.target === shareModal) shareModal.classList.remove('active');
    };

    if (copyLinkBtn) {
        copyLinkBtn.onclick = () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                copyBtnText.innerText = "Скапіявана";
                setTimeout(() => { copyBtnText.innerText = "Капіяваць"; }, 3000);
            });
        };
    }
}

/* =========================================
   9. AMBIENT LIGHT (ФОН) І ПРЭВ'Ю
========================================= */
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

previewVideo.preload = "auto";
previewVideo.src = video.src;

progressBar = document.getElementById('progress');
progressBar.addEventListener('mousemove', (e) => {
    previewContainer.style.display = 'flex';
    previewContainer.style.opacity = '1';

    const barRect = progressBar.getBoundingClientRect();
    const controlsRect = controlsPanel.getBoundingClientRect();
    
    let xInsideBar = e.clientX - barRect.left;
    let pos = Math.max(0, Math.min(xInsideBar / barRect.width, 1));
    const time = pos * video.duration;

    let previewX = (e.clientX - controlsRect.left) - (previewContainer.offsetWidth / 2);
    previewX = Math.max(0, Math.min(previewX, controlsRect.width - previewContainer.offsetWidth));
    previewContainer.style.left = `${previewX}px`;

    if (isFinite(time)) previewVideo.currentTime = time;
});

progressBar.addEventListener('mouseleave', () => {
    previewContainer.style.opacity = '0';
    setTimeout(() => { if (previewContainer.style.opacity === '0') previewContainer.style.display = 'none'; }, 150);
});

/* =========================================
   10. САЎНДТРЭКІ (MUSIC BANNER)
========================================= */
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
            $('bannerTrackCover').src = track.cover;
            
            musicBanner.classList.remove('hide');
            if (!isUIHidden()) {
                musicBanner.style.opacity = '1';
                musicBanner.style.transform = 'translateX(-50%) translateY(0)';
                musicBanner.style.pointerEvents = 'auto';
            }
        }
    } else if (currentTrack !== null) {
        currentTrack = null; 
        musicBanner.style.opacity = '0';
        musicBanner.style.transform = 'translateX(-50%) translateY(-20px)';
        musicBanner.style.pointerEvents = 'none';
    }
};

video.addEventListener('timeupdate', checkTrack);
video.addEventListener('seeking', checkTrack);

const uiObserver = new MutationObserver(() => {
    if (isUIHidden()) {
        musicBanner.style.opacity = '0';
        musicBanner.style.pointerEvents = 'none';
    } else if (currentTrack) {
        musicBanner.style.opacity = '1';
        musicBanner.style.transform = 'translateX(-50%) translateY(0)';
        musicBanner.style.pointerEvents = 'auto';
    }
});
if (controls) uiObserver.observe(controls, { attributes: true, attributeFilter: ['class'] });

musicBanner.onclick = () => {


    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
            console.log(`Памылка пры выхадзе з поўнага экрана: ${err.message}`);
        });
    

    // Далей ідзе твой звычайны код закрыцця модалкі
    musicModal.classList.remove('visible');
    };
    if (currentTrack) {
        $('modalTrackCover').src = currentTrack.cover;
        $('modalTrackTitle').innerText = currentTrack.title;
        $('modalTrackArtist').innerText = currentTrack.artist;
        $('modalTrackLink').href = currentTrack.url;
        musicModal.classList.add('active');
        if (!video.paused) togglePlay();
    }
};



musicModal.onclick = (e) => { if (e.target === musicModal) musicModal.classList.remove('active'); };

/* =========================================
   11. АНІМАЦЫЯ ПЕРАХОДАЎ СТАРОНАК
========================================= */
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