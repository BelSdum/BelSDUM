const shareBtn = document.getElementById('shareBtn');
const shareModal = document.getElementById('shareModal');
const shareLink = document.getElementById('shareLink');
const container = document.getElementById('trailerBox');
const video = document.getElementById('previewVideo');
const overlayText = container.querySelector('.play-overlay');
const posterContainer = document.querySelector('.poster-container');
const posterImg = posterContainer.querySelector('img');

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




container.onclick = () => {
    if (video.muted) {
        
        video.muted = false;
        video.volume = 0.5; 
        overlayText.innerText = "Націсніце, каб выключыць гук"; 
    } else {
        
        video.muted = true;
        overlayText.innerText = "Націсніце, каб уключыць гук"; 
    }
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


video.addEventListener('loadeddata', () => {
    ambientCanvas.width = 160; 
    ambientCanvas.height = 90;
    updateAmbientLight(); 
});


video.addEventListener('play', () => {
    updateAmbientLight();
});


video.addEventListener('seeked', () => {
    updateAmbientLight();
});



shareBtn.onclick = () => {
    shareModal.classList.add('active');
};

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
