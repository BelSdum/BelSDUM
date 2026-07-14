// cloud.js — Модуль работы с облаком Firebase 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Вставь сюда данные своего проекта из консоли Firebase:
const firebaseConfig = {
    apiKey: "AIzaSyBMJDadM7mOj_HJpbN5oXZ_QGpbrxOhN7U",
    authDomain: "belsdum-a8170.firebaseapp.com",
    databaseURL: "https://belsdum-a8170-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "belsdum-a8170",
    storageBucket: "belsdum-a8170_ID.appspot.com",
    messagingSenderId: "331040659321",
    appId: "1:331040659321:web:99dd77633de00b399441a8"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Экспортируем функции для работы с базой данных
export const CloudDB = {
    // Получить всех пользователей
    async getAllUsers() {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'usersDB'));
        return snapshot.exists() ? snapshot.val() : {};
    },

    // Сохранить/обновить конкретного пользователя
    async saveUser(username, userData) {
        await set(ref(db, 'usersDB/' + username), userData);
    },

    // Удалить старый узел (нужно при смене никнейма)
    async deleteUser(username) {
        await set(ref(db, 'usersDB/' + username), null);
    },

};


