# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions of the EcoTracker Carbon Footprint Awareness Platform:

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

We take the security of the EcoTracker platform seriously. If you identify any security vulnerability, please do not report it publicly. Instead, follow the process below to report it to the development team:

1. **Email Reports**: Send a detailed description of the vulnerability to [security@ecotracker-awareness.org](mailto:security@ecotracker-awareness.org).
2. **Details to Include**:
   - The type of issue (e.g., buffer overflow, SQL injection, XSS, etc.)
   - Paths/endpoints affected
   - Step-by-step instructions or proof of concept (PoC) to reproduce the issue
   - Potential impact of the vulnerability
3. **Response Time**: We will acknowledge receipt of your report within 24 hours and aim to provide a detailed resolution plan within 3 business days.

## Security Best Practices Implemented

This project incorporates the following security practices:
- **Dependency Sandboxing**: All third-party packages are pinned to secure versions, with automated audits to prevent CVE exploits.
- **CSRF Defense**: Double-submit signed cookies to safeguard state-modifying requests.
- **XSS Mitigation**: Contextual input sanitization of all incoming payloads.
- **Data Protection**: Strict cryptographic password hashing using `bcryptjs` (12 rounds) and short JWT session lifetimes (2 hours).
- **Hardened HTTP Headers**: Implements comprehensive security policies using `helmet` (CSP, frame options, HSTS, Referrer Policy) and custom policies.
- **Rate Limiting**: Defends API routes against brute-force attacks and denial-of-service (DoS) attempts.
