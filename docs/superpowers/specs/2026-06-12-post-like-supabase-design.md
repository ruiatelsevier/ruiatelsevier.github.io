# Post Like Button With Supabase

## Goal

Add a lightweight thumbs-up like feature to every post page. Each post shows a like button and the shared total like count at the bottom of the article. Visitors do not need to log in. One browser can like a post once, tracked with `localStorage`.

## Confirmed Decisions

- Use Supabase as the external shared counter store.
- Use the frontend Supabase JavaScript client to call a Postgres RPC function.
- Do not require login.
- Use `localStorage` only to prevent ordinary repeat likes from the same browser.
- Use the visual treatment with a small thumbs-up icon, the text `Like` or `Liked`, and the count.
- Use the site's existing Font Awesome assets. Do not add a new icon library.

## Out of Scope

- Strong anti-abuse controls.
- User identity, login, or account-linked likes.
- Unlike or undo behavior.
- Comments, reactions beyond a single thumbs-up, or per-user analytics.
- A custom backend, Supabase Edge Function, or GitHub-based reactions.

## Page Component

Add a post-only component near the end of `_layouts/single.html`, after the article body and before taxonomy, share links, and post pagination.

The component renders only for posts. It should not appear on pages, publications, CV pages, or other collections unless explicitly enabled later.

Default visual state:

```text
[thumbs-up icon] Like 24
```

Liked visual state:

```text
[thumbs-up icon] Liked 25
```

The button has an accessible label such as `Like this post`. The visible text remains concise. Styling should match the current site palette: neutral background, warm accent color, restrained border, and no decorative effects that distract from reading.

## Supabase Schema

Create one table:

```sql
create table public.post_likes (
  post_slug text primary key,
  like_count integer not null default 0,
  updated_at timestamptz not null default now()
);
```

Use the Jekyll `page.url` value as `post_slug`, for example:

```text
/posts/2026/06/agent-harness/
```

This gives stable, human-readable keys and avoids adding per-post front matter.

## Supabase Function

Create one RPC function:

```sql
increment_post_like(slug text) returns integer
```

Behavior:

- If no row exists for `slug`, insert one with `like_count = 1`.
- If a row exists, atomically increment `like_count`.
- Update `updated_at`.
- Return the latest `like_count`.

The frontend must call this function instead of reading a count and writing it back. That avoids lost updates when two visitors like the same post at the same time.

## Permissions And RLS

Enable Row Level Security on `public.post_likes`.

Policies and grants should enforce this model:

- Anonymous clients can `select` rows from `post_likes`.
- Anonymous clients cannot directly `insert`, `update`, or `delete` rows.
- Anonymous clients can execute only the `increment_post_like(slug text)` function.
- No Supabase `service_role` key appears in repository files or browser JavaScript.

The browser may use the Supabase project URL and anon public key. These values are still configuration, not secrets.

## Frontend Data Flow

On page load:

1. Read the current post slug from a data attribute rendered by Jekyll.
2. Query `post_likes` for the matching `post_slug`.
3. If no row exists, display `0`.
4. Check `localStorage` key `post-like:<slug>`.
5. If the local key exists, render the button as `Liked` and do not allow another increment.

On click:

1. If the local key exists, do nothing.
2. Disable the button while the request is in flight.
3. Call `supabase.rpc("increment_post_like", { slug })`.
4. On success, update the displayed count, write `post-like:<slug>` to `localStorage`, and render `Liked`.
5. On failure, re-enable the button and show a short inline status such as `Could not save like.`

## Failure Behavior

Reading the article must never depend on Supabase.

If Supabase cannot load or the count query fails:

- Keep the article content unchanged.
- Show the button with `--` for the count or hide the count.
- If a click fails, keep the local liked state unchanged and show a short status message.

If JavaScript is disabled:

- The article remains readable.
- The like feature may be absent or inert.

## Files To Change During Implementation

Expected implementation scope:

- Add `_includes/post-like.html`.
- Add `assets/js/post-like.js`.
- Modify `_layouts/single.html` to render `_includes/post-like.html` for posts immediately after the article content section.
- Modify `_includes/scripts.html` to load the Supabase client and `assets/js/post-like.js` only on post pages when post likes are enabled.
- Modify `_sass/_page.scss` for the button styling.
- Add `docs/supabase-post-likes.sql` with the setup SQL.
- Add a small public config block in `_config.yml`:

```yaml
post_likes:
  enabled: false
  supabase_url:
  supabase_anon_key:
```

The implementation should render the component only when `post_likes.enabled`, `post_likes.supabase_url`, and `post_likes.supabase_anon_key` are all present. This keeps the site buildable before Supabase is configured.

Do not change unrelated homepage, CV, publication, navigation, or content files.

## Verification

Build:

- Run `bundle exec jekyll build`.

Browser checks:

- Open at least one post page.
- Confirm the like component appears after the article body and before tags/share/pagination.
- Confirm it does not appear on the homepage or ordinary pages.
- Confirm desktop and mobile layouts remain readable.

Behavior checks with a configured Supabase project or a controlled test project:

- Initial load displays the stored count.
- A first click increments the count and changes the button to `Liked`.
- A refresh keeps the button in the `Liked` state through `localStorage`.
- A second click from the same browser does not increment again.
- A simulated Supabase failure does not break article reading and shows a short failure status.

Security checks:

- Confirm no `service_role` key is present in committed files.
- Confirm anonymous clients cannot directly update `post_likes`.
- Confirm anonymous clients can read counts and call only the increment RPC.
