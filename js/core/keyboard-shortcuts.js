// ================================================
// KEYBOARD SHORTCUTS MODULE
// ================================================

export const KeyboardShortcuts = {
    shortcuts: {},
    commandInput: null,
    WindowManager: null,

    init(shortcuts, commandInput, WindowManager) {
        this.shortcuts = shortcuts;
        this.commandInput = commandInput;
        this.WindowManager = WindowManager;

        document.addEventListener('keydown', (e) => {
            if (e.target === this.commandInput) return; // Don't interfere with terminal

            const key = `${e.altKey ? 'Alt+' : ''}${e.key}`;

            if (this.shortcuts[key]) {
                e.preventDefault();
                this.shortcuts[key]();
            }

            // Escape closes topmost window
            if (e.key === 'Escape' && this.WindowManager) {
                const windows = Object.entries(this.WindowManager.windows);
                if (windows.length > 0) {
                    const [appId] = windows.sort((a, b) =>
                        parseInt(b[1].style.zIndex) - parseInt(a[1].style.zIndex)
                    )[0];
                    this.WindowManager.closeWindow(appId);
                }
            }
        });
    }
};
