// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Ukrainian — a LANGUAGE PACK, not bundled: nothing imports this file, so it
// never enters the module graph. scripts/build-i18n.mjs --packs emits it as
// downloadable JSON. See docs/i18n-packs.md.
//
// Machine-drafted and NOT reviewed by a native speaker. Terminology is
// GENUINE UKRAINIAN, not transliterated Russian: слайд, макет, перехід,
// об’єкт, фігура, заливка, контур, ескіз, полотно, вкладка, вилучити,
// увімкнути/вимкнути. Where Microsoft's and Google's Ukrainian UI have a
// settled term it wins over a purist coinage (фон, а не тло; браузер, а не
// оглядач); "morph" is PowerPoint's «Трансформація». Ukrainian typographic
// apostrophe U+2019 (об’єкт) is used throughout.
//
// PLURALS. Ukrainian has four CLDR categories (one/few/many/other) and the
// 1 / 2-4 / 5+ agreement split is a real trap — «1 слайд», «2 слайди»,
// «5 слайдів». t() has NO plural machinery and none is being added, so every
// counted string is phrased COUNT-AGNOSTICALLY with the standard Ukrainian UI
// colon construction («Підключено: {n}», «Вставлено слайдів: {n}»), which is
// correct for n=1, n=3 and n=7 alike. Index labels («Вісь {n}», «Ряд {n}»)
// never agree with anything and are left as they are.
//
// GENDER. Past-tense verbs agree with the subject's gender in Ukrainian, so
// «{name} joined» would misgender half the people it names. Those strings are
// rephrased into gender-free forms («{name} — у сеансі»).
import type { Catalog } from '../../i18n'

export const label = 'Українська'

export const strings: Catalog = {
  "Backed up in this browser": "Резервну копію збережено в цьому браузері",
  "Unsaved changes — kept in this browser at {when} and offered back if you reopen. ⌘S downloads an updated copy.": "Незбережені зміни — збережено в цьому браузері о {when}; їх буде запропоновано під час повторного відкриття. ⌘S завантажує оновлену копію.",
  "Unsaved changes — ⌘S downloads an updated copy (this browser can’t rewrite the file)": "Незбережені зміни — ⌘S завантажує оновлену копію (цей браузер не може перезаписати файл)",
  "Save — download an updated copy (⌘S). This browser can’t rewrite the open file.": "Зберегти — завантажити оновлену копію (⌘S). Цей браузер не може перезаписати відкритий файл.",
  "This browser can’t rewrite files in place. ⌘S will download an updated copy instead — your work is also kept in this browser and offered back if you reopen.": "Цей браузер не може перезаписувати файли на місці. Натомість ⌘S завантажить оновлену копію — вашу роботу також збережено в цьому браузері, і її буде запропоновано під час повторного відкриття.",
  "Got it": "Зрозуміло",
  "What’s new →": "Що нового →",
  "Read the release notes for v{v} (opens in a new tab)": "Читати примітки до випуску v{v} (відкриється в новій вкладці)",
  "That image is too large to share live (about 1 MB max). It’s saved in your copy, but collaborators won’t see it.": "Це зображення завелике для спільної роботи в реальному часі (максимум близько 1 МБ). Воно збережене у вашій копії, але співавтори його не побачать.",
  "That change is too large to share live (about 1 MB max). It’s saved in your copy, but collaborators won’t see it.": "Ця зміна завелика для спільної роботи в реальному часі (максимум близько 1 МБ). Вона збережена у вашій копії, але співавтори її не побачать.",
  "This live session has run out of room. Your change is saved in your copy, but collaborators won’t see it.": "У цьому сеансі спільної роботи закінчилося місце. Вашу зміну збережено у вашій копії, але співавтори її не побачать.",
  "The live session couldn’t store that change. It’s saved in your copy, but collaborators won’t see it.": "Сеансу спільної роботи не вдалося зберегти цю зміну. Її збережено у вашій копії, але співавтори її не побачать.",
  "Too many changes at once — live sync is catching up.": "Забагато змін водночас — синхронізація надолужує.",
  "Backdrop": "Розмиття фону",
  "Blend": "Накладання",
  "Outline": "Обведення",
  "Outline color": "Колір обведення",
  "Interior": "Усередині",
  "filled": "із заливкою",
  "hollow": "без заливки",
  "Reduced motion: on": "Зменшення руху: увімк.",
  "Reduced motion: off": "Зменшення руху: вимк.",
  "Reduce motion — pause animations (also honours your OS setting)": "Зменшити рух — призупинити анімації (враховує й налаштування системи)",
  "Reduce motion (M)": "Зменшити рух (M)",
  "Visit bento.page (opens in a new tab)": "Перейти на bento.page (відкриється в новій вкладці)",
  "New to Bento? Find templates, the gallery and the AI editing guide at {home} — or ⭐ it on {gh}.": "Уперше в Bento? Шаблони, галерею та посібник з редагування за допомогою ШІ шукайте на {home} — або поставте ⭐ на {gh}.",
  "Morph": "Трансформація",
  "Morph id": "ID трансформації",
  "Pair with": "Пов’язати з",
  "(pick an element)": "(виберіть об’єкт)",
  "Morphs as <code>{id}</code>, overriding its own id. Set it back to <code>{own}</code> to clear.": "Трансформується як <code>{id}</code>, заміщаючи власний id. Поверніть <code>{own}</code>, щоб скинути.",
  "Elements sharing a morph id morph into each other across slides. Change this (or pick below) to pair with an element on another slide.": "Об’єкти зі спільним ID трансформації перетікають один в одного між слайдами. Змініть його (або виберіть нижче), щоб пов’язати з об’єктом на іншому слайді.",
  "Morph id can’t be empty.": "ID трансформації не може бути порожнім.",
  "Another element on this slide already uses that morph id.": "Інший об’єкт на цьому слайді вже використовує цей ID трансформації.",
  "<b>Morph</b> animates elements that appear on both this slide and the previous one (copy a slide, then move things around).": "<b>Трансформація</b> анімує об’єкти, які є і на цьому слайді, і на попередньому (скопіюйте слайд, а потім перемістіть об’єкти).",
  "A <b>state</b> is hidden from arrow-key flow — viewers reach it by clicking a linked element. Shared element ids morph between states.": "<b>Стан</b> прихований від навігації стрілками — глядачі потрапляють до нього, натиснувши пов’язаний об’єкт. Об’єкти зі спільними id трансформуються між станами.",
  "A deck needs at least one slide": "У презентації має бути принаймні один слайд",
  "About bento/slides — version, updates, licenses": "Про bento/slides — версія, оновлення, ліцензії",
  "Align": "Вирівняти",
  "Ambient": "Фонова анімація",
  "Angle": "Кут",
  "Apply": "Застосувати",
  "Arrange": "Упорядкувати",
  "Arrow": "Стрілка",
  "Background": "Фон",
  "Black": "Чорний",
  "Blur": "Розмиття",
  "Bold": "Жирний",
  "Built-in": "Вбудований",
  "Bundle a .woff2/.woff/.ttf/.otf into this file and use it here": "Вбудувати .woff2/.woff/.ttf/.otf у цей файл і використати його тут",
  "Change the name used for your new comments and replies": "Змінити ім’я, яке використовується у ваших нових коментарях і відповідях",
  "Chart": "Діаграма",
  "Check for updates": "Перевірити наявність оновлень",
  "Check for updates automatically at launch": "Автоматично перевіряти оновлення під час запуску",
  "Checked automatically at launch — you're on the latest version (v{v}).": "Перевірено автоматично під час запуску — у вас найновіша версія (v{v}).",
  "Checking…": "Перевірка…",
  "Checks contact the release server and send nothing about you or this document — no ids, no telemetry.": "Перевірка звертається до сервера випусків і не надсилає нічого про вас чи цей документ — жодних ідентифікаторів, жодної телеметрії.",
  "Click to reset": "Натисніть, щоб скинути",
  "Color": "Колір",
  "Comment": "Коментар",
  "Comment (C) — click an element or a spot on the slide": "Коментар (C) — натисніть об’єкт або точку на слайді",
  "Comment · element": "Коментар · об’єкт",
  "Comment · point ({x}, {y})": "Коментар · точка ({x}, {y})",
  "Comment · slide": "Коментар · слайд",
  "Comment:": "Коментар:",
  "Copied ✓": "Скопійовано ✓",
  "Copies this deck as plain JSON — paste it into an AI chat or any tool, then bring the edited JSON back here.": "Копіює цю презентацію як звичайний JSON — вставте його в чат зі ШІ чи будь-який інструмент, а потім поверніть відредагований JSON сюди.",
  "Copy document JSON": "Копіювати JSON документа",
  "Corner radius": "Радіус заокруглення",
  "Couldn't check: {m}": "Не вдалося перевірити: {m}",
  "Couldn’t access the clipboard": "Не вдалося отримати доступ до буфера обміну",
  "Count up": "Лічильник",
  "Custom ({n})": "Власний ({n})",
  "Data": "Дані",
  "Default set": "Типовий набір",
  "Delete": "Видалити",
  "Delete slide": "Видалити слайд",
  "Delete this layout": "Видалити цей макет",
  "Delete this slide? {parts}.": "Видалити цей слайд? {parts}.",
  "Dissolve the group (⇧⌘G)": "Розгрупувати (⇧⌘G)",
  "Document replaced — ⌘Z undoes": "Документ замінено — ⌘Z скасовує",
  "Download updated copy": "Завантажити оновлену копію",
  "Downloaded ✓": "Завантажено ✓",
  "Downloads a backup of the current version, then rewrites this file on disk as the new version — document untouched.": "Завантажує резервну копію поточної версії, а потім перезаписує цей файл на диску як нову версію — документ лишається недоторканим.",
  "Downloads the new version with this document inside. The file you have now is not touched.": "Завантажує нову версію з цим документом усередині. Наявний файл лишається недоторканим.",
  "Drag anchor points on the slide; double-click adds and removes points": "Перетягуйте опорні точки на слайді; подвійне клацання додає та вилучає точки",
  "Drag to resize · double-click to reset": "Перетягніть, щоб змінити розмір · подвійне клацання скидає",
  "Duplicate": "Дублювати",
  "Duplicate slide": "Дублювати слайд",
  "Duplicates this slide as a hidden interactive state and links the selected element to it": "Дублює цей слайд як прихований інтерактивний стан і пов’язує з ним вибраний об’єкт",
  "Elements select and move as one; Alt-click reaches a member (⌘G)": "Об’єкти виділяються й переміщуються як одне ціле; Alt-клацання дістає окремий (⌘G)",
  "Ellipse": "Еліпс",
  "End of deck": "Кінець презентації",
  "End tip": "Кінець лінії",
  "Enter": "Поява",
  "Export PDF (print)": "Експорт у PDF (друк)",
  "Extra bold": "Дуже жирний",
  "Extra light": "Дуже світлий",
  "Fill": "Заливка",
  "Fill & stroke": "Заливка й контур",
}
