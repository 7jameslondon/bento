// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Persian (Farsi) — a LANGUAGE PACK, not bundled: nothing imports this file,
// so it never enters the module graph. scripts/build-i18n.mjs --packs emits it
// as downloadable JSON. See docs/i18n-packs.md.
//
// Persian is right-to-left, and unlike the Hebrew pack — the first RTL one,
// written while the shell still laid out LTR — it lands in a shell that
// already mirrors its chrome. Orthography is PERSIAN, not Arabic: ک (U+06A9)
// and ی (U+06CC) throughout, never the Arabic ك/ي. ZWNJ (U+200C, نیم‌فاصله)
// is used where Persian requires it (می‌شود, به‌روزرسانی, طرح‌بندی); it is a
// joiner, not a bidi control, and there are NO bidi control characters in this
// file — strings mixing Persian with a Latin token, a shortcut or a number are
// REPHRASED so the punctuation lands right, never steered with marks. Digits
// stay Western (0-9): page and slide numbers are document content and must
// read identically for every viewer.
//
// Machine-drafted and NOT reviewed by a native speaker. Terminology follows
// what Persian speakers see in Office and Google Slides (اسلاید, ارائه,
// طرح‌بندی, قلم, نمودار). No plural machinery exists in t(); Persian keeps the
// noun singular after a numeral, so counted strings are phrased
// count-agnostically and read correctly at every n.
import type { Catalog } from '../../i18n'

export const label = 'فارسی'

export const strings: Catalog = {
  "Backed up in this browser": "در همین مرورگر پشتیبان گرفته شد",
  "Unsaved changes — kept in this browser at {when} and offered back if you reopen. ⌘S downloads an updated copy.": "تغییرات ذخیره‌نشده — ساعت {when} در همین مرورگر نگه داشته شد و هنگام باز کردن دوباره به شما پیشنهاد می‌شود. با ⌘S نسخهٔ به‌روز دانلود می‌شود.",
  "Unsaved changes — ⌘S downloads an updated copy (this browser can’t rewrite the file)": "تغییرات ذخیره‌نشده — با ⌘S نسخهٔ به‌روز دانلود می‌شود (این مرورگر نمی‌تواند فایل را بازنویسی کند)",
  "Save — download an updated copy (⌘S). This browser can’t rewrite the open file.": "ذخیره (⌘S) — دانلود نسخهٔ به‌روز. این مرورگر نمی‌تواند فایل باز را بازنویسی کند.",
  "This browser can’t rewrite files in place. ⌘S will download an updated copy instead — your work is also kept in this browser and offered back if you reopen.": "این مرورگر نمی‌تواند فایل‌ها را در جای خود بازنویسی کند. در عوض با ⌘S نسخهٔ به‌روز دانلود می‌شود — کار شما در همین مرورگر هم نگه داشته می‌شود و هنگام باز کردن دوباره به شما پیشنهاد می‌شود.",
  "Got it": "متوجه شدم",
  "What’s new →": "تازه‌ها ←",
  "Read the release notes for v{v} (opens in a new tab)": "خواندن یادداشت‌های انتشار نسخهٔ {v} (در زبانهٔ جدید باز می‌شود)",
  "That image is too large to share live (about 1 MB max). It’s saved in your copy, but collaborators won’t see it.": "این تصویر برای اشتراک‌گذاری زنده بزرگ‌تر از حد مجاز است (حداکثر حدود 1 مگابایت). در نسخهٔ خودتان ذخیره می‌شود، اما همکاران آن را نمی‌بینند.",
  "That change is too large to share live (about 1 MB max). It’s saved in your copy, but collaborators won’t see it.": "این تغییر برای اشتراک‌گذاری زنده بزرگ‌تر از حد مجاز است (حداکثر حدود 1 مگابایت). در نسخهٔ خودتان ذخیره می‌شود، اما همکاران آن را نمی‌بینند.",
  "This live session has run out of room. Your change is saved in your copy, but collaborators won’t see it.": "فضای این نشست زنده تمام شده است. تغییر شما در نسخهٔ خودتان ذخیره می‌شود، اما همکاران آن را نمی‌بینند.",
  "The live session couldn’t store that change. It’s saved in your copy, but collaborators won’t see it.": "نشست زنده نتوانست آن تغییر را ذخیره کند. تغییر در نسخهٔ خودتان ذخیره می‌شود، اما همکاران آن را نمی‌بینند.",
  "Too many changes at once — live sync is catching up.": "تغییرات هم‌زمان بیش از اندازه است — هم‌گام‌سازی زنده در حال جبران عقب‌ماندگی است.",
  "Backdrop": "تاری پس‌زمینه",
  "Blend": "حالت ترکیب",
  "Outline": "خط دور",
  "Outline color": "رنگ خط دور",
  "Interior": "فضای داخلی",
  "filled": "توپر",
  "hollow": "توخالی",
  "Reduced motion: on": "کاهش حرکت: روشن",
  "Reduced motion: off": "کاهش حرکت: خاموش",
  "Reduce motion — pause animations (also honours your OS setting)": "کاهش حرکت — توقف انیمیشن‌ها (تنظیم سیستم‌عامل شما هم رعایت می‌شود)",
  "Reduce motion (M)": "کاهش حرکت (M)",
  "Visit bento.page (opens in a new tab)": "رفتن به bento.page (در زبانهٔ جدید باز می‌شود)",
  "New to Bento? Find templates, the gallery and the AI editing guide at {home} — or ⭐ it on {gh}.": "تازه با bento آشنا شده‌اید؟ الگوها، گالری و راهنمای ویرایش با هوش مصنوعی در {home} هستند — یا در {gh} به آن ⭐ بدهید.",
  "Morph": "مورف",
  "Morph id": "شناسهٔ مورف",
  "Pair with": "جفت کردن با",
  "(pick an element)": "(یک عنصر انتخاب کنید)",
  "Morphs as <code>{id}</code>, overriding its own id. Set it back to <code>{own}</code> to clear.": "به‌جای شناسهٔ خودش با <code>{id}</code> مورف می‌شود. برای پاک کردن، دوباره آن را روی <code>{own}</code> بگذارید.",
  "Elements sharing a morph id morph into each other across slides. Change this (or pick below) to pair with an element on another slide.": "عنصرهایی که شناسهٔ مورف یکسانی دارند در اسلایدهای مختلف به یکدیگر مورف می‌شوند. برای جفت کردن با عنصری در اسلاید دیگر، این مقدار را تغییر دهید یا از فهرست پایین انتخاب کنید.",
  "Morph id can’t be empty.": "شناسهٔ مورف نمی‌تواند خالی باشد.",
  "Another element on this slide already uses that morph id.": "عنصر دیگری در همین اسلاید از آن شناسهٔ مورف استفاده می‌کند.",
  "<b>Morph</b> animates elements that appear on both this slide and the previous one (copy a slide, then move things around).": "<b>مورف</b> عنصرهایی را که هم در این اسلاید و هم در اسلاید پیشین هستند متحرک می‌کند (یک اسلاید را کپی کنید و سپس چیزها را جابه‌جا کنید).",
  "A <b>state</b> is hidden from arrow-key flow — viewers reach it by clicking a linked element. Shared element ids morph between states.": "<b>حالت</b> از مسیر کلیدهای جهت‌دار پنهان است — بیننده با کلیک روی عنصری پیونددار به آن می‌رسد. عنصرهایی با شناسهٔ مشترک بین حالت‌ها مورف می‌شوند.",
  "A deck needs at least one slide": "هر ارائه باید دست‌کم یک اسلاید داشته باشد",
  "About bento/slides — version, updates, licenses": "دربارهٔ bento/slides — نسخه، به‌روزرسانی‌ها و مجوزها",
  "Align": "تراز",
  "Ambient": "تحرک پیوسته",
  "Angle": "زاویه",
  "Apply": "اعمال",
  "Arrange": "چیدمان",
  "Arrow": "پیکان",
  "Background": "پس‌زمینه",
  "Black": "سیاه",
  "Blur": "تاری",
  "Bold": "ضخیم",
  "Built-in": "داخلی",
  "Bundle a .woff2/.woff/.ttf/.otf into this file and use it here": "فایل قلم (woff2، woff، ttf یا otf) را در همین فایل جای دهید و اینجا از آن استفاده کنید",
  "Change the name used for your new comments and replies": "تغییر نامی که برای نظرها و پاسخ‌های تازهٔ شما به کار می‌رود",
  "Chart": "نمودار",
  "Check for updates": "بررسی به‌روزرسانی",
  "Check for updates automatically at launch": "بررسی خودکار به‌روزرسانی هنگام اجرا",
  "Checked automatically at launch — you're on the latest version (v{v}).": "هنگام اجرا به‌طور خودکار بررسی شد — شما از آخرین نسخه ({v}) استفاده می‌کنید.",
  "Checking…": "در حال بررسی…",
  "Checks contact the release server and send nothing about you or this document — no ids, no telemetry.": "بررسی‌ها فقط با سرور انتشار تماس می‌گیرند و هیچ اطلاعاتی دربارهٔ شما یا این سند نمی‌فرستند — نه شناسه‌ای، نه داده‌های تحلیلی.",
  "Click to reset": "برای بازنشانی کلیک کنید",
  "Color": "رنگ",
  "Comment": "نظر",
  "Comment (C) — click an element or a spot on the slide": "نظر (C) — روی یک عنصر یا نقطه‌ای از اسلاید کلیک کنید",
  "Comment · element": "نظر · عنصر",
  "Comment · point ({x}, {y})": "نظر · نقطه ({x}، {y})",
  "Comment · slide": "نظر · اسلاید",
  "Comment:": "نظر:",
  "Copied ✓": "کپی شد ✓",
  "Copies this deck as plain JSON — paste it into an AI chat or any tool, then bring the edited JSON back here.": "این ارائه را به‌صورت JSON ساده کپی می‌کند — آن را در یک گفت‌وگوی هوش مصنوعی یا هر ابزار دیگری بچسبانید و سپس JSON ویرایش‌شده را به اینجا برگردانید.",
  "Copy document JSON": "کپی JSON سند",
  "Corner radius": "گردی گوشه",
  "Couldn't check: {m}": "بررسی ممکن نشد: {m}",
  "Couldn’t access the clipboard": "دسترسی به کلیپ‌بورد ممکن نشد",
  "Count up": "شمارش صعودی",
  "Custom ({n})": "سفارشی ({n})",
  "Data": "داده‌ها",
  "Default set": "مجموعهٔ پیش‌فرض",
  "Delete": "حذف",
  "Delete slide": "حذف اسلاید",
  "Delete this layout": "حذف این طرح‌بندی",
  "Delete this slide? {parts}.": "این اسلاید حذف شود؟ {parts}.",
  "Dissolve the group (⇧⌘G)": "لغو گروه‌بندی (⇧⌘G)",
  "Document replaced — ⌘Z undoes": "سند جایگزین شد — با ⌘Z واگرد می‌شود",
  "Download updated copy": "دانلود نسخهٔ به‌روز",
  "Downloaded ✓": "دانلود شد ✓",
  "Downloads a backup of the current version, then rewrites this file on disk as the new version — document untouched.": "ابتدا از نسخهٔ فعلی یک پشتیبان دانلود می‌کند، سپس این فایل را روی دیسک به‌عنوان نسخهٔ تازه بازنویسی می‌کند — سند دست‌نخورده می‌ماند.",
  "Downloads the new version with this document inside. The file you have now is not touched.": "نسخهٔ تازه را همراه با همین سند دانلود می‌کند. فایلی که اکنون دارید دست‌نخورده می‌ماند.",
  "Drag anchor points on the slide; double-click adds and removes points": "نقطه‌های مهار را روی اسلاید بکشید؛ دوبار کلیک نقطه را اضافه یا حذف می‌کند",
  "Drag to resize · double-click to reset": "برای تغییر اندازه بکشید · برای بازنشانی دوبار کلیک کنید",
  "Duplicate": "تکثیر",
  "Duplicate slide": "تکثیر اسلاید",
  "Duplicates this slide as a hidden interactive state and links the selected element to it": "این اسلاید را به‌عنوان یک حالت تعاملی پنهان تکثیر می‌کند و عنصر انتخاب‌شده را به آن پیوند می‌دهد",
}
