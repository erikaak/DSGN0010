// WebGL shader code for visual effects
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
    color += mix(colors[i], vec3(1.0), glow);
  }
  for (int i = 0; i < int(trailCount); i++) {
    vec2 uv = trail[i];
    float distance = length(st - uv);
    color += vec3(1.0) / (distance * 100.0);
  }
  gl_FragColor = vec4(color, 1.0);
}
`;

// Array to hold 3D text objects
let objects = [];

function setup() {
  createCanvas(windowWidth * 2/3, windowHeight, WEBGL).parent('webglCanvas');
  pixelDensity(1);
  noCursor();
  // Setup Firebase
  const firebaseConfig = {
    // Your Firebase config
  };
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  listenForUpdates(database);
}

function draw() {
  background(0);
  orbitControl();

  objects.forEach(obj => {
    push();
    let screenPos = screenPosition(obj.x, obj.y, obj.z);
    let d = dist(mouseX, mouseY, screenPos.x, screenPos.y);
    
    // Hover effect
    let textSizeVal = 24; // Default text size
    let boxSize = 20; // Default box size
    if (d < 50) { // Threshold for hover effect
      textSizeVal = 30; // Increased text size
      boxSize = 30; // Increased box size
    }

    // Update position
    obj.x += obj.speed * obj.direction;
    if ((obj.direction === 1 && obj.x > 200) || (obj.direction === -1 && obj.x < -200)) {
      obj.direction *= -1;
    }

    // Draw text
    translate(obj.x, obj.y, obj.z);
    fill(obj.color);
    textFont(obj.font);
    textSize(textSizeVal);
    text(obj.text, 0, 0);
    pop();

    // Draw box
    push();
    translate(obj.x, obj.y, obj.z);
    fill(obj.color);
    box(boxSize);
    pop();
  });
}

function listenForUpdates(database) {
  database.ref('userInput').on('child_added', function(snapshot) {
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
