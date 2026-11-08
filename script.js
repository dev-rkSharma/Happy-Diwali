const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
const canvas = $('fireworks');
const ctx = canvas.getContext('2d');
let width = 0, height = 0, particles = [], rockets = [], frame = 0, lastAuto = 0, previousTime = 0;
const colors = ['#ffd591', '#ff8aa3', '#79d9cd', '#eee2ff', '#ffae5f'];

function svgElement(tag, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}
// Lamps lead from the palace gates to the welcoming procession.
for (let i = 0; i < 9; i++) {
  const distance = i / 8;
  for (const side of [-1, 1]) {
    const lamp = svgElement('use', {href:'#scene-lamp', transform:`translate(${500 + side * (42 + distance * 340)} ${370 + distance * 181}) scale(${.35 + distance * .9})`});
    lamp.style.animationDelay = `${-i * .23}s`;
    $('welcome-lamps').appendChild(lamp);
  }
}
for (let i = 0; i < 29; i++) {
  const x = 305 + i * 390 / 28;
  const light = svgElement('circle', {cx:x, cy:230 + Math.sin(i / 28 * Math.PI) * 28, r:2.7, fill:'#ffe1a1', class:'palace-light'});
  light.style.animationDelay = `${-i * .18}s`;
  $('palace-lights').appendChild(light);
}
for (let i = 0; i < 20; i++) {
  const petal = svgElement('ellipse', {cx:290 + (i * 79 % 430), cy:125 + (i * 31 % 90), rx:3, ry:6, fill:i % 2 ? '#eda863' : '#e88096', class:'welcome-petal'});
  petal.style.animationDelay = `${-i * .43}s`;
  $('welcome-petals').appendChild(petal);
}

// Repeated vector petals keep the rangoli crisp on every screen.
for (let i = 0; i < 12; i++) {
  for (const [group, shape] of [['outer-petals', 'outer'], ['inner-petals', 'petal']]) {
    const petal = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    petal.setAttribute('href', `#${shape}`);
    petal.setAttribute('transform', `rotate(${i * 30} 300 300)`);
    $(group).appendChild(petal);
  }
}
for (let i = 0; i < 23; i++) {
  const bulb = document.createElement('span');
  bulb.className = 'bulb';
  const position = (i + .5) / 23;
  bulb.style.left = `${position * 100}%`;
  bulb.style.top = `${46 - Math.pow(position - .5, 2) * 140}px`;
  bulb.style.animationDelay = `${-i * .31}s`;
  document.querySelector('.garland').appendChild(bulb);
}
const recipient = new URLSearchParams(location.search).get('to');
// Start a fresh outgoing wish, even when the browser restores form values.
function resetSharingField() {
  $('name').value = '';
  $('share-status').textContent = '';
}
resetSharingField();
window.addEventListener('pageshow', resetSharingField);
if (recipient && recipient.trim()) {
  const name = recipient.trim().slice(0, 40);
  $('recipient').textContent = `For you, ${name}`;
  $('recipient').hidden = false;
}
function resize() {
  width = innerWidth; height = innerHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * ratio; canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
function burst(x, y, large = false) {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const count = large ? 95 : 60;
  for (let i = 0; i < count; i++) {
    const angle = Math.PI * 2 * i / count;
    const speed = (large ? 2.4 : 1.5) + Math.random() * 2;
    particles.push({x, y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
      life:1, decay:.009 + Math.random()*.007, color, size:1 + Math.random()*1.5});
  }
  particles = particles.slice(-950);
}
function launchRocket(x, targetY, large = false) {
  rockets.push({x, y:height + 10, targetY, speed:6 + Math.random() * 3, large, trail:[]});
  rockets = rockets.slice(-12);
}
function draw(time) {
  if (paused || document.hidden) { frame = 0; return; }
  const step = Math.min((time - previousTime) / 16.67 || 1, 2);
  previousTime = time;
  ctx.clearRect(0, 0, width, height);
  if (time - lastAuto > 1100) {
    launchRocket(width * (.08 + Math.random() * .84), height * (.08 + Math.random() * .35), Math.random() > .5);
    if (Math.random() > .5) launchRocket(width * (.1 + Math.random() * .8), height * (.12 + Math.random() * .3));
    lastAuto = time;
  }
  for (const rocket of rockets) {
    rocket.trail.push({x:rocket.x, y:rocket.y});
    rocket.trail = rocket.trail.slice(-14);
    rocket.y -= rocket.speed * step;
    for (let i = 0; i < rocket.trail.length; i++) {
      ctx.globalAlpha = i / rocket.trail.length * .6;
      ctx.fillStyle = '#ffd591';
      ctx.beginPath(); ctx.arc(rocket.trail[i].x, rocket.trail[i].y, 1.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff0ca';
    ctx.beginPath(); ctx.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2); ctx.fill();
    if (rocket.y <= rocket.targetY) burst(rocket.x, rocket.y, rocket.large);
  }
  rockets = rockets.filter(rocket => rocket.y > rocket.targetY);
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx * step; p.y += p.vy * step; p.vy += .018 * step;
    p.vx *= Math.pow(.986, step); p.vy *= Math.pow(.986, step); p.life -= p.decay * step;
    ctx.globalAlpha = Math.max(0, p.life) * .8;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  frame = requestAnimationFrame(draw);
}
function start() { if (!frame && !paused && !document.hidden) { previousTime = performance.now(); frame = requestAnimationFrame(draw); } }
function updateMotion() {
  document.body.classList.toggle('paused', paused);
  $('motion').textContent = paused ? 'Play magic' : 'Pause magic';
  $('motion').setAttribute('aria-pressed', String(paused));
  if (paused) { cancelAnimationFrame(frame); frame = 0; ctx.clearRect(0, 0, width, height); }
  else start();
}
$('motion').addEventListener('click', () => { paused = !paused; updateMotion(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateMotion(); });
$('celebrate').addEventListener('click', () => {
  if (paused) {
    $('celebrate').textContent = '✦ May all your wishes come true';
    return;
  }
  for (let i = 0; i < 5; i++) burst(width * (.12 + i * .19), height * (.12 + Math.random() * .23), true);
  for (let i = 0; i < 7; i++) launchRocket(width * (.08 + i * .14), height * (.1 + Math.random() * .28), true);
});
document.addEventListener('visibilitychange', start);
window.addEventListener('resize', resize);
resize(); updateMotion();

$('share-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const url = new URL(location.href);
  const name = $('name').value.trim();
  url.search = ''; url.hash = '';
  if (name) url.searchParams.set('to', name);
  const text = `${name ? `${name}, wishing` : 'Wishing'} you a Happy Diwali! 🪔 May your days be filled with love and light.`;
  if (location.protocol === 'file:') {
    $('share-status').textContent = 'Publish on GitHub Pages first, then share your live wish here.';
    return;
  }
  try {
    if (navigator.share) {
      await navigator.share({title:'Happy Diwali 🪔', text, url:url.href});
      $('share-status').textContent = 'A little light, passed along. ✨';
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url.href);
      $('share-status').textContent = 'Link copied! Paste it into a message to share the magic.';
    } else {
      $('share-status').textContent = `Copy this link: ${url.href}`;
    }
  } catch (error) {
    if (error.name !== 'AbortError') $('share-status').textContent = `Copy this link: ${url.href}`;
  }
});
