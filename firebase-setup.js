// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBzosBKCqg8aiVJrX5IaMTKvbnyZYQGfcQ",
    authDomain: "dsgn-0010.firebaseapp.com",
    databaseURL: "https://dsgn-0010-default-rtdb.firebaseio.com",
    projectId: "dsgn-0010",
    storageBucket: "dsgn-0010.appspot.com",
    messagingSenderId: "786787914010",
    appId: "1:786787914010:web:229c5ec98abbf1992b5ca3"

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
