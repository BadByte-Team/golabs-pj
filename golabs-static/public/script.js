/**
 * NovaCipher Labs — Main Script
 * Version 2.4.1
 */

(function () {
    'use strict';

    // ── Scroll-triggered animations ──
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.animate-in').forEach((el) => observer.observe(el));

    // ── Navbar scroll effect ──
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    });

    // ── Mobile nav toggle ──
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
            });
        });
    }

    // ── Smooth scroll for anchor links ──
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ── Contact form handler ──
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.textContent = 'Message Sent!';
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            setTimeout(() => {
                btn.textContent = 'Send Message';
                btn.style.background = '';
                form.reset();
            }, 2500);
        });
    }

    // ── Init console branding ──
    console.log(
        '%c NovaCipher Labs %c v2.4.1 ',
        'background: #3b82f6; color: #fff; font-weight: bold; border-radius: 3px 0 0 3px; padding: 2px 6px;',
        'background: #1e293b; color: #94a3b8; border-radius: 0 3px 3px 0; padding: 2px 6px;'
    );
    // TODO: clean up debug output before next release
    console.debug('flag-part2:', 'c0ns0l3_w0rk_t0g3th3r}');

})();
