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

// Handle user input and write to Firebase
function handleInput(event) {
    const text = event.target.value;
    database.ref('currentText').set({ text });
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

