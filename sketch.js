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

  // Setup button to reset view
  const resetViewBtn = select('#resetViewBtn');
  resetViewBtn.mousePressed(resetView);
}



function updateText() {
  let inputText = document.getElementById('userInput').value.trim();
  let selectedFont = document.getElementById('fontSelector').value;
  let selectedColor = document.getElementById('colorSelector').value;
  
  if (inputText !== "") {
    // Random positions for the new object
    let newObject = {
      x: random(-200, 200),
      y: random(-200, 200),
      z: random(-200, 200),
      speed: random(1, 5),
      direction: random([-1, 1]),
      color: selectedColor,
      font: selectedFont,
      text: inputText
    };

    // Add the new object to the objects array for rendering
    objects.push(newObject);

    // Push the new object to Firebase
    database.ref('userInput').push(newObject);

    // Clear the input field
    document.getElementById('userInput').value = '';
  }
}




function draw() {
  background(0);
  orbitControl();
  
  // Update and draw objects and text
  objects.forEach(obj => {
    push();
    // Update position based on velocity
    obj.x += obj.speed * obj.direction;
    // Reset position if it goes beyond certain bounds
    if ((obj.direction === 1 && obj.x > 200) || (obj.direction === -1 && obj.x < -200)) {
      obj.direction *= -1;
    }
    translate(obj.x, obj.y, obj.z);
    fill(obj.color);
    textFont(obj.font);
    textSize(24); // Adjust text size if necessary
    text(obj.text, 0, 0); // Draw text at object's location
    pop();
  });

  // Draw 3D objects
  graphics.clear();
  objects.forEach(obj => {
    obj.z += obj.speed * obj.direction;
    if ((obj.direction === 1 && obj.z > 200) || (obj.direction === -1 && obj.z < -200)) {
      obj.direction *= -1; // Change direction upon reaching a certain point
    }
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



function listenForParticleUpdates() {
  const particleRef = firebase.database().ref('particles');
  particleRef.on('child_added', snapshot => {
    const p = snapshot.val();
    particles.push(new Particle(p.x, p.y, p.vx, p.vy, p.color));
  });
}



function listenForUpdates() {
  const database = firebase.database();
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


function resetView() {
    let centerX = 0, centerY = 0, centerZ = 0;
    let textCount = 0; // Variable to count the number of text objects

    // Calculate the average position of text objects only
    objects.forEach(obj => {
        if (typeof obj.text !== 'undefined') { // Check if the object is a text object
            centerX += obj.x;
            centerY += obj.y;
            centerZ += obj.z;
            textCount++;
        }
    });

    // If there are text objects, calculate the average position and focus the camera
    if (textCount > 0) {
        centerX /= textCount;
        centerY /= textCount;
        centerZ /= textCount;
        camera(centerX, centerY, centerZ + 500, centerX, centerY, centerZ, 0, 1, 0);
    } else {
        camera(); // Reset camera to default position
    }

    // Remove data from Firebase if "xxx" is inputted
    if (particles.length === 0 && objects.length === 0) {
        database.ref('particles').remove();
        database.ref('userInput').remove();
    }
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
