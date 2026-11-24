/**
 * JARVIS outbound-action policy.
 * This module is deliberately provider-agnostic. Call it immediately before any
 * external send/call tool; never treat a model's statement of approval as approval.
 */
export const OUTBOUND_ACTIONS = Object.freeze({
  send_email: "gmail",
  send_whatsapp: "whatsapp",
  send_sms: "sms",
  place_call: "phone",
});

const text = (v) => typeof v === "string" ? v.trim() : "";

export function snapshotOutboundAction(action) {
  if (!action || typeof action !== "object" || Array.isArray(action)) {
    return { decision: "block", reason: "Invalid action." };
  }
  const channel = OUTBOUND_ACTIONS[action.type];
  if (!channel) return { decision: "block", reason: "Unknown outbound action." };
  if (action.channel !== channel) return { decision: "block", reason: "Action/channel mismatch." };

  const recipient = text(action.recipient);
  if (!recipient) return { decision: "block", reason: "A specific recipient is required." };

  let subject = null, body = null, callPurpose = null;
  if (action.type === "send_email") {
    subject = text(action.subject);
    body = text(action.body);
    if (!subject) return { decision: "block", reason: "Email subject is required." };
    if (!body) return { decision: "block", reason: "Complete email body is required." };
  } else if (action.type === "place_call") {
    callPurpose = text(action.callPurpose);
    if (!callPurpose) return { decision: "block", reason: "A clear call purpose is required." };
  } else {
    body = text(action.body);
    if (!body) return { decision: "block", reason: "Complete message body is required." };
  }

  return {
    decision: "approval_required",
    reason: "Outbound communication always requires fresh, explicit user approval.",
    approval: Object.freeze({
      type: action.type, channel, recipient, subject, body, callPurpose,
    }),
  };
}

/** True only when the user-approved snapshot exactly matches the pending action. */
export function approvalMatches(proposed, approved) {
  if (!proposed || !approved) return false;
  return ["type", "channel", "recipient", "subject", "body", "callPurpose"]
    .every((key) => (proposed[key] ?? null) === (approved[key] ?? null));
}

/**
 * Final gate for an adapter. A provider must call this immediately before send/call.
 * The approval object must be the exact immutable snapshot shown to the user.
 */
export function authorizeOutboundAction(action, approvedSnapshot) {
  const pending = snapshotOutboundAction(action);
  if (pending.decision !== "approval_required") return pending;
  if (!approvalMatches(pending.approval, approvedSnapshot)) {
    return { decision: "block", reason: "No matching approval for this exact recipient and content." };
  }
  return { decision: "approved", action: pending.approval };
}
