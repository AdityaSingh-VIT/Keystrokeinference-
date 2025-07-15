document.addEventListener('DOMContentLoaded', function() {
    // Initialize status element
    const statusContainer = document.getElementById('status');

    // Get modal elements
    let analysisProgressModal;
    const analysisProgressModalElement = document.getElementById('analysisProgressModal');
    if (analysisProgressModalElement) {
        analysisProgressModal = new bootstrap.Modal(analysisProgressModalElement, {
            backdrop: 'static',
            keyboard: false
        });
    }
    const analysisProgressBar = document.getElementById('analysisProgressBar');
    const analysisProgressStatus = document.getElementById('analysisProgressStatus');

    let trainingProgressModal;
    const trainingProgressModalElement = document.getElementById('trainingProgressModal');
    if (trainingProgressModalElement) {
        trainingProgressModal = new bootstrap.Modal(trainingProgressModalElement, {
            keyboard: false
        });
    }
    const trainingProgressBar = document.getElementById('trainingProgressBar');
    const trainingProgressStatus = document.getElementById('trainingProgressStatus');
    const filesProcessed = document.getElementById('filesProcessed');
    const totalFiles = document.getElementById('totalFiles');

    // Handle file upload form submission
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Check if file is selected
            const audioFile = document.getElementById('audioFile');
            if (!audioFile.files || audioFile.files.length === 0) {
                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <div>Please select an audio file first</div>
                            </div>
                        </div>
                    `;
                }
                return;
            }

            // Show progress modal
            if (analysisProgressBar) {
                analysisProgressBar.style.width = '0%';
                analysisProgressBar.setAttribute('aria-valuenow', 0);
                analysisProgressBar.textContent = '0%';
            }

            if (analysisProgressStatus) {
                analysisProgressStatus.textContent = 'Preparing file for upload...';
            }

            if (analysisProgressModal) analysisProgressModal.show();

            // Update progress
            let currentStep = 0;
            const steps = ['Uploading file...', 'Processing audio...', 'Generating spectrogram...', 'Analyzing patterns...', 'Predicting text...'];

            // Function to update the progress bar
            const updateProgress = () => {
                currentStep++;
                const percentage = Math.min(Math.round((currentStep / steps.length) * 100), 100);

                if (analysisProgressBar) {
                    analysisProgressBar.style.width = `${percentage}%`;
                    analysisProgressBar.setAttribute('aria-valuenow', percentage);
                    analysisProgressBar.textContent = `${percentage}%`;
                }

                if (analysisProgressStatus && currentStep <= steps.length) {
                    analysisProgressStatus.textContent = steps[currentStep - 1];
                }
            };

            // Start progress updates
            updateProgress(); // First step

            // Set up timer to simulate progress steps
            const progressTimer = setInterval(() => {
                if (currentStep < steps.length) {
                    updateProgress();
                } else {
                    clearInterval(progressTimer);
                }
            }, 1500);

            const formData = new FormData(uploadForm);

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Clear progress timer and hide modal
                clearInterval(progressTimer);
                if (analysisProgressModal) analysisProgressModal.hide();

                if (data.error) {
                    throw new Error(data.error);
                }

                // Clear status
                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div class="alert alert-success">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-check-circle me-2"></i>
                                <div>Audio processed successfully!</div>
                            </div>
                        </div>
                    `;
                }

                // Display results
                const resultContainer = document.getElementById('resultContainer');
                if (resultContainer) {
                    resultContainer.classList.remove('d-none');

                    // Display predicted text
                    const predictedTextElement = document.getElementById('predictedText');
                    if (predictedTextElement) {
                        predictedTextElement.textContent = data.predicted_text;
                        
                        // Add keyboard visualization
                        const keyboardVisualization = document.getElementById('keyboardVisualization');
                        if (keyboardVisualization && window.createKeyboardVisualization && data.predicted_text) {
                            window.createKeyboardVisualization('keyboardVisualization', data.predicted_text);
                        }
                    }

                    // Display accuracy
                    const accuracyElement = document.getElementById('accuracyPercentage');
                    if (accuracyElement) {
                        accuracyElement.textContent = `${data.accuracy_percentage}%`;

                        // Set the width of the progress bar
                        const progressBar = document.querySelector('.progress-bar');
                        if (progressBar) {
                            progressBar.style.width = `${data.accuracy_percentage}%`;
                            progressBar.setAttribute('aria-valuenow', data.accuracy_percentage);

                            // Change color based on accuracy
                            progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
                            if (data.accuracy_percentage >= 80) {
                                progressBar.classList.add('bg-success');
                            } else if (data.accuracy_percentage >= 50) {
                                progressBar.classList.add('bg-warning');
                            } else {
                                progressBar.classList.add('bg-danger');
                            }
                        }
                    }

                    // Display spectrogram
                    if (data.spectrogram) {
                        const spectrogramContainer = document.getElementById('spectrogramContainer');
                        if (spectrogramContainer) {
                            // Call the visualization function from visualizations.js
                            renderSpectrogram(data.spectrogram, spectrogramContainer);
                        }
                    }

                    // Scroll to results
                    resultContainer.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <div>Error: ${error.message}</div>
                            </div>
                        </div>
                    `;
                }
            });
        });
    }

    // Handle audio recording
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const recordingStatus = document.getElementById('recordingStatus');

    if (recordButton && stopButton) {
        // Initialize audio recorder
        const audioRecorder = new AudioRecorder();

        recordButton.addEventListener('click', function() {
            // Start recording
            audioRecorder.start()
                .then(() => {
                    recordButton.classList.add('d-none');
                    stopButton.classList.remove('d-none');
                    if (recordingStatus) {
                        recordingStatus.classList.remove('d-none');
                    }
                })
                .catch(error => {
                    console.error('Recording error:', error);
                    if (statusContainer) {
                        statusContainer.innerHTML = `
                            <div class="alert alert-danger">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-exclamation-circle me-2"></i>
                                    <div>Error starting recording: ${error.message}</div>
                                </div>
                            </div>
                        `;
                    }
                });
        });

        stopButton.addEventListener('click', function() {
            // Stop recording
            audioRecorder.stop()
                .then(audioBlob => {
                    recordButton.classList.remove('d-none');
                    stopButton.classList.add('d-none');
                    if (recordingStatus) {
                        recordingStatus.classList.add('d-none');
                    }

                    // Show progress modal
                    if (analysisProgressBar) {
                        analysisProgressBar.style.width = '0%';
                        analysisProgressBar.setAttribute('aria-valuenow', 0);
                        analysisProgressBar.textContent = '0%';
                    }

                    if (analysisProgressStatus) {
                        analysisProgressStatus.textContent = 'Preparing recording for analysis...';
                    }

                    if (analysisProgressModal) analysisProgressModal.show();

                    // Update progress
                    let currentStep = 0;
                    const steps = ['Processing recording...', 'Converting audio...', 'Generating spectrogram...', 'Analyzing patterns...', 'Predicting text...'];

                    // Function to update the progress bar
                    const updateProgress = () => {
                        currentStep++;
                        const percentage = Math.min(Math.round((currentStep / steps.length) * 100), 100);

                        if (analysisProgressBar) {
                            analysisProgressBar.style.width = `${percentage}%`;
                            analysisProgressBar.setAttribute('aria-valuenow', percentage);
                            analysisProgressBar.textContent = `${percentage}%`;
                        }

                        if (analysisProgressStatus && currentStep <= steps.length) {
                            analysisProgressStatus.textContent = steps[currentStep - 1];
                        }
                    };

                    // Start progress updates
                    updateProgress(); // First step

                    // Set up timer to simulate progress steps
                    const progressTimer = setInterval(() => {
                        if (currentStep < steps.length) {
                            updateProgress();
                        } else {
                            clearInterval(progressTimer);
                        }
                    }, 1500);

                    // Create form data with audio blob
                    const formData = new FormData();
                    formData.append('audio_data', audioBlob, 'recording.wav');

                    // Send to server
                    fetch('/record', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            throw new Error(data.error);
                        }

                        // Clear status
                        if (statusContainer) {
                            statusContainer.innerHTML = `
                                <div class="alert alert-success">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle me-2"></i>
                                        <div>Recording processed successfully!</div>
                                    </div>
                                </div>
                            `;
                        }

                        // Display results
                        const resultContainer = document.getElementById('resultContainer');
                        if (resultContainer) {
                            resultContainer.classList.remove('d-none');

                            // Display predicted text
                            const predictedTextElement = document.getElementById('predictedText');
                            if (predictedTextElement) {
                                predictedTextElement.textContent = data.predicted_text;
                                
                                // Add keyboard visualization
                                const keyboardVisualization = document.getElementById('keyboardVisualization');
                                if (keyboardVisualization && window.createKeyboardVisualization && data.predicted_text) {
                                    window.createKeyboardVisualization('keyboardVisualization', data.predicted_text);
                                }
                            }

                            // Display accuracy
                            const accuracyElement = document.getElementById('accuracyPercentage');
                            if (accuracyElement) {
                                accuracyElement.textContent = `${data.accuracy_percentage}%`;

                                // Set the width of the progress bar
                                const progressBar = document.querySelector('.progress-bar');
                                if (progressBar) {
                                    progressBar.style.width = `${data.accuracy_percentage}%`;
                                    progressBar.setAttribute('aria-valuenow', data.accuracy_percentage);

                                    // Change color based on accuracy
                                    progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
                                    if (data.accuracy_percentage >= 80) {
                                        progressBar.classList.add('bg-success');
                                    } else if (data.accuracy_percentage >= 50) {
                                        progressBar.classList.add('bg-warning');
                                    } else {
                                        progressBar.classList.add('bg-danger');
                                    }
                                }
                            }

                            // Display spectrogram
                            if (data.spectrogram) {
                                const spectrogramContainer = document.getElementById('spectrogramContainer');
                                if (spectrogramContainer) {
                                    // Call the visualization function from visualizations.js
                                    renderSpectrogram(data.spectrogram, spectrogramContainer);
                                }
                            }

                            // Scroll to results
                            resultContainer.scrollIntoView({ behavior: 'smooth' });
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        if (statusContainer) {
                            statusContainer.innerHTML = `
                                <div class="alert alert-danger">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-exclamation-circle me-2"></i>
                                        <div>Error: ${error.message}</div>
                                    </div>
                                </div>
                            `;
                        }
                    });
                })
                .catch(error => {
                    console.error('Error stopping recording:', error);
                    if (statusContainer) {
                        statusContainer.innerHTML = `
                            <div class="alert alert-danger">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-exclamation-circle me-2"></i>
                                    <div>Error stopping recording: ${error.message}</div>
                                </div>
                            </div>
                        `;
                    }
                });
        });
    }

    // Handle standard training form
    const trainingForm = document.getElementById('trainingForm');
    if (trainingForm) {
        trainingForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData();
            const files = document.getElementById('trainingFiles').files;
            const groundTruth = document.getElementById('groundTruth').value;

            if (files.length === 0) {
                alert('Please select audio files to upload');
                return;
            }

            for (let file of files) {
                formData.append('files', file);
            }
            formData.append('ground_truth', groundTruth);

            try {
                const response = await fetch('/train', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Training completed successfully!');
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error uploading files: ' + error.message);
            }
        });
    }

    // Handle bulk training form
    const bulkTrainingForm = document.getElementById('bulkTrainingForm');
    const bulkTrainingFiles = document.getElementById('bulkTrainingFiles');
    const filePreview = document.getElementById('filePreview');
    const filePreviewList = document.getElementById('filePreviewList');
    const convertUnderscores = document.getElementById('convertUnderscores');
    const convertHyphens = document.getElementById('convertHyphens');

    if (bulkTrainingForm && bulkTrainingFiles) {
        // Show file preview when files are selected
        bulkTrainingFiles.addEventListener('change', function() {
            if (filePreview && filePreviewList) {
                // Clear previous preview
                filePreviewList.innerHTML = '';

                if (this.files.length > 0) {
                    filePreview.classList.remove('d-none');

                    // Get conversion settings
                    const underscoreConversion = convertUnderscores && convertUnderscores.checked;
                    const hyphenConversion = convertHyphens && convertHyphens.checked;

                    // Add each file to the preview
                    Array.from(this.files).forEach(file => {
                        const filename = file.name;
                        // Extract the base name without extension
                        const baseName = filename.substring(0, filename.lastIndexOf('.'));

                        // Apply conversions to preview what the ground truth will be
                        let groundTruth = baseName;
                        if (underscoreConversion) {
                            groundTruth = groundTruth.replace(/_/g, ' ');
                        }
                        if (hyphenConversion) {
                            groundTruth = groundTruth.replace(/-/g, ' ');
                        }

                        // Add row to preview table
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${filename}</td>
                            <td>${groundTruth}</td>
                        `;
                        filePreviewList.appendChild(row);
                    });
                } else {
                    filePreview.classList.add('d-none');
                }
            }
        });

        // Update preview when conversion options change
        if (convertUnderscores) {
            convertUnderscores.addEventListener('change', function() {
                // Trigger preview update
                const event = new Event('change');
                bulkTrainingFiles.dispatchEvent(event);
            });
        }

        if (convertHyphens) {
            convertHyphens.addEventListener('change', function() {
                // Trigger preview update
                const event = new Event('change');
                bulkTrainingFiles.dispatchEvent(event);
            });
        }

        // Submit bulk training form with progress modal
        bulkTrainingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (bulkTrainingFiles.files.length === 0) {
                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div class="alert alert-warning">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <div>Please select audio files for training.</div>
                            </div>
                        </div>
                    `;
                }
                return;
            }

            // Set up progress modal
            if (totalFiles) totalFiles.textContent = bulkTrainingFiles.files.length;
            if (filesProcessed) filesProcessed.textContent = '0';

            // Show progress bar at 0%
            if (trainingProgressBar) {
                trainingProgressBar.style.width = '0%';
                trainingProgressBar.setAttribute('aria-valuenow', 0);
                trainingProgressBar.textContent = '0%';
            }

            // Update status message
            if (trainingProgressStatus) {
                trainingProgressStatus.textContent = 'Preparing files for upload...';
            }

            // Show the modal
            if (trainingProgressModal) trainingProgressModal.show();

            // Create FormData
            const formData = new FormData(bulkTrainingForm);

            // Simulate progress updates (in a real implementation, this would come from the server)
            let progress = 0;
            const totalSteps = bulkTrainingFiles.files.length * 2; // Upload + processing
            const progressInterval = setInterval(() => {
                progress += 1;

                // Calculate percentage
                const percentage = Math.min(Math.floor((progress / totalSteps) * 100), 99);

                // Update progress bar
                if (trainingProgressBar) {
                    trainingProgressBar.style.width = `${percentage}%`;
                    trainingProgressBar.setAttribute('aria-valuenow', percentage);
                    trainingProgressBar.textContent = `${percentage}%`;
                }

                // Update file counter (each file has multiple steps)
                const currentFileIndex = Math.min(Math.floor(progress / 2), bulkTrainingFiles.files.length);
                if (filesProcessed) {
                    filesProcessed.textContent = currentFileIndex;
                }

                // Update status message based on progress
                if (trainingProgressStatus) {
                    if (percentage < 20) {
                        trainingProgressStatus.textContent = 'Uploading files...';
                    } else if (percentage < 40) {
                        trainingProgressStatus.textContent = 'Processing audio data...';
                    } else if (percentage < 60) {
                        trainingProgressStatus.textContent = 'Extracting features...';
                    } else if (percentage < 80) {
                        trainingProgressStatus.textContent = 'Training CNN model...';
                    } else {
                        trainingProgressStatus.textContent = 'Training HMM model...';
                    }
                }

                // Stop when we reach the end
                if (progress >= totalSteps) {
                    clearInterval(progressInterval);
                }
            }, 100);

            // Send the form data to the server
            fetch('/bulk_train', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Clear the progress interval
                clearInterval(progressInterval);

                if (data.error) {
                    throw new Error(data.error);
                }

                // Show 100% completion
                if (trainingProgressBar) {
                    trainingProgressBar.style.width = '100%';
                    trainingProgressBar.setAttribute('aria-valuenow', 100);
                    trainingProgressBar.textContent = '100%';
                }

                if (trainingProgressStatus) {
                    trainingProgressStatus.textContent = 'Training complete!';
                }

                // Hide the modal after a short delay
                setTimeout(() => {
                    if (trainingProgressModal) trainingProgressModal.hide();

                    // Clear form
                    bulkTrainingForm.reset();
                    if (filePreview) {
                        filePreview.classList.add('d-none');
                    }

                    // Show success message
                    if (statusContainer) {
                        statusContainer.innerHTML = `
                            <div class="alert alert-success">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-check-circle me-2"></i>
                                    <div>${data.message}</div>
                                </div>
                            </div>
                        `;
                    }

                    // Show training details
                    if (data.file_details && data.file_details.length > 0) {
                        let detailsHTML = '<div class="mt-3"><h6>Processed Files:</h6><ul class="list-group">';

                        data.file_details.forEach(file => {
                            detailsHTML += `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span><strong>${file.filename}</strong></span>
                                    <span class="badge bg-primary rounded-pill">"${file.ground_truth}"</span>
                                </li>
                            `;
                        });

                        detailsHTML += '</ul></div>';

                        statusContainer.innerHTML += detailsHTML;
                    }
                }, 1000);
            })
            .catch(error => {
                // Clear the progress interval
                clearInterval(progressInterval);

                // Hide the modal
                if (trainingProgressModal) trainingProgressModal.hide();

                console.error('Error:', error);
                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <div>Error: ${error.message}</div>
                            </div>
                        </div>
                    `;
                }
            });
        });
    }

    // Reset training button
    const resetTrainingButton = document.getElementById('resetTrainingButton');
    if (resetTrainingButton) {
        resetTrainingButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to reset all training data? This cannot be undone.')) {
                // Show loading status
                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div class="alert alert-info">
                            <div class="d-flex align-items-center">
                                <div class="spinner-border spinner-border-sm me-2" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <div>Resetting training data...</div>
                            </div>
                        </div>
                    `;
                }

                fetch('/reset_training', {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }

                    // Show success message
                    if (statusContainer) {
                        statusContainer.innerHTML = `
                            <div class="alert alert-success">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-check-circle me-2"></i>
                                    <div>${data.message}</div>
                                </div>
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    if (statusContainer) {
                        statusContainer.innerHTML = `
                            <div class="alert alert-danger">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-exclamation-circle me-2"></i>
                                    <div>Error: ${error.message}</div>
                                </div>
                            </div>
                        `;
                    }
                });
            }
        });
    }

    // Handle feedback forms
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form values
            const predictedText = document.getElementById('predictedText').textContent;
            const correctText = document.getElementById('correctText').value;
            const accuracyRating = document.querySelector('input[name="accuracyRating"]:checked')?.value;
            const comments = document.getElementById('feedbackComments').value;

            if (!correctText) {
                alert('Please enter the correct text.');
                return;
            }

            if (!accuracyRating) {
                alert('Please rate the prediction accuracy.');
                return;
            }

            // Create payload
            const payload = {
                audio_filename: 'user_feedback.wav',  // Placeholder filename
                predicted_text: predictedText,
                correct_text: correctText,
                accuracy_rating: parseInt(accuracyRating),
                comments: comments
            };

            // Show loading status
            if (statusContainer) {
                statusContainer.innerHTML = `
                    <div class="alert alert-info">
                        <div class="d-flex align-items-center">
                            <div class="spinner-border spinner-border-sm me-2" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <div>Submitting feedback...</div>
                        </div>
                    </div>
                `;
            }

            fetch('/submit_feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }

                // Clear form
                feedbackForm.reset();

                // Show success message
                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div class="alert alert-success">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-check-circle me-2"></i>
                                <div>${data.message}</div>
                            </div>
                        </div>
                    `;
                }

                // Hide feedback form
                const feedbackContainer = document.getElementById('feedbackContainer');
                if (feedbackContainer) {
                    feedbackContainer.classList.add('d-none');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <div>Error: ${error.message}</div>
                            </div>
                        </div>
                    `;
                }
            });
        });
    }

    // Toggle feedback form
    const showFeedbackButton = document.getElementById('showFeedbackButton');
    if (showFeedbackButton) {
        showFeedbackButton.addEventListener('click', function() {
            const feedbackContainer = document.getElementById('feedbackContainer');
            if (feedbackContainer) {
                feedbackContainer.classList.toggle('d-none');

                // Scroll to feedback form
                if (!feedbackContainer.classList.contains('d-none')) {
                    feedbackContainer.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
});
