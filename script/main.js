document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0. Gameplay 섹션: 페이드 인 된 지점으로 스크롤 이동 ---------- */
  const scrollToGameplayReveal = () => {
    const spacer = document.querySelector('#gameplay .gameplay-spacer');
    if (!spacer) {
      document.getElementById('gameplay')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const vh = window.innerHeight;
    const spacerHeight = spacer.offsetHeight;
    const spacerTop = spacer.getBoundingClientRect().top + window.scrollY;
    // handleGameplayScroll의 progress 계산과 동일한 기준.
    // progress 0.4 지점 = 배경/헤더 페이드인이 끝나고 첫 feature가 보이기 시작하는 안정 구간
    const targetProgress = 0.4;
    const targetY = spacerTop + targetProgress * (spacerHeight - vh);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  document.querySelectorAll('a[href="#gameplay"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToGameplayReveal();
    });
  });

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

  /* ---------- 5. Craft stage before/after viewer ---------- */
  // 한국어 원문(fallback). 일본어는 ja.json의 vision.<key>.title / vision.<key>.desc 를 사용한다.
  // prevImg: 비교 슬라이더 왼쪽(이전 단계)에 표시할 이미지. 첫 단계는 이전 단계가 없으므로 자기 자신을 사용.
  const visionDataKo = {
    materials: {
      title: '재료 준비',
      desc: '다리, 상판, 나사까지 — 가구가 되기 전 모든 재료를 한눈에 확인하고 제작을 시작합니다. 필요한 부품을 미리 살펴보면 다음 단계가 훨씬 수월해집니다.',
      img: 'images/stage-materials.jpg',
      prevImg: 'images/stage-materials.jpg'
    },
    assembling: {
      title: '조립',
      desc: '아이템을 드래그해 정해진 위치에 배치하고 조립합니다. 상태 머신으로 관리되는 조립 과정 덕분에 부품이 하나씩 맞물리는 손맛을 그대로 느낄 수 있습니다.',
      img: 'images/stage-assembling.jpg',
      prevImg: 'images/stage-materials.jpg'
    },
    painting: {
      title: '페인팅',
      desc: '색상 선택 및 오브젝트 드래그 인터랙션을 통해 원하는 색으로 칠합니다. 머티리얼 속성을 실시간으로 조절해 광택(Smoothness)까지 세밀하게 표현할 수 있습니다.',
      img: 'images/stage-painting.jpg',
      prevImg: 'images/stage-assembling.jpg'
    },
    sanding: {
      title: '사포질',
      desc: '거친 표면을 문질러 매끈하게 다듬는 사포질 단계입니다. 현재 거칠기를 눈으로 확인하며 표면이 부드럽게 변하는 과정을 직접 체감할 수 있습니다.',
      img: 'images/stage-sanding.jpg',
      prevImg: 'images/stage-painting.jpg'
    },
    complete: {
      title: '완성',
      desc: '아이템 완성 시 카메라 회전과 특수 효과(VFX) 연출로 완성의 순간을 만끽합니다. 내 손으로 완성한 가구를 여러 각도에서 감상해보세요.',
      img: 'images/stage-complete.jpg',
      prevImg: 'images/stage-sanding.jpg'
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
        img: ko.img,
        prevImg: ko.prevImg
      };
    }
    return ko;
  };

  const normalImg = document.querySelector('.vision-img-normal');
  const effectImg = document.querySelector('.vision-img-effect');
  const viewerTitle = document.querySelector('.vision-viewer-title');
  const viewerDesc = document.querySelector('.vision-viewer-desc');
  const viewerTag = document.querySelector('.vision-viewer-tag');
  const tabs = document.querySelectorAll('.vision-tab');
  const compareEl = document.getElementById('visionCompare');
  const dividerEl = document.getElementById('visionDivider');
  const peekBtn = document.getElementById('visionPeekBtn');

  if (normalImg && effectImg && tabs.length && compareEl) {
    const getActiveKey = () => (document.querySelector('.vision-tab.active') || tabs[0])?.dataset.key;

    // 초기 활성 탭에 맞춰 태그/제목/설명 동기화 (언어 전환 시에도 재사용)
    const syncViewerToActiveTab = () => {
      const key = getActiveKey();
      const data = getVisionEntry(key);
      if (!data) return;
      if (viewerTag) viewerTag.textContent = `LIVE · ${data.title}`;
      if (viewerTitle) viewerTitle.textContent = data.title;
      // 뷰어 하단 설명(vision.viewerIntroDesc)은 static markup의 data-i18n이 처리하므로,
      // 탭을 한 번이라도 클릭한 뒤에는 여기서 최신 언어의 설명으로 맞춰준다.
      if (viewerDesc && viewerDesc.dataset.tabInteracted === 'true') {
        viewerDesc.textContent = data.desc;
      }
    };
    syncViewerToActiveTab();

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
          normalImg.src = data.prevImg;
          effectImg.src = data.img;
          viewerTitle.textContent = data.title;
          viewerDesc.textContent = data.desc;
          viewerDesc.dataset.tabInteracted = 'true';
          normalImg.classList.remove('fade-out');
          effectImg.classList.remove('fade-out');

          if (viewerTag) {
            viewerTag.textContent = `LIVE · ${data.title}`;
          }
        }, 300);

        if (viewerTag) {
          // pulse 애니메이션이 끝난 뒤 클래스 제거 (다음 전환에서 재생되도록)
          setTimeout(() => viewerTag.classList.remove('pulse'), 700);
        }
      });
    });

    // 언어 전환 시 현재 선택된 탭 기준으로 뷰어 텍스트를 다시 그린다
    document.addEventListener('i18n:change', syncViewerToActiveTab);

    // 분할 핸들 드래그: 좌(정상)/우(이펙트) 비율만 바꾼다.
    // 이펙트 레이어 자체는 항상 뷰어 전체 크기이므로, 마스크의 중심은
    // 분할 위치와 무관하게 항상 좌우 기준 정중앙에 고정된다.
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

  /* ---------- 6. Hero CTA buttons scroll to gameplay ---------- */
  document.querySelectorAll('.cta-primary, .cta-secondary').forEach(btn => {
    if (!btn.dataset.target) return;
    btn.addEventListener('click', (e) => {
      if (btn.dataset.target === '#gameplay') {
        scrollToGameplayReveal();
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

  /* ---------- 8. Immersive Gameplay Section Scroll Animation ---------- */
  const gameplaySection = document.getElementById('gameplay');
  if (gameplaySection) {
    const spacer = gameplaySection.querySelector('.gameplay-spacer');
    const bg = gameplaySection.querySelector('.gameplay-background');
    const header = gameplaySection.querySelector('.section-header');
    const features = gameplaySection.querySelectorAll('.gameplay-feature');

    const handleGameplayScroll = () => {
      const rect = spacer.getBoundingClientRect();
      const { top, height } = rect;
      const vh = window.innerHeight;

      // 섹션이 화면에 보이지 않으면 실행 안함
      if (top > vh || top + height < 0) {
        if (bg.style.opacity !== '0') {
          bg.style.opacity = 0;
          header.style.opacity = 0;
          features.forEach(feature => {
            feature.style.opacity = 0;
            feature.style.transform = `translateY(20px)`;
          });
        }
        return;
      }

      // 스크롤 진행률 (0: 섹션 상단이 뷰포트 상단에 닿을 때, 1: 섹션 하단이 뷰포트 하단에 닿을 때)
      const progress = Math.max(0, Math.min(1, -top / (height - vh)));

      // 1. 배경(영상) 애니메이션
      // 0% -> 35% : 사각형(clip) 리빌로 등장 — "스크롤 시작 부분"이므로 rectangular fade-in 유지.
      //             단, 스크롤이 시작되기 전(progress 0)에도 영상이 옅게 보이도록 시작값을 0이 아닌 기본값으로 둔다.
      // 80% -> 100% : 평범한 fade-out (사각형 축소 없이 opacity만 감소)
      const fadeInEnd = 0.5;
      const fadeOutStart = 0.8;
      const PRE_BG_OPACITY = 0.28; // 스크롤 시작 전 이미 보이는 기본 불투명도
      const PRE_BG_INSET = 32;     // 스크롤 시작 전 사각형 클립 상태(%)

      let currentOpacity = PRE_BG_OPACITY;
      let currentInset = PRE_BG_INSET;

      if (progress > fadeInEnd && progress < fadeOutStart) {
        // 중간의 안정된 상태
        currentOpacity = 1;
        currentInset = 0;
      } else if (progress <= fadeInEnd) {
        // 인트로 애니메이션 (Ease-out Cubic) — 사각형 리빌 유지 + 이미 옅게 보이는 상태에서 시작
        const localProgress = progress / fadeInEnd;
        const easedProgress = 1 - Math.pow(1 - localProgress, 3);
        currentOpacity = PRE_BG_OPACITY + (1 - PRE_BG_OPACITY) * easedProgress;
        currentInset = PRE_BG_INSET * (1 - easedProgress);
      } else if (progress >= fadeOutStart) {
        // 아우트로 애니메이션 (Ease-in-out Cubic) — 평범한 fade-out (사각형 없음)
        const localProgress = (progress - fadeOutStart) / (1 - fadeOutStart);
        const easedProgress = localProgress < 0.5
          ? 4 * localProgress * localProgress * localProgress
          : 1 - Math.pow(-2 * localProgress + 2, 3) / 2;
        currentOpacity = 1 - easedProgress;
        currentInset = 0;
      }

      bg.style.opacity = Math.max(0, Math.min(1, currentOpacity));
      bg.style.clipPath = `inset(${currentInset}% ${currentInset}% ${currentInset}% ${currentInset}%)`;

      // 2. 헤더 페이드 인/아웃
      // 20% -> 35% : 페이드 인
      // 80% -> 90% : 페이드 아웃
      if (progress >= 0.20 && progress <= 0.35) {
        header.style.opacity = (progress - 0.20) / 0.15;
      } else if (progress > 0.35 && progress < 0.8) {
        header.style.opacity = 1;
      } else if (progress >= 0.8 && progress <= 0.9) {
        header.style.opacity = 1 - (progress - 0.8) / 0.1;
      } else if (progress > 0.9 || progress < 0.20) {
        header.style.opacity = 0;
      }

      // 3. 피처 아이템 순차적 애니메이션 — 카드 간 전환이므로 평범한 opacity fade만 사용 (사각형 클립 없음)
      const featureZoneStart = 0.25;
      const featureZoneEnd = 0.95;
      const featureCount = features.length;
      const featureDuration = (featureZoneEnd - featureZoneStart) / featureCount;

      features.forEach((feature, i) => {
        const zoneStart = featureZoneStart + i * featureDuration;
        const zoneEnd = zoneStart + featureDuration * 0.8; // 각 아이템이 보이는 시간을 약간 줄임
        const zoneLength = zoneEnd - zoneStart;

        const fadeInRatio = 0.35;
        const fadeOutRatio = 0.8;
        const localFadeInEnd = zoneStart + zoneLength * fadeInRatio;
        const localFadeOutStart = zoneStart + zoneLength * fadeOutRatio;

        let opacity = 0;

        if (progress < zoneStart || progress > zoneEnd) {
          opacity = 0;
        } else if (progress <= localFadeInEnd) {
          // 평범한 fade-in (Ease-out Cubic)
          const localProgress = (progress - zoneStart) / (localFadeInEnd - zoneStart);
          opacity = 1 - Math.pow(1 - localProgress, 3);
        } else if (progress < localFadeOutStart) {
          // 중간의 안정된 상태
          opacity = 1;
        } else {
          // 평범한 fade-out (Ease-in-out Cubic)
          const localProgress = (progress - localFadeOutStart) / (zoneEnd - localFadeOutStart);
          const eased = localProgress < 0.5
            ? 4 * localProgress * localProgress * localProgress
            : 1 - Math.pow(-2 * localProgress + 2, 3) / 2;
          opacity = 1 - eased;
        }

        opacity = Math.max(0, Math.min(1, opacity));
        feature.style.opacity = opacity;
        feature.style.transform = `translateY(${20 * (1 - opacity)}px)`;
      });
    };

    window.addEventListener('scroll', handleGameplayScroll, { passive: true });
    handleGameplayScroll(); // 초기 로드 시 한 번 실행
  }


  /* ---------- 10. Spotlight Story Band: scroll-triggered fade-up ---------- */
  // 규칙:
  //  - 카드 간 전환(2,3,4번째 카드의 등장/퇴장, 첫 카드의 퇴장)은 평범한 opacity fade.
  //  - 오직 "스크롤 이벤트 시작 부분"(첫 카드가 처음 등장하는 구간)만 사각형(clip-path inset) 리빌을 유지.
  //  - 스크롤이 시작되기 전(progress 0)에도 첫 카드의 사진이 이미 옅게/부분적으로 보이도록
  //    opacity/inset의 시작값을 0이 아닌 값으로 잡는다.
  //  - clip-path에 카드의 border-radius(--spotlight-radius)를 round 값으로 함께 넘겨,
  //    사각형 리빌 도중에도 모서리가 항상 둥글게 유지되도록 한다.
  const spotlightSpacer = document.querySelector('.spotlight-spacer');
  if (spotlightSpacer) {
    const slides = Array.from(spotlightSpacer.querySelectorAll('.spotlight-slide'));
    const dots = Array.from(spotlightSpacer.querySelectorAll('.spotlight-dot'));
    const total = slides.length;

    const PRE_OPACITY = 0.3;  // 스크롤 시작 전 이미 보이는 기본 불투명도
    const PRE_INSET = 26;     // 스크롤 시작 전 사각형 클립 상태(%)

    // 카드별 border-radius 값을 한 번만 읽어둔다 (반응형 브레이크포인트에서 값이 바뀌므로
    // 리사이즈 시 다시 계산)
    let slideRadius = new Map();
    const syncSlideRadius = () => {
      slides.forEach((slide) => {
        const radius = getComputedStyle(slide).getPropertyValue('--spotlight-radius').trim() || '22px';
        slideRadius.set(slide, radius);
      });
    };
    syncSlideRadius();
    window.addEventListener('resize', syncSlideRadius);

    const handleSpotlightScroll = () => {
      const rect = spotlightSpacer.getBoundingClientRect();
      const { top, height } = rect;
      const vh = window.innerHeight;

      if (top > vh || top + height < 0) return; // 화면 밖이면 계산 스킵

      const progress = Math.max(0, Math.min(1, -top / (height - vh)));
      const zoneLength = 1 / total;
      let activeIndex = 0;
      let activeOpacity = -1;

      slides.forEach((slide, i) => {
        const zoneStart = i * zoneLength;
        const zoneEnd = zoneStart + zoneLength;
        const fadeInRatio = 0.5;
        const fadeOutRatio = 0.5;
        const fadeInEnd = zoneStart + zoneLength * fadeInRatio;
        const fadeOutStart = zoneStart + zoneLength * fadeOutRatio;

        let opacity = 0;
        let inset = 0; // 기본은 평범한 fade (사각형 클립 없음)

        if (progress >= zoneStart && progress <= zoneEnd) {
          if (progress <= fadeInEnd) {
            const local = (progress - zoneStart) / (fadeInEnd - zoneStart);
            const eased = 1 - Math.pow(1 - local, 3); // Ease-out Cubic

            if (i === 0) {
              // 최초 등장 구간: 사각형 리빌 유지 + 이미 옅게 보이는 상태에서 시작
              opacity = PRE_OPACITY + (1 - PRE_OPACITY) * eased;
              inset = PRE_INSET * (1 - eased);
            } else {
              // 카드 간 전환: 평범한 fade-in
              opacity = eased;
              inset = 0;
            }
          } else if (progress < fadeOutStart) {
            opacity = 1;
            inset = 0;
          } else {
            // 모든 카드의 퇴장은 항상 평범한 fade-out (사각형 없음)
            const local = (progress - fadeOutStart) / (zoneEnd - fadeOutStart);
            const eased = local < 0.5
              ? 4 * local * local * local
              : 1 - Math.pow(-2 * local + 2, 3) / 2;
            opacity = 1 - eased;
            inset = 0;
          }
        }

        opacity = Math.max(0, Math.min(1, opacity));
        const radius = slideRadius.get(slide) || '22px';
        slide.style.opacity = opacity;
        slide.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius})`;
        slide.style.transform = `translateY(${18 * (1 - opacity)}px)`;

        if (opacity > activeOpacity) {
          activeOpacity = opacity;
          activeIndex = i;
        }
      });

      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeIndex));
    };

    // 진행 표시 점(dot)을 클릭하면 해당 카드가 안정 구간(중앙)에 오는 위치로 스크롤 이동
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const i = Number(dot.dataset.index);
        const vh = window.innerHeight;
        const height = spotlightSpacer.offsetHeight;
        const spacerTop = spotlightSpacer.getBoundingClientRect().top + window.scrollY;
        const zoneLength = 1 / total;
        const targetProgress = i * zoneLength + zoneLength * 0.5; // 각 구간의 안정(중앙) 지점
        const targetY = spacerTop + targetProgress * (height - vh);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });

    window.addEventListener('scroll', handleSpotlightScroll, { passive: true });
    handleSpotlightScroll();
  }

  /* ---------- 9. Match experience-image height to feature-grid (2-card) height on desktop ---------- */
  const experienceImage = document.querySelector('.experience-image');
  const featureGrid = document.querySelector('.feature-grid');
  if (experienceImage && featureGrid) {
    const syncExperienceImageHeight = () => {
      if (window.innerWidth > 1024) {
        // feature-grid는 2x2 그리드이므로 전체 높이가 곧 카드 2개 높이(행 2개 + gap)와 같음
        experienceImage.style.height = `${featureGrid.offsetHeight}px`;
      } else {
        experienceImage.style.height = '';
      }
    };
    syncExperienceImageHeight();
    window.addEventListener('resize', syncExperienceImageHeight);
    window.addEventListener('load', syncExperienceImageHeight);
  }
});