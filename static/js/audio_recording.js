// Audio Recording functionality

class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this._isRecording = false;
        
        // Browser compatibility check
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Media Devices API not supported in this browser.');
        }
    }
    
    isRecording() {
        return this._isRecording;
    }
    
    async start() {
        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create media recorder
            this.mediaRecorder = new MediaRecorder(this.stream);
            
            // Clear previous chunks
            this.audioChunks = [];
            
            // Add data handler
            this.mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            });
            
            // Start recording
            this.mediaRecorder.start();
            this._isRecording = true;
            
            console.log('Recording started');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }
    
    async stop() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error('No active recording.'));
                return;
            }
            
            // Add stop event handler
            this.mediaRecorder.addEventListener('stop', () => {
                // Create audio blob
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                
                // Stop all tracks in the stream
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                }
                
                this._isRecording = false;
                console.log('Recording stopped');
                
                resolve(audioBlob);
            });
            
            // Stop recording
            this.mediaRecorder.stop();
        });
    }
}
