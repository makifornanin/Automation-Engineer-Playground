import { DARK_MEDIA_QUERY, THEME_STORAGE_KEY } from "@/lib/theme/theme";

/**
 * No-flash theme script.
 *
 * This MUST be a blocking inline <script> in <head>. `next/script` — including
 * strategy="beforeInteractive" — runs too late and the learner sees a white
 * flash before a dark paint. It sets `data-theme` and `color-scheme` before the
 * first paint, so tokens, native scrollbars and form controls are correct from
 * frame one.
 *
 * If anything throws (blocked site data, no matchMedia), no attribute is set
 * and the `prefers-color-scheme` fallback in globals.css takes over.
 */
const themeScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var p=null;try{p=window.localStorage.getItem(k)}catch(e){}
if(p!=="light"&&p!=="dark"&&p!=="system"){p="system"}
var dark=p==="dark"||(p==="system"&&typeof window.matchMedia==="function"&&window.matchMedia(${JSON.stringify(DARK_MEDIA_QUERY)}).matches);
var t=dark?"dark":"light";var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t}catch(e){}})();`;

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      suppressHydrationWarning
    />
  );
}
