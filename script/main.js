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
    // progress 0.7 지점 = 배경/헤더 페이드인이 끝나고 첫 feature가 보이기 시작하는 안정 구간
    const targetProgress = 0.7;
    const targetY = spacerTop + targetProgress * (spacerHeight - vh);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  document.querySelectorAll('a[href="#gameplay"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToGameplayReveal();
    });
  });

  /* ---------- 0-1. Spotlight(#vision) 섹션: 첫 카드가 완전히 보이는 지점으로 스크롤 이동 ----------
     #vision은 position:sticky 컨테이너 내부 요소라 문서상 "정적 위치"가 스크럽 구간의
     맨 처음(progress 0, 첫 카드가 아직 옅게만 보이는 지점)으로 계산된다.
     네이티브 해시 이동에 맡기면 위에서 내려올 때는 자연스럽게 이어져 보이지만,
     아래에서 거슬러 올라올 때는 그 "설익은" 지점에 그대로 멈춰 마치 동작하지 않는 것처럼
     보이므로, gameplay와 동일하게 JS로 가로채 안정 구간으로 이동시킨다. */
  const scrollToVisionReveal = () => {
    const spacer = document.querySelector('.spotlight-spacer');
    if (!spacer) {
      document.getElementById('vision')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const vh = window.innerHeight;
    const spacerHeight = spacer.offsetHeight;
    const spacerTop = spacer.getBoundingClientRect().top + window.scrollY;
    // handleSpotlightScroll의 zone 계산과 동일한 기준 (slide 0의 안정 구간 중앙).
    // style.css의 .snap-step 첫 번째 마커(0.125)와 같은 지점.
    const targetProgress = 0.125;
    const targetY = spacerTop + targetProgress * (spacerHeight - vh);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  document.querySelectorAll('a[href="#vision"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToVisionReveal();
    });
  });

  /* ---------- 1. Mobile nav toggle ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('nav ul');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
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

  /* ---------- 6. Hero CTA buttons scroll to gameplay ---------- */
  document.querySelectorAll('.cta-primary, .cta-secondary').forEach(btn => {
    if (!btn.dataset.target) return;
    btn.addEventListener('click', (e) => {
      if (btn.dataset.target === '#gameplay') {
        scrollToGameplayReveal();
        return;
      }
      if (btn.dataset.target === '#vision') {
        scrollToVisionReveal();
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
  const navEl = document.querySelector('nav');
  if (gameplaySection) {
    const spacer = gameplaySection.querySelector('.gameplay-spacer');
    const header = gameplaySection.querySelector('.section-header');
    const features = gameplaySection.querySelectorAll('.gameplay-feature');
    const modelViewer = gameplaySection.querySelector('model-viewer, .model-viewer-container');

    const handleGameplayScroll = () => {
      const rect = spacer.getBoundingClientRect();
      const { top, height } = rect;
      const vh = window.innerHeight;

      // 섹션이 화면에 보이지 않으면 실행 안함
      if (top > vh || top + height < 0) {
        if (header.style.opacity !== '0') {
          header.style.opacity = 0;
          features.forEach(feature => {
            feature.style.opacity = 0;
            feature.style.transform = `translateY(20px)`;
          });
        }
        if (navEl) {
          navEl.style.opacity = '';
          navEl.style.pointerEvents = '';
        }
        return;
      }

      // 스크롤 진행률 (0: 섹션 상단이 뷰포트 상단에 닿을 때, 1: 섹션 하단이 뷰포트 하단에 닿을 때)
      const progress = Math.max(0, Math.min(1, -top / (height - vh)));

      // 1. 헤더 페이드 인/아웃
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

      // 2. 상단 nav 페이드 아웃/인 — panorama가 풀스크린으로 보이는 구간(25%~80%)에는
      //    고정 nav가 화면 위쪽을 가려 "잘려 보이는" 문제를 막기 위해 nav를 숨긴다.
      if (navEl) {
        let navOpacity = 1;
        if (progress >= 0.20 && progress <= 0.30) {
          navOpacity = 1 - (progress - 0.20) / 0.10;
        } else if (progress > 0.30 && progress < 0.85) {
          navOpacity = 0;
        } else if (progress >= 0.85 && progress <= 0.95) {
          navOpacity = (progress - 0.85) / 0.10;
        } else {
          navOpacity = 1;
        }
        navEl.style.opacity = navOpacity;
        navEl.style.pointerEvents = navOpacity < 0.05 ? 'none' : '';
      }

      // 3. 3D Model Viewer 페이드 연동 (25% -> 45% 페이드인 / 80% -> 95% 페이드아웃)
      if (modelViewer) {
        if (progress >= 0.25 && progress <= 0.45) {
          const opacity = (progress - 0.25) / 0.20;
          modelViewer.style.opacity = opacity;
          modelViewer.style.transform = `translateY(${20 * (1 - opacity)}px)`;
        } else if (progress > 0.45 && progress < 0.80) {
          modelViewer.style.opacity = 1;
          modelViewer.style.transform = `translateY(0px)`;
        } else if (progress >= 0.80 && progress <= 0.95) {
          const opacity = 1 - (progress - 0.80) / 0.15;
          modelViewer.style.opacity = opacity;
          modelViewer.style.transform = `translateY(${20 * (1 - opacity)}px)`;
        } else {
          modelViewer.style.opacity = 0;
          modelViewer.style.transform = `translateY(20px)`;
        }
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

  /* ---------- 10. 360도 공방 panorama + 작업대 hotspot(3D 책상 모델) ---------- */
  const panoramaEl = document.getElementById('panorama');
  const deskModal = document.getElementById('deskModelModal');

  if (panoramaEl && typeof pannellum !== 'undefined') {
    const viewer = pannellum.viewer('panorama', {
      type: 'equirectangular',
      panorama: 'images/thatch_chapel.jpg',
      autoLoad: true,
      autoRotate: -2,
      compass: false,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      mouseZoom: false, // 휠을 줌으로 가로채지 않도록 비활성화 → 스크롤이 항상 페이지 스크롤로 전달됨
      hotSpots: [
        {
          pitch: -20,
          yaw: 31,
          type: 'custom',
          cssClass: 'desk-hotspot',
          createTooltipFunc: (hotSpotDiv) => {
            hotSpotDiv.classList.add('desk-hotspot-marker');
            hotSpotDiv.innerHTML =
              '<span class="material-icons desk-hotspot-icon">chair</span>' +
              '<span class="desk-hotspot-pulse"></span>' +
              '<span class="desk-hotspot-label">완성된 책상 보기</span>';
            hotSpotDiv.addEventListener('click', (e) => {
              e.stopPropagation();
              openDeskModal();
            });
          }
        }
      ]
    });

    // pannellum이 초기화 시점에 컨테이너 높이를 잘못 계산해 캔버스 상단이
    // 잘려 보이는 경우를 방지하기 위해, 로드/리사이즈 시 강제로 재계산한다.
    const resizePanorama = () => {
      if (viewer && typeof viewer.resize === 'function') viewer.resize();
    };
    window.addEventListener('load', resizePanorama);
    window.addEventListener('resize', resizePanorama);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resizePanorama).observe(panoramaEl);
    }
    setTimeout(resizePanorama, 300);
  }

  function openDeskModal() {
    if (!deskModal) return;
    deskModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDeskModal() {
    if (!deskModal) return;
    deskModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (deskModal) {
    deskModal.querySelector('.model-modal-close')?.addEventListener('click', closeDeskModal);
    deskModal.addEventListener('click', (e) => {
      if (e.target === deskModal) closeDeskModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && deskModal.classList.contains('active')) closeDeskModal();
    });
  }
});

/* ---------- 8. Immersive gamevideo Section Scroll Animation ---------- */
const gamevideoSection = document.getElementById('gamevideo');
if (gamevideoSection) {
  const spacer = gamevideoSection.querySelector('.gamevideo-spacer');
  const bg = gamevideoSection.querySelector('.gamevideo-background');
  const header = gamevideoSection.querySelector('.section-header');
  const gvStage = gamevideoSection.querySelector('.gv-stage');

  const handleGamevideoScroll = () => {
    const rect = spacer.getBoundingClientRect();
    const { top, height } = rect;
    const vh = window.innerHeight;

    // 섹션이 화면에 보이지 않으면 실행 안함
    if (top > vh || top + height < 0) {
      if (bg.style.opacity !== '0') {
        bg.style.opacity = 0;
        if (header) header.style.opacity = 0;
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

    // 3. 파티클 레이어 스크롤 시차용 값 — 안정 구간 중심(0.65)을 기준으로
    //    -1~1 근방 값을 만들어 --scroll-shift로 흘려보낸다. .gv-particle-layer의
    //    --depth와 곱해져 레이어별로 다른 속도의 세로 이동을 만든다.
    if (gvStage) {
      const scrollShift = Math.max(-1, Math.min(1, (progress - 0.65) / 0.35));
      gvStage.style.setProperty('--scroll-shift', scrollShift.toFixed(3));
    }

    // 4. 헤더 페이드 인/아웃
    // 20% -> 35% : 페이드 인
    // 80% -> 90% : 페이드 아웃
    if (header) {
      if (progress >= 0.20 && progress <= 0.35) {
        header.style.opacity = (progress - 0.20) / 0.15;
      } else if (progress > 0.35 && progress < 0.8) {
        header.style.opacity = 1;
      } else if (progress >= 0.8 && progress <= 0.9) {
        header.style.opacity = 1 - (progress - 0.8) / 0.1;
      } else if (progress > 0.9 || progress < 0.20) {
        header.style.opacity = 0;
      }
    }
  };

  window.addEventListener('scroll', handleGamevideoScroll, { passive: true });
  handleGamevideoScroll(); // 초기 로드 시 한 번 실행

  /* ---------- 8-1. 비디오 3D 틸트 + 파티클(톱밥) 패럴랙스 레이어 ---------- */
  if (gvStage) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 레이어별로 톱밥 파티클을 랜덤 생성 (far → 작고 흐릿, near → 크고 선명)
    const particleConfigs = [
      { selector: '.gv-particle-layer--far', count: 16, size: [2, 4], blur: 2.5 },
      { selector: '.gv-particle-layer--mid', count: 12, size: [3, 6], blur: 1.2 },
      { selector: '.gv-particle-layer--near', count: 8, size: [5, 10], blur: 0 },
    ];
    particleConfigs.forEach(cfg => {
      const layer = gvStage.querySelector(cfg.selector);
      if (!layer) return;
      for (let i = 0; i < cfg.count; i++) {
        const dot = document.createElement('span');
        dot.className = 'gv-particle';
        const size = cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]);
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.left = `${Math.random() * 100}%`;
        dot.style.top = `${Math.random() * 100}%`;
        if (cfg.blur) dot.style.filter = `blur(${cfg.blur}px)`;
        if (!reduceMotion) {
          dot.style.animationDuration = `${8 + Math.random() * 10}s`;
          dot.style.animationDelay = `-${Math.random() * 12}s`;
        }
        layer.appendChild(dot);
      }
    });

    if (!reduceMotion) {
      // 마우스 위치를 바로 반영하지 않고 lerp로 이징 — 관성이 붙어 자연스럽게 따라온다
      let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

      const onPointerMove = (e) => {
        const rect = gamevideoSection.querySelector('.gamevideo-sticky-container').getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        targetX = Math.max(-1, Math.min(1, nx));
        targetY = Math.max(-1, Math.min(1, ny));
      };
      const resetTilt = () => { targetX = 0; targetY = 0; };

      const tick = () => {
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;
        gvStage.style.setProperty('--tilt-x', currentX.toFixed(4));
        gvStage.style.setProperty('--tilt-y', currentY.toFixed(4));
        requestAnimationFrame(tick);
      };
      tick();

      const stickyContainer = gamevideoSection.querySelector('.gamevideo-sticky-container');
      if (stickyContainer) {
        stickyContainer.addEventListener('mousemove', onPointerMove);
        stickyContainer.addEventListener('mouseleave', resetTilt);
      }
    }
  }
}
