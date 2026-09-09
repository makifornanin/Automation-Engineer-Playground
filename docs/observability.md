# AEP Observability Standard

## Purpose

AEP uses structured execution logs so learners can understand what happened inside an automation without relying only on raw n8n execution history.

The future AEP website will render these records as an execution timeline.

## Standard Log Contract

Each log record can contain:

- workflow_name
- execution_id
- event_id
- status
- stage
- error_message
- retry_count
- recovered
- metadata
- logged_at

## Example

```json
{
  "workflow_name": "AEP Lab 08 - Dead Letter Queue & Failure Recovery",
  "execution_id": "3945",
  "event_id": "evt_observe_003",
  "status": "recovered",
  "stage": "recovery_completed",
  "error_message": null,
  "retry_count": 3,
  "recovered": true
}