const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

const estimationForm = document.querySelector('#estimation-form');
const estimationResult = document.querySelector('#estimation-result');

if (estimationForm && estimationResult) {
  estimationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    estimationResult.textContent = 'Merci, un conseiller IMP Pro vous contactera pour une estimation détaillée.';
  });
}

const partenaireForm = document.querySelector('#partenaire-form');
const partenaireResult = document.querySelector('#partenaire-result');

if (partenaireForm && partenaireResult) {
  partenaireForm.addEventListener('submit', (event) => {
    event.preventDefault();
    partenaireResult.textContent = 'Merci, nous revenons vers vous rapidement pour finaliser votre partenariat.';
  });
}
