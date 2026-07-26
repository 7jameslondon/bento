// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
//
// The static first-page preview: what a Bento deck looks like to something
// that renders its HTML but never runs its JavaScript.
//
// WHY THIS EXISTS. Thumbnailers — iOS Files, macOS QuickLook/Finder, the Bento
// Tray app — render HTML with scripting off. Until our runtime boots, every
// deck is the same bytes plus the same boot splash, so every deck thumbnailed
// as the same dark box. The kernel (kernel/src/save.ts) parks what we build
// here inside a `<noscript>` on every save, which is rendered by exactly that
// population and by nobody else. See that file for the placement rules, the
// encryption veto and the output-safety check.
//
// WHY IT REUSES render.ts. A second renderer would drift from the first, and
// a preview that disagrees with the deck is worse than no preview. `svgAsImage`
// (the mode sidebar thumbnails already use) does most of the static-ifying for
// free: svg elements collapse to one <img>, and media renders as a poster or
// an icon chip instead of a live <video>/<audio>. What is left is stripping the
// runtime's DOM hooks, inlining the handful of rules the (absent) runtime
// stylesheet would have supplied, and fitting 1280×720 into an unknown
// viewport without JavaScript.
//
// HOW IT SCALES. `transform: scale(calc(min(100vw, <aspect>vh) / <width>px))`.
// CSS Values 4 length-over-length division yields the plain <number> that
// scale() needs, so the whole page scales as ONE unit and every inline px the
// renderer emitted stays untouched. Measured in the real macOS thumbnailer
// (`qlmanage -t`) and pixel-exact there.
//
// WHAT DID NOT WORK, so nobody re-tries it: `<svg viewBox><foreignObject>`,
// the textbook way to fit HTML into a box. Chrome renders it correctly, and
// QuickLook's WebKit does not — absolutely-positioned children vanished and
// the content scaled non-uniformly. It is not usable for the one renderer this
// feature exists to serve.

import { renderSlide } from './render'
import { PREVIEW_BUDGET, type BentoDoc, type Slide } from './model'

/** Elements that must never reach a static preview (active or external). */
const BANNED = 'script,style,noscript,iframe,object,embed,link,video,audio,canvas,form,input,button'

/**
 * Runtime-only attributes: selection ids, morph keys, editing hooks. Dead
 * weight in a preview, and every one of them is paid for in every saved file.
 *
 * `id` is deliberately NOT on this list, however useless it looks. svg paints
 * gradients, markers and clip paths through document-global `url(#…)`
 * references, so stripping ids silently voids every fill that uses one — the
 * starter deck's tiles rendered as nothing at all until this was caught.
 * render.ts already mints those ids from a counter, so they are unique.
 */
const DROP_ATTRS = [
  'data-el-id', 'data-flip-id', 'data-slide-id', 'data-link', 'data-group',
  'data-show-on-hover', 'data-chart', 'data-table', 'data-autoplay',
  'data-r', 'data-c', 'data-sym', 'contenteditable', 'draggable', 'tabindex',
]

/**
 * Generic families appended to every inline font-family.
 *
 * `doc.fonts[]` are injected as @font-face at boot from the asset table — which
 * is to say, by JavaScript, which is not running. Embedding the font data here
 * instead would cost hundreds of KB for a thumbnail. So the preview renders in
 * a system face; a fallback chain makes that a deliberate substitution rather
 * than whatever the UA picks for an unresolvable family name (usually Times).
 */
const FONT_FALLBACK = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif`

/** Inline the rules `.bento-*` classes get from styles.css, which is compressed
 *  into a payload the preview's audience never decompresses. */
function inlineRuntimeCss(root: HTMLElement) {
  prepend(root, 'position:relative;overflow:hidden')
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('.bento-el'))) {
    prepend(el, 'position:absolute')
  }
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('.bento-el-text .bento-text-inner'))) {
    prepend(el, 'overflow-wrap:break-word')
  }
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('.bento-el-table'))) {
    prepend(el, 'overflow:visible')
  }
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('.bento-cell-inner'))) {
    prepend(el, 'min-height:1em')
  }
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('code'))) {
    prepend(el, 'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:0.9em;' +
      'background:rgb(127 127 127 / 0.16);padding:0 0.28em;border-radius:3px')
  }
}

/** Put `css` in front of the element's existing inline style (which wins). */
function prepend(el: HTMLElement, css: string) {
  const own = el.getAttribute('style') ?? ''
  el.setAttribute('style', own ? `${css};${own}` : css)
}

/**
 * Turn the live render into inert markup: drop anything active, drop the
 * runtime's hooks, and (when `keepImages` is false) drop raster payloads whose
 * data URIs would otherwise be carried twice in the file.
 */
function staticize(root: HTMLElement, doc: BentoDoc, keepImages: boolean) {
  for (const el of Array.from(root.querySelectorAll(BANNED))) el.remove()

  for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    for (const attr of Array.from(el.attributes)) {
      // on* handlers can only arrive via sanitizeHtml's allowlist (which
      // strips every attribute) or our own code, so this is defence in depth.
      if (attr.name.startsWith('on') || DROP_ATTRS.includes(attr.name)) el.removeAttribute(attr.name)
    }
    const family = el.style?.fontFamily
    if (family && !family.includes(FONT_FALLBACK)) el.style.fontFamily = `${family},${FONT_FALLBACK}`
  }

  if (!keepImages) {
    for (const img of Array.from(root.querySelectorAll<HTMLImageElement>('img'))) {
      // Keep the BOX — an empty rectangle where the photo was reads as
      // composition; removing it collapses the page into floating text.
      const tint = document.createElement('div')
      tint.setAttribute('style',
        `width:100%;height:100%;border-radius:${img.style.borderRadius || '0'};` +
        `background:linear-gradient(135deg,${doc.theme.accent}2E,${doc.theme.accent}12)`)
      img.replaceWith(tint)
    }
  }

  inlineRuntimeCss(root)
}

/** A background string safe to repeat behind the page: a flat colour repeats
 *  invisibly, a gradient or an embedded image does not (and a data: URI would
 *  be paid for twice). */
const flatBackground = (css: string) => (/url\(|gradient|data:/i.test(css) ? null : css)

/** Wrap a rendered page in the fixed, viewport-fitting overlay. */
function overlay(page: HTMLElement, doc: BentoDoc, slide: Slide): HTMLElement {
  const { width: w, height: h } = doc.size
  const surround = flatBackground(slide.background) ?? flatBackground(doc.theme.background) ?? '#0D1B2E'

  const box = document.createElement('div')
  // z-index above the splash (9999) and the loader's failure card (99999).
  box.setAttribute('style',
    `position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483000;` +
    `overflow:hidden;background:${surround}`)

  const fit = document.createElement('div')
  // Two `transform` declarations on purpose. calc() length-over-length is CSS
  // Values 4; a renderer that rejects it drops the second declaration and
  // keeps the first, showing the page centred at 1:1 (cropped, but the deck)
  // instead of nothing at all.
  const aspect = ((w / h) * 100).toFixed(4)
  fit.setAttribute('style',
    `position:absolute;left:50%;top:50%;width:${w}px;height:${h}px;` +
    `transform:translate(-50%,-50%);` +
    `transform:translate(-50%,-50%) scale(calc(min(100vw, ${aspect}vh) / ${w}px))`)

  fit.appendChild(page)
  box.appendChild(fit)
  return box
}

/** Last resort: the deck's identity in the deck's colours, a few hundred bytes. */
function titleCard(doc: BentoDoc): HTMLElement {
  const page = document.createElement('div')
  const { width: w, height: h } = doc.size
  page.setAttribute('style',
    `position:relative;overflow:hidden;width:${w}px;height:${h}px;` +
    `background:${flatBackground(doc.theme.background) ?? '#0D1B2E'};` +
    `display:flex;flex-direction:column;justify-content:center;padding:0 ${Math.round(w * 0.075)}px;` +
    `box-sizing:border-box;font-family:${FONT_FALLBACK}`)

  const rule = document.createElement('div')
  rule.setAttribute('style',
    `width:${Math.round(w * 0.07)}px;height:${Math.round(h * 0.011)}px;background:${doc.theme.accent};margin-bottom:${Math.round(h * 0.05)}px`)

  const title = document.createElement('div')
  title.setAttribute('style',
    `font-size:${Math.round(h * 0.1)}px;font-weight:800;line-height:1.1;color:${doc.theme.color};overflow-wrap:break-word`)
  title.textContent = doc.title

  page.append(rule, title)
  return page
}

const byteLength = (el: HTMLElement) => new TextEncoder().encode(el.outerHTML).length

/**
 * Build the static preview of the deck's first page, or null when there is
 * nothing to show. Registered with the kernel from main.ts.
 *
 * Three tiers, cheapest acceptable one wins, all bounded by PREVIEW_BUDGET:
 *   1. the page as it renders, images and all;
 *   2. the same page with raster payloads replaced by tinted boxes — layout
 *      and text survive, the megabytes do not;
 *   3. a title card in the deck's own colours.
 * Tier 3 cannot exceed the budget, so this always terminates with something.
 */
export function buildSlidePreview(doc: BentoDoc): HTMLElement | null {
  // The first page a reader sees: interactive states are hidden variants and
  // never open a deck.
  const slide = doc.slides.find((s) => !s.stateOf) ?? doc.slides[0]
  if (!slide) return null

  for (const keepImages of [true, false]) {
    const page = renderSlide(slide, doc, { svgAsImage: true, hidePlaceholders: true })
    staticize(page, doc, keepImages)
    if (!keepImages) page.style.background = flatBackground(slide.background) ?? doc.theme.background
    const built = overlay(page, doc, slide)
    if (byteLength(built) <= PREVIEW_BUDGET) return built
  }
  return overlay(titleCard(doc), doc, slide)
}
