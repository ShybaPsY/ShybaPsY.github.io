// ================================================
// EASTER EGGS MODULE
// ================================================

import { t } from '../i18n/i18n.js';
import { AchievementManager } from './achievements.js';

export const EasterEggs = {
    konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    konamiIndex: 0,
    secretUnlocked: false,

    init() {
        this.setupKonamiCode();
        this.checkSecretUnlocked();
    },

    setupKonamiCode() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase() === e.key ? e.key : e.key;

            if (key === this.konamiCode[this.konamiIndex] || key.toLowerCase() === this.konamiCode[this.konamiIndex]) {
                this.konamiIndex++;

                if (this.konamiIndex === this.konamiCode.length) {
                    this.triggerKonamiSecret();
                    this.konamiIndex = 0;
                }
            } else {
                this.konamiIndex = 0;
            }
        });
    },

    triggerKonamiSecret() {
        if (this.secretUnlocked) {
            this.showSecretMessage(t('easter_eggs.already_unlocked'));
            return;
        }

        this.secretUnlocked = true;
        localStorage.setItem('konami-unlocked', 'true');

        // Create epic secret reveal
        const overlay = document.createElement('div');
        overlay.id = 'secret-overlay';
        overlay.innerHTML = `
            <div class="secret-content">
                <div class="secret-title">${t('easter_eggs.secret_unlocked')}</div>
                <div class="secret-icon">🎮</div>
                <div class="secret-text">${t('easter_eggs.konami_found')}</div>
                <div class="secret-reward">${t('easter_eggs.nostalgia_unlocked')}</div>
                <div class="secret-hint">${t('easter_eggs.rickroll_hint')}</div>
                <button class="secret-close">${t('easter_eggs.awesome')}</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add confetti effect
        this.createConfetti();

        overlay.querySelector('.secret-close').addEventListener('click', () => {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 300);
        });

        // Unlock secret achievement
        AchievementManager.unlock('secret_finder');
    },

    createConfetti() {
        const colors = ['#ff5555', '#ffb86c', '#f1fa8c', '#50fa7b', '#8be9fd', '#bd93f9', '#ff79c6'];

        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }
    },

    showSecretMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'secret-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    checkSecretUnlocked() {
        this.secretUnlocked = localStorage.getItem('konami-unlocked') === 'true';
    }
};

// Add rickroll command to terminal
export function getRickrollCommand() {
    return async function () {
        const lines = [
            '',
            '<span class="detail-green">  Never gonna give you up</span>',
            '<span class="detail-cyan">  Never gonna let you down</span>',
            '<span class="detail-green">  Never gonna run around and desert you</span>',
            '<span class="detail-cyan">  Never gonna make you cry</span>',
            '<span class="detail-green">  Never gonna say goodbye</span>',
            '<span class="detail-cyan">  Never gonna tell a lie and hurt you</span>',
            '',
            '<span class="comment">  🎵 You just got rickrolled! 🎵</span>',
            '',
            `<span class="highlight">  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank">▶ ${t('easter_eggs.click_full_experience')}</a></span>`,
            ''
        ];

        // Unlock achievement
        AchievementManager.unlock('rickrolled');

        return lines.join('\n');
    };
}

// Animated SL (Steam Locomotive) command
export function getAnimatedSL() {
    return async function () {
        const frames = [
            `<span class="detail-cyan">                       (@@)  (  )  (@@)  (  )  (@@)  (  )
                  (   )
               (@@@@@@)
            =========  _---------_
           /          \\           \\
          |    |   o   |    []     |
          |     \\_____/            |
          |                        |
          \\_________   ___________/
                    | |
                    | |
                    | |
               _____|_|_____
              [_____________]</span>`,
        ];

        return `
  <span class="detail-cyan">
      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  |  ______|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__
 |/-=|___|=O=====O=====O=====O   |_____/~\\___/
  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/
  </span>

  <span class="highlight">🚂 ${t('easter_eggs.choo_choo')}</span>
  <span class="comment">${t('easter_eggs.sl_typed')}</span>
  <span class="comment">${t('easter_eggs.train_passing')}</span>`;
    };
}
