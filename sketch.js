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

// Color scheme for particles and other visual elements
let colorScheme = [
  [255, 200, 100], [255, 150, 50], [255, 200, 50],
  [200, 255, 50], [50, 255, 100], [50, 200, 255],
  [100, 150, 255], [200, 100, 255], [255, 100, 200],
  [255, 100, 100], [255, 255, 255]
];

class Particle {
  constructor(x, y, vx, vy, color = random(colorScheme)) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.color = color;
  }

  move() {
    this.pos.add(this.vel);
  }

  serialize() {
    return {
      x: this.pos.x,
      y: this.pos.y,
      vx: this.vel.x,
      vy: this.vel.y,
      color: this.color
    };
  }

  explode() {
    let numParticles = int(random(5, 15));
    for (let i = 0; i < numParticles; i++) {
      let angle = random(TWO_PI);
      let speed = random(1, 3);
      let vx = speed * cos(angle);
      let vy = speed * sin(angle);
      let newParticle = new Particle(this.pos.x, this.pos.y, vx, vy, this.color);
      particles.push(newParticle);
      // Send new particle data to Firebase
      database.ref('particles').push(newParticle.serialize());
    }
  }
}

let particles = [];
let graphics; // 2D graphics buffer for text
let objects = []; // Array to hold 3D objects

function setup() {
  createCanvas(windowWidth * 2/3, windowHeight, WEBGL).parent('webglCanvas');
  graphics = createGraphics(windowWidth / 3, windowHeight);
  graphics.textSize(20);
  graphics.textAlign(CENTER, CENTER);
  pixelDensity(1);
  noCursor();

  // Listen for updates from Firebase
  listenForUpdates();
  listenForParticleUpdates();
}

function updateText() {
  let inputText = document.getElementById('userInput').value.trim();
  let selectedFont = document.getElementById('fontSelector').value;
  let selectedColor = document.getElementById('colorSelector').value;
  if (inputText !== "") {
    let newTextObject = {
      x: random(-200, 200),
      y: random(-200, 200),
      z: random(-200, 200),
      speed: random(1, 5),
      direction: random([-1, 1]),
      color: selectedColor,
      font: selectedFont,
      text: inputText
    };
    objects.push(newTextObject); // Add immediately for display
    database.ref('userInputs').push(newTextObject); // Push to Firebase for persistence
    document.getElementById('userInput').value = '';
  }
}

function draw() {
  background(0);
  orbitControl();
  displayObjects();
  displayParticles();
}

function displayObjects() {
  objects.forEach(obj => {
    push();
    translate(obj.x, obj.y, obj.z);
    fill(obj.color);
    textFont(obj.font);
    textSize(24);
    text(obj.text, 0, 0);
    pop();

    // Update object movement
    obj.z += obj.speed * obj.direction;
    if ((obj.direction === 1 && obj.z > 200) || (obj.direction === -1 && obj.z < -200)) {
      obj.direction *= -1;
    }
  });
}

function displayParticles() {
  particles.forEach(p => {
    fill(p.color);
    ellipse(p.pos.x, p.pos.y, 8, 8);
    p.move();
  });
}

function mousePressed() {
  if (mouseButton === RIGHT) {
    // Clear all particles when right mouse button is clicked
    particles = [];
    console.log("Particles cleared"); // Optional: Console log for debugging
  } else if (mouseButton === LEFT) {
    let newParticle = new Particle(pmouseX - width / 2, pmouseY - height / 2, mouseX - pmouseX, mouseY - pmouseY);
    particles.push(newParticle);
    database.ref('particles').push(newParticle.serialize());
  }
}

function mouseDragged() {
  let newParticle = new Particle(pmouseX - width / 2, pmouseY - height / 2, mouseX - pmouseX, mouseY - pmouseY);
  particles.push(newParticle);
  database.ref('particles').push(newParticle.serialize());
}



function listenForParticleUpdates() {
  const particleRef = firebase.database().ref('particles');
  particleRef.on('child_added', snapshot => {
    const newParticle = new Particle(snapshot.val().x, snapshot.val().y, snapshot.val().vx, snapshot.val().vy, snapshot.val().color);
    particles.push(newParticle);
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


function resetView() {
    if (objects.length > 0) {
        // Calculate the centroid of text objects only
        let sumX = 0, sumY = 0, sumZ = 0;
        objects.forEach(obj => {
            sumX += obj.x;
            sumY += obj.y;
            sumZ += obj.z;
        });
        let centerX = sumX / objects.length;
        let centerY = sumY / objects.length;
        let centerZ = sumZ / objects.length;

        // Set the camera to look at the centroid of text objects
        // Adjust the third parameter as needed to ensure a suitable distance
        let distance = 500; // Adjust this distance to ensure the text fits well in the view
        camera(centerX, centerY, centerZ + distance, centerX, centerY, centerZ, 0, 1, 0);
    } else {
        // Reset to default view if there are no text objects
        camera(0, 0, (height / 2) / tan(PI / 6), 0, 0, 0, 0, 1, 0);
    }
}

