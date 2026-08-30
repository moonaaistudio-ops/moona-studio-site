/* Shared locale runtime for the static Moona pages. */
(() => {
  'use strict';

  const STORAGE_KEY = 'moona.locale';
  const VALID_LOCALES = new Set(['en', 'he']);
  const HEBREW_FONTS_ID = 'moona-hebrew-fonts';
  const HEBREW_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600&family=Frank+Ruhl+Libre:wght@400;600&display=swap';

  const messages = {
    en: {
      'meta.home.title': 'Moona | AI-native studio for cinematic brand films',
      'meta.home.description': 'We build the world, then film the ad. An AI-native studio making cinematic brand films with uncompromising craft.',
      'meta.privacy.title': 'Privacy notice | Moona',
      'meta.privacy.description': 'How Moona uses optional, consent-based analytics and protects inquiry form data.',

      'language.switchToHebrew': 'Switch to Hebrew',
      'language.switchToEnglish': 'Switch to English',
      'header.home': 'Moona home',
      'nav.sections': 'Sections',
      'nav.work': 'Work',
      'nav.studio': 'Studio',
      'nav.cta': 'Get an ad',
      'skip.work': 'Skip to the work',

      'consent.label': 'Analytics preferences',
      'consent.text': 'We use analytics to see how the site performs.',
      'consent.privacy': 'Privacy notice',
      'consent.accept': 'Accept analytics',
      'consent.decline': 'Decline',
      'lightbox.label': 'Enlarged work',
      'common.close': 'Close',
      'loader.label': 'Loading',

      'hero.headline.lead': 'Cinematic ads, ',
      'hero.headline.emphasis': 'born without a camera',
      'hero.subline.one': 'An AI-native studio for film and motion ads.',
      'hero.subline.two': 'Story, craft and taste first.',
      'hero.cta': 'Get an ad for your brand',
      'hero.turn.setup': "We don't film products.",
      'hero.turn.payoff': 'We film what they mean.',
      'hero.scroll': 'Scroll',

      'film.eyebrow': 'The flagship',
      'film.title.lead': 'We invented a brand. ',
      'film.title.emphasis': 'Then we shot its ad.',
      'film.note.tail': ' is an energy bar you cannot buy.',
      'film.frame.open': 'Open DUSTLINE larger, with controls',
      'film.video.description': 'DUSTLINE. A one-night desert love story told through an energy bar. A film by Moona.',
      'film.original': 'Moona original',
      'film.playWithSound': 'Play with sound',
      'film.credit.lead': 'DUSTLINE',
      'film.credit.tail': 'born without a camera',
      'film.how.eyebrow': 'How we work',
      'film.how.body': 'Nothing here was left to the model. Days of retakes, and every frame decided, measured and graded before it existed. We work at the front of these tools, which only counts because someone made the decisions first.',
      'film.beat.experience.label': 'The experience',
      'film.beat.experience.title': "We don't find locations. We build experience.",
      'film.beat.experience.body': 'A world you can believe, then measured to the metre: the gap between the stones at 0.90 m, the towers at 21, sky and ground lifted colour by colour. Get the place wrong and every shot standing in it is wrong.',
      'film.beat.shots.label': 'The shots',
      'film.beat.shots.title': 'The profession is in the details.',
      'film.beat.shots.body': 'A mathematically frozen frame is the clearest tell that a shot was generated. Every camera here breathes, carries a footstep, drifts, and never moves without a reason inside the story. Nobody notices it. Everybody feels it.',
      'film.beat.cast.label': 'The cast',
      'film.beat.cast.title': 'The reference outranks the script.',
      'film.beat.cast.body': 'Faces, wardrobe and packaging lock to approved plates before a frame is generated, and where the writing disagrees with the reference the writing changes. Drift between shots is the first failure we design against.',
      'work.eyebrow': 'Spec work · nobody asked for these',
      'work.note': "Four brands we don't work for. We made these anyway, the same way we'll make yours.",
      'work.specBadge': 'Moona original · Spec',
      'work.mcdonalds.video': "McDonald's self-initiated spec film by Moona",
      'work.mcdonalds.concept': 'You already know the taste. Now watch it move.',
      'work.mcdonalds.tag': 'from one product photo · 3 days · appetite pacing · single continuous move',
      'work.strava.video': 'Strava self-initiated spec film by Moona',
      'work.strava.concept': 'Every run already has a soundtrack. We cut to it.',
      'work.strava.tag': 'from their own site · 3 days · beat-matched cut · product-locked colour',
      'work.bullPadel.video': 'Bull Padel self-initiated spec film by Moona',
      'work.bullPadel.concept': 'The court hits back.',
      'work.bullPadel.tag': 'from one product photo · 3 days · 3-beat cut · frame-accurate brand colour',
      'work.koda.video': 'Koda self-initiated spec film by Moona',
      'work.koda.concept': 'Built for the feed it lives in.',
      'work.koda.tag': 'from their own site · 3 days · loop-safe edit · legibility at 0.4s',

      'studio.eyebrow': 'No pitch',
      'studio.title.lead': "We'd rather ",
      'studio.title.emphasis': 'show',
      'studio.title.tail': ' you than tell you.',
      'studio.body': 'One finished piece with your actual product, moving or still. Then you decide.',
      'studio.note': 'No cost, no call, no commitment.',
      'studio.statement.lead': 'Moona is an AI-native studio making cinematic motion for brands. ',
      'studio.statement.emphasis': 'The camera was optional.',

      'contact.line': 'Your product, next.',
      'contact.or': 'or',
      'contact.email': 'Email the studio',
      'contact.disclaimer': 'All work self-initiated. Brands are shown for demonstration only and are not clients. No client relationship implied.',
      'contact.rights': 'All rights reserved.',

      'form.dialog': 'Get an ad for your brand',
      'form.step.name.label': "01 / Who we're speaking with",
      'form.step.name.title': "What's your name?",
      'form.step.name.placeholder': 'Jane Cohen',
      'form.step.name.hint': 'Press Enter to continue',
      'form.step.email.label': '02 / Where it lands',
      'form.step.email.title': 'Where should we send the work?',
      'form.step.email.placeholder': 'you@yourbrand.com',
      'form.step.email.hint': 'Used for the work and nothing else.',
      'form.step.site.label': '03 / The product',
      'form.step.site.title': 'Where can we see it?',
      'form.step.site.placeholder': 'yourbrand.com',
      'form.step.site.hint': 'A site or a product page. We pull the rest ourselves.',
      'form.upload.title': 'Add product shots or a logo',
      'form.upload.detail': 'Optional · images, PDF or zip · up to 3.5 MB',
      'form.upload.browse': 'Browse',
      'form.next': 'Next',
      'form.back': 'Back',
      'form.send': 'Send',
      'form.done.title': "We're on it.",
      'form.done.body': 'Your work lands in your inbox within a few days.',
      'form.validation.required': 'This one we need.',
      'form.validation.email': 'That address looks off.',
      'form.validation.url': 'A link we can open, please.',
      'form.status.sending': 'Sending…',
      'form.status.mailFallback': "Couldn't send from here, opening your mail instead.",
      'form.files.tooLarge': 'Too large to send with the form',
      'form.files.remove': 'Remove {name}',
      'form.files.notFit': {
        one: "{count} won't fit · {size} total. Remove one, or send the rest by reply.",
        two: "{count} won't fit · {size} total. Remove one, or send the rest by reply.",
        many: "{count} won't fit · {size} total. Remove one, or send the rest by reply.",
        other: "{count} won't fit · {size} total. Remove one, or send the rest by reply."
      },
      'form.mailto.subject': 'Ad request: {brand}',
      'form.mailto.name': 'Name',
      'form.mailto.company': 'Company',
      'form.mailto.website': 'Website',
      'form.mailto.email': 'Email',

      'media.pauseThisFilm': 'Pause this film',
      'media.playThisFilm': 'Play this film',
      'media.pauseTheFilm': 'Pause the film',
      'media.playTheFilm': 'Play the film',
      'media.soundOff': 'Turn the film sound off',
      'media.soundOn': 'Turn the film sound on',
      'media.openFilm': 'Open film larger',
      'media.openStill': 'Open still larger',
      'media.openThisFilm': 'Open this film larger',

      'privacy.back': 'Back to ',
      'privacy.heading': 'Privacy notice',
      'privacy.intro': 'Moona Studio uses optional analytics to understand website use and improve our work. Analytics do not load until you choose “Accept analytics” in the notice on the site. You can choose “Decline” instead.',
      'privacy.services.heading': 'Analytics services',
      'privacy.services.ga': 'Google Analytics 4, for aggregated traffic and engagement measurement.',
      'privacy.services.clarity': 'Microsoft Clarity, for privacy-protected usability insights. The project inquiry form is explicitly masked.',
      'privacy.services.posthog': 'PostHog, for product-analytics events such as page views and safe interaction events. Session recording and automatic click capture are disabled for this site.',
      'privacy.collection.heading': 'What we collect',
      'privacy.collection.body': 'After consent, these services may receive technical and usage data such as page paths, browser and device information, approximate location derived from IP address, and the interaction events needed to understand the site. We do not send values entered in the inquiry form to these analytics services.',
      'privacy.choices.heading': 'Your choices',
      'privacy.choices.body': 'You can decline analytics in the site notice. If you previously accepted, clear this website’s stored data in your browser and reload the site to choose again. Browser privacy controls such as Do Not Track and Global Privacy Control are respected where available.',
      'privacy.contact.heading': 'Contact',
      'privacy.contact.lead': 'For privacy questions, email ',
      'privacy.contact.tail': '.'
    },

    he: {
      'meta.home.title': 'Moona | סטודיו AI-native לסרטי מותג קולנועיים',
      'meta.home.description': 'סטודיו AI-native להפקת סרטי מותג ופרסומות ברמה קולנועית.',
      'meta.privacy.title': 'הודעת פרטיות | Moona',
      'meta.privacy.description': 'שימוש אופציונלי ומבוסס־הסכמה באנליטיקה ב־Moona, והאופן שבו נשמר המידע בטופס הפנייה.',

      'language.switchToHebrew': 'מעבר לעברית',
      'language.switchToEnglish': 'מעבר לאנגלית',
      'header.home': 'דף הבית של Moona',
      'nav.sections': 'חלקי האתר',
      'nav.work': 'עבודות',
      'nav.studio': 'סטודיו',
      'nav.cta': 'יצירת פרסומת',
      'skip.work': 'דילוג לעבודות',

      'consent.label': 'העדפות עוגיות אנליטיקה',
      'consent.text': 'אנחנו משתמשים בעוגיות אנליטיקה כדי להבין איך משתמשים באתר ולשפר אותו.',
      'consent.privacy': 'הודעת פרטיות',
      'consent.accept': 'אישור עוגיות',
      'consent.decline': 'דחיית עוגיות',
      'lightbox.label': 'עבודה בתצוגה מוגדלת',
      'common.close': 'סגירה',
      'loader.label': 'טעינה',

      'hero.headline.lead': 'פרסומות קולנועיות, ',
      'hero.headline.emphasis': 'שנולדו בלי מצלמה',
      'hero.subline.one': 'מתמחים בהפקת סרטי מותג ופרסומות באמצעות AI,',
      'hero.subline.two': 'במראה ריאליסטי וברמה קולנועית, בלי להתפשר על אף פריים.',
      'hero.cta': 'יצירת פרסומת למותג',
      'hero.turn.setup': 'אנחנו לא רק יוצרים פרסומות למותגים.',
      'hero.turn.payoff': 'אנחנו הופכים את החוויה שלהם לסרט.',
      'hero.scroll': 'לגלול',

      'film.eyebrow': 'סרט הדגל',
      'film.title.lead': 'המצאנו מותג. ',
      'film.title.emphasis': 'ואז צילמנו לו פרסומת.',
      'film.note.tail': ' הוא חטיף אנרגיה שאי אפשר לקנות.',
      'film.frame.open': 'פתיחת DUSTLINE בתצוגה מוגדלת עם פקדים',
      'film.video.description': 'DUSTLINE. סיפור אהבה מדברי של לילה אחד, המסופר דרך חטיף אנרגיה. סרט של Moona.',
      'film.original': 'יצירה מקורית של Moona',
      'film.playWithSound': 'ניגון עם סאונד',
      'film.credit.lead': 'DUSTLINE',
      'film.credit.tail': 'נולד בלי מצלמה',
      'film.how.eyebrow': 'מאחורי הסרט',
      'film.how.body': 'DUSTLINE הוא מותג קונספט מקורי שיצרנו ב־Moona מאפס. הכול התחיל בסיפור. כל פריים תוכנן כדי לשרת את הקריאייטיב ולשמור על עולם עקבי ואמין. אנחנו משלבים כלי AI מתקדמים עם תהליך הפקה קפדני ושליטה מלאה בבימוי, בעריכה ובפוסט.',
      'film.beat.experience.label': 'בניית העולם',
      'film.beat.experience.title': 'לוקיישן שאפשר להאמין בו.',
      'film.beat.experience.body': 'הוא נבנה עד הפרט האחרון: מרווח של 0.90 מ׳ בין האבנים, מגדלים בגובה 21 מ׳, שמיים וקרקע שנבנו שכבה אחר שכבה. מבחינתנו, אמינות מתחילה בבסיס, בלוקיישן עצמו.',
      'film.beat.shots.label': 'הפרטים',
      'film.beat.shots.title': 'הכול נמצא בפרטים.',
      'film.beat.shots.body': 'אמינות הדמויות, העקביות בין השוטים, הלוקיישן ואווירת המסיבה נשמרים לאורך הסרט. הסיפור, התנועה, הצבע ורמת הגימור מקבלים את אותה תשומת לב. כשכל פרט מדויק, הסרט כולו מרגיש אמיתי.',
      'film.beat.cast.label': 'הקריאייטיב',
      'film.beat.cast.title': 'קריאייטיב שעובד.',
      'film.beat.cast.body': 'הכול מתחיל בקריאייטיב ובתסריט. הדמויות, הסטיילינג והשפה הוויזואלית נקבעים כבר בשלב הקריאייטיב. משם נבנים הליהוק, תנועות המצלמה, עיצוב הסאונד והעריכה. את החיבור ביניהם רואים בכל פריים של DUSTLINE.',

      'work.eyebrow': 'סרטי קונספט · ביוזמת Moona',
      'work.note': 'סרטי הקונספט האלה נוצרו ביוזמתנו כדי להראות מה נוכל ליצור עבור המותג הבא. המותגים המוצגים אינם לקוחות של Moona.',
      'work.specBadge': 'יצירה מקורית של Moona · קונספט',
      'work.mcdonalds.video': "סרט קונספט ביוזמת Moona עבור McDonald's",
      'work.mcdonalds.concept': 'את הטעם כבר מכירים. עכשיו אפשר לראות אותו זז.',
      'work.mcdonalds.tag': 'מתמונת מוצר אחת · 3 ימים · קצב שמעורר תיאבון · תנועה רציפה אחת',
      'work.strava.video': 'סרט קונספט ביוזמת Moona עבור Strava',
      'work.strava.concept': 'לכל ריצה כבר יש פסקול. ערכנו לפיו.',
      'work.strava.tag': 'מהאתר שלהם · 3 ימים · עריכה לפי הקצב · צבע נעול למוצר',
      'work.bullPadel.video': 'סרט קונספט ביוזמת Moona עבור Bull Padel',
      'work.bullPadel.concept': 'המגרש מחזיר מכה.',
      'work.bullPadel.tag': 'מתמונת מוצר אחת · 3 ימים · עריכה בשלושה ביטים · צבע מותג מדויק לפריים',
      'work.koda.video': 'סרט קונספט ביוזמת Moona עבור Koda',
      'work.koda.concept': 'נבנה לפיד שבו הוא חי.',
      'work.koda.tag': 'מהאתר שלהם · 3 ימים · עריכה ללופ חלק · קריאות בתוך 0.4 שניות',

      'studio.eyebrow': 'בלי פיץ׳',
      'studio.title.lead': 'נעדיף ',
      'studio.title.emphasis': 'להראות',
      'studio.title.tail': ' במקום לספר.',
      'studio.body': 'יצירה מוגמרת אחת עם המוצר האמיתי, בתנועה או בסטילס. ואז מחליטים.',
      'studio.note': 'בלי עלות, בלי שיחה, בלי התחייבות.',
      'studio.statement.lead': 'Moona הוא סטודיו AI-native שיוצר תוכן קולנועי בתנועה למותגים. ',
      'studio.statement.emphasis': 'המצלמה הייתה אופציונלית.',

      'contact.line': 'עכשיו תור המוצר.',
      'contact.or': 'או',
      'contact.email': 'מייל לסטודיו',
      'contact.disclaimer': 'כל העבודות נוצרו ביוזמתנו. המותגים מוצגים לצורכי הדגמה בלבד ואינם לקוחות. אין בכך כדי לרמוז על קשר מסחרי.',
      'contact.rights': 'כל הזכויות שמורות.',

      'form.dialog': 'יצירת פרסומת למותג',
      'form.step.name.label': '01 / עם מי מדברים',
      'form.step.name.title': 'איך קוראים לך?',
      'form.step.name.placeholder': 'דנה כהן',
      'form.step.name.hint': 'לחיצה על Enter להמשך',
      'form.step.email.label': '02 / לאן זה מגיע',
      'form.step.email.title': 'לאן לשלוח את העבודה?',
      'form.step.email.placeholder': 'you@yourbrand.com',
      'form.step.email.hint': 'משמש רק לשליחת העבודה.',
      'form.step.site.label': '03 / המוצר',
      'form.step.site.title': 'איפה אפשר לראות אותו?',
      'form.step.site.placeholder': 'yourbrand.com',
      'form.step.site.hint': 'אתר או עמוד מוצר. את השאר כבר נמצא.',
      'form.upload.title': 'הוספת תמונות מוצר או לוגו',
      'form.upload.detail': 'אופציונלי · תמונות, PDF או zip · עד 3.5 MB',
      'form.upload.browse': 'בחירת קבצים',
      'form.next': 'המשך',
      'form.back': 'חזרה',
      'form.send': 'שליחה',
      'form.done.title': 'אנחנו על זה.',
      'form.done.body': 'העבודה תגיע למייל בתוך כמה ימים.',
      'form.validation.required': 'את זה צריך למלא.',
      'form.validation.email': 'כתובת המייל לא נראית תקינה.',
      'form.validation.url': 'צריך קישור שאפשר לפתוח.',
      'form.status.sending': 'מתבצעת שליחה…',
      'form.status.mailFallback': 'לא ניתן לשלוח מכאן. המייל ייפתח במקום.',
      'form.files.tooLarge': 'הקובץ גדול מדי לשליחה עם הטופס',
      'form.files.remove': 'הסרת {name}',
      'form.files.notFit': {
        one: 'קובץ אחד לא יישלח · המגבלה הכוללת היא ⁦{size}⁩. אפשר להסיר קובץ או לשלוח את השאר בתשובה למייל.',
        two: 'שני קבצים לא יישלחו · המגבלה הכוללת היא ⁦{size}⁩. אפשר להסיר קובץ או לשלוח את השאר בתשובה למייל.',
        many: '⁦{count}⁩ קבצים לא יישלחו · המגבלה הכוללת היא ⁦{size}⁩. אפשר להסיר קובץ או לשלוח את השאר בתשובה למייל.',
        other: '⁦{count}⁩ קבצים לא יישלחו · המגבלה הכוללת היא ⁦{size}⁩. אפשר להסיר קובץ או לשלוח את השאר בתשובה למייל.'
      },
      'form.mailto.subject': 'בקשה לפרסומת: ⁦{brand}⁩',
      'form.mailto.name': 'שם',
      'form.mailto.company': 'מותג',
      'form.mailto.website': 'אתר',
      'form.mailto.email': 'מייל',

      'media.pauseThisFilm': 'השהיית הסרט',
      'media.playThisFilm': 'ניגון הסרט',
      'media.pauseTheFilm': 'השהיית הסרט',
      'media.playTheFilm': 'ניגון הסרט',
      'media.soundOff': 'כיבוי הסאונד בסרט',
      'media.soundOn': 'הפעלת הסאונד בסרט',
      'media.openFilm': 'פתיחת הסרט בתצוגה מוגדלת',
      'media.openStill': 'פתיחת התמונה בתצוגה מוגדלת',
      'media.openThisFilm': 'פתיחת הסרט בתצוגה מוגדלת',

      'privacy.back': 'חזרה ל־',
      'privacy.heading': 'הודעת פרטיות',
      'privacy.intro': 'ב־Moona Studio נעשה שימוש בעוגיות אנליטיקה אופציונליות כדי להבין איך משתמשים באתר ולשפר אותו. שירותי האנליטיקה אינם נטענים עד לבחירה ב״אישור עוגיות״ בהודעה שבאתר. אפשר לבחור במקום זאת ב״דחיית עוגיות״.',
      'privacy.services.heading': 'שירותי אנליטיקה',
      'privacy.services.ga': 'שירות Google Analytics 4 משמש למדידה מצרפית של תנועה ומעורבות.',
      'privacy.services.clarity': 'שירות Microsoft Clarity מספק תובנות על חוויית השימוש תוך הגנה על הפרטיות. טופס הפנייה לפרויקט ממוסך במפורש.',
      'privacy.services.posthog': 'שירות PostHog משמש לאירועי אנליטיקת מוצר, כגון צפיות בעמוד ואינטראקציות בטוחות. הקלטת סשנים ולכידה אוטומטית של קליקים מושבתות באתר זה.',
      'privacy.collection.heading': 'מה אנחנו אוספים',
      'privacy.collection.body': 'לאחר קבלת הסכמה, השירותים האלה עשויים לקבל מידע טכני ונתוני שימוש כגון נתיבי עמודים, פרטי דפדפן ומכשיר, מיקום משוער המבוסס על כתובת IP ואירועי האינטראקציה הדרושים להבנת השימוש באתר. איננו שולחים לשירותי האנליטיקה את הערכים שמוזנים בטופס הפנייה.',
      'privacy.choices.heading': 'אפשרויות הבחירה',
      'privacy.choices.body': 'אפשר לדחות עוגיות אנליטיקה בהודעה שבאתר. אם ניתנה בעבר הסכמה, אפשר למחוק את נתוני האתר השמורים בדפדפן ולטעון מחדש כדי לבחור שוב. אנחנו מכבדים, כשהם זמינים, מנגנוני פרטיות בדפדפן כגון Do Not Track ו־Global Privacy Control.',
      'privacy.contact.heading': 'יצירת קשר',
      'privacy.contact.lead': 'לשאלות בנושא פרטיות אפשר לפנות במייל אל ',
      'privacy.contact.tail': '.'
    }
  };

  let locale = VALID_LOCALES.has(window.__MOONA_LOCALE__) ? window.__MOONA_LOCALE__ : 'en';
  const subscribers = new Set();

  function ensureHebrewFonts() {
    if (document.getElementById(HEBREW_FONTS_ID)) return;
    const link = document.createElement('link');
    link.id = HEBREW_FONTS_ID;
    link.rel = 'stylesheet';
    link.href = HEBREW_FONTS_URL;
    document.head.appendChild(link);
  }

  function interpolate(value, vars) {
    return String(value).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
    );
  }

  function pluralCategory(count, targetLocale) {
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.PluralRules === 'function') {
        return new Intl.PluralRules(targetLocale).select(Number(count));
      }
    } catch (_) { /* fall through to the small deterministic fallback */ }
    if (Number(count) === 1) return 'one';
    if (Number(count) === 2) return 'two';
    return 'other';
  }

  function t(key, vars = {}, localeOverride) {
    const targetLocale = VALID_LOCALES.has(localeOverride) ? localeOverride : locale;
    let value = messages[targetLocale][key];
    if (value === undefined) return key;
    if (value && typeof value === 'object') {
      const category = pluralCategory(vars.count, targetLocale);
      value = Object.prototype.hasOwnProperty.call(value, category) ? value[category] : value.other;
      if (value === undefined) return key;
    }
    return interpolate(value, vars);
  }

  function pageName() {
    return document.body?.dataset.page === 'privacy' || /\/privacy\.html$/.test(location.pathname)
      ? 'privacy'
      : 'home';
  }

  function setDocumentLocale() {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
    document.documentElement.dataset.locale = locale;
    if (locale === 'he') ensureHebrewFonts();
  }

  function updateMetadata() {
    const page = pageName();
    document.title = t(`meta.${page}.title`);
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = t(`meta.${page}.description`);
  }

  function updateLocaleLinks(root) {
    root.querySelectorAll?.('[data-locale-link]').forEach(link => {
      const current = link.getAttribute('href');
      if (!current) return;
      const url = new URL(current, location.href);
      url.searchParams.set('lang', locale);
      link.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
    });
  }

  function updateLanguageToggles(root) {
    root.querySelectorAll?.('[data-language-toggle]').forEach(button => {
      const target = locale === 'he' ? 'en' : 'he';
      button.textContent = target.toUpperCase();
      button.setAttribute('aria-label', t(target === 'he' ? 'language.switchToHebrew' : 'language.switchToEnglish'));
      button.setAttribute('lang', 'en');
      button.setAttribute('dir', 'ltr');
    });
  }

  function applyDocument(root = document) {
    try {
      setDocumentLocale();
      updateMetadata();
      root.querySelectorAll?.('[data-i18n]').forEach(element => {
        element.textContent = t(element.dataset.i18n);
      });
      const translatedAttributes = [
        ['data-i18n-aria-label', 'aria-label'],
        ['data-i18n-placeholder', 'placeholder'],
        ['data-i18n-title', 'title']
      ];
      translatedAttributes.forEach(([dataAttribute, attribute]) => {
        root.querySelectorAll?.(`[${dataAttribute}]`).forEach(element => {
          element.setAttribute(attribute, t(element.getAttribute(dataAttribute)));
        });
      });
      updateLanguageToggles(root);
      updateLocaleLinks(root);
    } finally {
      clearTimeout(window.__MOONA_I18N_FAILOPEN__);
      document.documentElement.classList.remove('i18n-pending');
    }
  }

  function saveLocale(nextLocale) {
    try { localStorage.setItem(STORAGE_KEY, nextLocale); } catch (_) { /* storage is optional */ }
  }

  function syncUrl(nextLocale, forceParameter) {
    const url = new URL(location.href);
    if (forceParameter) url.searchParams.set('lang', nextLocale);
    else url.searchParams.delete('lang');
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function notify(detail) {
    subscribers.forEach(listener => {
      try { listener(detail); } catch (error) { console.error(error); }
    });
  }

  function setLocale(nextLocale, options = {}) {
    if (!VALID_LOCALES.has(nextLocale)) return false;
    const source = options.source || 'programmatic';
    const from = locale;
    const scrollPosition = { x: scrollX, y: scrollY };
    notify({ phase: 'before', from, to: nextLocale, source });
    locale = nextLocale;
    window.__MOONA_LOCALE__ = locale;
    if (options.persist !== false) saveLocale(locale);
    if (options.updateUrl !== false) syncUrl(locale, true);
    applyDocument();
    notify({ phase: 'after', from, to: locale, source });
    if (source === 'user') {
      requestAnimationFrame(() => window.scrollTo(scrollPosition.x, scrollPosition.y));
    }
    return from !== locale;
  }

  function getLocale() { return locale; }

  function subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  }

  window.MoonaI18n = { getLocale, setLocale, t, applyDocument, subscribe };

  const initialSource = window.__MOONA_LOCALE_SOURCE__ || 'default';
  if (initialSource === 'query') saveLocale(locale);
  syncUrl(locale, initialSource !== 'default');
  applyDocument();

  document.querySelectorAll('[data-language-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const from = locale;
      const to = locale === 'he' ? 'en' : 'he';
      if (!setLocale(to, { source: 'user' })) return;
      if (pageName() === 'home') {
        window.MoonaAnalytics?.capture('language_switch', {
          from_locale: from,
          to_locale: to
        });
      }
    });
  });
})();
