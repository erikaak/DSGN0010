// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCnET0MG8IWwTtvX1Y5m9IKRetZRHUJLY8",
    authDomain: "dsgn0010-405.firebaseapp.com",
    databaseURL: "https://dsgn0010-405-default-rtdb.firebaseio.com",
    projectId: "dsgn0010-405",
    storageBucket: "dsgn0010-405.appspot.com",
    messagingSenderId: "672215177148",
    appId: "1:672215177148:web:9b4a888eaa64f67825fdb9"

};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Listen for changes to user inputs in real-time and update the display
database.ref('userInput').on('child_added', function(snapshot) {
const data = snapshot.val();
if (data) {
    displayUserInput(data);
}
});

function displayUserInput(data) {
// Update the p5.js sketch with user input
objects.push({
    x: random(-200, 200),
    y: random(-200, 200),
    z: random(-200, 200),
    speed: random(1, 5),
    direction: random([-1, 1]),
    color: data.color,
    font: data.font,
    text: data.text
});
}

// Submit button click event
document.getElementById("submitBtn").addEventListener("click", function() {
const inputText = document.getElementById('userInput').value.trim();
const selectedFont = document.getElementById('fontSelector').value;
const selectedColor = document.getElementById('colorSelector').value;
if (inputText !== "") {
    // Save to Firebase and clear the input field
    saveToFirebase(inputText, selectedFont, selectedColor);
    document.getElementById('userInput').value = '';
}
});

function saveToFirebase(text, font, color) {
// Push user input data to Firebase database
database.ref('userInput').push({
    text: text,
    font: font,
    color: color,
    timestamp: firebase.database.ServerValue.TIMESTAMP
});
}

// Listen for real-time updates
database.ref('currentText').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Assuming `updateDisplayArea` is a function in `sketch.js` that handles the display logic
        updateDisplayArea(data.text);
    }
});

// Example function to be defined in `sketch.js` or another script
function updateDisplayArea(text) {
    // Update some part of your p5.js sketch or page
    document.getElementById('displayArea').innerText = text;
}
