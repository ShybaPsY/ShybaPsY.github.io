// ================================================
// ACHIEVEMENT MANAGER MODULE
// Tracks user achievements and progress
// ================================================

import { t } from '../i18n/i18n.js';

export const AchievementManager = {
    achievements: [],

    init() {
        this.loadAchievements();
    },

    loadAchievements() {
        try {
            this.achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        } catch (e) {
            this.achievements = [];
        }
    },

    saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    },

    unlock(achievementId) {
        if (!this.achievements.includes(achievementId)) {
            this.achievements.push(achievementId);
            this.saveAchievements();
        }
    },

    // Alias for unlock - used by terminal
    check(achievementId) {
        this.unlock(achievementId);
    },

    hasAchievement(achievementId) {
        return this.achievements.includes(achievementId);
    },

    trackApp(appId) {
        // Track app usage for achievements
        const key = `app_opened_${appId}`;
        if (!this.hasAchievement(key)) {
            this.unlock(key);
        }
    },

    trackTheme(themeName) {
        // Track theme usage for achievements
        const key = `theme_used_${themeName}`;
        if (!this.hasAchievement(key)) {
            this.unlock(key);
        }
    },

    listAchievements() {
        if (this.achievements.length === 0) {
            return t('commands.conquistas_empty');
        }
        const translatedList = this.achievements.map(a => {
            const translated = t(`achievements.${a}`);
            return translated !== `achievements.${a}` ? translated : a;
        });
        const list = translatedList.map(a => `  - ${a}`).join('\n');
        return `<span class="highlight">${t('commands.conquistas_title')}</span>\n\n${list}`;
    },

    getAll() {
        return this.achievements;
    }
};
