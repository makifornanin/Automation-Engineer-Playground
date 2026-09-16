import {
  assertNeverBlock,
  type CalloutTone,
  type ContentBlock,
  type LessonAction,
} from "@/lib/lesson/types";

const CALLOUT_CLASS: Record<CalloutTone, string> = {
  note: "border-line bg-surface-sunken",
  warning: "border-line-strong bg-surface-sunken",
  gotcha: "border-accent-soft bg-accent-soft",
};

/**
 * A fenced value the learner copies. Rendered in a scroll container rather
 * than wrapped: an n8n expression broken across lines is easy to mis-copy, and
 * the horizontal scroll is confined here so the page body never scrolls.
 */
export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <figure className="flex flex-col gap-1">
      <pre className="overflow-x-auto rounded-card border border-line bg-surface-sunken p-3 text-sm">
        <code className="font-mono text-ink">{code}</code>
      </pre>
      {caption ? <figcaption className="text-sm text-ink-muted">{caption}</figcaption> : null}
    </figure>
  );
}

/**
 * The ordered steps of a chunk. `expect` gets its own line because "what you
 * should see" is the part that turns an instruction into something the learner
 * can check for themselves.
 */
export function ActionList({ items }: { items: readonly LessonAction[] }) {
  return (
    <ol className="flex list-decimal flex-col gap-4 pl-5 marker:text-ink-muted">
      {items.map((action, index) => (
        <li key={index} className="flex flex-col gap-2 pl-1">
          <p className="max-w-prose text-ink-soft">{action.text}</p>
          {action.code ? <CodeBlock code={action.code.code} /> : null}
          {action.expect ? (
            <p className="text-sm text-ink-muted">
              <span className="font-medium text-ink">You should see: </span>
              {action.expect}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "prose":
      return <p className="max-w-prose text-ink-soft">{block.text}</p>;

    case "callout":
      return (
        <aside className={`flex flex-col gap-1 rounded-card border p-4 ${CALLOUT_CLASS[block.tone]}`}>
          {block.title ? <p className="text-sm font-medium text-ink">{block.title}</p> : null}
          <p className="max-w-prose text-sm text-ink-soft">{block.text}</p>
        </aside>
      );

    case "code":
      return <CodeBlock code={block.code} caption={block.caption} />;

    /*
     * The ASCII itself is hidden from assistive tech and `alt` carries the
     * meaning: a diagram read out character by character is noise, and the
     * description is the only thing that makes it comprehensible aloud.
     */
    case "diagram":
      return (
        <pre
          role="img"
          aria-label={block.alt}
          className="overflow-x-auto rounded-card border border-line bg-surface-sunken p-3 text-sm"
        >
          <code aria-hidden className="font-mono text-ink-soft">
            {block.ascii}
          </code>
        </pre>
      );

    case "actions":
      return <ActionList items={block.items} />;

    default:
      return assertNeverBlock(block);
  }
}

/**
 * Renders a chunk's content blocks in order. The switch is exhaustive: adding
 * a `ContentBlock` member without a renderer arm is a compile error at
 * `assertNeverBlock`, not a silently missing paragraph.
 */
export function ContentBlocks({ blocks }: { blocks: readonly ContentBlock[] }) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}
