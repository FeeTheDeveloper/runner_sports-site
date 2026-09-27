# Clerk production activation runbook

Production sign-in shows **"Sign-in is temporarily unavailable"** whenever
`getClerkConfigurationState()` (`lib/auth/config.ts`) returns anything other than
`configured`. In that state the Clerk provider, `<SignIn>`/`<SignUp>`, and the
Clerk middleware are all bypassed, and protected routes redirect to `/sign-in`.

## Check the current state (no login required)

```
GET https://www.werunsportsandanalytics.com/api/health
→ { "data": { "status": "ok", "identity": "<state>", ... } }
```

`identity` returns the state name only. It never contains key material or hostnames.

| `identity` | Meaning | Fix |
|---|---|---|
| `missing` | The running deployment lacks `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY` | Add both in Vercel for this environment, then **redeploy** |
| `unverified_instance` | `CLERK_EXPECTED_FRONTEND_API` is absent or not a hostname | Set it to the instance's Frontend API hostname, then redeploy |
| `invalid_keys` | The key format is wrong (it must be `pk_(test\|live)_…` / `sk_(test\|live)_…`) | Re-copy the keys from Clerk → API Keys |
| `mode_mismatch` | One key is `test` and the other is `live` | Use both keys from the same instance |
| `instance_mismatch` | The publishable key belongs to a different instance than `CLERK_EXPECTED_FRONTEND_API` | Align the key and the hostname (see below) |
| `configured` | The format check and instance binding pass | Continue with the acceptance check below |

## Activation steps

1. **Clerk (production instance).** Clerk → Domains: the production domain is
   `werunsportsandanalytics.com`. The Frontend API hostname is shown there
   (normally `clerk.werunsportsandanalytics.com`). Paths: sign-in `/sign-in`,
   sign-up `/sign-up`.
2. **Cloudflare DNS.** Add every CNAME that Clerk → Domains lists (`clerk`,
   `accounts`, `clkmail`, `clk._domainkey`, `clk2._domainkey`) exactly as shown.
   Set each one to **DNS only (grey cloud)**. A proxied (orange cloud) record breaks
   Clerk's certificate issuance and the Frontend API. Wait for Clerk to mark
   DNS and SSL as verified.
3. **Vercel env (project `runner-sports-site`, Production).**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: the `pk_live_…` key of that instance
   - `CLERK_SECRET_KEY`: the `sk_live_…` key of the **same** instance
   - `CLERK_EXPECTED_FRONTEND_API`: the Frontend API hostname from step 1
     (no scheme, no path)

   These are production-only today, so preview deployments always report
   `missing`. Add test-instance values scoped to Preview if previews need sign-in.
4. **Redeploy.** Vercel snapshots env vars when a deployment is built, and
   `NEXT_PUBLIC_*` values are inlined into the client bundle at build time.
   Adding or changing a variable does nothing until a new production
   deployment is built.
5. **Verify.** `/api/health` reports `identity: "configured"`. `/sign-in`
   renders the Clerk form. Signing in lands on `/picks`. An admin listed in
   `RUNNER_ADMIN_BOOTSTRAP_EMAILS` (with a verified primary email) can open
   `/admin/operations`.

## Related dependencies

- A signed-in user's entitlement also reads the Supabase billing mirror and the
  manual grants (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_EXPECTED_PROJECT_REF`) and the Stripe binding
  (`STRIPE_EXPECTED_ACCOUNT_ID`, `STRIPE_BILLING_MODE`). If these are missing,
  sign-in still works but paid access resolves to `free` with
  `billingState: "unavailable"`.
- A Clerk API failure during `currentUser()`, for example a secret key issued by a
  different instance, degrades to public access and logs
  `Runner identity lookup failed <ErrorName>`. It no longer crashes the root layout.
