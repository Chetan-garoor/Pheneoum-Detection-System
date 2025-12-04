document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // DOM elements
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const fileSelectBtn = document.getElementById('file-select-btn');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const fileName = document.getElementById('file-name');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const resultsSection = document.getElementById('results-section');
    const uploadSection = document.getElementById('upload-section');
    const resultImage = document.getElementById('result-image');
    const resultIcon = document.getElementById('result-icon');
    const resultStatus = document.getElementById('result-status');
    const confidenceFill = document.getElementById('confidence-fill');
    const confidenceValue = document.getElementById('confidence-value');
    const confidenceText = document.getElementById('confidence-text');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const demoModeBadge = document.getElementById('demo-mode-badge');
    
    // Check if demo mode or production mode
    let isDemoMode = true;
    // Set demo mode based on server environment - this will be updated by Flask
    fetch('/check-mode')
        .then(response => response.json())
        .then(data => {
            isDemoMode = data.demo_mode;
            demoModeBadge.style.display = isDemoMode ? 'block' : 'none';
        })
        .catch(() => {
            // If error, assume demo mode
            isDemoMode = true;
            demoModeBadge.style.display = 'block';
        });
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Handle file selection via button
    fileSelectBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files);
        }
    });
    
    function handleFiles(files) {
        const file = files[0];
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            showError('Please select a valid image file (JPEG, JPG, or PNG).');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('File size is too large. Please select an image under 5MB.');
            return;
        }
        
        // Clear any previous errors
        hideError();
        
        // Display preview
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            fileName.textContent = file.name;
            previewContainer.style.display = 'block';
            
            // Scroll to preview if on mobile
            if (window.innerWidth < 768) {
                previewContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }
        reader.readAsDataURL(file);
    }
    
    // Analyze button click handler
    analyzeBtn.addEventListener('click', function() {
        if (!fileInput.files || fileInput.files.length === 0) {
            showError('Please select an image first.');
            return;
        }
        
        // Show loading state
        previewContainer.style.display = 'none';
        loadingIndicator.style.display = 'block';
        hideError();
        
        if (isDemoMode) {
            // In demo mode, simulate API response after a delay
            setTimeout(() => {
                simulatePrediction(fileInput.files[0]);
            }, 2000);
        } else {
            // Regular API call
            // Prepare form data
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            // Make API request
            fetch('/predict', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || 'Network response was not ok');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Display results
                displayResults(data);
            })
            .catch(error => {
                console.error('Error:', error);
                loadingIndicator.style.display = 'none';
                previewContainer.style.display = 'block';
                showError(error.message || 'An error occurred while analyzing the image. Please try again.');
            });
        }
    });
    
    // Function to simulate a prediction for demo mode
    function simulatePrediction(file) {
        // Generate a random prediction (for demo purposes)
        const isPneumonia = Math.random() > 0.5;
        const confidence = 70 + Math.random() * 25; // Random confidence between 70-95%
        
        const result = {
            prediction: isPneumonia ? "Pneumonia Detected" : "Normal (No Pneumonia)",
            confidence: `${confidence.toFixed(2)}%`,
            confidence_raw: parseFloat(confidence.toFixed(2)),
            filename: file.name,
            status: 'success'
        };
        
        displayResults(result);
    }
    
    function displayResults(data) {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        // Set result image
        resultImage.src = imagePreview.src;
        
        // Determine if prediction is positive or negative
        const isPositive = data.prediction.includes('Pneumonia');
        const confidencePercent = data.confidence_raw || parseFloat(data.confidence) || 0;
        
        // Set result icon and status
        if (isPositive) {
            resultIcon.innerHTML = '⚠️'; // Warning icon
            resultIcon.className = 'result-icon positive';
            resultStatus.textContent = 'Pneumonia Detected';
            resultStatus.className = 'result-status positive';
            confidenceFill.className = 'confidence-fill positive';
        } else {
            resultIcon.innerHTML = '✓'; // Check mark
            resultIcon.className = 'result-icon negative';
            resultStatus.textContent = 'No Pneumonia Detected';
            resultStatus.className = 'result-status negative';
            confidenceFill.className = 'confidence-fill negative';
        }
        
        // Set confidence fill width to 0 initially for animation
        confidenceFill.style.width = '0%';
        
        // Animate confidence meter
        setTimeout(() => {
            confidenceFill.style.width = `${confidencePercent}%`;
        }, 100);
        
        // Set confidence text
        confidenceValue.textContent = `${confidencePercent.toFixed(1)}% Confidence`;
        confidenceText.textContent = data.confidence || `Confidence: ${confidencePercent.toFixed(1)}%`;
        
        // Show results section
        uploadSection.style.display = 'none';
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Try again button
    tryAgainBtn.addEventListener('click', resetForm);
    
    function resetForm() {
        // Reset file input
        fileInput.value = '';
        imagePreview.src = '';
        fileName.textContent = '';
        previewContainer.style.display = 'none';
        
        // Reset results display
        confidenceFill.style.width = '0%';
        
        // Show upload section and hide results
        uploadSection.style.display = 'block';
        resultsSection.style.display = 'none';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Scroll to error if on mobile
        if (window.innerWidth < 768) {
            errorMessage.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
    }
});