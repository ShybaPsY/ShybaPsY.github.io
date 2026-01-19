// ================================================
// PROJETOS APP MODULE
// Project showcase with animations, carousel, and 3D flip cards
// ================================================

import { t, i18n } from '../i18n/i18n.js';

export const ProjetosApp = {
    WindowManager: null,
    AchievementManager: null,
    projects: [],
    featuredProjects: [],
    carouselIndex: 0,
    carouselInterval: null,
    particleAnimationId: null,

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;
        this.projects = i18n.getProjects() || [];
        this.featuredProjects = this.projects.filter(p => p.featured);

        // Register cleanup handler
        if (WindowManager) {
            WindowManager.registerCleanup('projetos', () => this.cleanup());
        }
    },

    open() {
        if (!this.WindowManager) return;

        // Refresh projects data in case language changed
        this.projects = i18n.getProjects() || [];
        this.featuredProjects = this.projects.filter(p => p.featured);

        const content = `<div class="projetos-container" id="projetos-content"></div>`;
        this.WindowManager.createWindow('projetos', t('projetos.title'), 650, 700, content);
        this.render();

        if (this.AchievementManager) {
            this.AchievementManager.trackApp('projetos');
        }
    },

    render() {
        const container = document.getElementById('projetos-content');
        if (!container) return;

        container.innerHTML = `
            ${this.renderHeader()}
            <div class="projetos-grid" id="projetos-grid">
                ${this.renderProjectCards()}
            </div>
        `;

        this.initEventListeners();
        this.initParticles();
    },

    renderHeader() {
        return `
            <div class="projetos-header">
                <canvas class="projetos-particles" id="projetos-particles"></canvas>
                <div class="projetos-title">${t('projetos.title')}</div>
                <div class="projetos-subtitle">${t('projetos.subtitle')}</div>
                <div class="projetos-search">
                    <span class="projetos-search-icon">$</span>
                    <input
                        type="text"
                        class="projetos-search-input"
                        id="projetos-search"
                        placeholder="${t('projetos.search_placeholder')}"
                    >
                </div>
            </div>
        `;
    },

    renderFeaturedCarousel() {
        if (this.featuredProjects.length === 0) return '';

        const slides = this.featuredProjects.map((project, index) => `
            <div class="projetos-carousel-slide" data-index="${index}">
                <div class="projetos-carousel-title">${project.title}</div>
                <div class="projetos-carousel-desc">${project.description}</div>
                <div class="projetos-carousel-tech">
                    ${project.techStack.slice(0, 4).map(tech =>
            `<span class="projetos-tech-badge">${tech}</span>`
        ).join('')}
                </div>
            </div>
        `).join('');

        const dots = this.featuredProjects.map((_, index) => `
            <div class="projetos-carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
        `).join('');

        return `
            <div class="projetos-featured">
                <div class="projetos-featured-label">⭐ ${t('projetos.featured')}</div>
                <button class="projetos-carousel-arrow prev" id="carousel-prev">❮</button>
                <button class="projetos-carousel-arrow next" id="carousel-next">❯</button>
                <div class="projetos-carousel" id="projetos-carousel">
                    ${slides}
                </div>
                <div class="projetos-carousel-nav" id="carousel-nav">
                    ${dots}
                </div>
            </div>
        `;
    },

    renderProjectCards(filter = '') {
        const filteredProjects = this.projects.filter(project => {
            if (!filter) return true;
            const searchLower = filter.toLowerCase();
            return project.title.toLowerCase().includes(searchLower) ||
                project.description.toLowerCase().includes(searchLower) ||
                project.techStack.some(tech => tech.toLowerCase().includes(searchLower));
        });

        if (filteredProjects.length === 0) {
            return `
                <div class="projetos-no-results">
                    <div class="projetos-no-results-icon">🔍</div>
                    <div class="projetos-no-results-text">${t('projetos.no_results')}</div>
                </div>
            `;
        }

        return filteredProjects.map((project, index) => `
            <div class="projetos-card" style="animation-delay: ${index * 0.1}s" data-id="${project.id}">
                <div class="projetos-card-inner">
                    <div class="projetos-card-front">
                        <div class="projetos-card-thumbnail">
                            ${project.thumbnail
                ? `<img src="${project.thumbnail}" alt="${project.title}">`
                : this.getProjectIcon(project)}
                        </div>
                        <div class="projetos-card-info">
                            <div class="projetos-card-title">${project.title}</div>
                            <div class="projetos-card-desc">${project.description}</div>
                            <div class="projetos-card-tech-mini">
                                ${project.techStack.slice(0, 2).map(tech =>
                    `<span class="projetos-tech-mini">${tech}</span>`
                ).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="projetos-card-back">
                        <div>
                            <div class="projetos-card-back-title">${project.title}</div>
                            <div class="projetos-card-back-desc">${project.description}</div>
                        </div>
                        <div>
                            <div class="projetos-card-back-links">
                                ${project.githubUrl ? `
                                    <a href="${project.githubUrl}" target="_blank" class="projetos-card-link github" onclick="event.stopPropagation()">
                                        GitHub
                                    </a>
                                ` : ''}
                                ${project.liveUrl ? `
                                    <a href="${project.liveUrl}" target="_blank" class="projetos-card-link" onclick="event.stopPropagation()">
                                        Demo
                                    </a>
                                ` : ''}
                            </div>
                            <button class="projetos-card-details-btn" data-id="${project.id}">
                                ${t('projetos.view_details')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    getProjectIcon(project) {
        const title = project.title.toLowerCase();
        const stack = project.techStack.join(' ').toLowerCase();

        if (title.includes('api') || stack.includes('api')) return '{ }';
        if (title.includes('chat') || stack.includes('socket')) return '< >';
        if (title.includes('e-commerce') || title.includes('store')) return '[ ]';
        if (stack.includes('react') || stack.includes('vue')) return '< />';
        if (stack.includes('node') || stack.includes('express')) return '> _';
        if (stack.includes('mobile') || stack.includes('native')) return '[ ]';

        return '</>';
    },

    initEventListeners() {
        // Search
        const searchInput = document.getElementById('projetos-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProjects(e.target.value);
            });
        }

        // Carousel navigation
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateCarousel(-1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateCarousel(1));
        }

        // Carousel dots
        const dots = document.querySelectorAll('.projetos-carousel-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                this.goToSlide(index);
            });
        });

        // Card detail buttons
        const detailBtns = document.querySelectorAll('.projetos-card-details-btn');
        detailBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = btn.dataset.id;
                this.openProjectDetail(projectId);
            });
        });

        // Cards click (optional - also open detail)
        const cards = document.querySelectorAll('.projetos-card');
        cards.forEach(card => {
            card.addEventListener('dblclick', () => {
                const projectId = card.dataset.id;
                this.openProjectDetail(projectId);
            });
        });
    },

    filterProjects(searchTerm) {
        const grid = document.getElementById('projetos-grid');
        if (grid) {
            grid.innerHTML = this.renderProjectCards(searchTerm);

            // Re-attach event listeners for new cards
            const detailBtns = grid.querySelectorAll('.projetos-card-details-btn');
            detailBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const projectId = btn.dataset.id;
                    this.openProjectDetail(projectId);
                });
            });

            const cards = grid.querySelectorAll('.projetos-card');
            cards.forEach(card => {
                card.addEventListener('dblclick', () => {
                    const projectId = card.dataset.id;
                    this.openProjectDetail(projectId);
                });
            });
        }
    },

    startCarouselAutoplay() {
        if (this.featuredProjects.length <= 1) return;

        this.carouselInterval = setInterval(() => {
            this.navigateCarousel(1);
        }, 5000);
    },

    navigateCarousel(direction) {
        const newIndex = this.carouselIndex + direction;
        const maxIndex = this.featuredProjects.length - 1;

        if (newIndex < 0) {
            this.goToSlide(maxIndex);
        } else if (newIndex > maxIndex) {
            this.goToSlide(0);
        } else {
            this.goToSlide(newIndex);
        }
    },

    goToSlide(index) {
        this.carouselIndex = index;

        const carousel = document.getElementById('projetos-carousel');
        if (carousel) {
            carousel.style.transform = `translateX(-${index * 100}%)`;
        }

        const dots = document.querySelectorAll('.projetos-carousel-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        // Reset autoplay timer
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
            this.startCarouselAutoplay();
        }
    },

    openProjectDetail(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        const hasImages = project.images && project.images.length > 0;
        const imageCount = hasImages ? project.images.length : 0;

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'projetos-modal-overlay';
        overlay.id = 'projetos-modal';

        overlay.innerHTML = `
            <div class="projetos-modal">
                <div class="projetos-modal-header">
                    <div class="projetos-modal-title">${project.title}</div>
                    <button class="projetos-modal-close" id="modal-close">✕</button>
                </div>
                <div class="projetos-modal-content">
                    <div class="projetos-modal-carousel">
                        ${hasImages
                ? `
                            <div class="carousel-images" id="carousel-images">
                                ${project.images.map((img, i) => `
                                    <img src="${img}" alt="${project.title} - ${i + 1}" class="carousel-image ${i === 0 ? 'active' : ''}" data-index="${i}">
                                `).join('')}
                            </div>
                            ${imageCount > 1 ? `
                                <button class="carousel-nav carousel-prev" id="carousel-prev">‹</button>
                                <button class="carousel-nav carousel-next" id="carousel-next">›</button>
                                <div class="carousel-dots" id="carousel-dots">
                                    ${project.images.map((_, i) => `
                                        <span class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        `
                : `<div class="projetos-modal-carousel-placeholder">${this.getProjectIcon(project)}</div>`
            }
                    </div>
                    <div class="projetos-modal-desc">${project.fullDescription || project.description}</div>
                    <div class="projetos-modal-tech">
                        ${project.techStack.map(tech =>
                `<span class="projetos-modal-tech-badge">${tech}</span>`
            ).join('')}
                    </div>
                    <div class="projetos-modal-meta">
                        <span>${this.formatDate(project.date)}</span>
                        ${project.featured ? `<span>${t('projetos.featured_project')}</span>` : ''}
                    </div>
                    <div class="projetos-modal-links">
                        ${project.githubUrl ? `
                            <a href="${project.githubUrl}" target="_blank" class="projetos-modal-link github">
                                ${t('projetos.view_github')}
                            </a>
                        ` : ''}
                        ${project.liveUrl ? `
                            <a href="${project.liveUrl}" target="_blank" class="projetos-modal-link live">
                                ${t('projetos.view_demo')}
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        // Carousel navigation
        if (hasImages && imageCount > 1) {
            let currentIndex = 0;
            const images = overlay.querySelectorAll('.carousel-image');
            const dots = overlay.querySelectorAll('.carousel-dot');
            const prevBtn = overlay.querySelector('#carousel-prev');
            const nextBtn = overlay.querySelector('#carousel-next');

            const showImage = (index) => {
                images.forEach((img, i) => img.classList.toggle('active', i === index));
                dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
                currentIndex = index;
            };

            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showImage((currentIndex - 1 + imageCount) % imageCount);
            });

            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showImage((currentIndex + 1) % imageCount);
            });

            dots.forEach(dot => {
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showImage(parseInt(dot.dataset.index));
                });
            });

            // Auto-advance every 2 seconds
            const autoAdvance = setInterval(() => {
                showImage((currentIndex + 1) % imageCount);
            }, 2000);

            // Store interval to clear on modal close
            overlay.dataset.carouselInterval = autoAdvance;
        }

        // Close handlers
        const closeBtn = document.getElementById('modal-close');
        closeBtn.addEventListener('click', () => this.closeModal());

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });

        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },

    closeModal() {
        const modal = document.getElementById('projetos-modal');
        if (modal) {
            // Clear carousel auto-advance interval
            if (modal.dataset.carouselInterval) {
                clearInterval(parseInt(modal.dataset.carouselInterval));
            }
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    },

    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString(i18n.getDateLocale(), {
            year: 'numeric',
            month: 'long'
        });
    },

    initParticles() {
        const canvas = document.getElementById('projetos-particles');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const particles = [];
        const particleCount = 30;

        const resizeCanvas = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };
        resizeCanvas();

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        const getColor = (varName) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                // Update position
                p.x += p.speedX;
                p.y += p.speedY;

                // Wrap around
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = getColor('--green');
                ctx.globalAlpha = p.opacity;
                ctx.fill();
            });

            ctx.globalAlpha = 1;
            this.particleAnimationId = requestAnimationFrame(animate);
        };

        animate();
    },

    cleanup() {
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
            this.carouselInterval = null;
        }
        if (this.particleAnimationId) {
            cancelAnimationFrame(this.particleAnimationId);
            this.particleAnimationId = null;
        }
        this.carouselIndex = 0;
        this.closeModal();
    }
};
