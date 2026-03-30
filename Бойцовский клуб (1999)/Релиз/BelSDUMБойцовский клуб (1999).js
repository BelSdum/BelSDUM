const container = document.getElementById('trailerBox');
const video = document.getElementById('previewVideo');
const overlayText = container.querySelector('.play-overlay');
const posterContainer = document.querySelector('.poster-container');
const posterImg = posterContainer.querySelector('img');

// 3D эффект только для изображения
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

