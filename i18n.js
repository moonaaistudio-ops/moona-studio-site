/* Shared locale runtime for the static Moona pages. */
(() => {
  'use strict';

  // The old key also stored shared-link locales, so it cannot prove a user choice.
  const STORAGE_KEY = 'moona.locale.user';
  const VALID_LOCALES = new Set(['en', 'he']);
  const HEBREW_FONTS_ID = 'moona-hebrew-fonts';
  const HEBREW_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700;800&display=swap';

  const messages = {
    en: {
      "form.quick.title": "Let’s make something.",
      "form.quick.intro": "A few words are enough to start.",
      "form.quick.name": "Name",
      "form.quick.email": "Email",
      "form.quick.brief": "What would you like to create? (optional)",
      "form.quick.placeholder": "For example, a short film for a product launch.",
      "form.quick.send": "Send inquiry",
      "form.quick.reply": "We reply within two business days.",
      "nav.solutions": "Solutions",
      "solutions.eyebrow": "The Moona approach",
      "solutions.heading": "Creative solutions.",
      "solutions.intro": "Creative direction, custom-built tools and specialist AI agents. One studio takes your idea from the first brief to the final frame.",
      "solutions.creative.title": "Creative direction",
      "solutions.creative.body": "A clear idea before the first frame. We shape the concept, script and visual language around your brand and the story you want to tell.",
      "solutions.films.title": "Brand & product films",
      "solutions.films.body": "Films for launches, campaigns and social. Direction, motion, editing and sound come together to give your product a world of its own.",
      "solutions.visuals.title": "Visual production",
      "solutions.visuals.body": "Product imagery, characters and cinematic worlds, built in the studio without a camera. One visual language connects the stills, the shots and the campaign.",
      "solutions.digital.title": "AI & digital",
      "solutions.digital.body": "Websites, interactive experiences and custom tools. We bring software development into the creative process to build what the project needs.",
      "solutions.method.label": "From brief to delivery",
      "solutions.method.concept": "Concept",
      "solutions.method.visual": "Visual development",
      "solutions.method.production": "Production",
      "solutions.method.finishing": "Edit & sound",
      "solutions.method.note": "One creative direction connects every stage.",

      'meta.home.title': 'Moona Studio | Cinematic Brand Films, No Shoot Day',
      'meta.home.description': 'Cinematic brand and product films, made without a shoot day. From concept to final cut, with your product protected in every shot. Founded by Tal Tzur.',
      'meta.privacy.title': 'Privacy notice | Moona',
      'meta.privacy.description': 'How Moona uses optional, consent-based analytics and protects inquiry form data.',
      'meta.accessibility.title': 'Accessibility statement | Moona',
      'meta.accessibility.description': 'Accessibility arrangements on the Moona website and how to contact us about accessibility.',

      'language.switchToHebrew': 'Switch to Hebrew',
      'language.switchToEnglish': 'Switch to English',
      'header.home': 'Moona home',
      'nav.sections': 'Sections',
      'nav.work': 'Work',
      'nav.about': 'About',
      'nav.crew': 'Crew',
      'nav.studio': 'About',
      'nav.menu.open': 'Open menu',
      'nav.menu.close': 'Close menu',
      'skip.work': 'Skip to the work',
      'footer.nav': 'Legal and accessibility',

      'consent.label': 'Analytics preferences',
      'consent.text': 'We use analytics to see how the site performs.',
      'consent.privacy': 'Privacy notice',
      'consent.accept': 'Accept analytics',
      'consent.decline': 'Decline',
      'lightbox.label': 'Enlarged work',
      'common.close': 'Close',
      'common.primaryCta': 'LET’S TALK',
      'loader.label': 'Loading',
      'motion.pause': 'Pause motion',
      'motion.resume': 'Resume motion',
      'motion.systemReduced': 'Motion reduced by system settings',

      'hero.eyebrow': 'Founder-led · Creative technology · Tel Aviv',
      'hero.headline.lead': 'Cinematic ads,',
      'hero.headline.aiTerm': '',
      'hero.headline.emphasis': 'born without a camera',
      'hero.subline.one': 'A brand-film studio. No shoot day.',
      'hero.subline.two': 'Your product, protected in every shot.',
      'hero.beat2.lead': 'Every frame directed.',
      'hero.beat2.emphasis': 'Simulated to the last grain of dust.',
      'hero.beat3.lead': 'Your brand,',
      'hero.beat3.emphasis': 'on new ground.',
      'hero.cta': 'Talk to the studio',
      'hero.productCta': 'SEND ONE PRODUCT',
      'hero.projectCta': 'Talk to the studio',
      'hero.projectCtaLabel': 'Talk to the Moona studio',
      'hero.scroll': 'Scroll',

      'film.eyebrow': 'The flagship',
      'film.stance': "Not another clip that looks like everyone else's.",
      'film.title.lead': 'We created a brand. ',
      'film.title.emphasis': 'Then we shot its ad.',
      'film.note.tail': 'is an energy bar you cannot buy.',
      'film.frame.open': 'Open DUSTLINE larger, with controls',
      'film.video.description': 'DUSTLINE. A one-night desert love story told through an energy bar. A film by Moona.',
      'film.original': 'Moona original',
      'film.playWithSound': 'Play with sound',
      'film.credit.copy': 'No camera. Directed to the final frame.',
      'film.credit.aiTerm': '',
      'film.credit.end': '',
      'film.how.eyebrow': 'How we work',
      'film.how.body': 'DUSTLINE is a self-initiated film for a fictional energy bar. We created the world and characters, then directed and edited the film. This approach can shape a brand film or product launch.',
      'film.beat.experience.label': 'The experience',
      'film.beat.experience.mediaLabel': 'DUSTLINE desert-festival world, with a monumental mirrored stage facing the crowd at sunset.',
      'film.beat.experience.title': 'A place that never existed.',
      'film.beat.experience.body': 'Built before the first shot, so every frame belongs to the same world.',
      'film.beat.shots.label': 'The shots',
      'film.beat.shots.mediaLabel': 'Three DUSTLINE character frames demonstrating visual continuity across the film.',
      'film.beat.shots.title': 'The cast stays the cast.',
      'film.beat.shots.body': 'Faces, wardrobe and product lock before motion begins.',
      'film.beat.cast.label': 'The cast',
      'film.beat.cast.mediaLabel': 'The DUSTLINE lead characters facing each other at sunset in the desert festival.',
      'film.beat.cast.title': 'Every frame has a reason.',
      'film.beat.cast.body': 'Camera, edit and grade follow the story, not the model.',

      'about.eyebrow': 'About',
      'about.name': 'Tal Tzur',
      'about.role': 'Founder · Creative Director · Developer',
      'about.body': "I'm Tal, founder of Moona. My background is in software development, and I create brand and product films, from concept and direction through editing and finishing.",
      'about.engine': 'Custom software · Continuous R&D · Specialist AI agents',
      'about.imageAlt': 'Tal Tzur standing in a spacesuit on a lunar landscape',

      'crew.transitionEyebrow': 'The crew',
      'crew.transition': 'A crew of specialist AI agents. All built in the studio.',
      'crew.transitionBody': 'Each one is trained for a single craft and answers to a single director.',
      'crew.transitionAlt': 'Tal Tzur inside a cinematic orbital cockpit',
      'crew.eyebrow': 'AI Crew',
      'crew.heading': 'Specialists behind the work.',
      'crew.intro': 'Creative, editing, image, motion, audio and product.',
      'crew.alma.role': 'Creative',
      'crew.alma.line': 'Turns the brief into concepts, scripts and a clear creative direction.',
      'crew.nara.role': 'Image',
      'crew.nara.line': 'Creates campaign imagery, characters and visual worlds.',
      'crew.luc.role': 'Motion',
      'crew.luc.line': 'Turns scripts and frames into shots, movement and video.',
      'crew.vero.role': 'Editing',
      'crew.vero.line': 'Shapes footage into a story, from the first cut to the final delivery.',
      'crew.sona.role': 'Audio',
      'crew.sona.line': 'Creates voices, music and sound effects for every story.',
      'crew.iva.role': 'Product',
      'crew.iva.line': 'Turns ideas into websites, interactive experiences and digital tools.',
      'work.eyebrow': 'Selected work',
      'work.heading': 'Selected concept films',
      'work.note': 'Five self-initiated concept films.',
      'work.specBadge': 'Moona original · Spec',
      'work.mcdonalds.video': "McDonald's self-initiated spec film by Moona",
      'work.mcdonalds.open': "Open the McDonald's concept film larger",
      'work.mcdonalds.concept': 'You already know the taste. Now watch it move.',
      'work.mcdonalds.tag': 'From one product image.',
      'work.strava.video': 'Strava self-initiated spec film by Moona',
      'work.strava.open': 'Open the Strava concept film larger',
      'work.strava.concept': 'Every run already has a soundtrack. We cut to it.',
      'work.strava.tag': 'Built from the existing brand world.',
      'work.bullPadel.video': 'Bull Padel self-initiated spec film by Moona',
      'work.bullPadel.open': 'Open the Bull Padel concept film larger',
      'work.bullPadel.concept': 'The court hits back.',
      'work.bullPadel.tag': 'Product colour locked across every frame.',
      'work.koda.video': 'Koda self-initiated spec film by Moona',
      'work.koda.open': 'Open the Koda concept film larger',
      'work.koda.concept': 'Built for the feed it lives in.',
      'work.koda.summary': 'An original product and self-initiated concept film by Moona. We created the product world and made the film around it. A short format like this can introduce a product or launch on social.',
      'work.koda.tag': 'An original product world by Moona.',
      'work.jewelry.video': 'Self-initiated jewelry concept film by Moona',
      'work.jewelry.open': 'Open the jewelry concept film larger',
      'work.jewelry.title': 'Jewelry',
      'work.jewelry.concept': 'Nobody stood on this street.',
      'work.jewelry.summary': 'A jewelry film made without a camera, a location or a shoot day. The street, the light and every move were built in the studio, frame by frame.',

      'studio.eyebrow': 'Founder-led',
      'studio.title.lead': 'Creative direction and code, ',
      'studio.title.emphasis': 'working',
      'studio.title.tail': ' as one.',
      'studio.note': 'Reply within two business days',
      'studio.statement.afterBrand': 'is a founder-led',
      'studio.statement.afterAi': 'creative technology studio.',
      'studio.statement.emphasis': 'Direction stays human.',

      'contact.line': 'Let’s make one for your brand.',
      'contact.body': 'Send one product and a line about the brand. We reply with a direction within two business days.',
      'contact.productCta': 'Send one product',
      'contact.or': 'or',
      'contact.email': 'Email the studio',
      'contact.disclaimer': 'All work self-initiated. Brands are shown for demonstration only and are not clients. No client relationship implied.',
      'contact.rights': 'All rights reserved.',
      'footer.privacy': 'Privacy notice',
      'footer.accessibility': 'Accessibility statement',

      'form.dialog': 'Talk to the studio',
      'form.step.name.label': '01 / Introduction',
      'form.step.name.title': 'Who are we speaking with?',
      'form.step.name.placeholder': 'Jane Cohen',
      'form.step.name.hint': 'Press Enter to continue',
      'form.step.email.label': '02 / Reply',
      'form.step.email.title': 'Where should we reply?',
      'form.step.email.placeholder': 'you@yourbrand.com',
      'form.step.email.hint': 'Used only to reply to this project inquiry.',
      'form.step.site.label': '03 / The brand',
      'form.step.site.title': 'Where can we see the brand?',
      'form.step.site.placeholder': 'yourbrand.com',
      'form.step.site.hint': 'A website or product page. Optional.',
      'form.step.brief.label': '04 / The project',
      'form.step.brief.title': 'What are you looking to make?',
      'form.step.brief.placeholder': 'Tell us about the brand, the film and what success should feel like.',
      'form.step.brief.hint': '20 to 1,200 characters.',
      'form.upload.title': 'Add product shots or a logo',
      'form.upload.detail': 'Optional · images, PDF or zip · up to 3.5 MB',
      'form.upload.browse': 'Browse',
      'form.next': 'Next',
      'form.back': 'Back',
      'form.send': 'Send details',
      'form.done.title': 'Received.',
      'form.done.body': 'We will review the project and reply within two business days.',
      'form.validation.required': 'This one we need.',
      'form.validation.email': 'That address looks off.',
      'form.validation.url': 'A link we can open, please.',
      'form.validation.brief': 'Please keep it under 1,200 characters.',
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
      'form.mailto.subject': 'Project inquiry: {brand}',
      'form.mailto.name': 'Name',
      'form.mailto.company': 'Company',
      'form.mailto.website': 'Website',
      'form.mailto.email': 'Email',
      'form.mailto.brief': 'Project brief',

      'media.pauseThisFilm': 'Pause this film',
      'media.playThisFilm': 'Play this film',
      'media.pauseTheFilm': 'Pause the film',
      'media.playTheFilm': 'Play the film',
      'media.soundOff': 'Turn the film sound off',
      'media.soundOn': 'Turn the film sound on',
      'media.openFilm': 'Open film larger',
      'media.openStill': 'Open still larger',
      'media.openThisFilm': 'Open this film larger',
      'media.openNamedFilm': 'Open the {name} film larger',
      'media.openNamedStill': 'Open the {name} image larger',
      'media.asset.loccitaneFlat': "L'Occitane flat lay",
      'media.asset.proteinBar': 'Protein Bar',
      'media.asset.btan': 'B.Tan',
      'media.asset.kodaCans': 'Koda cans',
      'media.asset.acoustic': 'Acoustic',
      'media.asset.forgeskinStudio': 'ForgeSkin studio portrait',
      'media.asset.sanMiguelCan': 'San Miguel can',
      'media.asset.joseon': 'Joseon',
      'media.asset.medix': 'Medix',
      'media.asset.kodaYuzu': 'Koda Yuzu',
      'media.asset.innisfree': 'Innisfree',
      'media.asset.aerial': 'Aerial',
      'media.asset.forgeskinBag': 'ForgeSkin bag',
      'media.asset.loccitaneDuo': "L'Occitane duo",
      'media.asset.sanMiguelSun': 'San Miguel sunset',

      'privacy.back': 'Back to ',
      'privacy.skip': 'Skip to the privacy notice',
      'privacy.heading': 'Privacy notice',
      'privacy.intro': 'Moona Studio measures how the site is used to improve our work. PostHog runs on every page without cookies. Google Analytics and Microsoft Clarity load only after you choose “Accept analytics” in the notice on the site. You can choose “Decline” instead.',
      'privacy.services.heading': 'Analytics services',
      'privacy.services.ga': 'Google Analytics 4, for aggregated traffic and engagement measurement.',
      'privacy.services.clarity': 'Microsoft Clarity, for privacy-protected usability insights. The project inquiry form is explicitly masked.',
      'privacy.services.posthog': 'PostHog, on every page and without cookies, for page views, clicks and session recordings that show how a page was used. Anything typed into a field is masked and never recorded.',
      'privacy.collection.heading': 'What we collect',
      'privacy.collection.body': 'PostHog, and after consent Google Analytics and Clarity, may receive technical and usage data such as page paths, browser and device information, approximate location derived from IP address, and the interactions needed to understand the site. Values entered in the inquiry form are never sent to these services.',
      'privacy.choices.heading': 'Your choices',
      'privacy.choices.body': 'You can decline Google Analytics and Clarity in the site notice. If you previously accepted, clear this website’s stored data in your browser and reload the site to choose again. PostHog stores nothing on your device, and it does not load at all when your browser sends Do Not Track or Global Privacy Control.',
      'privacy.contact.heading': 'Contact',
      'privacy.contact.lead': 'For privacy questions, email ',
      'privacy.contact.tail': '.',

      'accessibility.back': 'Back to ',
      'accessibility.skip': 'Skip to the accessibility statement',
      'accessibility.heading': 'Accessibility statement',
      'accessibility.intro': 'Moona is committed to making this website accessible to people with disabilities and to providing an equal, respectful and independent browsing experience.',
      'accessibility.standard.heading': 'Accessibility standard',
      'accessibility.standard.body': 'The site is designed and tested with the aim of meeting Israeli Standard 5568 for accessible web content, based on WCAG 2.0 Level AA. Accessibility is maintained as part of ongoing site development.',
      'accessibility.features.heading': 'Accessibility features on the site',
      'accessibility.features.keyboard': 'Keyboard navigation, visible focus indicators and a skip link to the main work.',
      'accessibility.features.structure': 'Semantic headings, landmarks and accessible names for interactive controls.',
      'accessibility.features.language': 'English and Hebrew interfaces with the appropriate language and reading direction.',
      'accessibility.features.motion': 'Play and pause controls for films, a site motion control and support for the operating system reduced-motion preference.',
      'accessibility.features.forms': 'Form instructions, linked field descriptions and validation messages announced to assistive technology.',
      'accessibility.limitations.heading': 'Known limitations',
      'accessibility.limitations.media': 'Some portfolio films are primarily visual and do not yet include complete captions or audio description. Contact us for a written description or an accessible alternative.',
      'accessibility.limitations.testing': 'Automated and keyboard testing has been completed. A full external audit with NVDA and JAWS has not yet been completed.',
      'accessibility.arrangements.heading': 'Service accessibility arrangements',
      'accessibility.arrangements.body': 'Moona provides its website service online. For information about accessibility arrangements for a meeting or another service channel, contact us in advance by email.',
      'accessibility.contact.heading': 'Accessibility inquiries and feedback',
      'accessibility.contact.lead': 'Accessibility contact: the Moona team. Email ',
      'accessibility.contact.tail': '. Please include the page, device and browser, assistive technology used and a short description of the issue so we can investigate it efficiently.',
      'accessibility.audit.heading': 'Statement details',
      'accessibility.audit.date': 'Last accessibility review: 31 August 2026.',
      'accessibility.updated.date': 'Statement last updated: 31 August 2026.'
    },

    he: {
      "form.quick.title": "בואו ניצור משהו.",
      "form.quick.intro": "כמה מילים מספיקות כדי להתחיל.",
      "form.quick.name": "שם",
      "form.quick.email": "מייל",
      "form.quick.brief": "מה תרצו ליצור? (לא חובה)",
      "form.quick.placeholder": "למשל, סרט קצר להשקת מוצר.",
      "form.quick.send": "שליחת פנייה",
      "form.quick.reply": "נחזור אליכם בתוך שני ימי עסקים.",
      "nav.solutions": "פתרונות",
      "solutions.eyebrow": "הפתרונות של MOONA",
      "solutions.heading": "פתרונות קריאייטיב.",
      "solutions.intro": "ניהול קריאייטיב, כלים שנבנו בסטודיו וסוכני AI מומחים. מוביל את הברנד שלכם מהבריף הראשון ועד הפריים האחרון.",
      "solutions.creative.title": "קריאייטיב ובימוי",
      "solutions.creative.body": "רעיון ברור לפני הפריים הראשון. מגבשים קונספט, תסריט ושפה חזותית סביב המותג שלכם והסיפור שאתם רוצים לספר.",
      "solutions.films.title": "סרטי מותג ומוצר",
      "solutions.films.body": "סרטים להשקות, לקמפיינים ולסושיאל. בימוי, תנועה, עריכה וסאונד מתחברים כדי לתת למוצר שלכם עולם משלו.",
      "solutions.visuals.title": "הפקה חזותית",
      "solutions.visuals.body": "תמונות מוצר, דמויות ועולמות קולנועיים שנבנים בסטודיו, בלי מצלמה. שפה חזותית אחת מחברת בין התמונות, השוטים והקמפיין.",
      "solutions.digital.title": "AI ודיגיטל",
      "solutions.digital.body": "אתרים, חוויות אינטראקטיביות וכלים מותאמים. משלבים פיתוח תוכנה בתהליך היצירה כדי לבנות את מה שהפרויקט צריך.",
      "solutions.method.label": "מהבריף לתוצר",
      "solutions.method.concept": "קונספט",
      "solutions.method.visual": "פיתוח חזותי",
      "solutions.method.production": "הפקה",
      "solutions.method.finishing": "עריכה וסאונד",
      "solutions.method.note": "כיוון קריאייטיבי אחד מחבר את כל השלבים.",

      'meta.home.title': 'Moona Studio | סרטי מותג ופרסומות קולנועיות, בלי יום צילום',
      'meta.home.description': 'סטודיו מונה יוצר סרטי מותג ומוצר בלי יום צילום, מהרעיון ועד הגרסה הסופית, והמוצר נשאר מדויק בכל שוט. בהובלת טל צור.',
      'meta.privacy.title': 'הודעת פרטיות | Moona',
      'meta.privacy.description': 'שימוש אופציונלי ומבוסס־הסכמה באנליטיקה ב־Moona, והאופן שבו נשמר המידע בטופס הפנייה.',
      'meta.accessibility.title': 'הצהרת נגישות | Moona',
      'meta.accessibility.description': 'מידע על נגישות אתר Moona ודרכי פנייה בנושא נגישות.',

      'language.switchToHebrew': 'מעבר לעברית',
      'language.switchToEnglish': 'מעבר לאנגלית',
      'header.home': 'דף הבית של Moona',
      'nav.sections': 'חלקי האתר',
      'nav.work': 'עבודות',
      'nav.about': 'אודות',
      'nav.crew': 'Crew',
      'nav.studio': 'אודות',
      'nav.menu.open': 'פתיחת תפריט',
      'nav.menu.close': 'סגירת תפריט',
      'skip.work': 'דילוג לעבודות',
      'footer.nav': 'מידע משפטי ונגישות',

      'consent.label': 'העדפות עוגיות אנליטיקה',
      'consent.text': 'אנחנו משתמשים בעוגיות אנליטיקה כדי להבין איך משתמשים באתר ולשפר אותו.',
      'consent.privacy': 'הודעת פרטיות',
      'consent.accept': 'אישור עוגיות',
      'consent.decline': 'דחיית עוגיות',
      'lightbox.label': 'עבודה בתצוגה מוגדלת',
      'common.close': 'סגירה',
      'common.primaryCta': 'בואו נדבר',
      'loader.label': 'טעינה',
      'motion.pause': 'עצירת אנימציות',
      'motion.resume': 'הפעלת אנימציות',
      'motion.systemReduced': 'התנועה הופחתה לפי הגדרת המערכת',

      'hero.eyebrow': 'בהובלת המייסד · קריאייטיב טכנולוגי · תל אביב',
      'hero.headline.lead': 'פרסומות קולנועיות,',
      'hero.headline.aiTerm': '',
      'hero.headline.emphasis': 'שנולדו בלי מצלמה',
      'hero.subline.one': 'סטודיו לסרטי מותג. בלי יום צילום.',
      'hero.subline.two': 'המוצר שלכם, בדיוק כמו שהוא, בכל שוט.',
      'hero.beat2.lead': 'לכל פריים יש במאי.',
      'hero.beat2.emphasis': 'בנינו את העולם עד גרגר החול האחרון.',
      'hero.beat3.lead': 'המותג שלכם,',
      'hero.beat3.emphasis': 'נועץ דגל.',
      'hero.cta': 'לדבר עם הסטודיו',
      'hero.productCta': 'שלחו מוצר אחד',
      'hero.projectCta': 'לדבר עם הסטודיו',
      'hero.projectCtaLabel': 'לדבר עם הסטודיו של Moona',
      'hero.scroll': 'לגלול',

      'film.eyebrow': 'סרט הדגל',
      'film.stance': 'לא עוד סרטון שנראה כמו כולם.',
      'film.title.lead': 'יצרנו מותג. ',
      'film.title.emphasis': 'וצילמנו לו פרסומת.',
      'film.note.tail': 'הוא חטיף אנרגיה שאנחנו יצרנו מאפס.',
      'film.frame.open': 'פתיחת DUSTLINE בתצוגה מוגדלת עם פקדים',
      'film.video.description': 'DUSTLINE. סיפור אהבה מדברי של לילה אחד, המסופר דרך חטיף אנרגיה. סרט של Moona.',
      'film.original': 'יצירה מקורית של Moona',
      'film.playWithSound': 'ניגון עם סאונד',
      'film.credit.copy': 'בלי מצלמה. בימוי עד הפריים האחרון.',
      'film.credit.aiTerm': '',
      'film.credit.end': '',
      'film.how.eyebrow': 'מאחורי הסרט',
      'film.how.body': 'DUSTLINE הוא סרט עצמאי למותג חטיף אנרגיה בדיוני. יצרנו את העולם והדמויות והובלנו את הבימוי והעריכה. תהליך כזה יכול להתאים לסרט מותג או להשקת מוצר.',
      'film.beat.experience.label': 'בניית העולם',
      'film.beat.experience.mediaLabel': 'עולם הפסטיבל המדברי של DUSTLINE, עם במה מונומנטלית וסימטרית מול הקהל בשעת שקיעה.',
      'film.beat.experience.title': 'לוקיישן שאפשר להאמין בו.',
      'film.beat.experience.body': 'הוא נבנה עד הפרט האחרון: מרווח של 0.90 מ׳ בין האבנים, מגדלים בגובה 21 מ׳, שמיים וקרקע שנבנו שכבה אחר שכבה. מבחינתנו, אמינות מתחילה בבסיס, בלוקיישן עצמו.',
      'film.beat.shots.label': 'הפרטים',
      'film.beat.shots.mediaLabel': 'שלושה פריימים של דמויות מתוך DUSTLINE, המדגימים עקביות חזותית לאורך הסרט.',
      'film.beat.shots.title': 'הכול נמצא בפרטים.',
      'film.beat.shots.body': 'אמינות הדמויות, העקביות בין השוטים, הלוקיישן ואווירת המסיבה נשמרים לאורך הסרט. הסיפור, התנועה, הצבע ורמת הגימור מקבלים את אותה תשומת לב. כשכל פרט מדויק, הסרט כולו מרגיש אמיתי.',
      'film.beat.cast.label': 'הקריאייטיב',
      'film.beat.cast.mediaLabel': 'הדמויות הראשיות של DUSTLINE ניצבות זו מול זו בשעת שקיעה, בלב הפסטיבל המדברי.',
      'film.beat.cast.title': 'קריאייטיב שעובד.',
      'film.beat.cast.body': 'הכול מתחיל בקריאייטיב ובתסריט. הדמויות, הסטיילינג והשפה הוויזואלית נקבעים כבר בשלב הקריאייטיב. משם נבנים הליהוק, תנועות המצלמה, עיצוב הסאונד והעריכה. את החיבור ביניהם רואים בכל פריים של DUSTLINE.',

      'about.eyebrow': 'אודות',
      'about.name': 'טל צור',
      'about.role': 'מייסד · מנהל קריאייטיב · מפתח',
      'about.body': 'אני טל, מייסד MOONA. אני מגיע מפיתוח ויוצר סרטי מותג ומוצר, מהרעיון והבימוי ועד לעריכה ולגימור.',
      'about.engine': 'פיתוח תוכנה מותאם · מחקר ופיתוח מתמשך · סוכני AI מומחים',
      'about.imageAlt': 'טל צור עומד בחליפת חלל על נוף ירחי',

      'crew.transitionEyebrow': 'הצוות',
      'crew.transition': 'צוות של סוכני AI מומחים. כולם נבנו בסטודיו.',
      'crew.transitionBody': 'כל אחד מאומן במקצוע אחד. לכולם יש במאי אחד.',
      'crew.transitionAlt': 'טל צור בתוך תא טייס קולנועי בחלל',
      'crew.eyebrow': 'צוות AI',
      'crew.heading': 'המומחים שמאחורי העבודה.',
      'crew.intro': 'קריאייטיב, עריכה, תמונה, תנועה, אודיו ופרודקט.',
      'crew.alma.role': 'קריאייטיב',
      'crew.alma.line': 'הופכת את הבריף לרעיונות, תסריטים וכיוון קריאייטיבי ברור.',
      'crew.nara.role': 'תמונה',
      'crew.nara.line': 'יוצרת תמונות לקמפיינים, דמויות ועולמות חזותיים.',
      'crew.luc.role': 'תנועה',
      'crew.luc.line': 'הופך תסריטים ופריימים לשוטים, תנועה ווידאו.',
      'crew.vero.role': 'עריכה',
      'crew.vero.line': 'מחבר את חומרי הגלם לסיפור, מהקאט הראשון ועד הגרסה הסופית.',
      'crew.sona.role': 'אודיו',
      'crew.sona.line': 'יוצרת קולות, מוזיקה ואפקטים קוליים לכל סיפור.',
      'crew.iva.role': 'פרודקט',
      'crew.iva.line': 'הופכת רעיונות לאתרים, חוויות אינטראקטיביות וכלים דיגיטליים.',
      'work.eyebrow': 'סרטי קונספט · ביוזמת Moona',
      'work.heading': 'סרטי קונספט נבחרים',
      'work.note': 'סרטי הקונספט האלה נוצרו ביוזמתנו כדי להראות מה נוכל ליצור עבור המותג הבא. המותגים המוצגים אינם לקוחות של Moona.',
      'work.specBadge': 'יצירה מקורית של Moona · קונספט',
      'work.mcdonalds.video': "סרט קונספט ביוזמת Moona עבור McDonald's",
      'work.mcdonalds.open': "פתיחת סרט הקונספט של McDonald's בתצוגה מוגדלת",
      'work.mcdonalds.concept': 'את הטעם כבר מכירים. עכשיו אפשר לראות אותו זז.',
      'work.mcdonalds.tag': 'מתמונת מוצר אחת.',
      'work.strava.video': 'סרט קונספט ביוזמת Moona עבור Strava',
      'work.strava.open': 'פתיחת סרט הקונספט של Strava בתצוגה מוגדלת',
      'work.strava.concept': 'לכל ריצה כבר יש פסקול. ערכנו לפיו.',
      'work.strava.tag': 'נבנה מתוך עולם המותג הקיים.',
      'work.bullPadel.video': 'סרט קונספט ביוזמת Moona עבור Bull Padel',
      'work.bullPadel.open': 'פתיחת סרט הקונספט של Bull Padel בתצוגה מוגדלת',
      'work.bullPadel.concept': 'המחבט מחזיר חבטה.',
      'work.bullPadel.tag': 'צבע המוצר נשמר בכל פריים.',
      'work.koda.video': 'סרט קונספט ביוזמת Moona עבור Koda',
      'work.koda.open': 'פתיחת סרט הקונספט של Koda בתצוגה מוגדלת',
      'work.koda.concept': 'נבנה לפיד שבו הוא חי.',
      'work.koda.summary': 'מוצר מקורי וסרט קונספט עצמאי שיצרנו במונה. בנינו עולם חזותי סביב המוצר והפכנו אותו לסרט קצר. כיוון כזה יכול להתאים להשקת מוצר ולגרסאות לסושיאל.',
      'work.koda.tag': 'זה מוצר שהמצאנו מאפס',
      'work.jewelry.video': 'סרט קונספט של תכשיטים ביוזמת Moona',
      'work.jewelry.open': 'פתיחת סרט התכשיטים בתצוגה מוגדלת',
      'work.jewelry.title': 'תכשיטים',
      'work.jewelry.concept': 'אף אחד לא עמד ברחוב הזה.',
      'work.jewelry.summary': 'סרט תכשיטים בלי מצלמה, בלי לוקיישן ובלי יום צילום. את הרחוב, האור וכל תנועה בנינו בסטודיו, פריים אחרי פריים.',

      'studio.eyebrow': 'בהובלת המייסד',
      'studio.title.lead': 'קריאייטיב וקוד, ',
      'studio.title.emphasis': 'עובדים',
      'studio.title.tail': ' כמערכת אחת.',
      'studio.note': 'מענה בתוך שני ימי עסקים',
      'studio.statement.afterBrand': 'הוא סטודיו קריאייטיב טכנולוגי',
      'studio.statement.afterAi': 'בהובלת המייסד.',
      'studio.statement.emphasis': 'הבימוי נשאר אנושי.',

      'contact.line': 'בואו נעשה את זה גם למותג שלכם.',
      'contact.body': 'שלחו מוצר אחד ושורה על המותג. נחזור אליכם עם כיוון בתוך שני ימי עסקים.',
      'contact.productCta': 'שלחו מוצר אחד',
      'contact.or': 'או',
      'contact.email': 'מייל לסטודיו',
      'contact.disclaimer': 'כל העבודות נוצרו ביוזמתנו. המותגים מוצגים לצורכי הדגמה בלבד ואינם לקוחות. אין בכך כדי לרמוז על קשר מסחרי.',
      'contact.rights': 'כל הזכויות שמורות.',
      'footer.privacy': 'הודעת פרטיות',
      'footer.accessibility': 'הצהרת נגישות',

      'form.dialog': 'לדבר עם הסטודיו',
      'form.step.name.label': '01 / היכרות',
      'form.step.name.title': 'עם מי אנחנו מדברים?',
      'form.step.name.placeholder': 'דנה כהן',
      'form.step.name.hint': 'לחיצה על Enter להמשך',
      'form.step.email.label': '02 / תשובה',
      'form.step.email.title': 'לאן לחזור אליכם?',
      'form.step.email.placeholder': 'you@yourbrand.com',
      'form.step.email.hint': 'המייל ישמש רק למענה על הפנייה הזאת.',
      'form.step.site.label': '03 / המותג',
      'form.step.site.title': 'איפה אפשר לראות את המותג?',
      'form.step.site.placeholder': 'yourbrand.com',
      'form.step.site.hint': 'אתר או עמוד מוצר. לא חובה.',
      'form.step.brief.label': '04 / הפרויקט',
      'form.step.brief.title': 'מה תרצו ליצור?',
      'form.step.brief.placeholder': 'ספרו לנו על המותג, הסרט ומה התוצאה שתרצו להשיג.',
      'form.step.brief.hint': 'בין 20 ל־1,200 תווים.',
      'form.upload.title': 'הוספת תמונות מוצר או לוגו',
      'form.upload.detail': 'אופציונלי · תמונות, PDF או zip · עד 3.5 MB',
      'form.upload.browse': 'בחירת קבצים',
      'form.next': 'המשך',
      'form.back': 'חזרה',
      'form.send': 'שליחת הפרטים',
      'form.done.title': 'קיבלנו.',
      'form.done.body': 'נעבור על הפרויקט ונחזור אליכם בתוך שני ימי עסקים.',
      'form.validation.required': 'את זה צריך למלא.',
      'form.validation.email': 'כתובת המייל לא נראית תקינה.',
      'form.validation.url': 'צריך קישור שאפשר לפתוח.',
      'form.validation.brief': 'אפשר לכתוב עד 1,200 תווים.',
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
      'form.mailto.subject': 'פנייה לפרויקט: ⁦{brand}⁩',
      'form.mailto.name': 'שם',
      'form.mailto.company': 'מותג',
      'form.mailto.website': 'אתר',
      'form.mailto.email': 'מייל',
      'form.mailto.brief': 'תיאור הפרויקט',

      'media.pauseThisFilm': 'השהיית הסרט',
      'media.playThisFilm': 'ניגון הסרט',
      'media.pauseTheFilm': 'השהיית הסרט',
      'media.playTheFilm': 'ניגון הסרט',
      'media.soundOff': 'כיבוי הסאונד בסרט',
      'media.soundOn': 'הפעלת הסאונד בסרט',
      'media.openFilm': 'פתיחת הסרט בתצוגה מוגדלת',
      'media.openStill': 'פתיחת התמונה בתצוגה מוגדלת',
      'media.openThisFilm': 'פתיחת הסרט בתצוגה מוגדלת',
      'media.openNamedFilm': 'פתיחת הסרט {name} בתצוגה מוגדלת',
      'media.openNamedStill': 'פתיחת התמונה {name} בתצוגה מוגדלת',
      'media.asset.loccitaneFlat': "L'Occitane, פריסת מוצרים",
      'media.asset.proteinBar': 'Protein Bar',
      'media.asset.btan': 'B.Tan',
      'media.asset.kodaCans': 'פחיות Koda',
      'media.asset.acoustic': 'Acoustic',
      'media.asset.forgeskinStudio': 'ForgeSkin, דיוקן סטודיו',
      'media.asset.sanMiguelCan': 'פחית San Miguel',
      'media.asset.joseon': 'Joseon',
      'media.asset.medix': 'Medix',
      'media.asset.kodaYuzu': 'Koda Yuzu',
      'media.asset.innisfree': 'Innisfree',
      'media.asset.aerial': 'Aerial',
      'media.asset.forgeskinBag': 'תיק ForgeSkin',
      'media.asset.loccitaneDuo': "צמד מוצרי L'Occitane",
      'media.asset.sanMiguelSun': 'San Miguel בשקיעה',

      'privacy.back': 'חזרה ל־',
      'privacy.skip': 'דילוג להודעת הפרטיות',
      'privacy.heading': 'הודעת פרטיות',
      'privacy.intro': 'ב־Moona Studio אנחנו מודדים איך משתמשים באתר כדי לשפר את העבודה שלנו. שירות PostHog פועל בכל העמודים בלי עוגיות. Google Analytics ו־Microsoft Clarity נטענים רק אחרי בחירה ב״אישור עוגיות״ בהודעה שבאתר. אפשר לבחור במקום זאת ב״דחיית עוגיות״.',
      'privacy.services.heading': 'שירותי אנליטיקה',
      'privacy.services.ga': 'שירות Google Analytics 4 משמש למדידה מצרפית של תנועה ומעורבות.',
      'privacy.services.clarity': 'שירות Microsoft Clarity מספק תובנות על חוויית השימוש תוך הגנה על הפרטיות. טופס הפנייה לפרויקט ממוסך במפורש.',
      'privacy.services.posthog': 'שירות PostHog פועל בכל העמודים ובלי עוגיות, ומודד צפיות בעמודים, קליקים והקלטות סשן שמראות איך השתמשו בעמוד. כל מה שמוקלד בשדות ממוסך ואינו מוקלט.',
      'privacy.collection.heading': 'מה אנחנו אוספים',
      'privacy.collection.body': 'שירות PostHog, ולאחר קבלת הסכמה גם Google Analytics ו־Clarity, עשויים לקבל מידע טכני ונתוני שימוש כגון נתיבי עמודים, פרטי דפדפן ומכשיר, מיקום משוער המבוסס על כתובת IP והאינטראקציות הדרושות להבנת השימוש באתר. הערכים שמוזנים בטופס הפנייה לעולם אינם נשלחים לשירותים האלה.',
      'privacy.choices.heading': 'אפשרויות הבחירה',
      'privacy.choices.body': 'אפשר לדחות את Google Analytics ו־Clarity בהודעה שבאתר. אם ניתנה בעבר הסכמה, אפשר למחוק את נתוני האתר השמורים בדפדפן ולטעון מחדש כדי לבחור שוב. שירות PostHog אינו שומר דבר במכשיר, והוא לא נטען בכלל כשהדפדפן שולח Do Not Track או Global Privacy Control.',
      'privacy.contact.heading': 'יצירת קשר',
      'privacy.contact.lead': 'לשאלות בנושא פרטיות אפשר לפנות במייל אל ',
      'privacy.contact.tail': '.',

      'accessibility.back': 'חזרה ל־',
      'accessibility.skip': 'דילוג להצהרת הנגישות',
      'accessibility.heading': 'הצהרת נגישות',
      'accessibility.intro': 'ב־Moona אנחנו מחויבים להנגיש את האתר לאנשים עם מוגבלויות ולאפשר חוויית גלישה שוויונית, מכבדת ועצמאית.',
      'accessibility.standard.heading': 'תקן הנגישות',
      'accessibility.standard.body': 'האתר תוכנן ונבדק במטרה לעמוד בדרישות ת״י 5568 לנגישות תכנים באינטרנט, המבוסס על WCAG 2.0 ברמה AA. הנגישות נשמרת כחלק מהפיתוח השוטף של האתר.',
      'accessibility.features.heading': 'התאמות הנגישות באתר',
      'accessibility.features.keyboard': 'ניווט באמצעות מקלדת, סימון פוקוס ברור וקישור לדילוג ישיר לעבודות.',
      'accessibility.features.structure': 'מבנה כותרות סמנטי, אזורי עמוד מוגדרים ושמות נגישים לפקדים אינטראקטיביים.',
      'accessibility.features.language': 'ממשק בעברית ובאנגלית, עם הגדרת שפה וכיוון קריאה מתאימים.',
      'accessibility.features.motion': 'פקדי ניגון והשהיה לסרטים, שליטה בתנועה באתר ותמיכה בהעדפת הפחתת תנועה של מערכת ההפעלה.',
      'accessibility.features.forms': 'הנחיות לטופס, תיאורים המקושרים לשדות והודעות אימות שמוקראות לטכנולוגיות מסייעות.',
      'accessibility.limitations.heading': 'מגבלות נגישות ידועות',
      'accessibility.limitations.media': 'חלק מסרטי תיק העבודות הם יצירות חזותיות ואינם כוללים עדיין כתוביות או תיאור קולי מלאים. אפשר לפנות אלינו לקבלת תיאור כתוב או חלופה נגישה.',
      'accessibility.limitations.testing': 'בוצעו בדיקות אוטומטיות ובדיקות ניווט במקלדת. טרם הושלמה ביקורת חיצונית מלאה באמצעות NVDA ו־JAWS.',
      'accessibility.arrangements.heading': 'הסדרי נגישות בשירות',
      'accessibility.arrangements.body': 'השירות באתר ניתן באופן מקוון. לקבלת מידע על הסדרי נגישות לפגישה או בערוץ שירות אחר, אפשר לפנות אלינו מראש במייל.',
      'accessibility.contact.heading': 'פניות ומשוב בנושא נגישות',
      'accessibility.contact.lead': 'אחראי לפניות נגישות: צוות Moona. מייל ',
      'accessibility.contact.tail': '. כדי שנוכל לבדוק את הפנייה ביעילות, מומלץ לציין את העמוד, המכשיר והדפדפן, הטכנולוגיה המסייעת ותיאור קצר של הבעיה.',
      'accessibility.audit.heading': 'פרטי ההצהרה',
      'accessibility.audit.date': 'בדיקת הנגישות האחרונה: 31 באוגוסט 2026.',
      'accessibility.updated.date': 'הצהרה זו עודכנה לאחרונה: 31 באוגוסט 2026.'
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
    if (document.body?.dataset.page === 'privacy' || /\/privacy\.html$/.test(location.pathname)) return 'privacy';
    if (document.body?.dataset.page === 'accessibility' || /\/accessibility\.html$/.test(location.pathname)) return 'accessibility';
    return 'home';
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
      let code = button.querySelector('[data-language-code]');
      if (!code) {
        button.textContent = '';
        code = document.createElement('span');
        code.dataset.languageCode = '';
        code.setAttribute('lang', 'en');
        code.setAttribute('dir', 'ltr');
        code.setAttribute('aria-hidden', 'true');
        button.appendChild(code);
      }
      code.textContent = target.toUpperCase();
      button.setAttribute('aria-label', t(target === 'he' ? 'language.switchToHebrew' : 'language.switchToEnglish'));
      button.removeAttribute('lang');
      button.removeAttribute('dir');
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
        ['data-i18n-alt', 'alt'],
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
    url.searchParams.delete('moona-country');
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
    if (source === 'user' && options.persist !== false) saveLocale(locale);
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
