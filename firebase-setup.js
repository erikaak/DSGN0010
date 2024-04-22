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
