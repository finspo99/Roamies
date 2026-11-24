import assert from "node:assert/strict";
import { test } from "node:test";
import { snapshotOutboundAction, approvalMatches, authorizeOutboundAction } from "./policy.mjs";

const email = { type:"send_email", channel:"gmail", recipient:"person@example.com", subject:"Hello", body:"Are you free?" };

test("all outbound actions require approval", () => {
  for (const action of [
    email,
    { type:"send_whatsapp", channel:"whatsapp", recipient:"+447700900000", body:"Hi" },
    { type:"send_sms", channel:"sms", recipient:"+447700900000", body:"Hi" },
    { type:"place_call", channel:"phone", recipient:"+447700900000", callPurpose:"Ask about appointment" },
  ]) assert.equal(snapshotOutboundAction(action).decision, "approval_required");
});

test("rejects unknown actions, mismatched channels and missing recipients", () => {
  assert.equal(snapshotOutboundAction({type:"transfer_money",channel:"bank",recipient:"x"}).decision,"block");
  assert.equal(snapshotOutboundAction({...email,channel:"whatsapp"}).decision,"block");
  assert.equal(snapshotOutboundAction({...email,recipient:" "}).decision,"block");
});

test("email needs both a subject and a body", () => {
  assert.equal(snapshotOutboundAction({...email,subject:" "}).decision,"block");
  assert.equal(snapshotOutboundAction({...email,body:" "}).decision,"block");
});

test("calls need a purpose and phone channel", () => {
  assert.equal(snapshotOutboundAction({type:"place_call",channel:"phone",recipient:"123"}).decision,"block");
  assert.equal(snapshotOutboundAction({type:"place_call",channel:"sms",recipient:"123",callPurpose:"x"}).decision,"block");
});

test("approval is bound to exact recipient and content", () => {
  const pending = snapshotOutboundAction(email);
  assert.equal(authorizeOutboundAction(email,pending.approval).decision,"approved");
  assert.equal(approvalMatches({...pending.approval,body:"Changed"},pending.approval),false);
  assert.equal(authorizeOutboundAction({...email,recipient:"other@example.com"},pending.approval).decision,"block");
  assert.equal(authorizeOutboundAction({...email,body:"Different message"},pending.approval).decision,"block");
  assert.equal(authorizeOutboundAction(email,null).decision,"block");
});

test("does not accept malformed input", () => {
  assert.equal(snapshotOutboundAction(null).decision,"block");
  assert.equal(snapshotOutboundAction([]).decision,"block");
});
