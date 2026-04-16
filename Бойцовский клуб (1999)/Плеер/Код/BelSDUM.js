const ICONS = {
  play: '../Картинки/PLAY.png',
  pause: '../Картинки/Pause.png',
  volOn: '../Картинки/SOUND ON.png',
  volOff: '../Картинки/SOUND OFF.png',
  fsEnter: '../Картинки/Union.png',
  fsExit: '../Картинки/Union 2.png'
};


const preloadImages = (obj) => {
    // Вытаскиваем все пути к картинкам из твоего объекта ICONS
    const urls = Object.values(obj);
    
    // Добавляем сюда пути к логотипу и другим статичным картинкам, 
    // если их нет в объекте ICONS
    urls.push('../Картинки/Logo.png');
    urls.push('../Картинки/SOUND OFF.png');
    urls.push('../Картинки/Pause.png');

    urls.forEach(url => {
        const img = new Image();
        img.src = url;
        // Консоль для проверки (потом можно удалить)
        img.onload = () => console.log(`[Preload] Done: ${url}`);
    });
};

// Запускаем сразу при загрузке скрипта
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
      FSqualityMenu = $('fullscreenBtn')
      qualityItems = document.querySelectorAll('.quality-item');

// Логика открытия/закрытия
settingsBtn.onclick = (e) => {
    e.stopPropagation(); // Чтобы документ не поймал клик
    qualityMenu.classList.toggle('hide');
};



// Закрытие меню при клике в любое другое место плеера или экрана
document.addEventListener('click', () => {
    qualityMenu.classList.add('hide');
});

// Обновите функцию showUI, чтобы меню скрывалось вместе с контроллерами


const shareModal = $('shareModal');
const shareLink = $('shareLink');

let idleTimer, overlayTimer;
const SKIP_LIMIT = 123;
const SKIP_TARGET = 123;
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
  if (video.currentTime < SKIP_LIMIT) skipBtn.classList.add('show');
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

// Синхронизация при ручной перемотке
const syncMedia = () => { audio.currentTime = video.currentTime; };
video.onseeking = syncMedia;
video.onseeked = syncMedia;

video.ontimeupdate = () => {
  const cur = video.currentTime;
  const dur = video.duration;
  
  // Обновление прогресс-бара
  const p = (cur / dur) * 100 || 0;
  progress.value = p;
  paint(progress, p);
  
  // Текст времени
  curTimeText.innerText = formatTime(cur);
  

  localStorage.setItem('video_time_' + video.src, cur);

  // синхронизация аудио
  if (Math.abs(audio.currentTime - cur) > 0.3) {
      audio.currentTime = cur;
  }
  
  if (cur >= SKIP_LIMIT) skipBtn.classList.remove('show');
};

// Инициализация метаданных
const initMetadata = () => {
  if (video.duration) {
    durText.innerText = formatTime(video.duration);
    

    const savedTime = localStorage.getItem('video_time_' + video.src);
    if (savedTime) {
        const time = parseFloat(savedTime);
        video.currentTime = time;
        audio.currentTime = time;
    }
  }
  audio.volume = lastVolume;
  volRange.value = lastVolume;
  updateVolUI();
};

video.onloadedmetadata = initMetadata;
// На случай если браузер уже загрузил видео до выполнения скрипта
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

// Кнопки
playBtn.onclick = togglePlay;
video.onclick = (e) => { if(e.target === video) togglePlay(); };
fsBtn.onclick = toggleFS;
volBtn.onclick = toggleMute;

skipBtn.onclick = () => { 
    const safeTarget = SKIP_TARGET + 0.5; 
    video.currentTime = safeTarget; 
    audio.currentTime = safeTarget;
    skipBtn.classList.remove('show'); 
};
player.onmousemove = showUI;

// Горячие клавиши
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

// Открыть меню
shareBtn.onclick = () => {
  shareModal.classList.add('active');
  if (!video.paused) togglePlay();
};

// Закрыть при клике на задний план
shareModal.onclick = (e) => {
  if (e.target === shareModal) {
      shareModal.classList.remove('active');
  }
};


shareLink.onclick = () => {
  navigator.clipboard.writeText(shareLink.innerText);
  const originalText = shareLink.innerText;
  shareLink.innerText = "✔";
  setTimeout(() => { shareLink.innerText = originalText; }, 2000);
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Плавное появление при загрузке
    setTimeout(() => {
        document.body.classList.add("loaded");
    }, 100);

    // 2. Плавное исчезновение при клике на ссылки
    const links = document.querySelectorAll('a');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            // Игнорируем ссылки, открывающиеся в новом окне, и якоря (#)
            if (this.hostname === window.location.hostname && !this.hash && this.target !== "_blank") {
                e.preventDefault(); // Останавливаем мгновенный переход
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

const loader = $('videoLoader');

// Показываем лоадер при буферизации или перемотке
// Показываем лоадер и ставим аудио на паузу при буферизации или перемотке
video.addEventListener('waiting', () => {
    loader.classList.remove('hide');
    audio.pause(); // Останавливаем звук, пока видео грузится
});
video.addEventListener('seeking', () => {
    loader.classList.remove('hide');
    audio.pause(); // Останавливаем звук при перемотке
});

// Скрываем лоадер и продолжаем звук, когда видео готово к воспроизведению
video.addEventListener('playing', () => {
    loader.classList.add('hide');
    audio.currentTime = video.currentTime; // Финальная синхронизация перед стартом
    audio.play(); // Запускаем звук только вместе с видео
});
video.addEventListener('canplay', () => {
    loader.classList.add('hide');
});

// Дополнительная страховка: если видео встало на паузу по любой причине, аудио тоже должно молчать
video.addEventListener('pause', () => {
    audio.pause();
});

video.ontimeupdate = () => {
  const cur = video.currentTime;
  const dur = video.duration;
  
  // Обновление прогресс-бара
  const p = (cur / dur) * 100 || 0;
  progress.value = p;
  paint(progress, p);
  
  // Текст времени
  curTimeText.innerText = formatTime(cur);
  localStorage.setItem('video_time_' + video.src, cur);

  // Синхронизация аудио
  if (Math.abs(audio.currentTime - cur) > 0.3) {
      audio.currentTime = cur;
  }
  
  // Управление кнопкой пропуска
  if (cur >= SKIP_LIMIT) skipBtn.classList.remove('show');
};

video.addEventListener('play', () => {
  if (overlay.classList.contains('done')) return;
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => {
      overlay.classList.add('visible');
      overlay.classList.add('done');
      setTimeout(() => overlay.classList.remove('visible'), 20000);
  }, 5000);
});

const ambientCanvas = document.getElementById('ambientCanvas');
const ctx = ambientCanvas.getContext('2d', { alpha: false });

function updateAmbientLight() {
    // Если видео на паузе, мы всё равно хотим один раз отрисовать кадр (для старта)
    // Но если оно играет, запускаем цикл анимации
    ctx.drawImage(video, 0, 0, ambientCanvas.width, ambientCanvas.height);
    
    if (!video.paused && !video.ended) {
        requestAnimationFrame(updateAmbientLight);
    }
}

// 1. Настройка размеров и первая отрисовка, когда видео готово
video.addEventListener('loadeddata', () => {
    ambientCanvas.width = 160; 
    ambientCanvas.height = 90;
    updateAmbientLight(); // Рисуем первый кадр сразу
});

// 2. Запуск цикла при нажатии Play
video.addEventListener('play', () => {
    updateAmbientLight();
});

// 3. Чтобы при ручной перемотке (seek) подсветка тоже менялась сразу:
video.addEventListener('seeked', () => {
    updateAmbientLight();
});



const previewContainer = document.getElementById('preview-container');
const previewVideo = document.getElementById('preview-video');
const previewTime = document.getElementById('preview-time');
const progressBar = document.getElementById('progress');
const controlsPanel = document.getElementById('controlsPanel'); // Дадалі панэль кіравання

// Загружаем відэа для прэв'ю
previewVideo.preload = "auto";
previewVideo.src = video.src;

progressBar.addEventListener('mousemove', (e) => {
    previewContainer.style.display = 'flex';
    previewContainer.style.opacity = '1';

    // 1. Бяром геаметрыю прагрэс-бара і самой панэлі
    const barRect = progressBar.getBoundingClientRect();
    const controlsRect = controlsPanel.getBoundingClientRect();

    // 2. Лічым час для відэа (толькі ўнутры прагрэс-бара)
    let xInsideBar = e.clientX - barRect.left;
    let pos = Math.max(0, Math.min(xInsideBar / barRect.width, 1));
    const time = pos * video.duration;

    // 3. Лічым пазіцыю прэв'ю адносна ПАНЭЛІ controlsPanel
    let mouseXInControls = e.clientX - controlsRect.left;
    let previewWidth = previewContainer.offsetWidth;
    
    // Цэнтруем акенца строга над мышкай
    let previewX = mouseXInControls - (previewWidth / 2);

    // 4. ЖОСТКАЕ АБМЕЖАВАННЕ: каб не вылазіла за controlsPanel
    const minX = 0; // Левы край панэлі
    const maxX = controlsRect.width - previewWidth; // Правы край панэлі
    previewX = Math.max(minX, Math.min(previewX, maxX));

    // Ужываем каардынаты
    previewContainer.style.left = `${previewX}px`;

    // 5. Абнаўляем кадр і час
    if (isFinite(time)) {
        previewVideo.currentTime = time;
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        previewTime.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
});

progressBar.addEventListener('mouseleave', () => {
    previewContainer.style.opacity = '0';
    setTimeout(() => {
        if (previewContainer.style.opacity === '0') {
            previewContainer.style.display = 'none';
        }
    }, 150); // Хуткае і плыўнае знікненне
});

// Когда видео начинает искать новый кадр — показываем загрузку
previewVideo.addEventListener('seeking', () => {
    previewContainer.classList.remove('loaded');
});

// Когда кадр успешно загружен — скрываем загрузку
previewVideo.addEventListener('seeked', () => {
    previewContainer.classList.add('loaded');
});

// Добавь это в обработчик mousemove прогресс-бара, 
// чтобы при первом наведении тоже была проверка
progressBar.addEventListener('mousemove', (e) => {
    // ... твой старый код позиционирования ...
    
    // Если кадр уже готов (видео не в состоянии поиска)
    if (previewVideo.readyState >= 3) {
        previewContainer.classList.add('loaded');
    }
});

// Выбор качества
qualityItems.forEach(item => {
    item.onclick = (e) => {
        e.stopPropagation();
        
        const newSrc = item.dataset.src;
        const currentQuality = item.dataset.quality;

        // Если ссылка пустая или это то же самое видео — ничего не делаем
        if (!newSrc || newSrc === video.src) {
            qualityMenu.classList.add('hide');
            return;
        }

        // 1. Запоминаем текущее время и состояние (играло или нет)
        const currentTime = video.currentTime;
        const isPaused = video.paused;

        // 2. Визуальное переключение активного пункта
        qualityItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        // 3. Меняем источник
        video.src = newSrc;
        // previewVideo.src = newSrc; // Если хочешь, чтобы превью тоже обновилось

        // 4. Возвращаем видео на нужный момент после загрузки метаданных
        video.onloadedmetadata = () => {
            video.currentTime = currentTime;
            if (!isPaused) {
                video.play();
                audio.play();
            }
            // Удаляем временный обработчик, чтобы он не срабатывал постоянно
            video.onloadedmetadata = initMetadata; 
        };
        
        // Закрываем меню
        qualityMenu.classList.add('hide');
        showUI();
    };
});
















const movieId = "Байцоўскі клуб";

function saveProgress() {
    if (video.currentTime > 5) {
        const data = JSON.parse(localStorage.getItem('continueWatching') || '{}');
        
        data[movieId] = {
            time: video.currentTime,
            duration: video.duration,
            // Сохраняем полный путь к текущей странице плеера
            path: window.location.href 
        };
        
        localStorage.setItem('continueWatching', JSON.stringify(data));
    }
}

// Сохраняем при каждом обновлении времени
video.addEventListener('timeupdate', saveProgress);
