// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Arabic — a LANGUAGE PACK, not bundled: nothing imports this file, so it
// never enters the module graph. scripts/build-i18n.mjs --packs emits it as
// downloadable JSON. See docs/i18n-packs.md.
//
// Arabic is right-to-left, and the second RTL language here after Hebrew.
// The chrome mirrors now, so this pack is the WORDS; layout bugs belong to
// the CSS, not to the catalog.
//
// Machine-drafted and NOT reviewed by a native speaker. Terminology follows
// what Arabic speakers see in Office and Google Slides: شريحة (slide),
// عرض تقديمي (deck), تخطيط (layout), عنصر (element), نسق (theme),
// مخطط (chart). One rendering per concept, never varied.
//
// t() has NO plural machinery and Arabic has SIX CLDR plural categories, so
// every counted string is phrased count-agnostically — the number sits after
// a colon or beside a number-neutral noun and reads correctly for n = 1, 2,
// 3, 11 and 100 alike. Index labels (Axis {n}, Series {n}, slide {n}) are
// never pluralised.
//
// Digits are Western (0-9) throughout: page and slide numbers are DOCUMENT
// content and must read identically for every viewer. There are NO bidi
// control characters in this file, so it stays reviewable as plain text —
// where a string mixes scripts the wording is arranged to avoid the
// ambiguity rather than steered with invisible marks.
import type { Catalog } from '../../i18n'

export const label = 'العربية'

export const strings: Catalog = {
  "Backed up in this browser": "نُسخت احتياطيًا في هذا المتصفح",
  "Unsaved changes — kept in this browser at {when} and offered back if you reopen. ⌘S downloads an updated copy.": "تغييرات غير محفوظة — حُفظت في هذا المتصفح عند {when} وستُعرض عليك عند إعادة الفتح. الاختصار ⌘S ينزّل نسخة محدّثة.",
  "Unsaved changes — ⌘S downloads an updated copy (this browser can’t rewrite the file)": "تغييرات غير محفوظة — الاختصار ⌘S ينزّل نسخة محدّثة (هذا المتصفح لا يستطيع إعادة كتابة الملف)",
  "Save — download an updated copy (⌘S). This browser can’t rewrite the open file.": "حفظ — تنزيل نسخة محدّثة (⌘S). هذا المتصفح لا يستطيع إعادة كتابة الملف المفتوح.",
  "This browser can’t rewrite files in place. ⌘S will download an updated copy instead — your work is also kept in this browser and offered back if you reopen.": "هذا المتصفح لا يستطيع إعادة كتابة الملفات في مكانها. سينزّل الاختصار ⌘S نسخة محدّثة بدلًا من ذلك — كما يُحفظ عملك في هذا المتصفح ويُعرض عليك عند إعادة الفتح.",
  "Got it": "حسنًا",
  "What’s new →": "ما الجديد →",
  "Read the release notes for v{v} (opens in a new tab)": "قراءة ملاحظات الإصدار {v} (يُفتح في علامة تبويب جديدة)",
  "That image is too large to share live (about 1 MB max). It’s saved in your copy, but collaborators won’t see it.": "هذه الصورة أكبر من أن تُشارَك مباشرةً (الحد الأقصى نحو 1 ميجابايت). إنها محفوظة في نسختك، لكن المتعاونين لن يروها.",
  "That change is too large to share live (about 1 MB max). It’s saved in your copy, but collaborators won’t see it.": "هذا التغيير أكبر من أن يُشارَك مباشرةً (الحد الأقصى نحو 1 ميجابايت). إنه محفوظ في نسختك، لكن المتعاونين لن يروه.",
  "This live session has run out of room. Your change is saved in your copy, but collaborators won’t see it.": "نفدت المساحة في هذه الجلسة المباشرة. تغييرك محفوظ في نسختك، لكن المتعاونين لن يروه.",
  "The live session couldn’t store that change. It’s saved in your copy, but collaborators won’t see it.": "تعذّر على الجلسة المباشرة تخزين هذا التغيير. إنه محفوظ في نسختك، لكن المتعاونين لن يروه.",
  "Too many changes at once — live sync is catching up.": "تغييرات كثيرة دفعةً واحدة — المزامنة المباشرة تحاول اللحاق.",
  "Backdrop": "تمويه الخلفية",
  "Blend": "المزج",
  "Outline": "حدّ النص",
  "Outline color": "لون حدّ النص",
  "Interior": "داخل الحرف",
  "filled": "ممتلئ",
  "hollow": "مفرّغ",
  "Reduced motion: on": "تقليل الحركة: مفعّل",
  "Reduced motion: off": "تقليل الحركة: معطّل",
  "Reduce motion — pause animations (also honours your OS setting)": "تقليل الحركة — إيقاف الرسوم المتحركة مؤقتًا (يراعي أيضًا إعداد نظام التشغيل)",
  "Reduce motion (M)": "تقليل الحركة (M)",
  "Visit bento.page (opens in a new tab)": "الانتقال إلى bento.page (يُفتح في علامة تبويب جديدة)",
  "New to Bento? Find templates, the gallery and the AI editing guide at {home} — or ⭐ it on {gh}.": "جديد على bento؟ ستجد القوالب والمعرض ودليل التحرير بالذكاء الاصطناعي على {home} — ويسعدنا أن تضع لنا ⭐ على {gh}",
  "Morph": "تحوّل",
  "Morph id": "معرّف التحوّل",
  "Pair with": "الإقران مع",
  "(pick an element)": "(اختر عنصرًا)",
  "Morphs as <code>{id}</code>, overriding its own id. Set it back to <code>{own}</code> to clear.": "يتحوّل باسم <code>{id}</code> بدلًا من معرّفه الخاص. أعِد القيمة إلى <code>{own}</code> لإلغاء ذلك.",
  "Elements sharing a morph id morph into each other across slides. Change this (or pick below) to pair with an element on another slide.": "العناصر التي تشترك في معرّف التحوّل تتحوّل إلى بعضها بين الشرائح. غيّر هذه القيمة (أو اختر من الأسفل) لإقران عنصر في شريحة أخرى.",
  "Morph id can’t be empty.": "لا يمكن ترك معرّف التحوّل فارغًا.",
  "Another element on this slide already uses that morph id.": "هناك عنصر آخر في هذه الشريحة يستخدم معرّف التحوّل نفسه.",
  "<b>Morph</b> animates elements that appear on both this slide and the previous one (copy a slide, then move things around).": "<b>التحوّل</b> يُحرّك العناصر الموجودة في هذه الشريحة وفي السابقة معًا (انسخ شريحة ثم حرّك محتوياتها).",
  "A <b>state</b> is hidden from arrow-key flow — viewers reach it by clicking a linked element. Shared element ids morph between states.": "<b>الحالة</b> مخفية عن التنقّل بمفاتيح الأسهم — يصل إليها المشاهدون بالنقر على عنصر مرتبط. العناصر ذات المعرّفات المشتركة تتحوّل بين الحالات.",
  "A deck needs at least one slide": "لا بد أن يحتوي العرض التقديمي على شريحة واحدة على الأقل",
  "About bento/slides — version, updates, licenses": "حول bento/slides — الإصدار والتحديثات والتراخيص",
  "Align": "المحاذاة",
  "Ambient": "حركة مستمرة",
  "Angle": "الزاوية",
  "Apply": "تطبيق",
  "Arrange": "الترتيب",
  "Arrow": "سهم",
  "Background": "الخلفية",
  "Black": "أسود",
  "Blur": "التمويه",
  "Bold": "عريض",
  "Built-in": "مدمج",
  "Bundle a .woff2/.woff/.ttf/.otf into this file and use it here": "ضمّ ملف خط بامتداد .woff2 أو .woff أو .ttf أو .otf إلى هذا الملف واستخدامه هنا",
  "Change the name used for your new comments and replies": "تغيير الاسم المستخدم في تعليقاتك وردودك الجديدة",
  "Chart": "مخطط",
  "Check for updates": "البحث عن تحديثات",
  "Check for updates automatically at launch": "البحث عن التحديثات تلقائيًا عند التشغيل",
  "Checked automatically at launch — you're on the latest version (v{v}).": "تم البحث تلقائيًا عند التشغيل — لديك أحدث إصدار ({v}).",
  "Checking…": "جارٍ البحث…",
  "Checks contact the release server and send nothing about you or this document — no ids, no telemetry.": "عمليات البحث تتصل بخادم الإصدارات ولا ترسل أي شيء عنك أو عن هذا المستند — لا معرّفات ولا بيانات استخدام.",
  "Click to reset": "انقر لإعادة التعيين",
  "Color": "اللون",
  "Comment": "تعليق",
  "Comment (C) — click an element or a spot on the slide": "تعليق (C) — انقر على عنصر أو على موضع في الشريحة",
  "Comment · element": "تعليق · عنصر",
  "Comment · point ({x}, {y})": "تعليق · نقطة ({x}, {y})",
  "Comment · slide": "تعليق · شريحة",
  "Comment:": "تعليق:",
  "Copied ✓": "تم النسخ ✓",
  "Copies this deck as plain JSON — paste it into an AI chat or any tool, then bring the edited JSON back here.": "ينسخ هذا العرض التقديمي بصيغة JSON عادية — الصقه في محادثة ذكاء اصطناعي أو أي أداة، ثم أعِد إلى هنا النص المحرَّر.",
  "Copy document JSON": "نسخ JSON المستند",
  "Corner radius": "استدارة الزوايا",
  "Couldn't check: {m}": "تعذّر البحث: {m}",
  "Couldn’t access the clipboard": "تعذّر الوصول إلى الحافظة",
  "Count up": "عدّ تصاعدي",
  "Custom ({n})": "مخصص ({n})",
  "Data": "البيانات",
  "Default set": "المجموعة الافتراضية",
  "Delete": "حذف",
  "Delete slide": "حذف الشريحة",
  "Delete this layout": "حذف هذا التخطيط",
  "Delete this slide? {parts}.": "حذف هذه الشريحة؟ {parts}.",
  "Dissolve the group (⇧⌘G)": "فك المجموعة (⇧⌘G)",
  "Document replaced — ⌘Z undoes": "تم استبدال المستند — للتراجع اضغط ⌘Z",
  "Download updated copy": "تنزيل نسخة محدّثة",
  "Downloaded ✓": "تم التنزيل ✓",
  "Downloads a backup of the current version, then rewrites this file on disk as the new version — document untouched.": "ينزّل نسخة احتياطية من الإصدار الحالي، ثم يعيد كتابة هذا الملف على القرص بالإصدار الجديد — دون المساس بالمستند.",
  "Downloads the new version with this document inside. The file you have now is not touched.": "ينزّل الإصدار الجديد ومعه هذا المستند بداخله. أما الملف الموجود لديك الآن فلا يتغيّر.",
  "Drag anchor points on the slide; double-click adds and removes points": "اسحب نقاط الارتكاز على الشريحة؛ النقر المزدوج يضيف النقاط ويحذفها",
  "Drag to resize · double-click to reset": "اسحب لتغيير الحجم · انقر نقرًا مزدوجًا لإعادة التعيين",
  "Duplicate": "تكرار",
  "Duplicate slide": "تكرار الشريحة",
  "Duplicates this slide as a hidden interactive state and links the selected element to it": "يكرّر هذه الشريحة كحالة تفاعلية مخفية ويربط العنصر المحدد بها",
  "Elements select and move as one; Alt-click reaches a member (⌘G)": "تُحدَّد العناصر وتتحرك ككتلة واحدة؛ النقر مع Alt يصل إلى عنصر بداخلها (⌘G)",
  "Ellipse": "شكل بيضاوي",
  "End of deck": "نهاية العرض التقديمي",
  "End tip": "طرف النهاية",
  "Enter": "الدخول",
  "Export PDF (print)": "تصدير PDF (طباعة)",
  "Extra bold": "عريض جدًا",
  "Extra light": "خفيف جدًا",
  "Fill": "التعبئة",
  "Fill & stroke": "التعبئة والحدّ",
}
