/* =========================================================================
   common.js — index.html(데스크톱) / mobile.html(모바일) 공용 로직.
   페이지 레이아웃과 무관한 기능만 담는다:
   nav 토글, 스크롤 스파이, 리빌, 카운트업, 시각 손상 비교 뷰어(터치 대응
   완료), 갤러리 라이트박스, 히어로/CTA 버튼의 일반 앵커 스크롤.
   "긴 스페이서 + sticky + scroll progress" 방식의 스크럽 애니메이션
   (게임플레이/스포트라이트 밴드)은 여기 두지 않는다 — 데스크톱은
   desktop-scrub.js, 모바일은 mobile-carousel.js가 각각 담당한다.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Mobile nav toggle ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('nav ul');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      navToggle.classList.toggle('active');
    });
    navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
    }));
  }

  /* ---------- 2. Scroll state: shrink nav + scroll spy + sticky CTA bar ---------- */
  const nav = document.querySelector('nav');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  const stickyBar = document.querySelector('.sticky-cta');
  const hero = document.querySelector('.hero');

  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 40);

    if (stickyBar && hero) {
      const heroBottom = hero.getBoundingClientRect().bottom;
      // 스티키 바는 히어로 섹션이 끝난 후에만 표시
      stickyBar.classList.toggle('visible', heroBottom < 0);
    }

    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 140;
      if (y >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- 4. Count-up stats ---------- */
  const counters = document.querySelectorAll('.stat-number[data-count]');
  const currentSuffix = (el) => {
    const lang = window.i18n?.lang || 'ko';
    return (lang === 'ja' ? el.dataset.suffixJa : el.dataset.suffixKo) || el.dataset.suffix || '';
  };
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = el.dataset.count.includes('.') ? el.dataset.count.split('.')[1].length : 0;
    const duration = 1500;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = value.toFixed(decimals) + currentSuffix(el);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        animateCounter(entry.target);
        entry.target.dataset.counted = 'true';
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(el => counterObserver.observe(el));

  // 언어가 바뀌면 이미 카운트가 끝난 숫자들의 접미사(종류/種類)만 다시 맞춰준다
  document.addEventListener('i18n:change', () => {
    document.querySelectorAll('.stat-number[data-count][data-counted]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const decimals = el.dataset.count.includes('.') ? el.dataset.count.split('.')[1].length : 0;
      el.textContent = target.toFixed(decimals) + currentSuffix(el);
    });
  });

  /* ---------- 5. Vision interactive viewer ---------- */
  // 한국어 원문(fallback). 일본어는 ja.json의 vision.<key>.title / vision.<key>.desc 를 사용한다.
  const visionDataKo = {
    myopia: {
      title: '고도근시',
      desc: '5m 앞의 표지판이나 아는 사람의 얼굴조차 초점 없이 뿌옇게 번집니다. 다가오는 버스 번호를 확인하거나 계단을 내려가는 기본적인 일상조차 위태롭습니다.',
      img: 'images/고도근시.webp'
    },
    glaucoma: {
      title: '녹내장',
      desc: '시야 주변부가 어둠에 잠식되어 좁은 터널로만 세상을 봅니다. 옆에서 갑자기 다가오는 사람이나 차를 인지하지 못해 붐비는 거리를 걷거나 길을 건널 때 충돌 위험이 큽니다.',
      img: 'images/녹내장.webp'
    },
    cataract: {
      title: '백내장',
      desc: '뿌연 안개가 낀 유리창 너머로 세상을 보는 듯합니다. 마주 오는 차의 눈부신 빛 번짐으로 도로 구분이 어렵고, 밝은 햇빛 아래에서는 글씨를 읽기조차 힘듭니다.',
      img: 'images/백내장.webp'
    },
    achromatopsia: {
      title: '전색맹',
      desc: '색이 완전히 사라져 오직 명암만으로 세상을 구분합니다. 신호등 확인, 지하철 노선도 읽기, 옷이나 음식의 상태를 식별하는 일상적인 선택마다 커다란 제약을 받습니다.',
      img: 'images/전색맹.webp'
    },
    amd: {
      title: '황반변성',
      desc: '시야 중심부가 검게 가려져 정면을 볼수록 아무것도 보이지 않습니다. 마주 앉은 사람의 표정을 읽거나 스마트폰 문자·책을 읽는 등 시선을 한곳에 모으는 작업이 불가능해집니다.',
      img: 'images/황반변성.webp'
    }
  };

  // 현재 언어에 맞는 title/desc를 반환 (ja면 window.i18n을 통해 ja.json 조회, 없으면 한국어로 폴백)
  const getVisionEntry = (key) => {
    const ko = visionDataKo[key];
    if (!ko) return null;
    const lang = window.i18n?.lang || 'ko';
    if (lang === 'ja') {
      return {
        title: window.i18n.t(`vision.${key}.title`, ko.title),
        desc: window.i18n.t(`vision.${key}.desc`, ko.desc),
        img: ko.img
      };
    }
    return ko;
  };

  // 증상(key)별 필터/마스크 계산기. intensity는 1~5.
  const visionEffectStyle = (key, intensity) => {
    const i = intensity; // 1~5
    switch (key) {
      case 'myopia':
        return {
          filter: `blur(${1.5 + i * 1.6}px) contrast(${100 - i * 2}%)`,
          mask: 'none',
          blend: 'normal'
        };
      case 'cataract':
        return {
          filter: `blur(${1 + i * 1}px) brightness(${100 + i * 6}%) contrast(${100 - i * 8}%) saturate(${100 - i * 8}%)`,
          mask: 'radial-gradient(circle at center, rgba(255,246,220,0) 0%, rgba(255,246,220,0.55) 100%)',
          blend: 'screen'
        };
      case 'achromatopsia':
        return {
          filter: `grayscale(100%) contrast(${100 + i * 4}%) brightness(${100 + i * 2}%)`,
          mask: 'none',
          blend: 'normal'
        };
      case 'glaucoma': {
        const clear = 46 - i * 6;
        return {
          filter: `contrast(${100 + i * 3}%)`,
          mask: `radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${clear}%, rgba(0,0,0,0.97) ${clear + 18}%)`,
          blend: 'multiply'
        };
      }
      case 'amd': {
        const spot = 8 + i * 5;
        return {
          filter: `contrast(${100 + i * 3}%) blur(${i * 0.4}px)`,
          mask: `radial-gradient(circle at center, rgba(20,20,25,0.96) 0%, rgba(20,20,25,0.96) ${spot}%, rgba(20,20,25,0) ${spot + 20}%)`,
          blend: 'normal'
        };
      }
      default:
        return { filter: 'none', mask: 'none', blend: 'normal' };
    }
  };

  const normalImg = document.querySelector('.vision-img-normal');
  const effectImg = document.querySelector('.vision-img-effect');
  const effectMask = document.querySelector('.vision-effect-mask');
  const viewerTitle = document.querySelector('.vision-viewer-title');
  const viewerDesc = document.querySelector('.vision-viewer-desc');
  const viewerTag = document.querySelector('.vision-viewer-tag');
  const tabs = document.querySelectorAll('.vision-tab');
  const compareEl = document.getElementById('visionCompare');
  const dividerEl = document.getElementById('visionDivider');
  const intensityInput = document.getElementById('visionIntensity');
  const intensityValueEl = document.getElementById('visionIntensityValue');
  const peekBtn = document.getElementById('visionPeekBtn');

  if (normalImg && effectImg && tabs.length && compareEl) {
    const getActiveKey = () => (document.querySelector('.vision-tab.active') || tabs[0])?.dataset.key;
    const getIntensity = () => parseInt(intensityInput?.value || '3', 10);

    const applyEffectStyle = () => {
      const key = getActiveKey();
      const { filter, mask, blend } = visionEffectStyle(key, getIntensity());
      effectImg.style.setProperty('--vision-filter', filter);
      if (effectMask) {
        effectMask.style.setProperty('--vision-mask', mask);
        effectMask.style.setProperty('--vision-mask-blend', blend);
      }
    };

    const syncViewerToActiveTab = () => {
      const key = getActiveKey();
      const data = getVisionEntry(key);
      if (!data) return;
      if (viewerTag) viewerTag.textContent = `LIVE · ${data.title}`;
      if (viewerTitle) viewerTitle.textContent = data.title;
      if (viewerDesc && viewerDesc.dataset.tabInteracted === 'true') {
        viewerDesc.textContent = data.desc;
      }
    };
    syncViewerToActiveTab();
    applyEffectStyle();

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.key;
        const data = getVisionEntry(key);
        if (!data) return;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        normalImg.classList.add('fade-out');
        effectImg.classList.add('fade-out');

        if (viewerTag) {
          viewerTag.classList.add('pulse');
        }

        setTimeout(() => {
          normalImg.src = data.img;
          effectImg.src = data.img;
          viewerTitle.textContent = data.title;
          viewerDesc.textContent = data.desc;
          viewerDesc.dataset.tabInteracted = 'true';
          normalImg.classList.remove('fade-out');
          effectImg.classList.remove('fade-out');
          applyEffectStyle();

          if (viewerTag) {
            viewerTag.textContent = `LIVE · ${data.title}`;
          }
        }, 300);

        if (viewerTag) {
          setTimeout(() => viewerTag.classList.remove('pulse'), 700);
        }
      });
    });

    document.addEventListener('i18n:change', syncViewerToActiveTab);

    if (intensityInput) {
      intensityInput.addEventListener('input', () => {
        if (intensityValueEl) intensityValueEl.textContent = intensityInput.value;
        applyEffectStyle();
      });
    }

    // 분할 핸들 드래그(마우스+터치 모두 대응) — 좌(정상)/우(이펙트) 비율만 바꾼다.
    let dragging = false;
    const setSplit = (clientX) => {
      const rect = compareEl.querySelector('.vision-compare-media').getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.min(96, Math.max(4, pct));
      compareEl.style.setProperty('--split', pct.toFixed(2));
      if (dividerEl) dividerEl.setAttribute('aria-valuenow', Math.round(pct));
    };

    if (dividerEl) {
      const onMove = (e) => {
        if (!dragging) return;
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        setSplit(x);
      };
      const onUp = () => { dragging = false; };

      dividerEl.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
      dividerEl.addEventListener('touchstart', () => { dragging = true; }, { passive: true });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchend', onUp);

      // 키보드 접근성: 좌우 화살표로 5%씩 조정
      dividerEl.addEventListener('keydown', (e) => {
        const current = parseFloat(getComputedStyle(compareEl).getPropertyValue('--split')) || 50;
        if (e.key === 'ArrowLeft') {
          compareEl.style.setProperty('--split', Math.max(4, current - 5));
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          compareEl.style.setProperty('--split', Math.min(96, current + 5));
          e.preventDefault();
        }
      });
    }

    // "원본 보기" 버튼: 누르고 있는 동안 이펙트 레이어를 숨겨 원본을 보여준다.
    if (peekBtn) {
      const startPeek = (e) => { compareEl.classList.add('peeking'); e && e.preventDefault && e.preventDefault(); };
      const endPeek = () => compareEl.classList.remove('peeking');

      peekBtn.addEventListener('mousedown', startPeek);
      peekBtn.addEventListener('touchstart', startPeek, { passive: false });
      ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(evt =>
        peekBtn.addEventListener(evt, endPeek)
      );
    }
  }

  /* ---------- 6. Hero/CTA 버튼: #gameplay는 스크럽 페이지가 있으면 위임, 없으면 일반 앵커 스크롤 ---------- */
  document.querySelectorAll('.cta-primary, .cta-secondary').forEach(btn => {
    if (!btn.dataset.target) return;
    btn.addEventListener('click', () => {
      if (btn.dataset.target === '#gameplay' && typeof window.scrollToGameplayReveal === 'function') {
        // desktop-scrub.js가 로드된 페이지(index.html)에서는 진행률 기반 위치로 이동
        window.scrollToGameplayReveal();
        return;
      }
      document.querySelector(btn.dataset.target)?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- 7. Gallery Lightbox ---------- */
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.querySelector('.lightbox');
  if (galleryItems.length > 0 && lightbox) {
    const lightboxImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const imgSrc = item.querySelector('img').src;
        lightboxImg.src = imgSrc;
        lightbox.classList.add('active');
      });
    });

    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.classList.remove('active');
    });
  }
});
