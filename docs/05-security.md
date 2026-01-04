# Security Architecture

## Layers of Defense
1.  **Transport Layer**:
    - **HSTS**: Enforced strictly (`max-age=31536000`).
    - **HTTPS**: Required for all production traffic.
2.  **Application Layer (Backend)**:
    - **CSP**: Strict `Content-Security-Policy` preventing unsafe inline scripts.
    - **Throttling**: Rate limiting on sensitive endpoints (Login: 5/5min).
    - **Input Validation**: Strict serializers and file extension validators.
3.  **Authentication**:
    - **JWT**: Stateless auth with short-lived access tokens.
    - **Cookies**: `HttpOnly`, `Secure`, `SameSite=Lax/None`.
4.  **Database**:
    - **Partitioning**: Logic prepared for high-volume tables.
    - **Validation**: File upload validation at the model level to prevent RCE.

## Compliance
- **OWASP Top 10**: Mitigated (Injection, Broken Access Control, Logging).
- **Audit Logs**: Critical actions (Money movement, Role changes) are logged.
