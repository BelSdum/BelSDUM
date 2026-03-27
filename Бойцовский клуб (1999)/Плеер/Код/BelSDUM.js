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
      qualityItems = document.querySelectorAll('.quality-item');

// --- НОВЫЙ ЭЛЕМЕНТ (Loader) ---
const loader = $('videoLoader');


// (СТАРЫЙ КОД НЕ ТРОГАЕМ) Логика открытия/закрытия меню
if (settingsBtn) {
  settingsBtn.onclick = (e) => {
      e.stopPropagation();
      qualityMenu.classList.toggle('hide');
  };
}

// (СТАРЫЙ КОД НЕ ТРОГАЕМ) Выбор качества
qualityItems.forEach(item => {
    item.onclick = (e) => {
        e.stopPropagation();
        qualityItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        console.log("Выбрана якасць: " + item.dataset.quality);
        qualityMenu.classList.add('hide');
    };
});

document.addEventListener('click', () => {
    qualityMenu.classList.add('hide');
});


const shareModal = $('shareModal');
const shareLink = $('shareLink');

let idleTimer, overlayTimer;
const SKIP_LIMIT = 123;
const SKIP_TARGET = 123;
let lastVolume = parseFloat(localStorage.getItem('playerVolume')) || 1;

video.muted = true; 

// Вот эта часть управляет лоадером и остановкой звука
video.onwaiting = () => {
    loader.classList.remove('hide'); // Показать черную дыру
    audio.pause();                   // Остановить звук, чтобы не убежал вперед
};

video.onplaying = () => {
    loader.classList.add('hide');    // Скрыть лоадер
    if (!video.paused) audio.play(); // Запустить звук одновременно с видео
};

// А это новая логика отрисовки полоски с буфером
const paint = (el, val, max = 100) => {
  const played = (val / max) * 100;
  let buffered = 0;
  if (video.buffered.length > 0) {
      // Берем конечную точку последнего загруженного сегмента
      buffered = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
  }
  // Рисуем многослойный фон
  el.style.background = `linear-gradient(to right, #FFF ${played}%, rgba(255,255,255,0.3) ${played}%, rgba(255,255,255,0.3) ${buffered}%, rgba(255,255,255,0.05) ${buffered}%)`;
};

  // Создаем сложный градиент: Белый (проиграно) -> Серый (загружено) -> Прозрачный (не загружено)
  el.style.background = `linear-gradient(to right, 
      #D9D9D9 0%, #D9D9D9 ${pPlayed}%, 
      rgba(255,255,255,0.3) ${pPlayed}%, rgba(255,255,255,0.3) ${pBuffered}%, 
      rgba(255,255,255,0.1) ${pBuffered}%, rgba(255,255,255,0.1) 100%)`;
};

const formatTime = (s) => {
  if (isNaN(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};


const togglePlay = () => {
  if (video.paused) { 
    video.play().catch(e => console.log("R2 Load Error:", e)); // Добавили отлов ошибки R2
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
              skipBtn.classList.remove('show');
              player.style.cursor = 'none';
              qualityMenu.classList.add('hide'); // Добавили скрытие меню качества
          }
      }, 2500);
  }
};

// --- НОВЫЕ ОБРАБОТЧИКИ ДЛЯ ЛОАДЕРА И СИНХРОНИЗАЦИИ (ДОБАВЛЕНО) ---

// 1. Видео ждет загрузки (showing loader)
video.onwaiting = () => {
    loader.classList.remove('hide');
    audio.pause(); // Звук ждет видео
};

// 2. Видео готово играть (hiding loader)
video.oncanplay = () => {
    loader.classList.add('hide');
    if (!video.paused) audio.play(); // Звук догоняет
};

// 3. Видео играет (на всякий случай скрываем лоадер)
video.onplaying = () => {
    loader.classList.add('hide');
};

// 4. Отслеживаем прогресс буферизации (для полоски)
video.onprogress = () => {
    paint(progress, video.currentTime, video.duration);
};


// (СТАРЫЙ КОД НЕ ТРОГАЕМ) Предупреждение
video.addEventListener('play', () => {
  if (overlay.classList.contains('done')) return;
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => {
      overlay.classList.add('visible');
      overlay.classList.add('done');
      setTimeout(() => overlay.classList.remove('visible'), 20000);
  }, 5000);
});

// Синхронизация при ручной перемотке
const syncMedia = () => { 
    audio.currentTime = video.currentTime;
    // При перемотке показываем лоадер, пока R2 не отдаст новый кусок
    if (!video.paused) loader.classList.remove('hide'); 
};
video.onseeking = syncMedia;
video.onseeked = syncMedia;

video.ontimeupdate = () => {
  const cur = video.currentTime;
  const dur = video.duration;
  
  const p = (cur / dur) * 100 || 0;
  progress.value = p;
  paint(progress, cur, dur); // Обновленный paint покажет и буфер
  
  curTimeText.innerText = formatTime(cur);
  
  localStorage.setItem('video_time_' + video.src, cur);

  // умная синхронизация аудио (только если видео не висит на загрузке)
  if (Math.abs(audio.currentTime - cur) > 0.3 && !loader.classList.contains('visible')) {
      audio.currentTime = cur;
  }
  
  if (cur >= SKIP_LIMIT) skipBtn.classList.remove('show');
};

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
if (video.readyState >= 1) initMetadata();

progress.oninput = () => {
  const time = (progress.value / 100) * video.duration;
  video.currentTime = time;
  audio.currentTime = time;
  paint(progress, time, video.duration);
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
    video.currentTime = SKIP_TARGET; 
    audio.currentTime = SKIP_TARGET;
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
  if (key === 'arrowright') { video.currentTime += 5; showUI(); }
  if (key === 'arrowleft') { video.currentTime -= 5; showUI(); }
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

if (shareLink) {
    shareLink.onclick = () => {
      navigator.clipboard.writeText(shareLink.innerText);
      const originalText = shareLink.innerText;
      shareLink.innerText = "Скапіяваны";
      setTimeout(() => { shareLink.innerText = originalText; }, 2000);
    };
}

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

showUI();
