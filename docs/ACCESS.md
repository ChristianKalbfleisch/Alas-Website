# Granting access

A runbook for the store owner, for bringing an agency or contractor onto this
project — and for taking them off again. Written 2026-10-21.

`docs/HANDOVER.md` is the thing the agency reads. This is the thing you do.

> **UI labels move.** Both GitHub and Shopify have renamed these screens more
> than once, and the official docs did not surface cleanly when this was
> checked. The *mechanisms* below are stable; if a menu name differs, look for
> the nearest equivalent rather than assuming the step is gone.

---

## Three systems, and which one actually unblocks the work

This is the part that surprises people. GitHub is usually **not** the
bottleneck.

| System | What it unlocks | Needed by an agency that is… |
|---|---|---|
| **GitHub** | The code, this documentation | …writing or reviewing code |
| **Vercel** | Deploying, preview URLs, the env var | …shipping anything live |
| **Shopify** | Products, prices, SEO, images, policies, discounts | …doing almost anything else |

**Run `node scripts/audit-shopify.mjs` and look at what fails.** Every one of
those failures — alt text on 17 images, SEO titles and descriptions on 8
products, the Greek handles, Mésos's 0 g weight, product types and tags — is a
**Shopify admin** job, not a code job. An agency with only GitHub access cannot
touch any of it.

The same is true of the launch blockers: the repricing, the policy pages, and
attaching products to the subscription plan all happen in Shopify.

---

## 1. GitHub

### They can already read it

The repository is **public**. Anyone with the link can clone it today:

```
git clone https://github.com/ChristianKalbfleisch/Alas-Website.git
```

If reading is all they need, **send the link and stop here.**

### If they need to push: three options

**Option A — grant nothing. They fork and open pull requests.**
They work in their own copy and request a merge; you review every change. No
access granted, nothing to revoke, and you keep the final say. Best when the
relationship is new.

**Option B — add them as a collaborator.**

1. Repository → **Settings**
2. **Collaborators**, under "Access"
3. **Add people**
4. Their GitHub username or email
5. They receive an invitation and must accept it

**The catch, and it is not a small one.** A repository owned by a personal
account has exactly two levels: owner and collaborator — and **collaborator
means write access.** You cannot grant read-only, and you cannot grant anything
between. GitHub's own documentation is explicit that collaborators can't have
read-only access to repositories owned by a personal account. The granular
Read / Triage / Write / Maintain / Admin ladder exists **only on organization
repositories.**

**Option C — move the repository into a free GitHub Organization.** The right
answer if more than one person will touch this.

1. Create an organization (free tier is fine)
2. Repository → **Settings** → **General** → **Danger Zone** → **Transfer**
3. Transfer into the organization
4. Invite the agency with the **Write** role, keeping **Admin** to yourself

They can then push and review but cannot delete the repository, change its
visibility, or remove other people. History, issues and open pull requests all
come across, and GitHub redirects the old URL.

### Two things to settle before granting write access

**The default branch is `claude/new-session-1byzeh`, not `main`.** Vercel's
production branch defaults to the repository's default branch, so once Vercel
is connected, **anyone with write access can push straight to production with
no review.** Fix the order first: merge the open pull request so `main` holds
the current site, make `main` the default, then **Settings → Branches → Add
rule** to require a pull request before merging.

**The repository is public, and that includes these documents.**
`docs/HANDOVER.md` states plainly which figures contradict each other and which
product images are AI-generated. All true, all useful to the agency — and all
readable by competitors. **Settings → General → Danger Zone → Change
visibility** makes it private; the agency then needs Option B or C to see it at
all.

---

## 2. Vercel

Nothing is deployed yet, so this starts with you creating the project.

1. Sign up at vercel.com and **Add New → Project**, importing this repository
2. Set one environment variable: `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`, copied
   from Shopify admin → Sales channels → Headless
3. Deploy. You get a `*.vercel.app` URL immediately
4. To add the agency: Vercel → your team → **Members** → invite

A Vercel invitation is separate from GitHub. Someone can hold one without the
other.

---

## 3. Shopify — the one that matters most

Two mechanisms, and for an agency the second is the right one.

### Preferred: a collaborator account

Collaborator accounts exist specifically for Shopify Partners — agencies,
freelancers, developers. They are better than staff accounts here because they
**do not consume a staff seat** on your plan, they are requested by the agency
rather than created by you, and they are revoked independently.

**The agency initiates it.** They need your store URL
(`alassaltco.myshopify.com`) and, if you have one set, your **collaborator
request code**.

1. Find your collaborator request code: **Settings → Users and permissions**,
   in the Collaborators area. Send it to the agency
2. They go to their Partner Dashboard → **Stores → Add store → Request access**,
   enter the store URL and the code, choose the permissions they need, submit
3. The request appears for you under **Settings → Users and permissions**
4. **Review the permissions they asked for, and reduce them before approving.**
   This is the step people skip. Approve or reject

### Alternative: a staff account

If the agency is not a Shopify Partner, a staff account is the fallback.

1. **Settings → Users and permissions** (newer admin may label it just "Users")
2. **Add staff**
3. Name and email
4. **Choose a custom role, not "Full permissions."** Select only what they need

### What to withhold, either way

- **Leave "View billing and finances" off.** This is the main gate on revenue
  and tax data
- **Product cost is a separate permission from viewing products.** If you do
  not want COGS visible, check that one specifically — it is easy to miss
- **The Home page can still show sales figures** to staff without finance
  access. Worth knowing before you assume numbers are hidden
- **The payments account stays with the store owner** regardless of what you
  grant, so nobody can redirect payouts
- Require two-step authentication on any account that can reach settings

Plan staff limits differ by plan and the published numbers conflict between
sources — check your own admin rather than trusting a figure from a blog. This
is another reason to prefer a collaborator account, which sidesteps the limit.

---

## Never share

- **An Admin API token.** It must never be in this repository, in any client
  bundle, or pasted into a chat. The Storefront token is public by design and
  safe in client code; the Admin token is not
- **The store owner login.** Grant access as themselves, so the audit trail
  names a person
- Payment or payout credentials, under any circumstances

---

## Offboarding — do this when the engagement ends

Easy to forget, and the reason access creeps.

- [ ] **GitHub:** Settings → Collaborators → remove. Or, in an organization,
      remove them from the team
- [ ] **Vercel:** team → Members → remove
- [ ] **Shopify:** Settings → Users and permissions → revoke the collaborator
      or deactivate the staff account
- [ ] **Rotate the Storefront token.** They will have seen it in Vercel's
      environment variables. It lives in
      `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` precisely so it can be rotated
      without a code change: issue a new one in Shopify admin → Sales channels
      → Headless, update it in Vercel, redeploy
- [ ] Revoke any app or private app they installed
- [ ] If they had a Vercel or GitHub personal access token for CI, revoke that
      too
