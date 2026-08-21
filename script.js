const targets = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('show'); observer.unobserve(entry.target); } });
}, { threshold: 0.12 });
targets.forEach(el => observer.observe(el));

const tabs = document.querySelectorAll('[data-tab]');
const contentBlocks = document.querySelectorAll('[data-tab-content]');
const projectCards = document.querySelectorAll('[data-project-type]');
const tabNote = document.querySelector('#tab-note');
const tabNotes = {
  about: '先认识我，再看看我如何把 AI 做成真实的体验。',
  products: '我负责过的 AI 产品：从用户问题、模型能力到业务结果。',
  projects: '一个从 0 到 1，亲自完成产品、开发与商业验证的个人项目。'
};

function switchTab(name, shouldScroll = false) {
  const isAbout = name === 'about';
  contentBlocks.forEach(block => {
    block.hidden = isAbout ? block.dataset.tabContent !== 'about' : block.dataset.tabContent !== 'work';
  });
  projectCards.forEach(card => {
    card.hidden = isAbout || card.dataset.projectType !== name;
  });
  tabs.forEach(tab => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  tabNote.textContent = tabNotes[name];
  document.querySelectorAll('.tab-content:not([hidden]) .reveal').forEach(el => el.classList.add('show'));
  if (shouldScroll) document.querySelector('#explore').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

const requestedTab = new URLSearchParams(window.location.search).get('tab');
if (requestedTab && Object.hasOwn(tabNotes, requestedTab)) {
  switchTab(requestedTab);
  if (window.location.hash === '#explore') {
    requestAnimationFrame(() => document.querySelector('#explore')?.scrollIntoView({ block: 'start' }));
  }
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const tab = link.dataset.tabTarget;
      if (tab) switchTab(tab, true);
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const email = new FormData(contactForm).get('email');
    const subject = encodeURIComponent('来自个人网站的联系');
    const body = encodeURIComponent(`你好，我的邮箱是 ${email}。`);
    window.location.href = `mailto:Fanshuyuan0626@outlook.com?subject=${subject}&body=${body}`;
  });
}

const eyeStage = document.querySelector('.hero-character-stage');
const heroEyes = eyeStage ? eyeStage.querySelectorAll('.hero-eye') : [];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let eyeFrame = 0;

function setEyeOffset(x, y) {
  heroEyes.forEach(eye => {
    eye.style.setProperty('--eye-x', `${x}px`);
    eye.style.setProperty('--eye-y', `${y}px`);
  });
}

if (eyeStage && heroEyes.length && !reduceMotion.matches) {
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    cancelAnimationFrame(eyeFrame);
    eyeFrame = requestAnimationFrame(() => {
      const rect = eyeStage.getBoundingClientRect();
      const faceX = rect.left + rect.width * 0.548;
      const faceY = rect.top + rect.height * 0.305;
      const distance = Math.max(window.innerWidth, window.innerHeight) * 0.42;
      const clamp = value => Math.max(-1, Math.min(1, value));
      setEyeOffset(clamp((event.clientX - faceX) / distance) * 3.5, clamp((event.clientY - faceY) / distance) * 2.5);
    });
  }, { passive: true });
}
const assistant = document.querySelector('[data-assistant]');
const assistantHint = assistant?.querySelector('.assistant-hint');
const assistantPanel = assistant?.querySelector('#assistant-panel');
const assistantToggle = assistant?.querySelector('[data-assistant-toggle]');
const assistantClose = assistant?.querySelector('[data-assistant-close]');
const assistantForm = assistant?.querySelector('[data-assistant-form]');
const assistantInput = assistant?.querySelector('[data-assistant-input]');
const assistantMessages = assistant?.querySelector('[data-assistant-messages]');
const assistantApiUrl = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? '/api/assistant'
  : 'https://fan-shussistant-iflboiixlw.cn-hangzhou.fcapp.run/api/assistant';

function appendAssistantMessage(text, type) {
  const message = document.createElement('div');
  message.className = `assistant-message assistant-message-${type}`;
  message.textContent = text;
  assistantMessages?.append(message);
  if (assistantMessages) assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

const assistantConversation = [];

async function askAssistant(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;
  assistantConversation.push({ role: 'user', content: cleanQuestion });
  appendAssistantMessage(cleanQuestion, 'user');
  const pending = document.createElement('div');
  pending.className = 'assistant-message assistant-message-bot assistant-message-pending';
  pending.textContent = '正在查阅资料...';
  assistantMessages?.append(pending);
  if (assistantMessages) assistantMessages.scrollTop = assistantMessages.scrollHeight;
  try {
    const response = await fetch(assistantApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: assistantConversation }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '问答服务暂时不可用。');
    assistantConversation.push({ role: 'assistant', content: result.answer });
    appendAssistantMessage(result.answer, 'bot');
  } catch (error) {
    appendAssistantMessage(`问答服务暂时不可用：${error.message}。请确认你是通过 http://localhost:3000 打开网站，并已启动本地服务。`, 'bot');
  } finally {
    pending.remove();
  }
}

if (assistant && assistantPanel && assistantToggle) {
  const setAssistantOpen = open => {
    assistantPanel.hidden = !open;
    assistant.classList.toggle('is-open', open);
    assistantHint?.setAttribute('aria-hidden', String(open));
    assistantToggle.setAttribute('aria-expanded', String(open));
    assistantToggle.setAttribute('aria-label', open ? '收起问答助手' : '打开问答助手');
    assistantPanel.setAttribute('aria-hidden', String(!open));
    if (open) assistantInput?.focus();
  };
  assistantToggle.addEventListener('click', () => setAssistantOpen(assistantPanel.hidden));
  assistantClose?.addEventListener('click', () => setAssistantOpen(false));
  document.addEventListener('click', event => {
    if (!assistant.contains(event.target)) setAssistantOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !assistantPanel.hidden) setAssistantOpen(false);
  });
  assistantForm?.addEventListener('submit', event => {
    event.preventDefault();
    askAssistant(assistantInput.value);
    assistantInput.value = '';
  });
  assistant.querySelectorAll('[data-assistant-prompt]').forEach(button => {
    button.addEventListener('click', () => askAssistant(button.dataset.assistantPrompt));
  });
}
