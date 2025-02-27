function changeLanguage(languageCode) {
    Array.from(document.getElementsByClassName('lang')).forEach(function (elem) {
        if (elem.classList.contains('lang-' + languageCode)) {
             elem.style.display = 'initial';
        }
        else {
             elem.style.display = 'none';
        }
    });
}

// select handler
const selector = document.getElementById('langSelector');
selector.addEventListener('change', function (evt) {
    changeLanguage(this.value);
});

// detect initial browser language
const lang = navigator.userLanguage || navigator.language || 'en-EN';
const startLang = Array.from(selector.options).map(opt => opt.value).find(val => lang.includes(val)) || 'en';
changeLanguage(startLang);

// updating select with start value
selector.selectedIndex = Array.from(selector.options).map(opt => opt.value).indexOf(startLang)

// fill "The selected language is:"
document.getElementById('browserLang').innerText = lang;
document.getElementById('startLang').innerText = startLang;