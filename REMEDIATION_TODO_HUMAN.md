# 🔴 ROTATE NOW (cannot be done by the agent)

**Do this BEFORE merging this PR:**

1. **Supabase Service Role Key** — Regenerate in Supabase Dashboard → Project Settings → API
2. **Supabase Anon Key** — Regenerate alongside the service role key
3. **Gemini API Key** — Rotate in Google AI Studio
4. **VAPID Key Pair** — Regenerate via `npx web-push generate-vapid-keys`

5. **Delete the old `fix/security-remediation` branch** — It has diverged 25+ commits behind main and its changes are superseded by this remediation.

6. **Stripe Webhook** — Register webhook endpoint in Stripe Dashboard pointing to `https://flore.jo/api/payment/stripe/webhook` after deployment. Add the webhook secret to `STRIPE_WEBHOOK_SECRET` env var.

7. **CliQ Webhook Secret** — Obtain webhook signing secret from CliQ merchant dashboard and add to `CLIQ_WEBHOOK_SECRET` env var.

8. **GitHub Actions PAT Scope** — If CI workflow fails with PAT permission errors, check repository Settings → Actions → General → Workflow permissions.