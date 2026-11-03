// MenuLix Dynamic Customer Menu Controller
// Connected to Firebase Firestore: publicMenus/{restaurantId} and users/{restaurantId}/categories/{id}/items

const SUPPORTED_LANGUAGES = ['en', 'ar', 'ku'];
const RTL_LANGUAGES = ['ar', 'ku'];
const LANGUAGE_STORAGE_KEY = 'selectedLanguage';
const DEFAULT_LANGUAGE = 'en';

let currentLanguage = DEFAULT_LANGUAGE;
let currentRestaurantId = null;
let restaurantProfile = null;
let menuCategories = [];
let menuLoading = true;
let menuError = null;

let sectionObserver = null;
let cardObserver = null;
let feedbackSubmitted = false;

// Global translations dictionary for UI elements and system statuses
const translations = {
  en: {
    documentTitle: 'MenuLix - Customer Menu',
    brand: {
      defaultName: 'MenuLix',
    },
    hero: {
      defaultEyebrow: 'Restaurant',
      defaultTagline: 'Quality food, crafted with care',
    },
    buttons: {
      language: '🌐 Language',
      feedback: '✍️ Feedback',
      backToTop: 'Back to top',
      close: 'Close',
      sendFeedback: 'Send Feedback →',
    },
    labels: {
      phone: 'Phone',
      currency: 'IQD',
      menuCategories: 'Menu categories',
      viewDetails: 'View details for',
      unavailable: 'Currently Unavailable',
      calories: 'Calories',
      rating: 'Rating',
    },
    modals: {
      languageTitle: 'Choose Language',
      languageDescription: 'Choose your preferred menu language.',
      feedbackTitle: 'Share Feedback',
      feedbackDescription: "How was your experience? We'd love to hear from you.",
      itemDetailsContains: 'Details & Ingredients',
    },
    feedback: {
      placeholder: 'Tell us about your visit...',
      empty: 'Please write something first.',
      thanks: '✅ Thank you for your feedback!',
    },
    footer: {
      defaultTagline: 'Fine Food Daily',
      copy: '© 2026 MenuLix · All rights reserved',
    },
    empty: {
      title: 'No Menu Items Available',
      desc: 'This restaurant has not added any items to their menu yet. Please check back soon!',
    },
    error: {
      missingIdTitle: 'Restaurant Not Specified',
      missingIdDesc: 'No restaurant ID was provided in the URL. Please scan a valid MenuLix QR code or use a link containing ?restaurantId=YOUR_ID',
      notFoundTitle: 'Restaurant Not Found',
      notFoundDesc: 'We could not find a menu for this restaurant. The link may be expired or invalid.',
      subscriptionTitle: 'Menu Unavailable',
      subscriptionDesc: 'This restaurant menu is temporarily unavailable. Please check back later.',
      generalTitle: 'Could Not Load Menu',
      generalDesc: 'An error occurred while loading the menu. Please check your internet connection.',
    },
  },
  ar: {
    documentTitle: 'منيو ليكس - قائمة الطعام',
    brand: {
      defaultName: 'منيو ليكس',
    },
    hero: {
      defaultEyebrow: 'مطعم',
      defaultTagline: 'طعام شهي محضر بعناية فائقة',
    },
    buttons: {
      language: '🌐 اللغة',
      feedback: '✍️ الملاحظات',
      backToTop: 'العودة إلى الأعلى',
      close: 'إغلاق',
      sendFeedback: 'إرسال الملاحظات ←',
    },
    labels: {
      phone: 'الهاتف',
      currency: 'دينار',
      menuCategories: 'أقسام القائمة',
      viewDetails: 'عرض تفاصيل',
      unavailable: 'غير متوفر حالياً',
      calories: 'سعرة حرارية',
      rating: 'التقييم',
    },
    modals: {
      languageTitle: 'اختر اللغة',
      languageDescription: 'اختر اللغة المفضلة لعرض القائمة.',
      feedbackTitle: 'شارك ملاحظاتك',
      feedbackDescription: 'كيف كانت تجربتك؟ يسعدنا سماع رأيك.',
      itemDetailsContains: 'التفاصيل والمكونات',
    },
    feedback: {
      placeholder: 'اكتب لنا عن زيارتك...',
      empty: 'يرجى كتابة ملاحظة أولاً.',
      thanks: '✅ شكراً لملاحظاتك!',
    },
    footer: {
      defaultTagline: 'طعام فاخر يومياً',
      copy: '© 2026 منيو ليكس · جميع الحقوق محفوظة',
    },
    empty: {
      title: 'لا توجد أصناف في القائمة',
      desc: 'لم يقم المطعم بإضافة أي عناصر إلى قائمته بعد. يُرجى التحقق مرة أخرى قريباً!',
    },
    error: {
      missingIdTitle: 'لم يتم تحديد المطعم',
      missingIdDesc: 'لم يتم توفير معرّف المطعم في الرابط. يرجى مسح رمز QR صالح أو استخدام رابط يحتوي على ?restaurantId=ID',
      notFoundTitle: 'المطعم غير موجود',
      notFoundDesc: 'تعذر العثور على قائمة لهذا المطعم. قد يكون الرابط منتهي الصلاحية أو غير صحيح.',
      subscriptionTitle: 'القائمة غير متاحة',
      subscriptionDesc: 'قائمة هذا المطعم غير متاحة حالياً. يرجى مراجعتها لاحقاً.',
      generalTitle: 'تعذر تحميل القائمة',
      generalDesc: 'حدث خطأ أثناء تحميل القائمة. يرجى التحقق من اتصالك بالإنترنت.',
    },
  },
  ku: {
    documentTitle: 'مینیو لێکس - لیستی خواردن',
    brand: {
      defaultName: 'مینیو لێکس',
    },
    hero: {
      defaultEyebrow: 'چێشتخانە',
      defaultTagline: 'خواردنی بەتام بە گرنگییەوە ئامادەکراوە',
    },
    buttons: {
      language: '🌐 زمان',
      feedback: '✍️ بۆچوون',
      backToTop: 'گەڕانەوە بۆ سەرەوە',
      close: 'داخستن',
      sendFeedback: 'ناردنی بۆچوون ←',
    },
    labels: {
      phone: 'تەلەفۆن',
      currency: 'دینار',
      menuCategories: 'بەشەکانی لیست',
      viewDetails: 'بینینی وردەکاری',
      unavailable: 'لە ئێستادا بەردەست نییە',
      calories: 'کالۆری',
      rating: 'هەڵسەنگاندن',
    },
    modals: {
      languageTitle: 'زمان هەڵبژێرە',
      languageDescription: 'زمانی دڵخوازت بۆ لیستی خواردن هەڵبژێرە.',
      feedbackTitle: 'بۆچوونت بنێرە',
      feedbackDescription: 'ئەزموونت چۆن بوو؟ دڵخۆش دەبین بە بیستنی بۆچوونت.',
      itemDetailsContains: 'وردەکاری و پێکهاتەکان',
    },
    feedback: {
      placeholder: 'دەربارەی سەردانەکەت بۆمان بنووسە...',
      empty: 'تکایە سەرەتا شتێک بنووسە.',
      thanks: '✅ سوپاس بۆ بۆچوونەکەت!',
    },
    footer: {
      defaultTagline: 'خواردنی باش بەڕۆژانە',
      copy: '© 2026 مینیو لێکس · هەموو مافەکان پارێزراون',
    },
    empty: {
      title: 'هیچ خواردنێک بەردەست نییە',
      desc: 'ئەم چێشتخانەیە هێشتا هیچ خواردنێکی بۆ لیستەکەی زیاد نەکردووە. تکایە دواتر سەردان بکەرەوە!',
    },
    error: {
      missingIdTitle: 'چێشتخانە دیاری نەکراوە',
      missingIdDesc: 'هیچ ناسنامەیەکی چێشتخانە لە بەستەرەکەدا نییە. تکایە کۆدی QR ڕاستەقینە سکان بکە یان بەستەری تەواو بەکاربهێنە.',
      notFoundTitle: 'چێشتخانە نەدۆزرایەوە',
      notFoundDesc: 'نەتوانرا لیستی ئەم چێشتخانەیە بدۆزرێتەوە. لەوانەیە بەستەرەکە نادروست بێت.',
      subscriptionTitle: 'لیست بەردەست نییە',
      subscriptionDesc: 'لیستی ئەم چێشتخانەیە لە ئێستادا ناچالاکە.',
      generalTitle: 'نەتوانرا لیستەکە باربکرێت',
      generalDesc: 'هەڵەیەک ڕوویدا لە کاتی بارکردنی لیستەکەدا. تکایە هێڵی ئینتەرنێتەکەت بپشکنە.',
    },
  },
};

// Language Helpers
function loadLanguage() {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
    currentLanguage = saved;
  } else {
    currentLanguage = DEFAULT_LANGUAGE;
  }
}

function saveLanguage(lang) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

function translate(path, lang = currentLanguage) {
  const value = path.split('.').reduce((node, key) => node?.[key], translations[lang]);
  const fallback = path.split('.').reduce((node, key) => node?.[key], translations[DEFAULT_LANGUAGE]);
  return value ?? fallback ?? path;
}

// Multi-language value resolver
function resolveLocalized(field, lang = currentLanguage) {
  if (field === null || field === undefined) return '';
  if (typeof field === 'object') {
    return field[lang] || field[DEFAULT_LANGUAGE] || field.en || field.ar || field.ku || Object.values(field)[0] || '';
  }
  return String(field);
}

function isRtl(lang = currentLanguage) {
  return RTL_LANGUAGES.includes(lang);
}

function applyDirection(lang = currentLanguage) {
  const rtl = isRtl(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.body.dir = document.documentElement.dir;
  document.body.classList.toggle('is-rtl', rtl);
}

function updateStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = translate(key);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const [attr, key] = el.dataset.i18nAttr.split(':');
    if (attr && key) {
      el.setAttribute(attr, translate(key));
    }
  });

  updateLanguageOptions();
}

function updateLanguageOptions() {
  document.querySelectorAll('.lang-opt').forEach(option => {
    const isSelected = option.dataset.lang === currentLanguage;
    option.classList.toggle('selected', isSelected);
    option.setAttribute('aria-pressed', String(isSelected));
  });
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  currentLanguage = lang;
  saveLanguage(lang);
  applyDirection(currentLanguage);
  updateStaticTranslations();
  renderRestaurantProfile();
  renderNavigation();
  renderMenu();
  renderFeedbackForm();
  closeAll();
}

// Read restaurantId from URL search params (?restaurantId= or ?r=)
function getRestaurantIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('restaurantId') || params.get('r');
  return rawId ? rawId.trim() : null;
}

// Render dynamic Restaurant Profile
function renderRestaurantProfile() {
  const heroEyebrow = document.getElementById('heroEyebrow');
  const heroTitle = document.getElementById('heroTitle');
  const heroTagline = document.getElementById('heroTagline');
  const heroLogo = document.getElementById('heroLogo');
  const heroPhone = document.getElementById('heroPhone');
  const heroPhoneText = document.getElementById('heroPhoneText');

  const footerTitle = document.getElementById('footerTitle');
  const footerTagline = document.getElementById('footerTagline');
  const footerLogo = document.getElementById('footerLogo');
  const footerPhone = document.getElementById('footerPhone');
  const footerPhoneText = document.getElementById('footerPhoneText');
  const footerCopy = document.getElementById('footerCopy');
  const pageTitle = document.getElementById('pageTitle');

  if (!restaurantProfile) {
    const defaultName = translate('brand.defaultName');
    if (heroTitle) heroTitle.textContent = defaultName;
    if (footerTitle) footerTitle.textContent = defaultName;
    if (pageTitle) pageTitle.textContent = defaultName;
    return;
  }

  const name = resolveLocalized(restaurantProfile.restaurantName) || translate('brand.defaultName');
  const cuisine = resolveLocalized(restaurantProfile.cuisine || restaurantProfile.businessType) || translate('hero.defaultEyebrow');
  const tagline = resolveLocalized(restaurantProfile.tagline) || translate('hero.defaultTagline');
  const phone = restaurantProfile.phone || '';
  const logoUrl = restaurantProfile.restaurantLogoUrl || '';

  if (pageTitle) pageTitle.textContent = `${name} - ${translate('documentTitle')}`;

  if (heroEyebrow) heroEyebrow.textContent = cuisine;
  if (heroTitle) heroTitle.textContent = name;
  if (heroTagline) heroTagline.textContent = tagline;

  if (heroLogo) {
    if (logoUrl) {
      heroLogo.src = logoUrl;
      heroLogo.style.display = 'block';
    } else {
      heroLogo.style.display = 'none';
    }
  }

  if (heroPhone && heroPhoneText) {
    if (phone) {
      heroPhone.href = `tel:${phone.replace(/\s+/g, '')}`;
      heroPhoneText.textContent = phone;
      heroPhone.style.display = 'inline-flex';
    } else {
      heroPhone.style.display = 'none';
    }
  }

  if (footerTitle) footerTitle.textContent = name;
  if (footerTagline) footerTagline.textContent = `${cuisine} · ${tagline}`;

  if (footerLogo) {
    if (logoUrl) {
      footerLogo.src = logoUrl;
      footerLogo.style.display = 'block';
    } else {
      footerLogo.style.display = 'none';
    }
  }

  if (footerPhone && footerPhoneText) {
    if (phone) {
      footerPhone.href = `tel:${phone.replace(/\s+/g, '')}`;
      footerPhoneText.textContent = phone;
      footerPhone.style.display = 'inline-flex';
    } else {
      footerPhone.style.display = 'none';
    }
  }

  if (footerCopy) {
    const year = new Date().getFullYear();
    footerCopy.textContent = `© ${year} ${name} · ${translate('footer.copy').split('·')[1] || 'All rights reserved'}`;
  }
}

// Render Status or Error Container
function renderStatus(titleKey, descKey, icon = '🍽️') {
  const main = document.getElementById('menuMain');
  const navInner = document.getElementById('navInner');
  if (navInner) navInner.innerHTML = '';

  main.innerHTML = `
    <div class="menu-status-container">
      <div class="menu-status-icon">${icon}</div>
      <h2 class="menu-status-title">${translate(titleKey)}</h2>
      <p class="menu-status-desc">${translate(descKey)}</p>
    </div>
  `;
}

// Category Navigation
function renderNavigation() {
  const navInner = document.getElementById('navInner');
  if (!navInner) return;

  navInner.innerHTML = '';

  if (!menuCategories || menuCategories.length === 0) {
    return;
  }

  menuCategories.forEach(category => {
    // Only render categories that have items
    if (!category.items || category.items.length === 0) return;

    const button = document.createElement('button');
    button.className = 'nav-btn';
    button.dataset.target = `cat-${category.id}`;
    button.type = 'button';
    button.textContent = resolveLocalized(category.name);

    button.addEventListener('click', () => {
      document.getElementById(`cat-${category.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    navInner.appendChild(button);
  });
}

// Main Menu Renderer
function renderMenu() {
  const main = document.getElementById('menuMain');
  if (!main) return;

  if (menuLoading) {
    main.innerHTML = `
      <div class="menu-loading">
        <div class="menu-spinner"></div>
      </div>
    `;
    return;
  }

  if (menuError) {
    renderStatus(menuError.titleKey, menuError.descKey, menuError.icon);
    return;
  }

  // Filter categories with items
  const activeCategories = (menuCategories || []).filter(c => c.items && c.items.length > 0);

  if (activeCategories.length === 0) {
    renderStatus('empty.title', 'empty.desc', '📋');
    return;
  }

  main.innerHTML = '';

  activeCategories.forEach((category, sectionIndex) => {
    main.appendChild(createMenuSection(category, sectionIndex));

    if (sectionIndex < activeCategories.length - 1) {
      const separator = document.createElement('div');
      separator.className = 'section-sep';
      main.appendChild(separator);
    }
  });

  initSectionObserver();
  initCardObserver();
}

function createMenuSection(category, sectionIndex) {
  const menuSection = document.createElement('section');
  menuSection.className = 'menu-section';
  menuSection.id = `cat-${category.id}`;
  menuSection.dataset.sectionIndex = String(sectionIndex);

  const header = document.createElement('div');
  header.className = 'section-header';

  const icon = document.createElement('div');
  icon.className = 'section-icon';
  icon.textContent = category.icon || '🍽️';

  const title = document.createElement('h2');
  title.className = 'section-title';

  const titleText = document.createElement('span');
  titleText.className = 'section-title-main';
  titleText.textContent = resolveLocalized(category.name);

  title.append(titleText);
  header.append(icon, title);

  const container = document.createElement('div');
  container.className = 'items-container';
  container.id = `items-${category.id}`;

  menuSection.append(header, container);

  category.items.forEach((item, itemIndex) => {
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.dataset.sectionIndex = String(sectionIndex);
    card.dataset.itemIndex = String(itemIndex);
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.style.animationDelay = `${itemIndex * 0.05}s`;

    card.addEventListener('click', () => openItemDetails(category, item));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openItemDetails(category, item);
      }
    });

    const itemPhoto = document.createElement('img');
    itemPhoto.className = 'item-photo';
    itemPhoto.src = item.imageUrl || 'assets/images/fries.jpg';
    itemPhoto.alt = resolveLocalized(item.name);
    itemPhoto.loading = 'lazy';
    itemPhoto.onerror = function() {
      // Fallback placeholder if image link is broken
      this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F200%2Fsvg%22%3E%3Crect%20fill%3D%22%232B1B14%22%20width%3D%22100%25%22%20height%3D%22100%25%22%2F%3E%3Ctext%20fill%3D%22%23FFA14D%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EMenuLix%3C%2Ftext%3E%3C%2Fsvg%3E';
    };

    const itemInfo = document.createElement('div');
    itemInfo.className = 'item-info';

    const itemName = document.createElement('div');
    itemName.className = 'item-name';
    itemName.textContent = resolveLocalized(item.name);

    const itemNote = document.createElement('div');
    itemNote.className = 'item-note';
    const desc = resolveLocalized(item.description);
    itemNote.textContent = desc;
    itemNote.hidden = !desc;

    itemInfo.append(itemName, itemNote);

    if (item.tags && item.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'item-tags';
      item.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'item-tag';
        tagSpan.textContent = tag;
        tagsContainer.appendChild(tagSpan);
      });
      itemInfo.appendChild(tagsContainer);
    }

    const itemPrice = document.createElement('div');
    itemPrice.className = 'item-price';

    const priceText = item.price ? String(item.price) : '';
    const currencyStr = restaurantProfile?.currency || translate('labels.currency');

    const priceValue = document.createTextNode(priceText);
    const currency = document.createElement('span');
    currency.className = 'currency';
    currency.textContent = ' ' + currencyStr;

    itemPrice.append(priceValue, currency);

    if (item.available === false) {
      itemPrice.textContent = translate('labels.unavailable');
      itemPrice.style.fontSize = '0.78rem';
      card.style.opacity = '0.65';
    }

    card.append(itemPhoto, itemInfo, itemPrice);
    container.appendChild(card);
  });

  return menuSection;
}

// Modal item details view
function openItemDetails(category, item) {
  if (!item) return;

  const overlay = document.getElementById('itemDetailsOverlay');
  const title = document.getElementById('itemDetailsTitle');
  const icon = document.getElementById('itemDetailsIcon');
  const price = document.getElementById('itemDetailsPrice');
  const detailsList = document.getElementById('itemDetailsList');

  title.textContent = resolveLocalized(item.name);
  icon.innerHTML = '';

  const modalImage = document.createElement('img');
  modalImage.src = item.imageUrl || 'assets/images/fries.jpg';
  modalImage.alt = resolveLocalized(item.name);
  modalImage.onerror = function() {
    this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F200%2Fsvg%22%3E%3Crect%20fill%3D%22%232B1B14%22%20width%3D%22100%25%22%20height%3D%22100%25%22%2F%3E%3Ctext%20fill%3D%22%23FFA14D%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EMenuLix%3C%2Ftext%3E%3C%2Fsvg%3E';
  };
  icon.appendChild(modalImage);

  const currencyStr = restaurantProfile?.currency || translate('labels.currency');
  if (item.available === false) {
    price.textContent = translate('labels.unavailable');
    price.style.color = 'var(--muted)';
  } else {
    price.textContent = `${item.price || ''} ${currencyStr}`;
    price.style.color = '';
  }

  detailsList.innerHTML = '';

  // 1. Description
  const desc = resolveLocalized(item.description);
  if (desc) {
    const li = document.createElement('li');
    li.textContent = desc;
    detailsList.appendChild(li);
  }

  // 2. Calories
  if (item.calories) {
    const li = document.createElement('li');
    li.textContent = `🔥 ${item.calories} ${translate('labels.calories')}`;
    detailsList.appendChild(li);
  }

  // 3. Rating
  if (item.rating) {
    const li = document.createElement('li');
    li.textContent = `⭐ ${item.rating} / 5.0 (${translate('labels.rating')})`;
    detailsList.appendChild(li);
  }

  // 4. Tags
  if (item.tags && item.tags.length > 0) {
    const li = document.createElement('li');
    li.textContent = `🏷️ ${item.tags.join(', ')}`;
    detailsList.appendChild(li);
  }

  if (detailsList.children.length === 0) {
    const li = document.createElement('li');
    li.textContent = translate('brand.defaultName');
    detailsList.appendChild(li);
  }

  overlay.classList.add('open');
}

// Scrollspy and Animations
function initSectionObserver() {
  sectionObserver?.disconnect();

  const observerOptions = { rootMargin: '-25% 0px -65% 0px' };
  sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      document.querySelectorAll('.nav-btn').forEach(button => {
        button.classList.toggle('active', button.dataset.target === entry.target.id);
      });

      const activeButton = document.querySelector(`.nav-btn[data-target="${entry.target.id}"]`);
      activeButton?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    });
  }, observerOptions);

  document.querySelectorAll('.menu-section').forEach(section => sectionObserver.observe(section));
}

function initCardObserver() {
  cardObserver?.disconnect();

  cardObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.menu-item').forEach(card => {
    card.style.animationPlayState = 'paused';
    cardObserver.observe(card);
  });
}

function initScrollTop() {
  const button = document.getElementById('scrollTopBtn');
  if (!button) return;

  window.addEventListener('scroll', () => {
    button.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
}

// Modals
function openLang() {
  updateLanguageOptions();
  document.getElementById('langOverlay')?.classList.add('open');
}

function openFeedback() {
  renderFeedbackForm();
  document.getElementById('feedbackOverlay')?.classList.add('open');
}

function closeAll(event) {
  if (
    !event ||
    event.target.classList.contains('overlay') ||
    event.target.classList.contains('modal-close')
  ) {
    document.querySelectorAll('.overlay').forEach(overlay => overlay.classList.remove('open'));
  }
}

function submitFeedback() {
  const feedbackText = document.getElementById('feedbackText');
  const value = feedbackText?.value.trim();

  if (!value) {
    alert(translate('feedback.empty'));
    return;
  }

  feedbackSubmitted = true;
  const form = document.getElementById('feedbackForm');
  if (form) {
    form.innerHTML = `<p class="feedback-success">${translate('feedback.thanks')}</p>`;
  }

  setTimeout(closeAll, 2000);
}

function renderFeedbackForm() {
  const form = document.getElementById('feedbackForm');
  if (!form) return;

  if (!feedbackSubmitted && form.querySelector('#feedbackText')) {
    const textarea = document.getElementById('feedbackText');
    const button = form.querySelector('.feedback-submit');
    if (textarea) {
      textarea.placeholder = translate('feedback.placeholder');
      textarea.dir = isRtl() ? 'rtl' : 'ltr';
    }
    if (button) {
      button.textContent = translate('buttons.sendFeedback');
    }
    return;
  }

  feedbackSubmitted = false;
  form.innerHTML = '';

  const textarea = document.createElement('textarea');
  textarea.id = 'feedbackText';
  textarea.placeholder = translate('feedback.placeholder');
  textarea.dir = isRtl() ? 'rtl' : 'ltr';

  const submitButton = document.createElement('button');
  submitButton.className = 'feedback-submit';
  submitButton.type = 'button';
  submitButton.textContent = translate('buttons.sendFeedback');
  submitButton.addEventListener('click', submitFeedback);

  form.append(textarea, submitButton);
}

function initLangOptions() {
  document.querySelectorAll('.lang-opt').forEach(option => {
    option.addEventListener('click', () => setLanguage(option.dataset.lang));
  });
}

// Connect to Firebase Realtime Listeners
function startFirebaseSubscription(restaurantId) {
  menuLoading = true;
  menuError = null;
  renderMenu();

  if (!window.MenuLixFirestore) {
    console.error('[MenuLix Diagnostic] MenuLixFirestore module is not loaded.');
    menuLoading = false;
    menuError = { titleKey: 'error.generalTitle', descKey: 'error.generalDesc', icon: '⚠️' };
    renderMenu();
    return;
  }

  const firestoreDb = window.MenuLixFirestore.getDb();
  if (!firestoreDb) {
    console.error('[MenuLix Diagnostic] Cannot start subscription: Firestore is not initialized (window.db is null).');
    menuLoading = false;
    menuError = { titleKey: 'error.generalTitle', descKey: 'error.generalDesc', icon: '⚠️' };
    renderMenu();
    return;
  }

  // 1. Listen to public restaurant profile
  window.MenuLixFirestore.listenRestaurantProfile(
    restaurantId,
    profile => {
      if (!profile) {
        console.warn(`[MenuLix Diagnostic] publicMenus document not found for ID: "${restaurantId}". Categories and items will still be checked.`);
      } else {
        console.log(`[MenuLix Diagnostic] Loaded publicMenus profile for "${restaurantId}":`, profile.restaurantName || '(unnamed)');
        restaurantProfile = profile;
        renderRestaurantProfile();
      }
    },
    error => {
      console.warn('[MenuLix Diagnostic] Error loading public restaurant profile:', error?.message || error);
    }
  );

  // 2. Listen to categories and nested items
  window.MenuLixFirestore.listenMenuData(
    restaurantId,
    categories => {
      console.log(`[MenuLix Diagnostic] Real-time categories update for "${restaurantId}": ${categories.length} category(s) found.`);
      menuLoading = false;
      menuError = null;
      menuCategories = categories;
      renderNavigation();
      renderMenu();
    },
    error => {
      console.error('[MenuLix Diagnostic] Firestore menu error:', error?.message || error);
      menuLoading = false;
      menuError = { titleKey: 'error.notFoundTitle', descKey: 'error.notFoundDesc', icon: '🔍' };
      renderMenu();
    }
  );
}

// App Initialization
function init() {
  loadLanguage();
  applyDirection(currentLanguage);
  updateStaticTranslations();
  initScrollTop();
  initLangOptions();

  currentRestaurantId = getRestaurantIdFromUrl();

  // Diagnostic logging (strictly without credentials or private keys)
  const isFirebaseLoaded = typeof firebase !== 'undefined';
  const isAppInit = isFirebaseLoaded && Array.isArray(firebase.apps) && firebase.apps.length > 0;
  const isFirestoreInit = Boolean(window.db || (isFirebaseLoaded && typeof firebase.firestore === 'function'));

  console.group('[MenuLix Diagnostic] Customer Menu Status');
  console.log('Current URL:', window.location.href);
  console.log('Extracted restaurantId:', currentRestaurantId ? `"${currentRestaurantId}"` : '(none provided)');
  console.log('Firebase SDK loaded:', isFirebaseLoaded);
  console.log('Firebase App initialized:', isAppInit);
  console.log('Firestore initialized (window.db):', Boolean(window.db));
  console.log('Firestore service available:', isFirestoreInit);
  console.groupEnd();

  if (!currentRestaurantId) {
    console.warn('[MenuLix Diagnostic] Missing restaurant ID in URL query parameters. Expected ?restaurantId=ID or ?r=ID');
    menuLoading = false;
    menuError = {
      titleKey: 'error.missingIdTitle',
      descKey: 'error.missingIdDesc',
      icon: '🔗'
    };
    renderMenu();
    return;
  }

  startFirebaseSubscription(currentRestaurantId);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
