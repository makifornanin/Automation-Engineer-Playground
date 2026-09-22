import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionList, CodeBlock, ContentBlocks } from "./ContentBlocks";

describe("lesson workspace content", () => {
  it("renders an explicitly linear diagram as connected nodes with its description", () => {
    render(<ContentBlocks blocks={[{ type: "diagram", ascii: "Input\n  |\nTransform\n  |\nOutput", alt: "Input flows through Transform to Output." }]} />);
    const diagram = screen.getByRole("img", { name: "Input flows through Transform to Output." });
    expect(diagram.querySelectorAll(".workflow-node")).toHaveLength(3);
  });
  it("labels code without changing whitespace or the value to copy", () => {
    const code = 'const value = {\n  name: "Ada"\n};';
    render(<CodeBlock code={code} caption="Transform the input" />);
    expect(screen.getByText("Transform the input")).toBeVisible();
    expect(document.querySelector("code")?.textContent).toBe(code);
  });
  it("keeps the expected observation with its build instruction", () => {
    render(<ActionList items={[{ text: "Execute the node.", expect: "One item appears." }]} />);
    expect(screen.getByText(/One item appears/)).toBeVisible();
  });
  it("keeps a debug answer behind a closed disclosure", () => {
    render(<ActionList variant="questions" items={[{ text: "Which field is missing?", expect: "The email field." }]} />);
    const answer = screen.getByText("The email field.");
    expect(answer.closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Check your answer")).toBeVisible();
  });
});
