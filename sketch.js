/ Shader code with color scheme support
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
      // Also send new particle data to Firebase
      database.ref('particles').push(newParticle.serialize());
    }
  }
}

// Array to hold particles
let particles = [];
let graphics; // 2D graphics buffer for text
let objects = []; // Array to hold 3D objects
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

function setup() {
  createCanvas(windowWidth * 2/3, windowHeight, WEBGL).parent('webglCanvas');
  graphics = createGraphics(windowWidth / 3, windowHeight);
  graphics.textSize(20);
  graphics.textAlign(CENTER, CENTER);
  pixelDensity(1);
  noCursor();
  
  listenForUpdates();
  listenForParticleUpdates();

}


function updateText() {
  let inputText = document.getElementById('userInput').value.trim();
  let selectedFont = document.getElementById('fontSelector').value;
  let selectedColor = document.getElementById('colorSelector').value;
  
  if (inputText === "xxx") {
    clearScreen();
    redraw(); // Redraw the canvas after clearing
    document.getElementById('userInput').value = '';
    return; // Exit the function
  }
  
  if (inputText !== "") {
    // Add the text object to the array only when the user clicks "Submit"
    document.getElementById('submitButton').onclick = function() {
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
      
      // Clear the input field after submitting
      document.getElementById('userInput').value = '';
      
      // Redraw the canvas after adding the text object
      redraw();
    };
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
if (clickedObjectIndex !== -1) {
    let clickedObject = objects[clickedObjectIndex];
    let originalTextSize = 24; // Assuming fixed text size of 24 for simplicity, adjust as needed
    let enlargedTextSize = 48; // Adjust as needed for dramatic increase
    let textWidth = graphics.textWidth(clickedObject.text);
    let textHeight = originalTextSize;
    
    // Draw enlarged text
    push();
    translate(clickedObject.x, clickedObject.y, clickedObject.z);
    fill(clickedObject.color);
    textSize(enlargedTextSize); // Set enlarged text size
    text(clickedObject.text, 0, 0); // Draw text at object's location
    pop();
    
    // Update position and direction of clicked object
    clickedObject.z += clickedObject.speed * clickedObject.direction;
    if ((clickedObject.direction === 1 && clickedObject.z > 200) || (clickedObject.direction === -1 && clickedObject.z < -200)) {
      clickedObject.direction *= -1; // Change direction upon reaching a certain point
    }
    
    // Reset clickedObjectIndex after a short delay
    setTimeout(() => {
      clickedObjectIndex = -1; // Reset clicked object index after a short delay
    }, 1000); // Adjust delay as needed
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
  clickedObjectIndex = -1; // Reset clicked object index

  if (mouseButton === RIGHT) {
    particles = [];
  }
  // Check if the mouse button pressed is the left mouse button
  if (mouseButton === LEFT) {
    // Check if the mouse is over any text object
    for (let i = 0; i < objects.length; i++) {
      let obj = objects[i];
      let textWidth = graphics.textWidth(obj.text);
      let textHeight = 24; // Assuming fixed text size of 24 for simplicity, adjust as needed
      let leftBound = obj.x - textWidth / 2;
      let rightBound = obj.x + textWidth / 2;
      let topBound = obj.y - textHeight / 2;
      let bottomBound = obj.y + textHeight / 2;
      
      // Check if mouse coordinates are within bounds of the text object
      if (mouseX > leftBound && mouseX < rightBound && mouseY > topBound && mouseY < bottomBound) {
        clickedObjectIndex = i; // Store the index of the clicked object
        break; // Exit loop once a clicked object is found
      }
    }
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
