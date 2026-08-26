/**
 * i18n.js
 * -----------------------------------------------------------------------
 * gtranslate 드롭다운은 그대로 사용합니다 (ko/fr/it/es/en/pt/zh-TW는 기존처럼
 * Google 자동번역이 처리). 일본어(ja)만 예외적으로, 사용자가 드롭다운에서
 * "日本語"를 선택하는 순간 gtranslate의 doGTranslate() 호출을 가로채서
 * Google 번역 대신 /lang/ja.json 기반 커스텀 번역을 적용합니다.
 *
 * 동작 원리:
 *   gtranslate dropdown.js 위젯은 언어를 클릭/선택하면 내부적으로
 *   `doGTranslate('ko|ja')` 같은 전역 함수를 호출합니다.
 *   여기서는 그 함수를 감싸서(wrap) 타깃 언어가 'ja'이면 원래 함수를
 *   호출하지 않고 우리 로직(applyLanguage)만 실행합니다.
 *   그 외 언어는 원래 doGTranslate를 그대로 호출해 gtranslate가 처리하게 둡니다.
 *
 * 사용법 (HTML 쪽, 기존과 동일):
 *   data-i18n="key.path"          → textContent를 교체
 *   data-i18n-html="key.path"     → innerHTML을 교체 (내부에 <span> 등 태그가 있는 경우)
 *   data-i18n-alt="key.path"      → alt 속성을 교체
 *   data-i18n-content="key.path"  → content 속성을 교체 (meta 태그용)
 *   data-i18n-aria-label="key.path" → aria-label 속성을 교체
 * -----------------------------------------------------------------------
 */

const STORAGE_KEY = 'bw-lang';
// 사이트가 서브경로에 배포돼도 깨지지 않도록, 루트 절대경로 대신
// 이 스크립트 파일(script/i18n.js) 위치를 기준으로 상대경로를 계산한다.
const JSON_URL = new URL('../lang/ja.json', import.meta.url).href;

const state = {
    lang: 'ko',
    ja: null,          // ja.json 로드 결과
    ready: false,
    originals: new WeakMap(), // 각 엘리먼트의 원본(한국어) 값을 저장해서 ko로 되돌릴 수 있게 함
};

/** "a.b.c" 형태의 키로 중첩 객체에서 값을 꺼낸다 */
function resolveKey(dict, key) {
    if (!dict) return undefined;
    return key.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), dict);
}

function getOriginal(el, prop) {
    if (!state.originals.has(el)) state.originals.set(el, {});
    const store = state.originals.get(el);
    if (!(prop in store)) {
        store[prop] = prop === 'innerHTML' ? el.innerHTML
            : prop === 'textContent' ? el.textContent
                : el.getAttribute(prop);
    }
    return store[prop];
}

function applyToElement(el, attr, prop) {
    const key = el.getAttribute(attr);
    if (!key) return;
    const original = getOriginal(el, prop);

    if (state.lang === 'ko') {
        if (prop === 'innerHTML') el.innerHTML = original;
        else if (prop === 'textContent') el.textContent = original;
        else el.setAttribute(prop, original);
        return;
    }

    // ja
    const translated = resolveKey(state.ja, key);
    if (translated === undefined) {
        console.warn(`[i18n] ja.json에 "${key}" 키가 없습니다. 한국어 원문을 유지합니다.`);
        return;
    }
    if (prop === 'innerHTML') el.innerHTML = translated;
    else if (prop === 'textContent') el.textContent = translated;
    else el.setAttribute(prop, translated);
}

function applyLanguage(lang) {
    state.lang = lang === 'ja' ? 'ja' : 'ko';
    document.documentElement.lang = state.lang;

    document.querySelectorAll('[data-i18n]').forEach(el => applyToElement(el, 'data-i18n', 'textContent'));
    document.querySelectorAll('[data-i18n-html]').forEach(el => applyToElement(el, 'data-i18n-html', 'innerHTML'));
    document.querySelectorAll('[data-i18n-alt]').forEach(el => applyToElement(el, 'data-i18n-alt', 'alt'));
    document.querySelectorAll('[data-i18n-content]').forEach(el => applyToElement(el, 'data-i18n-content', 'content'));
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => applyToElement(el, 'data-i18n-aria-label', 'aria-label'));

    try { localStorage.setItem(STORAGE_KEY, state.lang); } catch (e) { /* ignore (프라이빗 모드 등) */ }

    // main.js처럼 동적으로 텍스트를 렌더링하는 코드(카운터 접미사, 비전 뷰어 등)가
    // 언어 변경에 반응할 수 있도록 커스텀 이벤트를 전달한다.
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: state.lang } }));
}

async function loadJaDict() {
    try {
        const res = await fetch(JSON_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        state.ja = await res.json();
    } catch (err) {
        console.error(`[i18n] ${JSON_URL} 을 불러오지 못했습니다.`, err);
        state.ja = {};
    }
    state.ready = true;
}

function getInitialLang() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'ja' || saved === 'ko') return saved;
    } catch (e) { /* ignore */ }
    return 'ko';
}

/**
 * gtranslate의 doGTranslate 전역 함수를 감싸서 'ja' 타깃만 가로챈다.
 * dropdown.js가 defer로 로드되고 이 모듈도 defer(모듈 기본)로 실행되므로
 * 보통은 이미 정의돼 있지만, 로드 타이밍이 어긋날 경우를 대비해 짧게 폴링한다.
 */
function hookGTranslate() {
    const MAX_WAIT_MS = 8000;
    const POLL_MS = 100;
    let waited = 0;

    const tryWrap = () => {
        if (typeof window.doGTranslate === 'function' && !window.doGTranslate.__i18nWrapped) {
            const original = window.doGTranslate;
            const wrapped = function (langPair) {
                const target = String(langPair || '').split('|')[1];
                if (target === 'ja') {
                    // Google 자동번역을 타지 않고 우리 JSON 번역만 적용
                    applyLanguage('ja');
                    return false;
                }
                // ja가 아닌 다른 언어를 선택하면, 우리가 덮어쓴 텍스트를 먼저
                // 한국어 원문으로 되돌린 뒤 gtranslate 본연의 동작을 그대로 진행시킨다.
                if (state.lang === 'ja') applyLanguage('ko');
                return original.apply(this, arguments);
            };
            wrapped.__i18nWrapped = true;
            window.doGTranslate = wrapped;
            return true;
        }
        return false;
    };

    if (tryWrap()) return;

    const timer = setInterval(() => {
        waited += POLL_MS;
        if (tryWrap() || waited >= MAX_WAIT_MS) {
            clearInterval(timer);
            if (waited >= MAX_WAIT_MS) {
                console.warn('[i18n] doGTranslate 함수를 찾지 못했습니다. gtranslate 위젯 로드 여부를 확인하세요.');
            }
        }
    }, POLL_MS);
}

// window.i18n 로 외부(main.js 등)에서 t()와 현재 언어를 참조할 수 있게 노출
window.i18n = {
    t(key, fallback = '') {
        if (state.lang === 'ko') return fallback;
        const val = resolveKey(state.ja, key);
        return val !== undefined ? val : fallback;
    },
    get lang() { return state.lang; },
    setLanguage: applyLanguage,
};

document.addEventListener('DOMContentLoaded', async () => {
    hookGTranslate();
    await loadJaDict();
    const initial = getInitialLang();
    if (initial === 'ja') applyLanguage('ja'); // 저장된 선택값이 ja면 새로고침 후에도 바로 반영
});
