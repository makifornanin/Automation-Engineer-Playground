/** Conceptual paths, shown only on the public problem step; never challenge answers. */
const PATHS: Record<string, readonly string[]> = {
  "01": ["Lead form", "Map and clean fields", "CRM-ready record"],
  "02": ["Incoming prospect", "Check the conditions", "Route to the right team"],
  "03": ["Client request", "Webhook → workflow", "Response to the client"],
  "04": ["Untrusted input", "Validate → normalize", "Accept or reject"],
  "05": ["Request a page", "Collect records → follow cursor", "Stop when there is no next page"],
  "06": ["Request fails", "Wait → retry with a limit", "Recover or report the failure"],
  "07": ["Event arrives again", "Check its identity", "Process once"],
  "08": ["Retries exhausted", "Preserve the failed event", "Investigate → replay safely"],
  "09": ["AI returns a response", "Parse → validate the structure", "Use only valid output"],
  "10": ["AI recommends an action", "Policy and approval checks", "Safe action or human review"],
};

export function WorkflowOverview({ labSlug }: { labSlug: string }) {
  const nodes = PATHS[labSlug.slice(0, 2)];
  if (!nodes) return null;
  return (
    <figure className="workflow-overview">
      <p className="lesson-eyebrow">The system you are building</p>
      <ol className="workflow-nodes">
        {nodes.map((node) => <li key={node} className="workflow-node">{node}</li>)}
      </ol>
      <figcaption>Follow the data. Each step has a job.</figcaption>
    </figure>
  );
}
