# Infrastructure & Configuration

## CORS & CSRF Strategy
The system uses a strict allowlist approach for Cross-Origin Resource Sharing and Cross-Site Request Forgery protection.

- **CORS Allowed Origins**:
  - Production: `https://coastal-web.onrender.com`, `https://coastal-project.onrender.com`
  - Development (Debug=True): `http://localhost:3000`, `http://127.0.0.1:3000`
- **CSRF Protection**:
  - `CSRF_TRUSTED_ORIGINS`: Matches CORS origins + dynamic Render subdomains (`https://*.onrender.com`).
  - **Cookies**: `SameSite=Lax` (Strict for Prod), `Secure=True` (HTTPS only), `HttpOnly=True`.

## Redis & Caching Architecture
Redis is the backbone for async operations and caching in production.

- **Broker URL**: Configured via `REDIS_URL` env variable.
- **Channel Layers (`daphne`)**:
  - Uses `channels_redis` for WebSocket message distribution (Chat, Real-time notifications).
  - Fallback: `InMemoryChannelLayer` for local dev if Redis is absent.
- **Celery Task Queue**:
  - **Enabled**: Only if `REDIS_URL` is present.
  - **Tasks**: Async email sending, PDF generation, Heavy reports.

## API Throttling (Rate Limiting)
To prevent abuse, `rest_framework.throttling` is configured globally:

| Scope | Rate | Purpose |
|-------|------|---------|
| `anon` | 100/hour | Prevent scraping by bots |
| `user` | 1000/hour | Standard user activity |
| `login` | **5/5min** | Anti-brute force protection |
| `otp_verify` | **3/5min** | Prevent OTP guessing |
| `token_refresh` | 10/min | Limit session extension attacks |

## External Services
- **SMS Gateway**: `Sendexa` (Configured via `SENDEXA_API_KEY`, `SENDEXA_SENDER_ID`).
- **Monitoring**:
  - **Sentry**: Error tracking (Enabled if `SENTRY_DSN` set).
  - **Prometheus**: Metrics middleware (`django_prometheus`) for Grafana/monitoring.
