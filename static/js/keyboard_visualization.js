/**
 * Keyboard visualization for keyboard acoustic side-channel attack results
 * Shows detected keystrokes on a keyboard layout and highlights the pressed keys
 */

function createKeyboard(container) {
    const keyboardLayout = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
        ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
        ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Menu', 'Ctrl']
    ];

    const specialKeys = {
        'Backspace': { width: 2 },
        'Tab': { width: 1.5 },
        'Caps': { width: 1.75 },
        'Enter': { width: 2.25 },
        'Shift': { width: 2.5 },
        'Ctrl': { width: 1.5 },
        'Win': { width: 1.25 },
        'Alt': { width: 1.25 },
        'Space': { width: 6.5 },
        'Menu': { width: 1.25 },
        '\\': { width: 1.5 }
    };

    const keyboard = document.createElement('div');
    keyboard.className = 'keyboard-visualization';
    keyboard.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 20px 0; user-select: none;';

    keyboardLayout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        rowDiv.style.cssText = 'display: flex; gap: 4px;';

        row.forEach(key => {
            const keyDiv = document.createElement('div');
            keyDiv.className = 'keyboard-key';
            keyDiv.dataset.key = key.toLowerCase();
            keyDiv.textContent = key;
            
            const width = specialKeys[key] ? specialKeys[key].width : 1;
            keyDiv.style.cssText = `
                width: ${width * 40}px;
                height: 40px;
                border: 1px solid var(--bs-secondary);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: var(--bs-dark);
                font-size: 14px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                transition: all 0.2s ease;
            `;
            
            rowDiv.appendChild(keyDiv);
        });

        keyboard.appendChild(rowDiv);
    });

    container.appendChild(keyboard);
    return keyboard;
}

function highlightKeys(keyboard, text) {
    // Reset all keys
    const allKeys = keyboard.querySelectorAll('.keyboard-key');
    allKeys.forEach(key => {
        key.style.backgroundColor = 'var(--bs-dark)';
        key.style.color = 'var(--bs-light)';
        key.style.transform = 'translateY(0)';
        key.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    });

    if (!text) return;

    // Convert the text to lowercase for matching with keys
    const characters = text.toLowerCase().split('');
    
    // Create a frequency map of characters
    const charFrequency = {};
    characters.forEach(char => {
        charFrequency[char] = (charFrequency[char] || 0) + 1;
    });
    
    // Find the max frequency for normalization
    const maxFreq = Math.max(...Object.values(charFrequency));
    
    // Highlight each key based on its frequency
    Object.keys(charFrequency).forEach(char => {
        const keyElements = keyboard.querySelectorAll(`.keyboard-key[data-key="${char}"]`);
        if (keyElements.length > 0) {
            const intensity = charFrequency[char] / maxFreq;
            
            keyElements.forEach(key => {
                // Calculate a color between green and red based on intensity
                const hue = 120 * (1 - intensity); // 120 = green, 0 = red
                key.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
                key.style.color = 'white';
                key.style.transform = 'translateY(-2px)';
                key.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                
                // Add a small animation
                key.style.animation = 'keyPress 0.3s ease';
            });
        }
    });
}

// Add the highlightDetectedKeys function to the window object so it can be called from other scripts
window.createKeyboardVisualization = function(containerId, text) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear the container
    container.innerHTML = '';
    
    // Create the keyboard
    const keyboard = createKeyboard(container);
    
    // Highlight the keys
    highlightKeys(keyboard, text);
    
    // Add the detected text below the keyboard
    if (text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'detected-text mt-3 p-3 border rounded bg-dark';
        textDiv.innerHTML = `<strong>Detected Text:</strong> <span class="text-info">${text}</span>`;
        container.appendChild(textDiv);
    }
    
    return keyboard;
};

// Add a keyPress animation
const style = document.createElement('style');
style.textContent = `
@keyframes keyPress {
  0% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(-2px); }
}
`;
document.head.appendChild(style);