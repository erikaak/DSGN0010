// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCr0modZkiiHbrYsSCQijpiCkPWE7v7Lag",
    authDomain: "dsgn-0010-final-project.firebaseapp.com",
    databaseURL: "https://dsgn-0010-final-project-default-rtdb.firebaseio.com",
    projectId: "dsgn-0010-final-project",
    storageBucket: "dsgn-0010-final-project.appspot.com",
    messagingSenderId: "764278519998",
    appId: "1:764278519998:web:81efd8f6ea0768ccc6c6ef"
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

