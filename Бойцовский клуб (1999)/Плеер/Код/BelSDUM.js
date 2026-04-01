const ICONS = {
  play: '../Картинки/PLAY.png',
  pause: '../Картинки/Pause.png',
  volOn: '../Картинки/SOUND ON.png',
  volOff: '../Картинки/SOUND OFF.png',
  fsEnter: '../Картинки/Union.png',
  fsExit: '../Картинки/Union 2.png'
};

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

// Выбор качества
qualityItems.forEach(item => {
    item.onclick = (e) => {
        e.stopPropagation();
        // Убираем активный класс у всех и даем нажатому
        qualityItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        console.log("Выбрана якасць: " + item.dataset.quality);
        
        // Закрываем меню после выбора
        qualityMenu.classList.add('hide');
    };
});

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
  shareLink.innerText = "Скапіяваны";
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

