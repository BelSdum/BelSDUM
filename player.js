
const ICONS = {
  play: 'icon/PLAY.png',
  pause: 'icon/Pause.png',
  volOn: 'icon/SOUND ON.png',
  volOff: 'icon/SOUND OFF.png',
  fsEnter: 'icon/Union.png',
  fsExit: 'icon/Union 2.png'
};


const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const movie = movieDB[movieId];

const preloadImages = (obj) => {

    const urls = Object.values(obj);
    

    urls.push('icon/Logo.png');
    urls.push('icon/SOUND OFF.png');
    urls.push('icon/Pause.png');

    urls.forEach(url => {
        const img = new Image();
        img.src = url;

        img.onload = () => console.log(`[Preload] Done: ${url}`);
    });
};


preloadImages(ICONS);

const $ = (id) => document.getElementById(id);
const video = $('video'), 
      audio = $('externalAudio'), 
      player = $('mainPlayer'), 
      controls = $('controlsPanel');
const header = $('videoHeader'), 
      playBtn = $('playBtn'), 
      volBtn = $('volumeBtn'), 
      volRange = $('volumeRange');
const progress = $('progress'), 
      curTimeText = $('currentTime'), 
      durText = $('duration'), 
      fsBtn = $('fullscreenBtn');
const overlay = $('overlayImage'), 
      skipBtn = $('skipBtn'), 
      shareBtn = $('shareBtn');
const settingsBtn = $('settingsBtn'),
      qualityMenu = $('qualityMenu'),
      FSqualityMenu = $('fullscreenBtn'),
      qualityItems = document.querySelectorAll('.quality-item');

let currentSkipTime = 0;


// Проверяем, что фильм нашелся, и наполняем плеер данными
if (movie) {
    // 1. Устанавливаем видео и аудио
    if (video) video.src = movie.videoSrc;
    if (audio) audio.src = movie.audioSrc;

    currentSkipTime = movie.skipTime || 0; 

    // 3. Текстовые заголовки
    const mainTitle = document.querySelector('.main-title');
    const subTitle = document.querySelector('.sub-title');
    if (mainTitle) mainTitle.innerText = movie.title;
    if (subTitle) subTitle.innerText = `${movie.titleOriginal} • ${movie.year}`;

    // 4. Подставляем ссылки в меню качества из базы данных
    // Инициализация ссылок для качества (добавь это перед qualityItems.forEach)
    qualityItems.forEach(item => {
    const q = item.dataset.quality; 
    if (movie.quality && movie.quality[q]) {
        item.dataset.src = movie.quality[q];
    }
    });

// Единый рабочий обработчик
    qualityItems.forEach(item => {
    item.onclick = (e) => {
        e.stopPropagation();
        
        const newSrc = item.dataset.src;
        
        // Если ссылки нет или это текущее качество
        if (!newSrc || newSrc === video.src) {
            qualityMenu.classList.add('hide');
            return;
        }

        const currentTime = video.currentTime;
        const isPaused = video.paused;

        // Обновляем UI
        qualityItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        // Меняем источник
        video.src = newSrc;

        // Используем addEventListener, чтобы не ломать логику
        const handleMetaLoad = () => {
            video.currentTime = currentTime;
            if (!isPaused) {
                video.play().catch(e => console.log("Ошибка воспроизведения:", e));
                if (audio) {
                    audio.currentTime = currentTime;
                    audio.play().catch(e => console.log("Ошибка аудио:", e));
                }
            }
            if (typeof initMetadata === 'function') initMetadata();
        };

        // Удаляем старый слушатель, если вдруг он остался от прошлых попыток
        video.removeEventListener('loadedmetadata', handleMetaLoad);
        video.addEventListener('loadedmetadata', handleMetaLoad, { once: true });
        
        qualityMenu.classList.add('hide');
        showUI();
    };
    });


    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.href = `release.html?id=${movieId}`;
    
    console.log("Данные загружены. Пропуск на:", currentSkipTime);
} else {
    console.error("Фильм не найден!");
}


// Функция-обработчик для восстановления
const restoreTime = () => {
    const savedTime = localStorage.getItem('video_pos_' + movieId);
    
    if (savedTime) {
        const time = parseFloat(savedTime);
        // Проверяем, что видео реально готово и время адекватное
        if (time > 0 && time < video.duration) {
            video.currentTime = time;
            if (audio) audio.currentTime = time;
            console.log("Позиция восстановлена на: " + time);
        }
    }

    video.removeEventListener('loadedmetadata', restoreTime);
};

// Добавляем слушатель
video.addEventListener('loadedmetadata', restoreTime);



settingsBtn.onclick = (e) => {
    e.stopPropagation();
    qualityMenu.classList.toggle('hide');
};




document.addEventListener('click', () => {
    qualityMenu.classList.add('hide');
});




const shareModal = $('shareModal');
const shareLink = $('shareLink');

let idleTimer, overlayTimer;
let lastVolume = parseFloat(localStorage.getItem('playerVolume')) || 1;

video.muted = true; 

const paint = (el, val, max = 100) => {
  const p = (val / max) * 100;
  el.style.background = `linear-gradient(to right, #D9D9D9 ${p}%, rgba(255,255,255,0.1) ${p}%)`;
};

const formatTime = (s) => {
  if (isNaN(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
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

const updateVolUI = () => {
  paint(volRange, audio.volume, 1);
  volBtn.src = audio.volume == 0 ? ICONS.volOff : ICONS.volOn;
  localStorage.setItem('playerVolume', audio.volume);
};

const showUI = () => {
  controls.classList.remove('hide');
  header.classList.remove('hide');
  // Используем динамический currentSkipTime
  if (video.currentTime < currentSkipTime) skipBtn.classList.add('show');
  player.style.cursor = 'default';
  
  clearTimeout(idleTimer);
  if (!video.paused) {
      idleTimer = setTimeout(() => {
          if (!controls.matches(':hover') && !skipBtn.matches(':hover')) {
              controls.classList.add('hide');
              header.classList.add('hide');
              qualityMenu.classList.add('hide');
              skipBtn.classList.remove('show');
              player.style.cursor = 'none';
          }
      }, 2500);
  }
};


const syncMedia = () => { audio.currentTime = video.currentTime; };
video.onseeking = syncMedia;
video.onseeked = syncMedia;


const initMetadata = () => {
  if (video.duration) {
    durText.innerText = formatTime(video.duration);
  }
  audio.volume = lastVolume;
  volRange.value = lastVolume;
  updateVolUI();
};

// Восстановление позиции при загрузке метаданных
video.addEventListener('loadedmetadata', () => {
    const savedTime = localStorage.getItem('video_pos_' + movieId);
    
    if (savedTime) {
        const time = parseFloat(savedTime);
        // Если время адекватное (не в самом конце)
        if (time > 0 && time < video.duration - 5) {
            video.currentTime = time;
            if (audio) audio.currentTime = time;
            console.log("Восстановлена позиция:", time);
        }
    }
    initMetadata(); 
});

if (video.readyState >= 1) initMetadata();

progress.oninput = () => {
  const time = (progress.value / 100) * video.duration;
  video.currentTime = time;
  audio.currentTime = time;
  paint(progress, progress.value);
};

volRange.oninput = () => {
  audio.volume = volRange.value;
  if (audio.volume > 0) lastVolume = audio.volume;
  updateVolUI();
};


playBtn.onclick = togglePlay;
video.onclick = (e) => { if(e.target === video) togglePlay(); };
fsBtn.onclick = toggleFS;
volBtn.onclick = toggleMute;

skipBtn.onclick = () => { 
    video.currentTime = currentSkipTime + 0.5; 
    audio.currentTime = currentSkipTime + 0.5;
    skipBtn.classList.remove('show'); 
};
player.onmousemove = showUI;


document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === ' ' || key === 'k' || key === 'л') { 
    e.preventDefault(); 
    togglePlay(); 
  }
  if (key === 'f' || key === 'а') { toggleFS(); }
  if (key === 'm' || key === 'ь') { toggleMute(); }
  if (key === 'arrowright') { video.currentTime += 10; showUI(); }
  if (key === 'arrowleft') { video.currentTime -= 10; showUI(); }
});


shareBtn.onclick = () => {
  shareModal.classList.add('active');
  if (!video.paused) togglePlay();
};


shareModal.onclick = (e) => {
  if (e.target === shareModal) {
      shareModal.classList.remove('active');
  }
};


shareLink.onclick = () => {
  navigator.clipboard.writeText(shareLink.innerText);
  const originalText = shareLink.innerText;
  shareLink.innerText = "Скапіяваны";
  setTimeout(() => { shareLink.innerText = originalText; }, 2000);
};

video.addEventListener('play', () => {
    updateAmbientLight();
});

document.addEventListener("DOMContentLoaded", () => {

    setTimeout(() => {
        document.body.classList.add("loaded");
    }, 100);
    const shareLink = document.getElementById('shareLink');
    if (shareLink) {
    shareLink.innerText = window.location.href; // Берет текущую ссылку из адресной строки
    }

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

const loader = $('videoLoader');


video.addEventListener('waiting', () => {
    loader.classList.remove('hide');
    audio.pause();
});
video.addEventListener('seeking', () => {
    loader.classList.remove('hide');
    audio.pause();
});


video.addEventListener('playing', () => {
    loader.classList.add('hide');
    audio.currentTime = video.currentTime;
    audio.play();
});
video.addEventListener('canplay', () => {
    loader.classList.add('hide');
});


video.addEventListener('pause', () => {
    audio.pause();
});



const ambientCanvas = document.getElementById('ambientCanvas');
const ctx = ambientCanvas.getContext('2d', { alpha: false });

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


video.addEventListener('seeked', () => {
    updateAmbientLight();
});



const previewContainer = document.getElementById('preview-container');
const previewVideo = document.getElementById('preview-video');
const progressBar = document.getElementById('progress');
const controlsPanel = document.getElementById('controlsPanel');


previewVideo.preload = "auto";
previewVideo.src = video.src;

progressBar.addEventListener('mousemove', (e) => {
    previewContainer.style.display = 'flex';
    previewContainer.style.opacity = '1';


    const barRect = progressBar.getBoundingClientRect();
    const controlsRect = controlsPanel.getBoundingClientRect();


    let xInsideBar = e.clientX - barRect.left;
    let pos = Math.max(0, Math.min(xInsideBar / barRect.width, 1));
    const time = pos * video.duration;


    let mouseXInControls = e.clientX - controlsRect.left;
    let previewWidth = previewContainer.offsetWidth;
    

    let previewX = mouseXInControls - (previewWidth / 2);


    const minX = 0; 
    const maxX = controlsRect.width - previewWidth; 
    previewX = Math.max(minX, Math.min(previewX, maxX));


    previewContainer.style.left = `${previewX}px`;


    if (isFinite(time)) {
        previewVideo.currentTime = time;
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
    }
});

progressBar.addEventListener('mouseleave', () => {
    previewContainer.style.opacity = '0';
    setTimeout(() => {
        if (previewContainer.style.opacity === '0') {
            previewContainer.style.display = 'none';
        }
    }, 150);
});

previewVideo.addEventListener('seeking', () => {
    previewContainer.classList.remove('loaded');
});


previewVideo.addEventListener('seeked', () => {
    previewContainer.classList.add('loaded');
});


progressBar.addEventListener('mousemove', (e) => {

    if (previewVideo.readyState >= 3) {
        previewContainer.classList.add('loaded');
    }
});








let lastSaveTime = 0;

video.addEventListener('timeupdate', () => {
    const cur = video.currentTime;
    const dur = video.duration || 0;
    
    // 1. Обновление прогресс-бара и UI
    const p = (cur / dur) * 100 || 0;
    progress.value = p;
    paint(progress, p);
    curTimeText.innerText = formatTime(cur);

    // 2. Сохраняем базовую позицию для восстановления плеера
    if (movieId && cur > 2) { 
        localStorage.setItem('video_pos_' + movieId, cur);
    }

    // 3. НОВОЕ: Сохраняем прогресс для главной страницы раз в 2 секунды
    if (cur - lastSaveTime > 2 || cur < lastSaveTime) {
        saveProgress();
        lastSaveTime = cur;
    }

    // 4. Синхронизация аудио
    if (Math.abs(audio.currentTime - cur) > 0.5) {
        audio.currentTime = cur;
    }

    // 5. Кнопка пропуска
    if (cur >= currentSkipTime) {
        skipBtn.classList.remove('show');
    } else {
        if (!controls.classList.contains('hide')) skipBtn.classList.add('show');
    }
    
});

video.addEventListener('pause', saveProgress);
window.addEventListener('beforeunload', saveProgress);

const restorePlayback = () => {
    const savedTime = localStorage.getItem('video_pos_' + movieId);
    if (savedTime) {
        const time = parseFloat(savedTime);
        if (time > 1 && time < video.duration - 5) {
            video.currentTime = time;
            if (audio) audio.currentTime = time;
            console.log("Позиция восстановлена:", time);
        }
    }
    initMetadata();
};

// Используем 'once: true', чтобы обработчик сработал только один раз при загрузке
video.addEventListener('canplay', restorePlayback, { once: true });





function saveProgress() {
    // 1. Быстрая проверка, чтобы не выполнять лишний код
    if (!movieId || video.currentTime <= 5) return;

    // 2. Проверка, что длительность видео загрузилась (не 0 и не NaN)
    if (!video.duration || video.duration === 0) return;

    // 3. Получаем данные
    const data = JSON.parse(localStorage.getItem('continueWatching') || '{}');
    
    // 4. Обновляем объект
    data[movieId] = {
        time: video.currentTime,
        duration: video.duration
        // Поле "path" можно удалить, так как мы теперь строим ссылку динамически в renderContinueWatching
    };
    
    // 5. Сохраняем
    localStorage.setItem('continueWatching', JSON.stringify(data));
}

document.getElementById('page-title').innerText = `BelSDUM | ${movie.title}`;


