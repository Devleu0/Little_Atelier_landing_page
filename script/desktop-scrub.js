/* =========================================================================
   desktop-scrub.js — index.html(데스크톱) 전용 스크롤 스크럽 로직.
   "긴 스페이서 + position:sticky + scrollY 진행률(progress)로 레이아웃을
   재구성"하는 방식은 모바일 주소창 vh 변동 문제 때문에 모바일에서는
   쓰지 않는다 (모바일은 mobile-carousel.js가 담당).
   반드시 common.js보다 "먼저" <script> 태그로 로드해야 한다 — 이 파일이
   정의하는 window.scrollToGameplayReveal을 common.js의 클릭 핸들러가
   DOMContentLoaded 시점에 참조하기 때문 (스크립트는 문서 순서대로
   DOMContentLoaded 리스너를 등록하므로, 등록 순서 = 실행 순서).
   ========================================================================= */
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
  // common.js(nav 링크, hero CTA 버튼)가 재사용할 수 있도록 전역에 노출
  window.scrollToGameplayReveal = scrollToGameplayReveal;

  document.querySelectorAll('a[href="#gameplay"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToGameplayReveal();
    });
  });

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
      const fadeInEnd = 0.5;
      const fadeOutStart = 0.8;
      const PRE_BG_OPACITY = 0.28; // 스크롤 시작 전 이미 보이는 기본 불투명도
      const PRE_BG_INSET = 32;     // 스크롤 시작 전 사각형 클립 상태(%)

      let currentOpacity = PRE_BG_OPACITY;
      let currentInset = PRE_BG_INSET;

      if (progress > fadeInEnd && progress < fadeOutStart) {
        currentOpacity = 1;
        currentInset = 0;
      } else if (progress <= fadeInEnd) {
        const localProgress = progress / fadeInEnd;
        const easedProgress = 1 - Math.pow(1 - localProgress, 3);
        currentOpacity = PRE_BG_OPACITY + (1 - PRE_BG_OPACITY) * easedProgress;
        currentInset = PRE_BG_INSET * (1 - easedProgress);
      } else if (progress >= fadeOutStart) {
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
      if (progress >= 0.20 && progress <= 0.35) {
        header.style.opacity = (progress - 0.20) / 0.15;
      } else if (progress > 0.35 && progress < 0.8) {
        header.style.opacity = 1;
      } else if (progress >= 0.8 && progress <= 0.9) {
        header.style.opacity = 1 - (progress - 0.8) / 0.1;
      } else if (progress > 0.9 || progress < 0.20) {
        header.style.opacity = 0;
      }

      // 3. 피처 아이템 순차적 애니메이션
      const featureZoneStart = 0.25;
      const featureZoneEnd = 0.95;
      const featureCount = features.length;
      const featureDuration = (featureZoneEnd - featureZoneStart) / featureCount;

      features.forEach((feature, i) => {
        const zoneStart = featureZoneStart + i * featureDuration;
        const zoneEnd = zoneStart + featureDuration * 0.8;
        const zoneLength = zoneEnd - zoneStart;

        const fadeInRatio = 0.35;
        const fadeOutRatio = 0.8;
        const localFadeInEnd = zoneStart + zoneLength * fadeInRatio;
        const localFadeOutStart = zoneStart + zoneLength * fadeOutRatio;

        let opacity = 0;

        if (progress < zoneStart || progress > zoneEnd) {
          opacity = 0;
        } else if (progress <= localFadeInEnd) {
          const localProgress = (progress - zoneStart) / (localFadeInEnd - zoneStart);
          opacity = 1 - Math.pow(1 - localProgress, 3);
        } else if (progress < localFadeOutStart) {
          opacity = 1;
        } else {
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
  const spotlightSpacer = document.querySelector('.spotlight-spacer');
  if (spotlightSpacer) {
    const slides = Array.from(spotlightSpacer.querySelectorAll('.spotlight-slide'));
    const dots = Array.from(spotlightSpacer.querySelectorAll('.spotlight-dot'));
    const total = slides.length;

    const PRE_OPACITY = 0.3;
    const PRE_INSET = 26;

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

      if (top > vh || top + height < 0) return;

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
        let inset = 0;

        if (progress >= zoneStart && progress <= zoneEnd) {
          if (progress <= fadeInEnd) {
            const local = (progress - zoneStart) / (fadeInEnd - zoneStart);
            const eased = 1 - Math.pow(1 - local, 3);

            if (i === 0) {
              opacity = PRE_OPACITY + (1 - PRE_OPACITY) * eased;
              inset = PRE_INSET * (1 - eased);
            } else {
              opacity = eased;
              inset = 0;
            }
          } else if (progress < fadeOutStart) {
            opacity = 1;
            inset = 0;
          } else {
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

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const i = Number(dot.dataset.index);
        const vh = window.innerHeight;
        const height = spotlightSpacer.offsetHeight;
        const spacerTop = spotlightSpacer.getBoundingClientRect().top + window.scrollY;
        const zoneLength = 1 / total;
        const targetProgress = i * zoneLength + zoneLength * 0.5;
        const targetY = spacerTop + targetProgress * (height - vh);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });

    window.addEventListener('scroll', handleSpotlightScroll, { passive: true });
    handleSpotlightScroll();
  }

  /* ---------- 9. Match experience-image height to feature-grid height (desktop only) ---------- */
  const experienceImage = document.querySelector('.experience-image');
  const featureGrid = document.querySelector('.feature-grid');
  if (experienceImage && featureGrid) {
    const syncExperienceImageHeight = () => {
      if (window.innerWidth > 1024) {
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
