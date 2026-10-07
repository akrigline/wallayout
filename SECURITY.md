# Security Policy

wallayout is a client-side, static web application. It has no backend, no accounts,
and no server-side storage; plans live in the browser's localStorage. The practical
attack surface is the client code itself (e.g. XSS through frame names, or unsafe
handling of pasted `GWP1:` plan codes).

## Reporting a vulnerability

Please report security issues privately via
[GitHub's private vulnerability reporting](https://github.com/akrigline/wallayout/security/advisories/new)
rather than a public issue. Include steps to reproduce and the browser/OS if relevant.
