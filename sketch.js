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
    float glow = smoothstep(0.05, 0.0, distance);
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

class Object3D {
    constructor(x, y, z, text, font, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.text = text;
        this.font = font;
        this.color = color;
        this.size = 24; // default size
        this.isSelected = false;
        this.scaleFactor = 1.5; // how much the text scales up when clicked
    }

    display() {
        push();
        translate(this.x, this.y, this.z);
        fill(this.color);
        textFont(this.font);
        textSize(this.size * (this.isSelected ? this.scaleFactor : 1));
        text(this.text, 0, 0);
        pop();
    }

    checkIfClicked(px, py) {
        // Simple distance check to see if the click is within bounds
        let d = dist(px, py, this.x, this.y);
        if (d < 50) { // assuming the clickable area is within 50 pixels radius
            this.isSelected = !this.isSelected; // toggle selection
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

function draw() {
  background(0);
  orbitControl();
  objects.forEach(obj => {
    obj.display();
  });
  displayParticles();
}

function displayParticles() {
  particles.forEach(p => {
    fill(p.color);
    ellipse(p.pos.x, p.pos.y, 8, 8);
    p.move();
  });
}

function mousePressed() {
  let mx = mouseX - width / 2; // Adjusting mouse x for WEBGL coordinates
  let my = mouseY - height / 2; // Adjusting mouse y for WEBGL coordinates
  objects.forEach(obj => {
      obj.checkIfClicked(mx, my);
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
      let newObj = new Object3D(
          random(-200, 200), random(-200, 200), random(-200, 200),
          data.text, data.font, data.color
      );
      objects.push(newObj);
    }
  });
}

function resetView() {
  let centerX = 0, centerY = 0, centerZ = 0;
  let textCount = 0;
  objects.forEach(obj => {
      if (typeof obj.text !== 'undefined') {
          centerX += obj.x;
          centerY += obj.y;
          centerZ += obj.z;
          textCount++;
      }
  });

  if (textCount > 0) {
      centerX /= textCount;
      centerY /= textCount;
      centerZ /= textCount;
      camera(centerX, centerY, centerZ + 500, centerX, centerY, centerZ, 0, 1, 0);
  } else {
      camera();
  }

  if (particles.length === 0 && objects.length === 0) {
      database.ref('particles').remove();
      database.ref('userInput').remove();
  }
}

