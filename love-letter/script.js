const appState = {
  hasStarted: false,
  sealOpened: false,
  letterCompleted: false,
  surprisePlayed: false,
  cursorBlinkTween: null,
  heartbeatTween: null,
  masterTimeline: null,
};

const copy = {
  letter: [
    "Nena 💖 hay momentos que quiero compartir contigo y que indican un antes y un despues, de algo  especial, solo espera un poco",
  ].join(" \n\n"),
  final: "Te amo ❤️",
};

const elements = {
  ambientCanvas: document.getElementById("ambient-canvas"),
  fxCanvas: document.getElementById("fx-canvas"),
  sealButton: document.getElementById("seal-button"),
  envelope: document.getElementById("envelope"),
  seal: document.getElementById("seal"),
  letter: document.getElementById("letter"),
  typedText: document.getElementById("typed-text"),
  typingCursor: document.getElementById("typing-cursor"),
  microcopy: document.getElementById("microcopy"),
  finalScene: document.getElementById("final-scene"),
  surpriseButton: document.getElementById("surprise-button"),
  finalMessage: document.getElementById("final-message"),
  heroCopy: document.querySelector(".hero-copy"),
  envelopeButton: document.querySelector(".envelope-button"),
};

const ambient = createAmbientCanvas(elements.ambientCanvas);
const fx = createEffectCanvas(elements.fxCanvas);
const audio = createAudioEngine();

function init() {
  resizeCanvases();
  bindEvents();
  createAmbientInitialState();
  ambient.render();
  startIntroTimeline();
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvases, { passive: true });

  elements.sealButton.addEventListener("click", handleSealClick);
  elements.surpriseButton.addEventListener("click", handleSurpriseClick);

  elements.envelopeButton.addEventListener("pointerenter", () => {
    if (appState.sealOpened) return;
    elements.envelopeButton.classList.add("is-hovered");
  });

  elements.envelopeButton.addEventListener("pointerleave", () => {
    elements.envelopeButton.classList.remove("is-hovered");
  });

  elements.sealButton.addEventListener("pointerdown", () => {
    elements.seal.classList.add("seal-pressed");
  });

  elements.sealButton.addEventListener("pointerup", () => {
    elements.seal.classList.remove("seal-pressed");
  });

  elements.sealButton.addEventListener("pointercancel", () => {
    elements.seal.classList.remove("seal-pressed");
  });
}

function startIntroTimeline() {
  if (appState.masterTimeline) {
    appState.masterTimeline.kill();
  }

  appState.masterTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

  appState.masterTimeline
    .to(elements.heroCopy, { opacity: 1, y: 0, duration: 1.5 }, 0.15)
    .to(elements.envelopeButton, { opacity: 1, y: 0, scale: 1, duration: 2.1 }, 2.7)
    .call(() => {
      appState.hasStarted = true;
      elements.envelopeButton.classList.add("is-ready");
      startSealHeartbeat();
    }, null, 3.35);

  ambient.setMood("quiet");
}

function handleSealClick() {
  if (!appState.hasStarted || appState.sealOpened) {
    return;
  }

  appState.sealOpened = true;
  if (appState.heartbeatTween) {
    appState.heartbeatTween.kill();
  }
  elements.envelopeButton.classList.add("is-broken");
  elements.microcopy.textContent = "Rompiendo el sello...";

  audio.playSealCrack();
  fx.emitBurst(window.innerWidth / 2, window.innerHeight * 0.55, "seal-break");
  ambient.setMood("romantic");

  const sealTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

  sealTimeline
    .to(elements.seal, { scale: 0.72, duration: 0.16 })
    .to(elements.seal, { scale: 1.1, duration: 0.22 })
    .to(elements.seal, { opacity: 0, duration: 0.55 }, 0.12)
    .call(() => {
      fx.emitSparkleField();
    }, null, 0.18)
    .to(elements.envelopeButton, { scale: 1.02, duration: 0.25 }, 0.24)
    .add(openEnvelopeSequence(), 0.38);
}

function startSealHeartbeat() {
  if (appState.heartbeatTween) {
    appState.heartbeatTween.kill();
  }

  appState.heartbeatTween = gsap.to(elements.seal, {
    scale: 1.07,
    duration: 0.34,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    repeatDelay: 2.6,
    transformOrigin: "50% 50%",
    onRepeat: () => {
      fx.emitSparkleField();
    },
  });
}

function openEnvelopeSequence() {
  const sequence = gsap.timeline({ defaults: { ease: "power4.inOut" } });

  sequence
    .call(() => {
      elements.envelopeButton.classList.add("is-open");
      elements.microcopy.textContent = "La carta comienza a salir...";
    })
    .to(elements.letter, { yPercent: -8, duration: 1.1 }, 0.1)
    .to(elements.letter, { yPercent: -42, duration: 1.25 }, 1.05)
    .to(elements.letter, { yPercent: -62, duration: 1.1 }, 2.2)
    .to(elements.letter, { rotate: 0, duration: 0.8 }, 2.2)
    .call(startTypingEffect, null, 2.45)
    .call(() => {
      elements.microcopy.textContent = "";
    }, null, 5.35);

  return sequence;
}

function startTypingEffect() {
  const typingState = { index: 0 };
  const text = copy.letter;

  elements.typedText.textContent = "";
  elements.typingCursor.style.opacity = "1";

  if (appState.cursorBlinkTween) {
    appState.cursorBlinkTween.kill();
  }

  appState.cursorBlinkTween = gsap.to(elements.typingCursor, {
    opacity: 0.12,
    duration: 0.55,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  gsap.to(typingState, {
    index: text.length,
    duration: 14,
    ease: "none",
    onUpdate: () => {
      const currentIndex = Math.round(typingState.index);
      elements.typedText.textContent = text.slice(0, currentIndex);
    },
    onComplete: () => {
      appState.letterCompleted = true;
      elements.typingCursor.style.opacity = "0";
      if (appState.cursorBlinkTween) {
        appState.cursorBlinkTween.kill();
      }
      fx.emitHeartDrift();
      fx.emitPetalFall();
      prepareFinalScene();
    },
  });
}

function prepareFinalScene() {
  elements.finalScene.setAttribute("aria-hidden", "false");

  const revealTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

  revealTimeline
    .to(elements.letter, { yPercent: -68, duration: 0.9 }, 0)
    .to(elements.finalScene, { opacity: 1, duration: 1.1 }, 0.15)
    .to(elements.surpriseButton, { opacity: 1, y: 0, scale: 1, duration: 1 }, 0.6);
}

function handleSurpriseClick() {
  if (appState.surprisePlayed) {
    return;
  }

  appState.surprisePlayed = true;
  elements.surpriseButton.disabled = true;
  elements.surpriseButton.textContent = "Sorpresa activada";

  const finale = gsap.timeline({ defaults: { ease: "power3.out" } });

  finale
    .to(elements.surpriseButton, { opacity: 0, scale: 0.9, duration: 0.35 })
    .call(() => {
      fx.emitFinalExplosion();
      audio.playFinalBurst();
    }, null, 0.08)
    .to(elements.letter, { yPercent: -76, duration: 0.7 }, 0.15)
    .to(elements.finalMessage, { opacity: 1, scale: 1, duration: 1.15 }, 0.32)
    .to(elements.finalMessage, { y: -10, duration: 1.2, yoyo: true, repeat: 1 }, 0.5)
    .to(elements.finalMessage, { textShadow: "0 0 34px rgba(236, 72, 153, 0.48), 0 0 60px rgba(255,255,255,0.12)", duration: 0.8 }, 0.35);
}

function createAmbientInitialState() {
  ambient.seed();
}

function resizeCanvases() {
  ambient.resize();
  fx.resize();
}

function createAmbientCanvas(canvas) {
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let mood = "quiet";
  const stars = [];
  const motes = [];
  const limit = 110;

  function seed() {
    stars.length = 0;
    motes.length = 0;

    const starCount = Math.min(120, Math.round((width * height) / 14000));
    for (let index = 0; index < starCount; index += 1) {
      stars.push(createStar());
    }

    for (let index = 0; index < limit; index += 1) {
      motes.push(createMote(true));
    }
  }

  function createStar() {
    return {
      x: Math.random() * width,
      y: Math.random() * height * 0.85,
      radius: 0.5 + Math.random() * 1.7,
      alpha: 0.22 + Math.random() * 0.65,
      twinkle: Math.random() * Math.PI * 2,
      drift: 0.01 + Math.random() * 0.07,
    };
  }

  function createMote(initial = false) {
    return {
      x: Math.random() * width,
      y: initial ? Math.random() * height : height + 20 + Math.random() * 50,
      vx: -0.08 + Math.random() * 0.16,
      vy: initial ? -0.03 - Math.random() * 0.08 : -0.08 - Math.random() * 0.13,
      radius: 0.7 + Math.random() * 1.8,
      alpha: 0.04 + Math.random() * 0.08,
      hue: Math.random() > 0.86 ? "pink" : "white",
      life: 0,
      ttl: 0.65 + Math.random() * 1.8,
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function setMood(value) {
    mood = value;
  }

  function render() {
    context.clearRect(0, 0, width, height);

    drawSkyWash();
    drawStars();
    drawMotes();

    requestAnimationFrame(render);
  }

  function drawSkyWash() {
    const gradient = context.createRadialGradient(width * 0.5, height * 0.15, 0, width * 0.5, height * 0.15, Math.max(width, height));
    gradient.addColorStop(0, mood === "romantic" ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.05)");
    gradient.addColorStop(0.32, "rgba(17,24,39,0.18)");
    gradient.addColorStop(1, "rgba(8,8,8,0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  function drawStars() {
    stars.forEach((star, index) => {
      star.twinkle += star.drift * (mood === "romantic" ? 1.4 : 1);
      const alpha = star.alpha * (0.55 + Math.sin(star.twinkle) * 0.45);
      const x = star.x + Math.sin(star.twinkle * 0.4 + index) * 0.12;
      const y = star.y + Math.cos(star.twinkle * 0.3 + index) * 0.08;

      context.beginPath();
      context.fillStyle = `rgba(255,255,255,${alpha})`;
      context.arc(x, y, star.radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  function drawMotes() {
    motes.forEach((mote) => {
      mote.x += mote.vx;
      mote.y += mote.vy;
      mote.life += 0.008;

      if (mote.y < -30 || mote.x < -30 || mote.x > width + 30 || mote.life > mote.ttl) {
        Object.assign(mote, createMote());
      }

      const pulse = 0.5 + Math.sin((mote.life + mote.x) * 0.6) * 0.5;
      const alpha = mote.alpha * pulse;

      context.beginPath();
      context.fillStyle = mote.hue === "pink" ? `rgba(236,72,153,${alpha})` : `rgba(255,255,255,${alpha})`;
      context.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  return { seed, resize, render, setMood };
}

function createEffectCanvas(canvas) {
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  const particles = [];
  let rafId = null;
  const gravity = 0.024;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticle(options) {
    particles.push({
      x: options.x,
      y: options.y,
      vx: options.vx,
      vy: options.vy,
      radius: options.radius,
      life: 0,
      ttl: options.ttl,
      kind: options.kind,
      rotation: Math.random() * Math.PI * 2,
      vr: -0.08 + Math.random() * 0.16,
      color: options.color,
      shimmer: Math.random(),
    });
  }

  function emitBurst(x, y, kind) {
    const count = kind === "final" ? 220 : 34;

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.2;
      const speed = kind === "final" ? 2 + Math.random() * 3.6 : 1.5 + Math.random() * 2.2;
      const palette = kind === "final"
        ? ["#ec4899", "#ffffff", "#f5e6c8", "#ffd1dc"]
        : ["#f5e6c8", "#ec4899", "#ffffff"];

      spawnParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: kind === "final" ? 2 + Math.random() * 3.6 : 2 + Math.random() * 1.8,
        ttl: kind === "final" ? 90 + Math.random() * 54 : 54 + Math.random() * 24,
        kind: kind === "final" ? (index % 6 === 0 ? "heart" : index % 2 === 0 ? "confetti" : "spark") : index % 4 === 0 ? "spark" : "confetti",
        color: palette[index % palette.length],
      });
    }

    kickLoop();
  }

  function emitSparkleField() {
    for (let index = 0; index < 24; index += 1) {
      spawnParticle({
        x: width * 0.5 + (Math.random() - 0.5) * 120,
        y: height * 0.53 + (Math.random() - 0.5) * 50,
        vx: -0.2 + Math.random() * 0.4,
        vy: -0.7 - Math.random() * 1.1,
        radius: 1 + Math.random() * 1.8,
        ttl: 38 + Math.random() * 16,
        kind: "spark",
        color: Math.random() > 0.5 ? "#ffffff" : "#ec4899",
      });
    }

    kickLoop();
  }

  function emitHeartDrift() {
    for (let index = 0; index < 12; index += 1) {
      spawnParticle({
        x: width * 0.46 + Math.random() * width * 0.18,
        y: height * 0.46 + Math.random() * height * 0.12,
        vx: -0.18 + Math.random() * 0.36,
        vy: -0.45 - Math.random() * 0.85,
        radius: 6 + Math.random() * 4,
        ttl: 130 + Math.random() * 50,
        kind: "heart",
        color: Math.random() > 0.5 ? "#ffb3c7" : "#ec4899",
      });
    }

    kickLoop();
  }

  function emitPetalFall() {
    for (let index = 0; index < 8; index += 1) {
      spawnParticle({
        x: Math.random() * width,
        y: -20 - Math.random() * 80,
        vx: -0.18 + Math.random() * 0.36,
        vy: 0.42 + Math.random() * 0.42,
        radius: 8 + Math.random() * 4,
        ttl: 180 + Math.random() * 100,
        kind: "petal",
        color: Math.random() > 0.5 ? "#ffd7e4" : "#f7b6c9",
      });
    }

    kickLoop();
  }

  function emitFinalExplosion() {
    const centerX = width * 0.5;
    const centerY = height * 0.46;
    const shells = 6;

    for (let shell = 0; shell < shells; shell += 1) {
      const shellAngle = (Math.PI * 2 * shell) / shells;
      const launchSpeed = 1.7 + Math.random() * 0.9;

      for (let index = 0; index < 32; index += 1) {
        const angle = (Math.PI * 2 * index) / 32;
        const radialSpeed = 1.8 + Math.random() * 4.2;
        const vx = Math.cos(angle) * radialSpeed + Math.cos(shellAngle) * launchSpeed;
        const vy = Math.sin(angle) * radialSpeed - 4.5 + Math.sin(shellAngle) * launchSpeed;
        const palette = ["#ec4899", "#ffffff", "#f5e6c8", "#ffd1dc"];

        spawnParticle({
          x: centerX + Math.cos(shellAngle) * 12,
          y: centerY + Math.sin(shellAngle) * 12,
          vx,
          vy,
          radius: 2 + Math.random() * 4,
          ttl: 120 + Math.random() * 80,
          kind: index % 9 === 0 ? "heart" : index % 3 === 0 ? "confetti" : "spark",
          color: palette[index % palette.length],
        });
      }
    }

    kickLoop();
  }

  function kickLoop() {
    if (rafId) {
      return;
    }

    rafId = requestAnimationFrame(step);
  }

  function step() {
    rafId = null;
    context.clearRect(0, 0, width, height);

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.life += 1;
      particle.vy += gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.vr;

      const remaining = 1 - particle.life / particle.ttl;

      if (remaining <= 0 || particle.x < -100 || particle.x > width + 100 || particle.y > height + 120) {
        particles.splice(index, 1);
        continue;
      }

      context.save();
      context.globalAlpha = Math.max(remaining, 0) * (particle.kind === "spark" ? 0.92 : 0.82);
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);

      if (particle.kind === "spark") {
        drawSpark(particle);
      } else if (particle.kind === "confetti") {
        drawConfetti(particle);
      } else if (particle.kind === "heart") {
        drawHeart(particle);
      } else {
        drawPetal(particle);
      }

      context.restore();
    }

    if (particles.length > 0) {
      rafId = requestAnimationFrame(step);
    } else {
      context.clearRect(0, 0, width, height);
    }
  }

  function drawSpark(particle) {
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(0, 0, Math.max(1, particle.radius * 0.42), 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = particle.color;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(-particle.radius * 2.6, 0);
    context.lineTo(particle.radius * 2.6, 0);
    context.moveTo(0, -particle.radius * 2.6);
    context.lineTo(0, particle.radius * 2.6);
    context.stroke();
  }

  function drawConfetti(particle) {
    context.fillStyle = particle.color;
    context.fillRect(-particle.radius, -particle.radius * 1.8, particle.radius * 2, particle.radius * 3.6);
  }

  function drawHeart(particle) {
    const size = particle.radius;
    context.fillStyle = particle.color;
    context.beginPath();
    context.moveTo(0, size * 0.7);
    context.bezierCurveTo(-size * 1.4, -size * 0.6, -size * 1.2, -size * 1.8, 0, -size * 0.7);
    context.bezierCurveTo(size * 1.2, -size * 1.8, size * 1.4, -size * 0.6, 0, size * 0.7);
    context.fill();
  }

  function drawPetal(particle) {
    context.fillStyle = particle.color;
    context.beginPath();
    context.ellipse(0, 0, particle.radius * 0.7, particle.radius * 1.2, Math.PI / 4, 0, Math.PI * 2);
    context.fill();
  }

  return {
    resize,
    emitBurst,
    emitSparkleField,
    emitHeartDrift,
    emitPetalFall,
    emitFinalExplosion,
  };
}

function createAudioEngine() {
  let context = null;
  let masterGain = null;
  let padGain = null;
  let padFilter = null;
  let padOscillatorA = null;
  let padOscillatorB = null;
  let padLfo = null;
  let padLfoGain = null;
  let musicTimer = null;

  function ensureContext() {
    if (context) {
      return context;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    context = new AudioContextClass();

    masterGain = context.createGain();
    masterGain.gain.value = 0.34;
    masterGain.connect(context.destination);

    return context;
  }

  function startMusic() {
    const audioContext = ensureContext();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    if (padOscillatorA) {
      return;
    }

    padFilter = audioContext.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 520;
    padFilter.Q.value = 0.75;

    padGain = audioContext.createGain();
    padGain.gain.value = 0.0;

    padOscillatorA = audioContext.createOscillator();
    padOscillatorA.type = "sine";
    padOscillatorA.frequency.value = 196;

    padOscillatorB = audioContext.createOscillator();
    padOscillatorB.type = "triangle";
    padOscillatorB.frequency.value = 294;

    padLfo = audioContext.createOscillator();
    padLfo.type = "sine";
    padLfo.frequency.value = 0.12;

    padLfoGain = audioContext.createGain();
    padLfoGain.gain.value = 8;

    padLfo.connect(padLfoGain);
    padLfoGain.connect(padFilter.frequency);

    padOscillatorA.connect(padFilter);
    padOscillatorB.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(masterGain);

    const now = audioContext.currentTime;
    padGain.gain.linearRampToValueAtTime(0.18, now + 2.2);

    padOscillatorA.start();
    padOscillatorB.start();
    padLfo.start();

    musicTimer = setInterval(() => {
      if (!context) {
        return;
      }

      const step = Math.random();
      const chordA = step > 0.66 ? 174.61 : step > 0.33 ? 196 : 164.81;
      const chordB = chordA * 1.5;
      padOscillatorA.frequency.setTargetAtTime(chordA, context.currentTime, 0.12);
      padOscillatorB.frequency.setTargetAtTime(chordB, context.currentTime, 0.12);
      padFilter.frequency.setTargetAtTime(460 + Math.random() * 180, context.currentTime, 0.2);
    }, 8200);
  }

  function playSealCrack() {
    const audioContext = ensureContext();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const burst = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.18, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      const decay = 1 - index / data.length;
      data[index] = (Math.random() * 2 - 1) * Math.pow(decay, 2.2) * 0.32;
    }

    const crackFilter = audioContext.createBiquadFilter();
    crackFilter.type = "bandpass";
    crackFilter.frequency.value = 820;
    crackFilter.Q.value = 2.2;

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.85, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);

    burst.buffer = buffer;
    burst.connect(crackFilter);
    crackFilter.connect(gain);
    gain.connect(masterGain);
    burst.start();
    burst.stop(audioContext.currentTime + 0.18);
  }

  function playFinalBurst() {
    const audioContext = ensureContext();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const sparkleOscillator = audioContext.createOscillator();
    const sparkleGain = audioContext.createGain();
    const sparkleFilter = audioContext.createBiquadFilter();

    sparkleOscillator.type = "triangle";
    sparkleOscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    sparkleOscillator.frequency.exponentialRampToValueAtTime(1046.5, audioContext.currentTime + 1.4);

    sparkleFilter.type = "highpass";
    sparkleFilter.frequency.value = 360;

    sparkleGain.gain.setValueAtTime(0.001, audioContext.currentTime);
    sparkleGain.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.08);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);

    sparkleOscillator.connect(sparkleFilter);
    sparkleFilter.connect(sparkleGain);
    sparkleGain.connect(masterGain);

    sparkleOscillator.start();
    sparkleOscillator.stop(audioContext.currentTime + 1.55);
  }

  return {
    startMusic,
    playSealCrack,
    playFinalBurst,
  };
}

window.addEventListener("beforeunload", () => {
  if (appState.cursorBlinkTween) {
    appState.cursorBlinkTween.kill();
  }

  if (appState.heartbeatTween) {
    appState.heartbeatTween.kill();
  }

  if (appState.masterTimeline) {
    appState.masterTimeline.kill();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The experience still works without the worker during local previews.
    });
  });
}

init();