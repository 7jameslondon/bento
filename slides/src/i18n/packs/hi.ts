// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Hindi — a LANGUAGE PACK, not bundled: nothing imports this file, so it
// never enters the module graph. scripts/build-i18n.mjs --packs emits it as
// downloadable JSON. See docs/i18n-packs.md.
//
// Machine-drafted and NOT reviewed by a native speaker.
//
// REGISTER. Hindi computing vocabulary splits between Sanskritised coinages
// (संगणक, कुंजीपटल) and everyday English borrowings written in Devanagari
// (कंप्यूटर, कीबोर्ड). This catalog follows the BORROWED convention, because
// that is what Hindi speakers actually meet in Google Slides/Docs and in
// Microsoft Office: स्लाइड, प्रज़ेंटेशन, फ़ॉन्ट, टेक्स्ट, इमेज, टेबल, चार्ट,
// लेआउट, थीम, ऐनिमेशन, ट्रांज़िशन. Where the Hindi word IS the everyday word
// it is used unchanged (रंग, आकार, चौड़ाई, ऊंचाई, टिप्पणी, पंक्ति).
//
// GENDER. Hindi verbs agree with the subject's gender, so nothing here
// addresses the user with a gendered verb form: strings use the neutral
// formal imperative (…करें), infinitives (…करना) and impersonal
// constructions rather than forms that would assume a male or female reader.
//
// PLURALS. t() has no plural machinery, so the six genuinely counted strings
// are phrased count-agnostically ("{n} लोग जुड़े हैं" style), and index
// labels ("Axis {n}", "slide {n}") are never pluralised.
//
// Western digits (0-9) throughout, matching what every Hindi UI uses.
import type { Catalog } from '../../i18n'

export const label = 'हिन्दी'

export const strings: Catalog = {
  "Backed up in this browser": "इस ब्राउज़र में बैकअप ले लिया गया",
  "Unsaved changes — kept in this browser at {when} and offered back if you reopen. ⌘S downloads an updated copy.": "बिना सेव किए बदलाव — {when} पर इस ब्राउज़र में रखे गए हैं और दोबारा खोलने पर वापस मिल जाएंगे। ⌘S अपडेट की गई कॉपी डाउनलोड करता है।",
  "Unsaved changes — ⌘S downloads an updated copy (this browser can’t rewrite the file)": "बिना सेव किए बदलाव — ⌘S अपडेट की गई कॉपी डाउनलोड करता है (यह ब्राउज़र फ़ाइल को दोबारा नहीं लिख सकता)",
  "Save — download an updated copy (⌘S). This browser can’t rewrite the open file.": "सेव करें — अपडेट की गई कॉपी डाउनलोड करें (⌘S)। यह ब्राउज़र खुली हुई फ़ाइल को दोबारा नहीं लिख सकता।",
  "This browser can’t rewrite files in place. ⌘S will download an updated copy instead — your work is also kept in this browser and offered back if you reopen.": "यह ब्राउज़र फ़ाइलों को उसी जगह दोबारा नहीं लिख सकता। इसके बजाय ⌘S अपडेट की गई कॉपी डाउनलोड करेगा — आपका काम इस ब्राउज़र में भी रखा जाता है और दोबारा खोलने पर वापस मिल जाता है।",
  "Got it": "ठीक है",
  "What’s new →": "नया क्या है →",
  "Read the release notes for v{v} (opens in a new tab)": "v{v} के रिलीज़ नोट पढ़ें (नए टैब में खुलता है)",
  "That image is too large to share live (about 1 MB max). It’s saved in your copy, but collaborators won’t see it.": "यह इमेज लाइव शेयर करने के लिए बहुत बड़ी है (ज़्यादा से ज़्यादा लगभग 1 MB)। यह आपकी कॉपी में सेव है, लेकिन सहयोगियों को नहीं दिखेगी।",
  "That change is too large to share live (about 1 MB max). It’s saved in your copy, but collaborators won’t see it.": "यह बदलाव लाइव शेयर करने के लिए बहुत बड़ा है (ज़्यादा से ज़्यादा लगभग 1 MB)। यह आपकी कॉपी में सेव है, लेकिन सहयोगियों को नहीं दिखेगा।",
  "This live session has run out of room. Your change is saved in your copy, but collaborators won’t see it.": "इस लाइव सेशन में जगह खत्म हो गई है। आपका बदलाव आपकी कॉपी में सेव है, लेकिन सहयोगियों को नहीं दिखेगा।",
  "The live session couldn’t store that change. It’s saved in your copy, but collaborators won’t see it.": "लाइव सेशन उस बदलाव को स्टोर नहीं कर पाया। यह आपकी कॉपी में सेव है, लेकिन सहयोगियों को नहीं दिखेगा।",
  "Too many changes at once — live sync is catching up.": "एक साथ बहुत सारे बदलाव — लाइव सिंक उन्हें पूरा कर रहा है।",
  "Backdrop": "बैकड्रॉप",
  "Blend": "ब्लेंड",
  "Outline": "आउटलाइन",
  "Outline color": "आउटलाइन का रंग",
  "Interior": "अंदरूनी भाग",
  "filled": "भरा हुआ",
  "hollow": "खोखला",
  "Reduced motion: on": "कम मोशन: चालू",
  "Reduced motion: off": "कम मोशन: बंद",
  "Reduce motion — pause animations (also honours your OS setting)": "मोशन कम करें — ऐनिमेशन रोकें (आपके OS की सेटिंग का भी पालन करता है)",
  "Reduce motion (M)": "मोशन कम करें (M)",
  "Visit bento.page (opens in a new tab)": "bento.page पर जाएं (नए टैब में खुलता है)",
  "New to Bento? Find templates, the gallery and the AI editing guide at {home} — or ⭐ it on {gh}.": "bento में नए हैं? टेंप्लेट, गैलरी और AI एडिटिंग गाइड {home} पर देखें — या {gh} पर ⭐ दें।",
  "Morph": "मॉर्फ",
  "Morph id": "मॉर्फ आईडी",
  "Pair with": "इसके साथ जोड़ें",
  "(pick an element)": "(कोई एलिमेंट चुनें)",
  "Morphs as <code>{id}</code>, overriding its own id. Set it back to <code>{own}</code> to clear.": "अपनी आईडी की जगह <code>{id}</code> के रूप में मॉर्फ होता है। हटाने के लिए इसे वापस <code>{own}</code> कर दें।",
  "Elements sharing a morph id morph into each other across slides. Change this (or pick below) to pair with an element on another slide.": "एक ही मॉर्फ आईडी वाले एलिमेंट स्लाइडों के बीच एक-दूसरे में मॉर्फ होते हैं। किसी दूसरी स्लाइड के एलिमेंट के साथ जोड़ने के लिए इसे बदलें (या नीचे से चुनें)।",
  "Morph id can’t be empty.": "मॉर्फ आईडी खाली नहीं हो सकती।",
  "Another element on this slide already uses that morph id.": "इस स्लाइड का कोई दूसरा एलिमेंट पहले से वह मॉर्फ आईडी इस्तेमाल कर रहा है।",
  "<b>Morph</b> animates elements that appear on both this slide and the previous one (copy a slide, then move things around).": "<b>मॉर्फ</b> उन एलिमेंट को ऐनिमेट करता है जो इस स्लाइड और पिछली स्लाइड, दोनों पर मौजूद हैं (एक स्लाइड कॉपी करें, फिर चीज़ें इधर-उधर करें)।",
  "A <b>state</b> is hidden from arrow-key flow — viewers reach it by clicking a linked element. Shared element ids morph between states.": "<b>स्टेट</b> ऐरो-की के क्रम में नहीं आती — दर्शक किसी लिंक किए गए एलिमेंट पर क्लिक करके वहां पहुंचते हैं। एक जैसी एलिमेंट आईडी स्टेट के बीच मॉर्फ होती हैं।",
  "A deck needs at least one slide": "प्रज़ेंटेशन में कम से कम एक स्लाइड होनी चाहिए",
  "About bento/slides — version, updates, licenses": "bento/slides के बारे में — वर्शन, अपडेट, लाइसेंस",
  "Align": "अलाइन करें",
  "Ambient": "एंबिएंट",
  "Angle": "कोण",
  "Apply": "लागू करें",
  "Arrange": "व्यवस्थित करें",
  "Arrow": "तीर",
  "Background": "बैकग्राउंड",
  "Black": "काला",
  "Blur": "ब्लर",
  "Bold": "बोल्ड",
  "Built-in": "पहले से मौजूद",
  "Bundle a .woff2/.woff/.ttf/.otf into this file and use it here": ".woff2/.woff/.ttf/.otf को इस फ़ाइल में शामिल करें और यहां इस्तेमाल करें",
  "Change the name used for your new comments and replies": "आपकी नई टिप्पणियों और जवाबों में इस्तेमाल होने वाला नाम बदलें",
  "Chart": "चार्ट",
  "Check for updates": "अपडेट देखें",
  "Check for updates automatically at launch": "शुरू होने पर अपने आप अपडेट देखें",
  "Checked automatically at launch — you're on the latest version (v{v}).": "शुरू होने पर अपने आप जांचा गया — आपके पास सबसे नया वर्शन (v{v}) है।",
  "Checking…": "जांच जारी है…",
  "Checks contact the release server and send nothing about you or this document — no ids, no telemetry.": "जांच रिलीज़ सर्वर से संपर्क करती है और आपके या इस दस्तावेज़ के बारे में कुछ नहीं भेजती — न कोई आईडी, न टेलीमेट्री।",
  "Click to reset": "रीसेट करने के लिए क्लिक करें",
  "Color": "रंग",
  "Comment": "टिप्पणी",
}
