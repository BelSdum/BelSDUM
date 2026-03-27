const ICONS = {
  play: '../Картинки/PLAY.png',
  pause: '../Картинки/Pause.png',
  volOn: '../Картинки/SOUND ON.png',
  volOff: '../Картинки/SOUND OFF.png',
  fsEnter: '../Картинки/Union.png',
  fsExit: '../Картинки/Union 2.png'
};

// Ссылки на видео (если файл один - укажи одну ссылку везде)
const videoSources = {
  '1080p': 'https://pub-e265e68b5cd54b969a844c74b92b4fd3.r2.dev/Fight.Club.1999.REPACK.1080p.BluRay.x264.AAC5.1-YTS.MX.mkv.mkv',
  '720p': 'https://pub-e265e68b5cd54b969a844c74b92b4fd3.r2.dev/Fight.Club.1999.REPACK.1080p.BluRay.x264.AAC5.1-YTS.MX.mkv.mkv',
  '480p': 'https://pub-e265e68b5cd54b969a844c74b92b4fd3.r2.dev/Fight.Club.1999.REPACK.1080p.BluRay.x264.AAC5.1-YTS.MX.mkv.mkv'
};

const $ = (id) => document.getElementById(id);
const video = $('video'), 
      audio = $('externalAudio'), 
      player = $('mainPlayer'), 
      controls = $('controlsPanel'),
      loader = $('videoLoader'); // Космический лоадер из HTML

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

let idleTimer, overlayTimer;
const SKIP_LIMIT = 123;
const SKIP_TARGET = 123;
let lastVolume = parseFloat(localStorage.getItem('playerVolume')) || 1;

video.muted = true; 

// --- ФУНКЦИЯ ОТРИСОВКИ ПОЛОСОК (ВИДЕО И ЗВУК РАЗДЕЛЕНЫ) ---
const paint = (el, val, max = 100) => {
  const percent = (val / max) * 100;
  
  if (el.id === 'progress') {
    // Рисуем полоску видео с БУФЕРОМ (серая часть)
    let buffered = 0;
    if (video.buffered.length > 0 && video.duration > 0) {
        buffered = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
    }
    el.style.background = `linear-gradient(to right, 
        #FFFFFF 0%, #FFFFFF ${percent}%, 
        rgba(255, 255, 255, 0.3) ${percent}%, rgba(255, 255, 255, 0.3) ${buffered}%, 
        rgba(255, 255, 255, 0.05) ${buffered}%, rgba(255, 255, 255, 0.05) 100%)`;
  } else {
    // Рисуем полоску звука ОБЫЧНУЮ (без серого буфера)
    el.style.background = `linear-gradient(to right, #FFFFFF ${percent}%, rgba(255, 255, 255, 0.1) ${percent}%)`;
  }
};

const formatTime = (s) => {
  if (isNaN(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

// --- ЛОГИКА ВЫБОРА КАЧЕСТВА ---
qualityItems.forEach(item => {
    item.onclick = (e) => {
        e.stopPropagation();
        const quality = item.dataset.quality;
        const newSrc = videoSources[quality];

        if (newSrc && video.getAttribute('src') !== newSrc) {
            const currentTime = video.currentTime;
            const isPaused = video.paused;

            qualityItems.forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            video.src = newSrc;
            video.currentTime = currentTime; // Сохраняем момент фильма
            
            if (!isPaused) {
                video.play();
                audio.play();
            }
        }
        qualityMenu.classList.add('hide');
    };
});

// Открытие меню
settingsBtn.onclick = (e) => {
    e.stopPropagation();
    qualityMenu.classList.toggle('hide');
};

const togglePlay = () => {
  if (video.paused) { 
    video.play(); audio.play(); 
    playBtn.src = ICONS.pause; 
  } else { 
    video.pause(); audio.pause(); 
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
  if (audio.volume > 0) { lastVolume = audio.volume; audio.volume = 0; }
  else { audio.volume = lastVolume || 1; }
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
              qualityMenu.classList.add('hide');
          }
      }, 2500);
  }
};

// Синхронизация и Лоадер
video.onwaiting = () => { 
    if (loader) loader.classList.remove('hide'); 
    audio.pause(); 
};
video.onplaying = () => { 
    if (loader) loader.classList.add('hide'); 
    if (!video.paused) audio.play(); 
};

video.ontimeupdate = () => {
  const cur = video.currentTime;
  const dur = video.duration;
  progress.value = (cur / dur) * 100 || 0;
  paint(progress, cur, dur);
  curTimeText.innerText = formatTime(cur);
  
  localStorage.setItem('video_time_' + video.src, cur);

  // Жесткая синхронизация звука
  if (Math.abs(audio.currentTime - cur) > 0.25) audio.currentTime = cur;
  if (cur >= SKIP_LIMIT) skipBtn.classList.remove('show');
};

video.onprogress = () => paint(progress, video.currentTime, video.duration);

const initMetadata = () => {
  if (video.duration) {
    durText.innerText = formatTime(video.duration);
    const savedTime = localStorage.getItem('video_time_' + video.src);
    if (savedTime) {
        video.currentTime = parseFloat(savedTime);
        audio.currentTime = parseFloat(savedTime);
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
};

player.onmousemove = showUI;
document.addEventListener('click', () => qualityMenu.classList.add('hide'));

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === ' ' || key === 'k' || key === 'л') { e.preventDefault(); togglePlay(); }
  if (key === 'f' || key === 'а') { toggleFS(); }
  if (key === 'm' || key === 'ь') { toggleMute(); }
});

const shareModal = $('shareModal');
const shareLink = $('shareLink');
shareBtn.onclick = () => { shareModal.classList.add('active'); if (!video.paused) togglePlay(); };
shareModal.onclick = (e) => { if (e.target === shareModal) shareModal.classList.remove('active'); };

if (shareLink) {
    shareLink.onclick = () => {
      navigator.clipboard.writeText(shareLink.innerText);
      shareLink.innerText = "Скапіяваны";
      setTimeout(() => { shareLink.innerText = "https://belsdum.com/watch/fight-club"; }, 2000);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => { document.body.classList.add("loaded"); }, 100);
});

showUI();
