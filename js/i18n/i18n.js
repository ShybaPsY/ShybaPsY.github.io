// Internationalization (i18n) Module
// Supports Portuguese (pt) and English (en)

export const i18n = {
    currentLang: 'pt',
    translations: {},
    projectsData: [],

    async init(lang) {
        this.currentLang = lang;
        await this.loadTranslations(lang);
        await this.loadProjects(lang);
        this.updateDocumentLang();
    },

    async loadTranslations(lang) {
        try {
            const response = await fetch(`js/locales/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to empty object
            this.translations = {};
        }
    },

    async loadProjects(lang) {
        try {
            const response = await fetch(`js/locales/projects-${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load projects-${lang}.json`);
            this.projectsData = await response.json();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.projectsData = [];
        }
    },

    t(key, replacements = {}) {
        // Support nested keys: "terminal.welcome"
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                console.warn(`Translation missing: ${key}`);
                return key; // Fallback to key
            }
        }

        // Handle replacements: t('greeting', { name: 'Gabriel' })
        if (typeof value === 'string' && Object.keys(replacements).length) {
            return value.replace(/\{(\w+)\}/g, (_, k) => replacements[k] ?? `{${k}}`);
        }

        return value;
    },

    getLang() {
        return this.currentLang;
    },

    getDateLocale() {
        return this.currentLang === 'pt' ? 'pt-BR' : 'en-US';
    },

    getProjects() {
        return this.projectsData?.projects || [];
    },

    updateDocumentLang() {
        document.documentElement.lang = this.currentLang === 'pt' ? 'pt-BR' : 'en-US';
        const title = this.t('meta.title');
        if (title !== 'meta.title') {
            document.title = title;
        }
    },

    // Update all elements with data-i18n attribute
    updatePageTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation !== key) {
                el.textContent = translation;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation !== key) {
                el.placeholder = translation;
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = this.t(key);
            if (translation !== key) {
                el.title = translation;
            }
        });
    }
};

// Shorthand export for convenience
export const t = (key, replacements) => i18n.t(key, replacements);
