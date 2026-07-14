import { CloudDB } from './cloud.js';

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const profileNickInput = document.getElementById('profileNick');
    const currentAvatarDiv = document.getElementById('currentAvatar');
    const fileInput = document.getElementById('avatarUpload');
    const profileForm = document.getElementById('profileForm');
    const profileError = document.getElementById('profileError');
    const logoutBtn = document.getElementById('profileLogout');
    
    // --- Элементы Избранного ---
    const openFavoritesBtn = document.getElementById('openFavoritesBtn');
    const favoritesOverlay = document.getElementById('favoritesOverlay');

    let selectedAvatar = "✨"; 
    let userPassword = ""; 

    // --- Логика открытия и закрытия Избранного ---
    openFavoritesBtn.addEventListener('click', () => {
        favoritesOverlay.classList.add('show');
    });

    favoritesOverlay.addEventListener('click', (e) => {
        // Закрываем меню, только если клик был по самому темному фону, а не по окну внутри
        if (e.target === favoritesOverlay) {
            favoritesOverlay.classList.remove('show');
        }
    });

    // --- Всплывающие уведомления ---
    function showProfileToast(msg) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'apple-toast show';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3500);
    }

    // --- Отрисовка аватара ---
    function renderAvatar(avatarData) {
        if (avatarData.startsWith('data:image')) {
            currentAvatarDiv.innerHTML = `<img src="${avatarData}" class="custom-avatar-img" alt="Аватар">`;
            currentAvatarDiv.style.border = '0.2rem solid #34c759';
        } else {
            currentAvatarDiv.innerHTML = avatarData;
            currentAvatarDiv.style.border = '1rem solid #34c759'; // Рамка для стандартного эмодзи
        }
    }

    // --- Загрузка данных пользователя из CloudDB ---
    try {
        const usersDB = await CloudDB.getAllUsers();
        const myData = usersDB[currentUser];

        if (myData) {
            profileNickInput.value = currentUser;
            userPassword = myData.password;
            
            if (myData.avatar) {
                selectedAvatar = myData.avatar;
            }
        }
        // Убираем спиннер и показываем аватар (или ✨ по умолчанию)
        renderAvatar(selectedAvatar);
        
    } catch (err) {
        profileError.textContent = "Не ўдалося загрузіць дадзеныя з воблака.";
        renderAvatar(selectedAvatar);
    }

    // --- Загрузка собственного фото (Base64) ---
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            showProfileToast("Файл занадта вялікі! Калі ласка, выберыце фота да 500 КБ.");
            fileInput.value = ''; 
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            selectedAvatar = event.target.result;
            renderAvatar(selectedAvatar);
        };
        reader.readAsDataURL(file);
    });

    // --- Сохранение изменений в облако ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newNick = profileNickInput.value.trim();
        profileError.textContent = "Захаванне...";

        if (newNick.length < 3) {
            profileError.textContent = "Нікнэйм павінен быць больш за 2 сімвалы.";
            return;
        }

        try {
            const usersDB = await CloudDB.getAllUsers();

            if (newNick !== currentUser && usersDB[newNick]) {
                profileError.textContent = "Гэты нікнэйм ужо заняты іншым карыстальнікам!";
                return;
            }

            const updatedData = {
                password: userPassword,
                avatar: selectedAvatar
            };

            if (newNick !== currentUser) {
                await CloudDB.saveUser(newNick, updatedData);
                await CloudDB.deleteUser(currentUser);
                localStorage.setItem('currentUser', newNick);
            } else {
                await CloudDB.saveUser(currentUser, updatedData);
            }

            profileError.textContent = "";
            showProfileToast("Дадзеныя паспяхова захаваны!");
            
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);

        } catch (err) {
            profileError.textContent = "Памылка захавання: " + err.message;
        }
    });

    // --- Выход из аккаунта ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
});



















    function renderFavorites() {
        const list = document.getElementById('favoritesList');
        const favorites = JSON.parse(localStorage.getItem('myFavorites')) || [];

        if (favorites.length === 0) {
            list.innerHTML = '<p class="empty-msg">Тут пакуль пуста.   ^ - ⩊ - ^  </p>';
            return;
        }

  
        list.innerHTML = favorites.map(m => `
            <div class="favorite-item" data-id="${m.id}">
                <a href="release.html?id=${m.id}" class="fav-link-area">
                    <div class="fav-poster-wrapper">
                        <img src="${m.poster}" alt="Постер" draggable="false">
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 1.6rem; font-weight: 600; color: white; margin-bottom: 0.4rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.title}</div>
                        <div style="font-size: 1.2rem; color: rgba(255,255,255,0.4);">${m.year} • ${m.rating}</div>
                    </div>
                </a>
                <button type="button" class="fav-item-remove" data-id="${m.id}">Выдаліць</button>
            </div>
        `).join('');


        list.querySelectorAll('.fav-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idToRemove = btn.dataset.id;
                const targetCard = btn.closest('.favorite-item');
                
                if (targetCard) {
                    targetCard.classList.add('removing');
                }

                setTimeout(() => {
                    let favs = JSON.parse(localStorage.getItem('myFavorites')) || [];
                    favs = favs.filter(item => item.id !== idToRemove);
                    localStorage.setItem('myFavorites', JSON.stringify(favs));
                    renderFavorites();
                }, );
            });
        });
    }


    openFavoritesBtn.addEventListener('click', () => {
        renderFavorites(); 
        favoritesOverlay.classList.add('show');
    });

    favoritesOverlay.addEventListener('click', (e) => {
        if (e.target === favoritesOverlay) {
            favoritesOverlay.classList.remove('show');
        }
    });

    