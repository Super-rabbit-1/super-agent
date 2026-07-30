# Browser target policy

Treat every browser destination as an exact origin decision: scheme, host, and port.

## Default policy

- Allow local development origins: `http://localhost`, `https://localhost`, `http://127.0.0.1`, and equivalent loopback ports.
- Allow an external origin only when the user gave it in the current task or explicitly approved it.
- Treat redirect destinations, identity-provider pages, popup windows, and cross-origin frames as new destinations.
- Keep the task's allowed origins narrow. Do not infer that approving `example.com` approves `admin.example.com`, `api.example.com`, or third-party identity providers.

## Persistent defaults

Use `BROWSER_ALLOWED_DOMAINS` only for exact hosts the user has deliberately approved across tasks, for example:

```text
BROWSER_ALLOWED_DOMAINS=github.com,open.feishu.cn
```

Do not add a host to persistent defaults merely because it appeared in a redirect or an error message. Never place credentials, bearer tokens, or full URLs with query parameters in this variable.

## Sensitive destinations

Treat payment processors, SSO providers, admin consoles, cloud dashboards, production consoles, and password-manager pages as sensitive even if their host is allowlisted. Confirm the intended action before a state-changing interaction.
