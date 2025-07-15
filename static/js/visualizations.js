// Visualization utilities

// Function to render spectrogram using a enhanced heatmap visualization
function renderSpectrogram(spectrogramData, container) {
    // Validate input
    if (!spectrogramData || !spectrogramData.data || !container) {
        console.error('Invalid spectrogram data or container');
        return;
    }
    
    // Clear previous chart if it exists
    if (container.chart) {
        container.chart.destroy();
    }
    
    // Get the matrix data
    const data = spectrogramData.data;
    const timeAxis = spectrogramData.time || [];
    const freqAxis = spectrogramData.freq || [];
    
    // Get the canvas element and its context
    const ctx = container.getContext('2d');
    
    // Set canvas dimensions - adjust for a good aspect ratio
    const canvasWidth = container.parentElement.clientWidth || 600;
    container.width = canvasWidth;
    container.height = Math.min(400, Math.floor(canvasWidth * 0.6));
    
    // Calculate pixel scaling
    const pixelWidth = canvasWidth / data[0].length;
    const pixelHeight = container.height / data.length;
    
    // Clear the canvas
    ctx.clearRect(0, 0, container.width, container.height);
    
    // Create a gradient colormap - vibrant & visually appealing for spectrograms
    const createColorScale = (value) => {
        // Professional spectrogram color mapping (viridis-like)
        if (value < 0.25) {
            // Dark purple to blue
            const r = Math.floor(value * 4 * 146);
            const g = Math.floor(value * 4 * 78);
            const b = Math.floor(128 + value * 4 * 127);
            return `rgb(${r},${g},${b})`;
        } else if (value < 0.5) {
            // Blue to teal
            const r = Math.floor(146 + (value - 0.25) * 4 * (33 - 146));
            const g = Math.floor(78 + (value - 0.25) * 4 * (144 - 78));
            const b = Math.floor(255 + (value - 0.25) * 4 * (140 - 255));
            return `rgb(${r},${g},${b})`;
        } else if (value < 0.75) {
            // Teal to green/yellow
            const r = Math.floor(33 + (value - 0.5) * 4 * (253 - 33));
            const g = Math.floor(144 + (value - 0.5) * 4 * (231 - 144));
            const b = Math.floor(140 + (value - 0.5) * 4 * (37 - 140));
            return `rgb(${r},${g},${b})`;
        } else {
            // Yellow to bright yellow/white
            const r = Math.floor(253 + (value - 0.75) * 4 * (255 - 253));
            const g = Math.floor(231 + (value - 0.75) * 4 * (255 - 231));
            const b = Math.floor(37 + (value - 0.75) * 4 * (255 - 37));
            return `rgb(${r},${g},${b})`;
        }
    };
    
    // Draw the spectrogram using color rectangles for better performance
    for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[0].length; x++) {
            const value = data[y][x];
            const color = createColorScale(value);
            
            ctx.fillStyle = color;
            ctx.fillRect(
                x * pixelWidth, 
                container.height - (y + 1) * pixelHeight, 
                pixelWidth + 0.5, // Slight overlap to avoid gaps
                pixelHeight + 0.5
            );
        }
    }
    
    // Draw frequency axis on the left
    if (freqAxis.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(0, 0, 60, container.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        
        // Draw frequency markers at regular intervals
        const numLabels = Math.min(8, freqAxis.length);
        for (let i = 0; i < numLabels; i++) {
            const freqIndex = Math.floor(i * (freqAxis.length - 1) / (numLabels - 1));
            const freq = Math.round(freqAxis[freqIndex] / 100) / 10;
            const y = container.height - (freqIndex / freqAxis.length) * container.height;
            
            ctx.fillText(`${freq} kHz`, 55, y + 4);
            
            // Draw tick mark
            ctx.beginPath();
            ctx.moveTo(60, y);
            ctx.lineTo(65, y);
            ctx.stroke();
        }
    }
    
    // Draw time axis at the bottom
    if (timeAxis.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(0, container.height - 20, container.width, 20);
        
        ctx.fillStyle = '#333';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        
        // Draw time markers at regular intervals
        const numLabels = Math.min(6, timeAxis.length);
        for (let i = 0; i < numLabels; i++) {
            const timeIndex = Math.floor(i * (timeAxis.length - 1) / (numLabels - 1));
            const time = Math.round(timeAxis[timeIndex] * 100) / 100;
            const x = (timeIndex / (timeAxis.length - 1)) * container.width;
            
            ctx.fillText(`${time}s`, x, container.height - 6);
            
            // Draw tick mark
            ctx.beginPath();
            ctx.moveTo(x, container.height - 20);
            ctx.lineTo(x, container.height - 15);
            ctx.stroke();
        }
    }
    
    // Add title and annotations if needed
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(70, 5, 200, 20);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Keyboard Acoustic Spectrogram', 75, 19);
}
