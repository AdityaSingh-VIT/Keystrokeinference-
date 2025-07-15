# Keyboard Acoustic Side-Channel Attack Demonstration

A web application demonstrating keyboard acoustic side-channel attacks using advanced machine learning techniques to predict typed text from audio signals.

## Running Locally

For local development without PostgreSQL, the application now includes SQLite support:

1. Run the application: python main.py
2. Access at http://localhost:5000

## Features

- Audio recording and file upload
- Real-time spectrogram visualization 
- CNN for audio feature extraction
- HMM for keystroke sequence prediction
- Trained model tracking and visualization
- Bulk training from filenames
