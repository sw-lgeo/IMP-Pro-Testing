document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav a');

  if (menuToggle && nav) {
    const closeMenu = () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    };

    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('open')) {
          closeMenu();
        }
      });
    });
  }

  const smoothLinks = document.querySelectorAll('a[href^="#"]');
  smoothLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.length > 1) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          event.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  function attachFormHandler(formId, resultId, message) {
    const form = document.getElementById(formId);
    const result = document.getElementById(resultId);

    if (form && result) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        result.textContent = message;
      });
    }
  }

  attachFormHandler(
    'estimation-form',
    'estimation-result',
    'Merci, un conseiller IMP Pro vous contactera pour une estimation détaillée.'
  );

  attachFormHandler(
    'partenaire-form',
    'partenaire-result',
    'Merci, nous revenons vers vous rapidement pour finaliser votre partenariat.'
  );

  attachFormHandler(
    'showroom-form',
    'showroom-result',
    'Votre rendez-vous est pris en compte, un conseiller vous confirme un créneau au plus vite.'
  );

  attachFormHandler(
    'contact-form',
    'contact-result',
    'Message envoyé ! Nous revenons vers vous sous 24h ouvrées.'
  );
});
