// Teachable Machine model URL
const URL = "https://teachablemachine.withgoogle.com/models/UJ-6ZpJR6/";
let model, webcam, labelContainer, maxPredictions;
let ListOfIngredients = [];

// Initialize webcam and model
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Setup webcam
    const flip = true;
    webcam = new tmImage.Webcam(200, 200, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    document.getElementById("webcam-container").appendChild(webcam.canvas);

    // Setup label container
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

// Main prediction loop
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// Predict function
let lastDetected = {}; // Track last detection timestamps
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    const currentTime = Date.now();
    for (let i = 0; i < maxPredictions; i++) {
        const { className, probability } = prediction[i];
        const classPrediction = `${className}: ${probability.toFixed(2)}`;
        labelContainer.childNodes[i].innerHTML = classPrediction;

        if (probability > 0.2 && (!lastDetected[className] || currentTime - lastDetected[className] > 1000)) {
            if (!ListOfIngredients.includes(className)) {
                ListOfIngredients.push(className);
            }
            lastDetected[className] = currentTime; // Update detection timestamp
        }
    }
}

// Send message function
function sendMessage() {
    const userInput = document.getElementById("user-input").value;
    if (userInput.trim() === "") return;

    addMessageToChat(userInput, 'user');

    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: userInput,
            Ingredients: getUniqueIngredients()
        }),
    })
    .then(response => response.json())
    .then(data => {
        addMessageToChat(data.response, 'bot');
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    document.getElementById("user-input").value = "";
}

function getUniqueIngredients() {
    return [...new Set(ListOfIngredients)];
}

// Add message to chat
function addMessageToChat(message, sender) {
    const chatContainer = document.getElementById("chat-container");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender + "-message");
    messageElement.textContent = message;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Event listener for Enter key
document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});