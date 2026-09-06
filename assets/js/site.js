/* ============================================================
   Assetsware — 2026 Redesign scripts
   Vanilla JS: nav, scroll reveal, form validation, widgets
   ============================================================ */
(function () {
    'use strict';

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ---------- Navbar: scrolled state ---------- */
    var nav = $('.nav');
    if (nav) {
        var onScroll = function () {
            nav.classList.toggle('scrolled', window.scrollY > 8);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Navbar: mobile toggle ---------- */
    var toggle = $('.nav-toggle');
    var menu = $('.nav-menu');
    if (toggle && menu) {
        var closeMenu = function () {
            toggle.setAttribute('aria-expanded', 'false');
            menu.classList.remove('open');
        };
        toggle.addEventListener('click', function () {
            var open = menu.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        // close when a link is chosen, on Escape, or when resizing past mobile
        $$('a', menu).forEach(function (a) {
            a.addEventListener('click', closeMenu);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 900) closeMenu();
        });
    }

    /* ---------- Active nav link ---------- */
    var links = $$('.nav-links a[href^="#"]');
    var sections = links
        .map(function (a) { return $(a.getAttribute('href')); })
        .filter(Boolean);
    if (links.length && sections.length) {
        var spy = function () {
            var pos = window.scrollY + 120;
            var current = sections[0].id;
            sections.forEach(function (sec) {
                if (sec.offsetTop <= pos) current = sec.id;
            });
            links.forEach(function (a) {
                a.classList.toggle('active', a.getAttribute('href') === '#' + current);
            });
        };
        window.addEventListener('scroll', spy, { passive: true });
        spy();
    }

    /* ---------- Reveal on scroll ---------- */
    var revealEls = $$('.reveal');
    if (revealEls.length && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('visible'); });
    }

    /* ---------- Scroll-to-top ---------- */
    var scrollTop = $('.scroll-top');
    if (scrollTop) {
        window.addEventListener('scroll', function () {
            scrollTop.classList.toggle('show', window.scrollY > 600);
        }, { passive: true });
        scrollTop.addEventListener('click', function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- Demo request dialog ---------- */
    var dialog = $('#demo-dialog');
    if (dialog && typeof dialog.showModal === 'function') {
        // render Turnstile lazily (it sits inside a hidden <dialog> on load)
        var ensureTurnstile = function () {
            var wrap = $('#demo-turnstile');
            if (!wrap || !window.turnstile) return;
            if (!wrap.children.length) {
                turnstile.render(wrap, {
                    sitekey: wrap.dataset.sitekey,
                    theme: wrap.dataset.theme || 'light'
                });
            }
        };

        $$('[data-open-dialog]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                ensureTurnstile();
                document.body.classList.add('no-scroll');
                dialog.showModal();
            });
        });
        $$('[data-close-dialog]').forEach(function (btn) {
            btn.addEventListener('click', function () { dialog.close(); });
        });
        dialog.addEventListener('close', function () {
            document.body.classList.remove('no-scroll');
        });
        // close when clicking the backdrop
        dialog.addEventListener('click', function (e) {
            if (e.target === dialog) dialog.close();
        });
    }

    /* ---------- Demo request form ---------- */
    var form = $('#request-demo-form');
    if (form) {
        var status = $('.form-status', form);
        var submitBtn = $('button[type="submit"]', form);

        var setField = function (input, invalid) {
            var field = input.closest('.form-field');
            if (!field) return;
            field.classList.toggle('invalid', invalid);
            var err = $('.field-error', field);
            if (err) err.textContent = input.dataset.error || 'This field is required.';
        };

        var validate = function () {
            var ok = true;
            $$('[required]', form).forEach(function (input) {
                var valid = input.value.trim() !== '';
                if (input.type === 'email' && valid) {
                    valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
                }
                setField(input, !valid);
                if (!valid) ok = false;
            });
            return ok;
        };

        // live re-validate after first attempt
        $$('[required]', form).forEach(function (input) {
            input.addEventListener('input', function () {
                if (input.closest('.form-field').classList.contains('invalid')) validate();
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validate()) return;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';
            status.className = 'form-status';

            fetch(form.action, {
                method: form.method,
                body: new FormData(form)
            })
                .then(function (res) {
                    if (!res.ok) throw new Error('Bad response');
                    status.classList.add('ok');
                    status.textContent = 'Thank you! Your demo request has been sent. We\u2019ll get back to you within 24 hours.';
                    form.reset();
                    // reset the Turnstile widget so the next submit works
                    if (window.turnstile) {
                        var widget = $('.cf-turnstile', form);
                        if (widget) turnstile.reset(widget);
                    }
                })
                .catch(function () {
                    status.classList.add('err');
                    status.textContent = 'Something went wrong. Please try again or contact us directly.';
                })
                .finally(function () {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Message';
                    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
        });
    }
})();
