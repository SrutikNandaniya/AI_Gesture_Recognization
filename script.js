 const URL = "https://teachablemachine.withgoogle.com/models/OGFZF5G5X/";
    let model = null;
    let webcam = null;
    let labelContainer = null;
    let maxPredictions = 0;
    let isRunning = false;

    // Load the model
    async function loadModel() {
        try {
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";
            model = await tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();
            return true;
        } catch (error) {
            console.error("Model loading error:", error);
            return false;
        }
    }

    // Initialize the camera and start recognition
    async function init() {
        if (isRunning) return;
        
        const loadingOverlay = document.getElementById("loadingOverlay");
        const placeholderImage = document.getElementById('placeholderImage');
        const webcamContainer = document.getElementById("webcam-container");
        const predictionPanel = document.getElementById("predictionPanel");
        
        if (!loadingOverlay || !placeholderImage || !webcamContainer || !predictionPanel) {
            console.error("Required elements not found in the DOM");
            return;
        }
        
        loadingOverlay.classList.add("active");
        placeholderImage.classList.add("hidden");
        webcamContainer.classList.add("active");
        predictionPanel.classList.remove("hidden");

        try {
            // Load model if not already loaded
            if (!model) {
                const modelLoaded = await loadModel();
                if (!modelLoaded) {
                    throw new Error("Failed to load model");
                }
            }

            // Stop any existing webcam
            if (webcam) {
                await webcam.stop();
                webcam = null;
            }

            // Initialize webcam with direct settings
            webcam = new tmImage.Webcam(400, 400, true);
            await webcam.setup({
                facingMode: "user",
                width: 400,
                height: 400
            });
            
            // Clear and setup containers
            webcamContainer.innerHTML = '';
            webcamContainer.appendChild(webcam.canvas);
            labelContainer = document.getElementById("label-container");
            if (!labelContainer) {
                throw new Error("Label container not found");
            }
            labelContainer.innerHTML = '';
            
            // Start the webcam
            await webcam.play();
            
            // Update UI
            document.getElementById("stopBtn").classList.remove("hidden");
            document.getElementById("resetBtn").classList.add("hidden");
            document.querySelector(".btn-primary").classList.add("hidden");
            
            // Start prediction loop
            isRunning = true;
            predictLoop();
            
        } catch (error) {
            console.error("Error initializing camera:", error);
            alert("Failed to initialize camera. Please check your camera permissions and try again.");
            resetCamera();
        } finally {
            loadingOverlay.classList.remove("active");
        }
    }

    function resetCamera() {
        if (webcam) {
            webcam.stop();
            webcam = null;
        }
        
        isRunning = false;
        
        const webcamContainer = document.getElementById("webcam-container");
        const labelContainer = document.getElementById("label-container");
        const placeholderImage = document.getElementById('placeholderImage');
        const predictionPanel = document.getElementById("predictionPanel");
        
        if (webcamContainer) webcamContainer.innerHTML = '';
        if (labelContainer) labelContainer.innerHTML = '';
        
        if (placeholderImage) placeholderImage.classList.remove("hidden");
        if (webcamContainer) webcamContainer.classList.remove("active");
        if (predictionPanel) predictionPanel.classList.add("hidden");
        
        const startBtn = document.querySelector(".btn-primary");
        const stopBtn = document.getElementById("stopBtn");
        const resetBtn = document.getElementById("resetBtn");
        
        if (startBtn) startBtn.classList.remove("hidden");
        if (stopBtn) stopBtn.classList.add("hidden");
        if (resetBtn) resetBtn.classList.add("hidden");
    }

    function stopCamera() {
        if (webcam) {
            webcam.stop();
            webcam = null;
        }
        
        isRunning = false;
        
        const webcamContainer = document.getElementById("webcam-container");
        const labelContainer = document.getElementById("label-container");
        
        if (webcamContainer) webcamContainer.innerHTML = '';
        if (labelContainer) labelContainer.innerHTML = '';
        
        const stopBtn = document.getElementById("stopBtn");
        const resetBtn = document.getElementById("resetBtn");
        
        if (stopBtn) stopBtn.classList.add("hidden");
        if (resetBtn) resetBtn.classList.remove("hidden");
    }

    async function predictLoop() {
        if (!isRunning || !webcam) return;
        
        try {
            webcam.update();
            await predict();
            requestAnimationFrame(predictLoop);
        } catch (error) {
            console.error("Error in prediction loop:", error);
            resetCamera();
        }
    }

    async function predict() {
        if (!model || !webcam || !labelContainer) return;
        
        try {
            const prediction = await model.predict(webcam.canvas);
            labelContainer.innerHTML = '';
            
            prediction.forEach((pred, index) => {
                const card = document.createElement('div');
                card.className = 'prediction-card fade-in';
                card.style.animationDelay = `${index * 0.1}s`;
                
                const name = document.createElement('div');
                name.className = 'prediction-name';
                name.textContent = pred.className;
                
                const probability = document.createElement('div');
                probability.className = 'prediction-probability';
                
                const probabilityLabel = document.createElement('div');
                probabilityLabel.className = 'probability-label';
                probabilityLabel.textContent = 'Accuracy';
                
                const probabilityValue = document.createElement('div');
                probabilityValue.className = 'probability-value';
                probabilityValue.textContent = `${(pred.probability * 100).toFixed(1)}%`;
                
                probability.appendChild(probabilityLabel);
                probability.appendChild(probabilityValue);
                
                const accuracyIndicator = document.createElement('div');
                accuracyIndicator.className = 'accuracy-indicator';
                
                const accuracyLine = document.createElement('div');
                accuracyLine.className = 'accuracy-line';
                accuracyLine.style.width = `${pred.probability * 100}%`;
                
                accuracyIndicator.appendChild(accuracyLine);
                
                card.appendChild(name);
                card.appendChild(probability);
                card.appendChild(accuracyIndicator);
                labelContainer.appendChild(card);
            });
        } catch (error) {
            console.error("Error in prediction:", error);
        }
    }

    // Load the model when the page loads
    loadModel();

// === DARK MODE TOGGLE ===
(function() {
    const appContainer = document.querySelector('.app-container');
    const toggleBtn = document.getElementById('darkModeToggle');
    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;
    const darkModeKey = 'ai-gesture-dark-mode';

    function setDarkMode(on) {
        if (!appContainer) return;
        if (on) {
            appContainer.classList.add('dark-mode');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        } else {
            appContainer.classList.remove('dark-mode');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }

    // Load preference
    const saved = localStorage.getItem(darkModeKey);
    if (saved === 'dark') setDarkMode(true);
    else if (saved === 'light') setDarkMode(false);
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkMode(true);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const isDark = appContainer.classList.contains('dark-mode');
            setDarkMode(!isDark);
            localStorage.setItem(darkModeKey, !isDark ? 'dark' : 'light');
        });
    }
})();