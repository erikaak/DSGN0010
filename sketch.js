// Shader code with color scheme support
let vertShader = `
precision mediump float;
attribute vec3 aPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

let fragShader = `
precision mediump float;
uniform vec2 resolution;
uniform float trailCount;
uniform vec2 trail[MAX_TRAIL_COUNT];
uniform float particleCount;
uniform vec3 particles[MAX_PARTICLE_COUNT];
uniform vec3 colors[MAX_PARTICLE_COUNT];
void main() {
  vec2 st = gl_FragCoord.xy / resolution.xy;
  vec3 color = vec3(0.0);
  for (int i = 0; i < int(particleCount); i++) {
    vec2 uv = particles[i].xy;
    float distance = length(st - uv);
    float glow = smoothstep(0.05, 0.0, 1.0 / distance);
    color += mix(colors[i], vec3(1.0), glow); // Blend particle color with white based on distance
  }
  for (int i = 0; i < int(trailCount); i++) {
    vec2 uv = trail[i];
    float distance = length(st - uv);
    color += vec3(1.0) / (distance * 100.0); // Add a glowing effect for trails
  }
  gl_FragColor = vec4(color, 1.0);
}
`;


// Particle class
class Particle {
  constructor(x, y, vx, vy, color) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.color = color; // Set color directly instead of using random color
  }
  
  move() {
    this.pos.add(this.vel);
  }
}

// Array to hold particles
let particles = [];
let colorScheme = [
  [255, 200, 100],  // Bright orange
  [255, 150, 50],   // Bright orange-yellow
  [255, 200, 50],   // Bright yellow
  [200, 255, 50],   // Bright lime green
  [50, 255, 100],   // Bright green
  [50, 200, 255],   // Bright cyan
  [100, 150, 255],  // Bright light blue
  [200, 100, 255],  // Bright violet
  [255, 100, 200],  // Bright magenta
  [255, 100, 100],  // Bright pink
  [255, 255, 255],  // White
];

// Firebase setup
function setupFirebase() {
  const firebaseConfig = {
    // Your Firebase configuration
  };
  firebase.initializeApp(firebaseConfig);
}

function setup() {
  createCanvas(windowWidth * 2/3, windowHeight, WEBGL).parent('webglCanvas');
  pixelDensity(1);
  noCursor();
  
  setupFirebase(); // Initialize Firebase
  listenForUpdates();
  listenForParticleUpdates(); // Listen for real-time particle updates
}

function draw() {
  background(0);
  orbitControl();
  
  // Display particles
  particles.forEach(p => {
    fill(p.color);
    ellipse(p.pos.x, p.pos.y, 8, 8);
    p.move();
  });
}

function listenForParticleUpdates() {
  const particleRef = firebase.database().ref('particles');
  particleRef.on('child_added', snapshot => {
    const p = snapshot.val();
    particles.push(new Particle(p.x, p.y, p.vx, p.vy, p.color));
  });
}



function updateText() {
  let inputText = document.getElementById('userInput').value.trim();
  let selectedFont = document.getElementById('fontSelector').value;
  let selectedColor = document.getElementById('colorSelector').value;
  if (inputText === "xxx") {
    clearScreen(); // Call clearScreen function when inputText is "xxx"
    document.getElementById('userInput').value = '';
    redraw(); // Redraw the canvas after clearing
    return; // Exit the function
  }
  if (inputText !== "") {
      objects.push({
          x: random(-200, 200),
          y: random(-200, 200),
          z: random(-200, 200),
          speed: random(1, 5),
          direction: random([-1, 1]),
          color: selectedColor,
          font: selectedFont,
          text: inputText
      });
      document.getElementById('userInput').value = '';
  }
}

function clearScreen() {
  particles = []; // Clear particles array
  objects = []; // Clear objects array
}

function draw() {  
  background(0);
  orbitControl();
  objects.forEach(obj => {
      push();
      translate(obj.x, obj.y, obj.z);
      fill(obj.color);
      textFont(obj.font);
      textSize(24); // Adjust text size if necessary
      text(obj.text, 0, 0); // Draw text at object's location
      pop();

      // Update position and direction
      obj.z += obj.speed * obj.direction;
      if ((obj.direction === 1 && obj.z > 200) || (obj.direction === -1 && obj.z < -200)) {
          obj.direction *= -1; // Change direction upon reaching a certain point
      }

  });

  graphics.clear();
  objects.forEach(obj => {
      graphics.fill(obj.color);
      graphics.textFont(obj.font);
      graphics.text(obj.text, obj.x + width / 2, obj.y + height / 2, obj.z);
  
      push();
      translate(obj.x, obj.y, obj.z);
      fill(obj.color);
      box(20); // Drawing a simple box
      pop();
    });
  image(graphics, -width / 2, -height / 2);

  // Display particles
  particles.forEach(p => {
      fill(p.color);
      ellipse(p.pos.x, p.pos.y, 8, 8);
      p.move();
  });
}

function mouseDragged() {
  let newParticle = new Particle(pmouseX - width / 2, pmouseY - height / 2, mouseX - pmouseX, mouseY - pmouseY);
  particles.push(newParticle);
  database.ref('particles').push(newParticle.serialize());
}

function mousePressed() {
  // Check if the mouse button pressed is the left mouse button
  if (mouseButton === LEFT) {
    // Randomly choose between changing color and exploding
    let randomAction = random();
    if (randomAction < 0.5) {
      // Change color
      let particleIndex = int(random(particles.length)); // Choose a random particle
      particles[particleIndex].color = random(colorScheme); // Change its color to a random color
    } else {
      // Explode
      let particleIndex = int(random(particles.length)); // Choose a random particle
      particles[particleIndex].explode(); // Make it explode
      particles.splice(particleIndex, 1); // Remove the original particle
    }
  }
  
  // Clear particles if right-clicked
  if (mouseButton === RIGHT) {
    particles = [];
  }
}

function initFirebaseObjects() {
  const database = firebase.database();
  database.ref('userInputs').on('child_added', function(snapshot) {
      const data = snapshot.val();
      addNewObject(data);
  });
}

function addNewObject(data) {
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



function resetView() {
  if (objects.length > 0) {
    // Calculate the centroid of text objects only
    let sumX = 0, sumY = 0, sumZ = 0;

    for (let obj of objects) {
        sumX += obj.x;
        sumY += obj.y;
        sumZ += obj.z;
    }

    let centerX = sumX / objects.length;
    let centerY = sumY / objects.length;
    let centerZ = sumZ / objects.length - 500; // Subtracted 500 to set a reasonable default distance

    // Set the camera to look at the centroid of text objects
    camera(centerX, centerY, centerZ + (height / 2) / tan(PI * 30.0 / 180.0), centerX, centerY, centerZ, 0, 1, 0);
  } else {
    // Reset to default view if there are no text objects
    camera(0, 0, (height/2) / tan(PI/6), 0, 0, 0, 0, 1, 0);
  }
}


function listenForParticleUpdates() {
  const particleRef = firebase.database().ref('particles');
  particleRef.on('child_added', snapshot => {
    const p = snapshot.val();
    particles.push(new Particle(p.x, p.y, p.vx, p.vy, p.color));
  });
}

function listenForUpdates() {
  const database = firebase.database();
  database.ref('userInputs').on('child_added', function(snapshot) {
    const data = snapshot.val();
    if (data) {
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
  });
}
