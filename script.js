const upBox = document.getElementById("up-box");
const downBox = document.getElementById("down-box");
const kOctaves = 4;
const baseNote = "C2";
const noteIntervals = [0, 7];
let voices = [];
const limiter = new Tone.Limiter(-30).toDestination();

let toneStarted = false;

let segmentHalfWidth = 150;
let segmentHeight = 200;
let kSegments;
let x0;
let circleX;
let circleVel;

function setup() {
  const canvas = createCanvas(600, 800);
  canvas.parent('sketch-container');
  frameRate(300);
  kSegments = Math.ceil(height / segmentHeight) + 2;
  x0 = width / 2;
  circleX = x0;
  circleVel = 2 * segmentHalfWidth / segmentHeight;
}

function draw() {
  background(0);
  
  strokeWeight(100);
  stroke(255);
  let y0 = -2*segmentHeight + (frameCount % (2*segmentHeight));
  // let y0 = 0;
  let direction = 1;
  for (let i = 0; i < kSegments; i++) {
    line(
      x0 - direction * segmentHalfWidth, y0 + i * segmentHeight,
      x0 + direction * segmentHalfWidth, y0 + (i + 1) * segmentHeight
    );
    direction *= -1;
  }
  
  noStroke();
  fill('#FF0000');
  
  circleX += circleVel;
  circle(circleX, segmentHeight * 2 - 100, 100);
  if (Math.abs(circleX - x0) >= segmentHalfWidth) {
    circleVel *= -1;
    if (toneStarted) {
        stepVoices(1);
    }
  }
}


class Voice {
    constructor(baseNote, offset, maxTranspose, synth) {
        this.baseNote = baseNote;
        this.offset = offset;
        this.maxTranspose = maxTranspose;
        this.synth = synth;
    }

    step(increment) {
        this.offset += increment;
        if (this.offset > this.maxTranspose) {
            this.offset = 0;
        }
        if (this.offset < 0) {
            this.offset = this.maxTranspose;
        }
    }

    playNote() {
        let note = new Tone.Frequency(this.baseNote).transpose(this.offset);
        let velocity = this.getVelocity();
        this.synth.triggerAttack(note, 0, velocity);
    }

    getVelocity() {
        const midpoint = this.maxTranspose / 2;
        return Math.cos(Math.PI * (this.offset - midpoint) / this.maxTranspose);
        // return 1 - 2 * Math.abs(offset - midpoint) / maxTranspose
    }
}

async function startTone() {
    await Tone.start();
    console.log("Tone.js started");
    voices = [];
    for (let i = 0; i < kOctaves; i++) {
        for (let interval of noteIntervals) {
            voices.push(new Voice(
                new Tone.Frequency(baseNote),
                i * 12 + interval,
                kOctaves * 12, 
                makeSynth()
            ));
        }
    }
    toneStarted = true;
}

function makeSynth() {
    const synth = new Tone.DuoSynth({
        "harmonicity": 1.5,
        "voice0": {
            "volume": -10,
            "portamento": 1,
            "oscillator": {
                "type": "sine"
            },
            "filterEnvelope": {
                "attack": 0.01,
                "decay": 0,
                "sustain": 1,
                "release": 0.5
            },
            "envelope": {
                "attack": 0.01,
                "decay": 0,
                "sustain": 1,
                "release": 0.5
            }
        },
        "voice1": {
            "volume": -10,
            "portamento": 1,
            "oscillator": {
                "type": "sine"
            },
            "filterEnvelope": {
                "attack": 0.01,
                "decay": 0,
                "sustain": 1,
                "release": 0.5
            },
            "envelope": {
                "attack": 0.01,
                "decay": 0,
                "sustain": 1,
                "release": 0.5
            },
        },
    }).connect(limiter);
    return synth;
}

function stopTone() {
    for (let voice of voices) {
        voice.synth.triggerRelease();
    }
    toneStarted = false;
}

function stepVoices(increment) {
    for (let voice of voices) {
        voice.step(increment);
        voice.playNote();
    }
}
