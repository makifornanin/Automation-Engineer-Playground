import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageTransition } from "./PageTransition";

/**
 * The server render wraps every app route. If it emitted `opacity: 0` the page
 * would parse invisible and stay invisible until hydration — and forever with
 * JavaScript disabled.
 */
describe("<PageTransition /> server render", () => {
  const html = renderToStaticMarkup(
    <PageTransition>
      <p>Lesson content</p>
    </PageTransition>,
  );

  it("renders its children", () => {
    expect(html).toContain("Lesson content");
  });

  it("does not hide the page with opacity:0", () => {
    expect(html).not.toMatch(/opacity:\s*0(?![.\d])/);
  });

  it("does not offset the page with a transform", () => {
    expect(html).not.toContain("transform");
    expect(html).not.toContain("page-switch-ready");
  });
});
