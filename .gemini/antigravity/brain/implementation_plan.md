# [Production Stabilization] Proxy and Hostname Configuration

Resolve 400 Bad Requests on Render and silence "IP Spoofing" warnings caused by strict proxy IP validation.

## Proposed Changes

### [Backend]

#### [MODIFY] [settings.py](file:///e:/coastal/banking_backend/config/settings.py)
- Automatically append `RENDER_EXTERNAL_HOSTNAME` to `ALLOWED_HOSTS` if it exists.
- Add `*.onrender.com` to `ALLOWED_HOSTS` as a fallback.
- Update `TRUSTED_PROXIES` to include Render's internal network or allow an "ignore" flag for cloud environments.

#### [MODIFY] [models.py](file:///e:/coastal/banking_backend/users/models.py)
- Add `staff_number = models.PositiveIntegerField(null=True, blank=True, unique=True)` to track the sequential part of the staff ID. This allows for efficient sorting and filtering without compromising the encryption of the final `staff_id`.

#### [MODIFY] [signals.py](file:///e:/coastal/banking_backend/users/signals.py)
- Refactor `generate_staff_id` to use `staff_number` for querying the latest sequence.
- Remove redundant/incompatible ORM filters on the `staff_id` property.
- Update `save(update_fields=...)` to use actual database fields (`staff_number`, `staff_id_encrypted`, `staff_id_hash`).
- Replace duplicated `get_client_ip` logic with `SecurityService.get_client_ip`.

#### [MODIFY] [security.py](file:///e:/coastal/banking_backend/users/security.py)
- Refactor `get_client_ip` to handle multiple proxy hops.
- Relax the "IP Spoofing" warning if `remote_addr` is known to be a proxy or if the system is configured to trust the `X-Forwarded-For` header (Standard for Render/Heroku/AWS).
- Support CIDR matching for `TRUSTED_PROXIES` if possible, or provide a simple bypass.

## Verification Plan

### Automated Tests
- Verification is difficult in local dev as it requires proxy simulation.
- Will rely on manual verification by the user after deployment.

### Manual Verification
- User to deploy and check Render logs for the absence of "IP Spoofing attempt detected" warnings and successful 200 responses on the login endpoint.
