// Centralized Dialog Management System
class DialogManager {
    constructor() {
        this.activeDialogs = new Set();
        this.dialogStack = [];
    }
    
    /**
     * Create and show a dialog
     */
    show(config) {
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.id = config.id || `dialog-${Date.now()}`;
        dialog.className = 'dialog-overlay';
        
        // Create dialog content
        const content = document.createElement('div');
        content.className = 'dialog-content';
        
        // Add title if provided
        if (config.title) {
            const title = document.createElement('h2');
            title.textContent = config.title;
            content.appendChild(title);
        }
        
        // Add body content
        if (config.content) {
            if (typeof config.content === 'string') {
                content.innerHTML += config.content;
            } else {
                content.appendChild(config.content);
            }
        }
        
        // Add buttons
        if (config.buttons) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'dialog-buttons';
            
            config.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = btn.className || 'dialogButton';
                button.textContent = btn.text;
                button.onclick = () => {
                    if (btn.onClick) btn.onClick();
                    if (btn.closeOnClick !== false) {
                        this.hide(dialog.id);
                    }
                };
                buttonContainer.appendChild(button);
            });
            
            content.appendChild(buttonContainer);
        }
        
        dialog.appendChild(content);
        
        // Add close on background click
        if (config.closeOnBackgroundClick !== false) {
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    this.hide(dialog.id);
                }
            });
        }
        
        // Add to DOM
        document.body.appendChild(dialog);
        this.activeDialogs.add(dialog.id);
        this.dialogStack.push(dialog.id);
        
        // Add escape key handler
        this.addEscapeHandler(dialog.id);
        
        return dialog.id;
    }
    
    /**
     * Hide and remove a dialog
     */
    hide(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.remove();
            this.activeDialogs.delete(dialogId);
            this.dialogStack = this.dialogStack.filter(id => id !== dialogId);
        }
    }
    
    /**
     * Hide all dialogs
     */
    hideAll() {
        this.activeDialogs.forEach(dialogId => this.hide(dialogId));
    }
    
    /**
     * Create a simple alert dialog
     */
    alert(message, title = 'Alert') {
        return this.show({
            title,
            content: `<p>${message}</p>`,
            buttons: [{
                text: 'OK',
                className: 'dialogButton'
            }]
        });
    }
    
    /**
     * Create a confirmation dialog
     */
    confirm(message, onConfirm, onCancel, title = 'Confirm') {
        return this.show({
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: 'OK',
                    className: 'dialogButton',
                    onClick: onConfirm
                },
                {
                    text: 'Cancel',
                    className: 'dialogButton cancel',
                    onClick: onCancel
                }
            ]
        });
    }
    
    /**
     * Create a settings dialog with sliders
     */
    createSettingsDialog(settings) {
        const content = document.createElement('div');
        
        settings.forEach(setting => {
            const container = document.createElement('div');
            container.className = 'sliderContainer';
            
            const label = document.createElement('label');
            label.innerHTML = `${setting.label}: <span id="${setting.id}-label">${setting.value}</span>${setting.unit || ''}`;
            container.appendChild(label);
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.id = setting.id;
            slider.min = setting.min || 0;
            slider.max = setting.max || 100;
            slider.value = setting.value;
            slider.oninput = (e) => {
                document.getElementById(`${setting.id}-label`).textContent = e.target.value;
                if (setting.onChange) setting.onChange(e.target.value);
            };
            
            container.appendChild(slider);
            content.appendChild(container);
        });
        
        return content;
    }
    
    /**
     * Add escape key handler for top dialog
     */
    addEscapeHandler(dialogId) {
        const handler = (e) => {
            if (e.key === 'Escape' && this.dialogStack[this.dialogStack.length - 1] === dialogId) {
                this.hide(dialogId);
                document.removeEventListener('keydown', handler);
            }
        };
        
        document.addEventListener('keydown', handler);
    }
    
    /**
     * Check if any dialog is open
     */
    hasActiveDialogs() {
        return this.activeDialogs.size > 0;
    }
}

// Add default styles if not already present
if (!document.getElementById('dialog-styles')) {
    const style = document.createElement('style');
    style.id = 'dialog-styles';
    style.textContent = `
        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .dialog-content {
            background-color: #333;
            padding: 30px;
            border-radius: 10px;
            border: 2px solid #555;
            min-width: 300px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .dialog-content h2 {
            margin-top: 0;
            margin-bottom: 20px;
            color: white;
            text-align: center;
        }
        
        .dialog-content p {
            color: white;
            margin: 20px 0;
        }
        
        .dialog-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
        }
        
        .dialogButton {
            padding: 12px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        
        .dialogButton:hover {
            background-color: #45a049;
        }
        
        .dialogButton.cancel {
            background-color: #666;
        }
        
        .dialogButton.cancel:hover {
            background-color: #555;
        }
    `;
    document.head.appendChild(style);
}

// Create global dialog manager instance
window.dialogManager = new DialogManager();