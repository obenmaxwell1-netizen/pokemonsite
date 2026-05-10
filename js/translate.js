// Google Translate Widget Initialization
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'en,fr,es,de,ja,zh-CN,ko',
    autoDisplay: false
  }, 'google_translate_element');
}

// Inject CSS to aggressively hide Google Translate banner
const style = document.createElement('style');
style.innerHTML = `
  body { top: 0 !important; position: static !important; }
  .skiptranslate iframe,
  .goog-te-banner-frame,
  iframe.goog-te-banner-frame { display: none !important; visibility: hidden !important; }
  #goog-gt-tt { display: none !important; visibility: hidden !important; }
  .goog-tooltip, .goog-tooltip:hover { display: none !important; }
  .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
  body > .skiptranslate { display: none !important; }
`;
document.head.appendChild(style);

// Custom Language Switcher Logic
document.addEventListener('DOMContentLoaded', () => {
  const langLabels = {
    'en': 'EN',
    'fr': 'FR',
    'es': 'ES',
    'de': 'DE',
    'ja': 'JA',
    'zh-CN': 'ZH',
    'ko': 'KO'
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const setLanguageCookie = (lang) => {
    const hostname = window.location.hostname;
    const cookieBase = lang === 'en' ? 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC' : `googtrans=/en/${lang}`;
    document.cookie = `${cookieBase}; path=/`;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      document.cookie = `${cookieBase}; domain=${hostname}; path=/`;
      document.cookie = `${cookieBase}; domain=.${hostname}; path=/`;
    }
  };

  const updateLabel = () => {
    const googtrans = getCookie('googtrans');
    let currentLang = 'en';
    if (googtrans && googtrans !== 'null') {
      const parts = googtrans.split('/');
      if (parts.length > 2) currentLang = parts[2];
    }
    const labelSpan = document.getElementById('current-lang-label');
    if (labelSpan && langLabels[currentLang]) {
      labelSpan.textContent = langLabels[currentLang];
    }
  };

  // Initial label update
  updateLabel();

  // Handle language selection
  const langLinks = document.querySelectorAll('.lang-dropdown a');
  langLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = e.currentTarget.getAttribute('data-lang');
      
      setLanguageCookie(lang);
      
      const gtSelect = document.querySelector('.goog-te-combo');
      if (gtSelect) {
        gtSelect.value = lang;
        gtSelect.dispatchEvent(new Event('change'));
        updateLabel();
      } else {
        // Fallback if widget hasn't loaded properly
        window.location.reload();
      }
    });
  });
});
