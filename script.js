// шапка

(function () {
    'use strict';

    const header     = document.getElementById('siteHeader');
    const burgerBtn  = document.getElementById('burgerBtn');
    const closeBtn   = document.getElementById('closeBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay    = document.getElementById('overlay');

    if (!burgerBtn || !mobileMenu || !overlay) return;

    function openMenu() {
        mobileMenu.classList.add('is-open');
        overlay.classList.add('is-visible');
        burgerBtn.classList.add('is-active');
        burgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.remove('is-open');
        overlay.classList.remove('is-visible');
        burgerBtn.classList.remove('is-active');
        burgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    burgerBtn.addEventListener('click', function () {
        mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });

    if (header) {
        window.addEventListener('scroll', function () {
            header.classList.toggle('is-scrolled', window.scrollY > 10);
        }, { passive: true });
    }

})();


// услуги

(function () {
    'use strict';

    const slider = document.getElementById('servicesSlider');
    if (!slider) return;

    const slides  = slider.querySelectorAll('.slider__slide');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const dotsBox = document.getElementById('sliderDots');

    if (!slides.length || !prevBtn || !nextBtn || !dotsBox) return;

    let current = 0;
    let autoTimer = null;

    slides.forEach(function (_, i) {
        const dot = document.createElement('button');
        dot.className = 'slider__dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
        dot.addEventListener('click', function () {
            goTo(i);
            restartAuto();
        });
        dotsBox.appendChild(dot);
    });

    const dots = dotsBox.querySelectorAll('.slider__dot');

    function goTo(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (s, i) {
            s.classList.toggle('is-active', i === current);
        });
        dots.forEach(function (d, i) {
            d.classList.toggle('is-active', i === current);
        });
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    nextBtn.addEventListener('click', function () { next(); restartAuto(); });
    prevBtn.addEventListener('click', function () { prev(); restartAuto(); });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { next(); restartAuto(); }
        if (e.key === 'ArrowLeft')  { prev(); restartAuto(); }
    });

    let touchStartX = 0;

    slider.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener('touchend', function (e) {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? next() : prev();
            restartAuto();
        }
    }, { passive: true });

    function startAuto()   { autoTimer = setInterval(next, 6000); }
    function stopAuto()    { clearInterval(autoTimer); }
    function restartAuto() { stopAuto(); startAuto(); }

    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);

    startAuto();

})();


// запись и календарь

(function () {
    'use strict';

    const bModal        = document.getElementById('bookingModal');
    if (!bModal) return;

    const bOpenBtns     = document.querySelectorAll('[data-open-booking]');
    const bCloseBtns    = bModal.querySelectorAll('[data-close-booking]');
    const bForm         = document.getElementById('bookingForm');
    const bNameInput    = document.getElementById('bookingName');
    const bPhoneInput   = document.getElementById('bookingPhone');
    const bDateInput    = document.getElementById('bookingDate');
    const bSlotsBox     = document.getElementById('bookingSlots');
    const bCalendarGrid = document.getElementById('bookingCalendarGrid');
    const bSteps        = bModal.querySelectorAll('[data-booking-step]');

    if (!bForm || !bNameInput || !bPhoneInput || !bDateInput || !bSlotsBox || !bCalendarGrid) {
        console.warn('Booking modal: не найдены обязательные элементы');
        return;
    }

    let bSelectedSlot = null;
    let bSelectedDate = null;

   
    const bAllSlots = [
        '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00'
    ];

    const bHappyHours = ['10:00', '11:00', '12:00'];
    const bDaysAhead  = 14;

    const bBookedSlots = {
        
    };

    // Демо-занятость  
    (function simulateBusy() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);

            if (d.getDay() === 1) continue;

            const y   = d.getFullYear();
            const m   = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const iso = y + '-' + m + '-' + day;

            const count = Math.floor(Math.random() * 12);
            const shuffled = bAllSlots.slice().sort(function () {
                return Math.random() - 0.5;
            });
            bBookedSlots[iso] = shuffled.slice(0, count);
        }
    })();

    /* --- Утилиты --- */
    function bToISO(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function bShowError(name, msg) {
        const el = bModal.querySelector('[data-error-for="' + name + '"]');
        if (el) {
            el.textContent = msg;
            el.classList.add('is-visible');
        }
    }

    function bClearError(name) {
        const el = bModal.querySelector('[data-error-for="' + name + '"]');
        if (el) {
            el.textContent = '';
            el.classList.remove('is-visible');
        }
    }

    /* --- Имя --- */
    bNameInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^A-Za-zА-Яа-яЁё\s-]/g, '');
        if (this.value.length > 40) this.value = this.value.slice(0, 40);

        if (this.value.trim().length >= 2) {
            this.classList.remove('is-invalid');
            bClearError('name');
        } else {
            this.classList.add('is-invalid');
        }
    });

    bNameInput.addEventListener('keypress', function (e) {
        if (!/[A-Za-zА-Яа-яЁё\s-]/.test(e.key)) e.preventDefault();
    });

    bNameInput.addEventListener('paste', function (e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const clean = text.replace(/[^A-Za-zА-Яа-яЁё\s-]/g, '').slice(0, 40);
        document.execCommand('insertText', false, clean);
    });

    /* --- Телефон --- */
    function bFormatPhone(digits) {
        if (!digits) return '';

        if (digits[0] === '8') digits = '7' + digits.slice(1);
        if (digits[0] !== '7') digits = '7' + digits;

        digits = digits.slice(0, 11);

        const rest = digits.slice(1);
        let out = '+7';

        if (rest.length > 0)  out += ' (' + rest.slice(0, 3);
        if (rest.length >= 3) out += ') ' + rest.slice(3, 6);
        if (rest.length >= 6) out += '-' + rest.slice(6, 8);
        if (rest.length >= 8) out += '-' + rest.slice(8, 10);

        return out;
    }

    bPhoneInput.addEventListener('input', function () {
        const digits = this.value.replace(/\D/g, '');
        this.value = bFormatPhone(digits);

        if (this.value.replace(/\D/g, '').length === 11) {
            this.classList.remove('is-invalid');
            bClearError('phone');
        } else {
            this.classList.add('is-invalid');
        }
    });

    bPhoneInput.addEventListener('focus', function () {
        if (!this.value) this.value = '+7 (';
    });

    bPhoneInput.addEventListener('blur', function () {
        const digits = this.value.replace(/\D/g, '');
        if (digits === '7' || digits === '') this.value = '';
    });

    bPhoneInput.addEventListener('keypress', function (e) {
        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
            e.preventDefault();
        }
    });

    bPhoneInput.addEventListener('paste', function (e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const digits = text.replace(/\D/g, '');
        document.execCommand('insertText', false, bFormatPhone(digits));
    });

    /* --- Календарь --- */
    function bBuildCalendar() {
        bCalendarGrid.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDate = new Date(today);
        const dow = (firstDate.getDay() + 6) % 7;
        firstDate.setDate(firstDate.getDate() - dow);

        const cells = Math.ceil((dow + bDaysAhead) / 7) * 7;

        for (let i = 0; i < cells; i++) {
            const d = new Date(firstDate);
            d.setDate(firstDate.getDate() + i);

            const isBeforeToday = d < today;
            const isPastHorizon = i >= dow + bDaysAhead;

            if (isBeforeToday || isPastHorizon) {
                const empty = document.createElement('div');
                empty.className = 'booking__calendar-empty';
                bCalendarGrid.appendChild(empty);
                continue;
            }

            const iso  = bToISO(d);
            const busy = bBookedSlots[iso] || [];
            const free = bAllSlots.length - busy.length;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.date = iso;

            /* Выходной — понедельник: только число, без подписи */
            if (d.getDay() === 1) {
                btn.className = 'booking__day booking__day--off';
                btn.disabled = true;

                const num = document.createElement('span');
                num.className = 'booking__day__num';
                num.textContent = d.getDate();

                btn.appendChild(num);
                bCalendarGrid.appendChild(btn);
                continue;
            }

            const hasHappyFree = bHappyHours.some(function (t) {
                return busy.indexOf(t) === -1;
            });

            let statusClass;
            if (free === 0) {
                statusClass = 'booking__day--busy';
                btn.disabled = true;
            } else if (hasHappyFree) {
                statusClass = 'booking__day--available';
            } else {
                statusClass = 'booking__day--free';
            }

            btn.className = 'booking__day ' + statusClass;

            if (iso === bToISO(today)) {
                btn.classList.add('is-today');
            }

            const num = document.createElement('span');
            num.className = 'booking__day__num';
            num.textContent = d.getDate();

            // Подпись только у занятых: «занято». У свободных — просто число 
            btn.appendChild(num);

            if (free === 0) {
                const label = document.createElement('span');
                label.className = 'booking__day__status';
                label.textContent = 'занято';
                btn.appendChild(label);
            }

            if (!btn.disabled) {
                btn.addEventListener('click', function () {
                    bCalendarGrid.querySelectorAll('.booking__day').forEach(function (b) {
                        b.classList.remove('is-selected');
                    });
                    btn.classList.add('is-selected');

                    bSelectedDate = iso;
                    bDateInput.value = iso;
                    bClearError('date');

                    bRenderSlots(iso);
                });
            }

            bCalendarGrid.appendChild(btn);
        }

        const firstAvailable = bCalendarGrid.querySelector(
            '.booking__day--free, .booking__day--available'
        );
        if (firstAvailable) firstAvailable.click();
    }

    /* --- Слоты --- */
    function bRenderSlots(iso) {
        bSlotsBox.innerHTML = '';
        bSelectedSlot = null;
        bClearError('time');

        if (!iso) return;

        const busy = bBookedSlots[iso] || [];

        bAllSlots.forEach(function (time) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'booking__slot';
            btn.textContent = time;
            btn.dataset.time = time;

            if (busy.indexOf(time) !== -1) {
                btn.disabled = true;
            }

            if (bHappyHours.indexOf(time) !== -1 && !btn.disabled) {
                btn.classList.add('booking__slot--happy');
            }

            btn.addEventListener('click', function () {
                bSlotsBox.querySelectorAll('.booking__slot').forEach(function (b) {
                    b.classList.remove('is-active');
                });
                btn.classList.add('is-active');
                bSelectedSlot = time;
                bClearError('time');
            });

            bSlotsBox.appendChild(btn);
        });
    }

    // открытие/закрытие
    function bOpenModal() {
        bModal.classList.add('is-open');
        bModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-locked');
        bShowStep('form');
        bBuildCalendar();
    }

    function bCloseModal() {
        bModal.classList.remove('is-open');
        bModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-locked');
    }

    bOpenBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            bOpenModal();
        });
    });

    bCloseBtns.forEach(function (btn) {
        btn.addEventListener('click', bCloseModal);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && bModal.classList.contains('is-open')) {
            bCloseModal();
        }
    });

    function bShowStep(name) {
        bSteps.forEach(function (s) {
            s.hidden = s.dataset.bookingStep !== name;
        });
    }

    // отправка
    bForm.addEventListener('submit', function (e) {
        e.preventDefault();

        let ok = true;

        const name  = bNameInput.value.trim();
        const phone = bPhoneInput.value.trim();

        if (name.length < 2) {
            bShowError('name', 'Введите имя (минимум 2 буквы)');
            bNameInput.classList.add('is-invalid');
            ok = false;
        }

        if (phone.replace(/\D/g, '').length !== 11) {
            bShowError('phone', 'Введите номер полностью: +7 (999) 123-45-67');
            bPhoneInput.classList.add('is-invalid');
            ok = false;
        }

        if (!bDateInput.value) {
            bShowError('date', 'Выберите дату');
            ok = false;
        }

        if (!bSelectedSlot) {
            bShowError('time', 'Выберите время');
            ok = false;
        }

        if (!ok) return;

        const serviceInput = document.getElementById('bookingService');

        console.log('Заявка:', {
            name: name,
            phone: phone,
            service: serviceInput ? serviceInput.value : '',
            date: bDateInput.value,
            time: bSelectedSlot
        });

        bShowStep('success');
    });

})();


// купон скидка

(function () {
    'use strict';

    const fab   = document.getElementById('promoFab');
    const promo = document.getElementById('promoModal');
    if (!fab || !promo) return;

    const pCloseBtns = promo.querySelectorAll('[data-close-promo]');

    function openPromo() {
        promo.classList.add('is-open');
        promo.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-locked');
    }

    function closePromo() {
        promo.classList.remove('is-open');
        promo.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-locked');
    }

    fab.addEventListener('click', openPromo);

    pCloseBtns.forEach(function (btn) {
        btn.addEventListener('click', closePromo);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && promo.classList.contains('is-open')) {
            closePromo();
        }
    });

})();


// кнопка "вверх"

(function () {
    'use strict';

    const btn = document.getElementById('toTop');
    if (!btn) return;

    const SHOW_AFTER = 300;

    function toggleButton() {
        btn.classList.toggle('is-visible', window.scrollY > SHOW_AFTER);
    }

    window.addEventListener('scroll', toggleButton, { passive: true });
    window.addEventListener('resize', toggleButton);
    toggleButton();

    btn.addEventListener('click', function (e) {
        e.preventDefault();

        const start    = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const duration = 500;
        const startAt  = performance.now();

        if (start === 0) return;

        function step(now) {
            const elapsed  = now - startAt;
            const progress = Math.min(elapsed / duration, 1);
            const ease     = 1 - Math.pow(1 - progress, 3);

            window.scrollTo(0, Math.round(start * (1 - ease)));

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    });

})();


// тест

(function () {
    'use strict';

    const qBox = document.getElementById('quizBox');
    if (!qBox) {
        console.warn('Quiz: #quizBox не найден');
        return;
    }

    const qSteps       = qBox.querySelectorAll('.quiz__step');
    const qProgressBar = document.getElementById('quizProgressBar');
    const qBackBtn     = document.getElementById('quizBack');
    const qRestartBtn  = document.getElementById('quizRestart');
    const qBookBtn     = document.getElementById('quizBookBtn');

    const qResultTitle = document.getElementById('quizResultTitle');
    const qResultDesc  = document.getElementById('quizResultDesc');
    const qResultList  = document.getElementById('quizResultList');
    const qResultPrice = document.getElementById('quizResultPrice');

    if (!qSteps.length || !qProgressBar || !qBackBtn || !qRestartBtn || !qBookBtn) {
        console.warn('Quiz: не найдены обязательные элементы');
        return;
    }

    const qAnswers = {};
    let qCurrentStep = 0;
    const qTotalQuestions = 4;

    const qServices = {
        complexFull: {
            title: 'Комплекс Брови + Ресницы',
            desc:  'Тебе подойдёт полный комплекс: коррекция, окрашивание, ламинирование бровей и ламинирование ресниц. Даёт максимальный вау-эффект и держится 4–6 недель.',
            points: ['3–4 недели стойкости', 'Эффект «выспавшейся»', 'Стерильный инструмент'],
            price: 3500
        },
        complexBrows: {
            title: 'Комплекс по бровям',
            desc:  'Коррекция + окрашивание + ламинирование бровей. Идеально, если хочется естественной, но ухоженной формы надолго.',
            points: ['3 недели стойкости', 'Подбор цвета под тон кожи', 'Форма под тип лица'],
            price: 2300
        },
        lamination: {
            title: 'Ламинирование бровей',
            desc:  'Долговременная укладка волосков. Придаёт объём, дисциплинирует форму, работает даже на редких бровях.',
            points: ['Объём и форма', 'Эффект до 4 недель', 'Питание волосков'],
            price: 1500
        },
        coloring: {
            title: 'Окрашивание + коррекция',
            desc:  'Классика: подберу форму и насыщенный оттенок хной или краской. Быстро, красиво, стойко.',
            points: ['Хна или краска', 'Форма под лицо', 'Стойкость 2–3 недели'],
            price: 1800
        },
        correction: {
            title: 'Коррекция бровей',
            desc:  'Аккуратная форма без окрашивания. Подойдёт, если брови и так хорошо пигментированы, но нужно убрать лишнее и задать форму.',
            points: ['Идеальная форма', 'Без окрашивания', '20–30 минут'],
            price: 1000
        },
        careComplex: {
            title: 'Комплекс Уход + восстановление',
            desc:  'Ламинирование + питательная сыворотка + окрашивание оттеночным составом. Для ослабленных или повреждённых бровей.',
            points: ['Восстановление', 'Мягкое окрашивание', 'Питание волосков'],
            price: 2600
        }
    };

    function qPickService(a) {
        if (a.goal === 'care') return 'careComplex';

        if (a.goal === 'bright' && a.budget === 'high') return 'complexFull';
        if (a.goal === 'durable' && a.budget === 'high') return 'complexFull';

        if (a.goal === 'bright' && a.budget === 'mid') return 'complexBrows';
        if (a.goal === 'durable' && a.budget === 'mid') return 'complexBrows';

        if (a.frequency === 'never' && a.budget !== 'low') return 'coloring';

        if ((a.frequency === 'two-weeks' || a.frequency === 'often') && a.goal === 'bright') {
            return 'lamination';
        }

        if (a.budget === 'low') {
            return a.goal === 'bright' ? 'coloring' : 'correction';
        }

        if ((a.faceType === 'square' || a.faceType === 'heart') && a.goal === 'natural') {
            return 'lamination';
        }

        return 'coloring';
    }

    function qShowStep(index) {
        qCurrentStep = index;

        qSteps.forEach(function (s) {
            s.classList.toggle('is-active', s.dataset.step === String(index));
        });

        if (index === 'result') {
            qProgressBar.style.width = '100%';
            qBackBtn.hidden = true;
        } else {
            const percent = (index / qTotalQuestions) * 100;
            qProgressBar.style.width = percent + '%';
            qBackBtn.hidden = index === 0;
        }
    }

    const qQuestionKeys = ['faceType', 'frequency', 'goal', 'budget'];

    qBox.querySelectorAll('.quiz__option').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const stepEl = btn.closest('.quiz__step');
            if (!stepEl) return;

            const stepIndex = parseInt(stepEl.dataset.step, 10);
            const answer    = btn.dataset.answer;

            stepEl.querySelectorAll('.quiz__option').forEach(function (b) {
                b.classList.remove('is-selected');
            });
            btn.classList.add('is-selected');

            qAnswers[qQuestionKeys[stepIndex]] = answer;

            setTimeout(function () {
                if (stepIndex + 1 < qTotalQuestions) {
                    qShowStep(stepIndex + 1);
                } else {
                    qShowResult();
                }
            }, 220);
        });
    });

    function qShowResult() {
        const key     = qPickService(qAnswers);
        const service = qServices[key];

        qResultTitle.textContent = service.title;
        qResultDesc.textContent  = service.desc;
        qResultPrice.textContent = service.price.toLocaleString('ru-RU') + ' ₽';

        qResultList.innerHTML = '';
        service.points.forEach(function (point) {
            const li = document.createElement('li');
            li.textContent = point;
            qResultList.appendChild(li);
        });

        qBox.dataset.recommendedService = service.title;
        qBox.dataset.recommendedPrice   = service.price;

        qShowStep('result');
    }

    qBackBtn.addEventListener('click', function () {
        if (qCurrentStep === 'result') return;
        if (qCurrentStep > 0) qShowStep(qCurrentStep - 1);
    });

    qRestartBtn.addEventListener('click', function () {
        Object.keys(qAnswers).forEach(function (k) { delete qAnswers[k]; });

        qBox.querySelectorAll('.quiz__option').forEach(function (b) {
            b.classList.remove('is-selected');
        });

        qShowStep(0);
    });

    qBookBtn.addEventListener('click', function () {
        const serviceField = document.getElementById('bookingService');
        if (serviceField && qBox.dataset.recommendedService) {
            serviceField.value = qBox.dataset.recommendedService;
        }

        const openBtn = document.querySelector('[data-open-booking]');
        if (openBtn) openBtn.click();
    });

    qShowStep(0);

})();


// плавное проявление

(function () {
    'use strict';

    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach(function (el) {
            el.classList.add('is-visible');
        });
        return;
    }

    const SELECTORS = [
        '.hero__card',
        '.hero__badge',
        '.hero__title',
        '.hero__text',
        '.hero__actions',
        '.hero__facts',
        '.hero__media',

        '.quiz__side',
        '.quiz__box',

        '.services__head',
        '.slider',

        '.prices__head',
        '.price-row',
        '.prices__footer',

        '.education__head',
        '.edu-item',

        '.contacts__head',
        '.contact-card',
        '.contact-address',
        '.contact-info',
        '.contacts__footer'
    ];

    const elements = document.querySelectorAll(SELECTORS.join(','));

    elements.forEach(function (el) {
        el.classList.add('reveal');

        const parentGroup = el.parentElement;
        if (parentGroup) {
            const siblings = parentGroup.querySelectorAll(':scope > .reveal');
            const position = Array.prototype.indexOf.call(siblings, el);
            if (position >= 0 && position < 5) {
                el.classList.add('reveal--delay-' + (position + 1));
            }
        }
    });

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function (el) {
        observer.observe(el);
    });

})();