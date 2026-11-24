# JARVIS foundation for Roamies

This folder adds the JARVIS behaviour profile and a provider-independent approval policy to the Roamies Node sidecar.

## Tests

From `showcase/tauri/sidecar`:

```sh
node --test jarvis/policy.test.mjs
```

## Integration boundary

The policy is not a mail or messaging provider and does not send anything. Each future Gmail, WhatsApp, SMS or calling adapter must call `snapshotOutboundAction` to prepare a pending action and `authorizeOutboundAction` immediately before the provider's send/call operation. The approval snapshot must be the exact object presented to the user. Never wire an adapter that bypasses this check.

The next integration step is to attach this profile to Roamies' agent prompt and route connected-app outbound tools through this policy. No external accounts are connected by this change.
