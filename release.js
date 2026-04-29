document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');


    const movie = movieDB[movieId];


    if (!movie) {
        window.location.href = "index.html";
        return;
    }


    document.getElementById('page-title').innerText = `BelSDUM | ${movie.title}`;
    document.getElementById('rel-poster').src = movie.posterRelease;
    document.getElementById('rel-title').innerHTML = `${movie.title} <span class="age-rating">${movie.rating}</span>`;
    document.getElementById('rel-subtitle').innerText = `${movie.titleOriginal} | ${movie.year} | Агучка | Мой родны гук`;
    document.getElementById('rel-score').innerText = movie.score;
    document.getElementById('rel-duration').innerText = movie.duration;
    document.getElementById('rel-desc').innerHTML = movie.description;
    

    document.getElementById('watch-btn').href = `player.html?id=${movie.id}`; 


    const videoElement = document.getElementById('previewVideo');
    videoElement.innerHTML = `<source src="${movie.trailerSrc}" type="video/mp4">`;
    videoElement.load();


    const shareLinkElem = document.getElementById('shareLink');
    if(shareLinkElem) {
        shareLinkElem.innerText = window.location.href;
    }

    initReleaseInteractivity();
});

function initReleaseInteractivity() {
    setTimeout(() => { document.body.classList.add("loaded"); }, 100);

    // 3D эфект постэра
    const posterImg = document.getElementById('rel-poster');
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

    const container = document.getElementById('trailerBox');
    const video = document.getElementById('previewVideo');
    const overlayText = container.querySelector('.play-overlay');
    const ambientCanvas = document.getElementById('ambientCanvas');
    const ctx = ambientCanvas.getContext('2d', { alpha: false });

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

    const shareBtn = document.getElementById('shareBtn');
    const shareModal = document.getElementById('shareModal');
    const shareLink = document.getElementById('shareLink');

    if(shareBtn) {
        shareBtn.onclick = () => shareModal.classList.add('active');
        shareModal.onclick = (e) => { if (e.target === shareModal) shareModal.classList.remove('active'); };
        shareLink.onclick = () => {
            navigator.clipboard.writeText(shareLink.innerText);
            const originalText = shareLink.innerText;
            shareLink.innerText = "Скапіяваны";
            setTimeout(() => { shareLink.innerText = originalText; }, 2000);
        };
    }
    
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.hostname === window.location.hostname && !this.hash && this.target !== "_blank") {
                e.preventDefault(); 
                const destination = this.href;
                document.body.classList.add("fade-out");
                setTimeout(() => { window.location.href = destination; }, 600);
            }
        });
    });
}