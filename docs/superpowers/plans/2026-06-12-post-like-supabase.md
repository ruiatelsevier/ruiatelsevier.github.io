# Post Like Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a post-only thumbs-up like button backed by Supabase shared counts, with one like per browser through `localStorage`.

**Architecture:** Jekyll renders a small post footer include only when post likes are enabled and configured. Browser JavaScript reads the current post slug, fetches the count from Supabase, calls an RPC function for atomic increments, and stores a local liked marker. Supabase owns persistence and permissions through a table, RLS policies, and a single increment function.

**Tech Stack:** Jekyll/Liquid, SCSS, vanilla JavaScript, Supabase JavaScript client, Supabase Postgres/RLS.

---

## File Structure

- `_config.yml`: add public `post_likes` configuration with `enabled`, `supabase_url`, and `supabase_anon_key`.
- `_includes/post-like.html`: render the post footer button markup and data attributes.
- `_layouts/single.html`: include `post-like.html` immediately after post content, before taxonomy/share/pagination.
- `_includes/scripts.html`: conditionally load Supabase JS CDN and `assets/js/post-like.js` only on configured post pages.
- `assets/js/post-like.js`: initialize all post-like widgets, fetch counts, handle click, call RPC, update state, and handle failures.
- `_sass/_page.scss`: add restrained styles for the post-like component.
- `docs/supabase-post-likes.sql`: provide the Supabase setup SQL for table, function, grants, and RLS policies.

Do not touch unrelated content files, homepage sections, publications, CV pages, or existing user-modified files outside this scope.

## Task 1: Add Supabase Setup SQL

**Files:**
- Create: `docs/supabase-post-likes.sql`

- [ ] **Step 1: Add the SQL setup document**

Create `docs/supabase-post-likes.sql` with:

```sql
create table if not exists public.post_likes (
  post_slug text primary key,
  like_count integer not null default 0 check (like_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.post_likes enable row level security;

create or replace function public.increment_post_like(slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  if slug is null or length(trim(slug)) = 0 then
    raise exception 'slug is required';
  end if;

  insert into public.post_likes (post_slug, like_count, updated_at)
  values (slug, 1, now())
  on conflict (post_slug)
  do update set
    like_count = public.post_likes.like_count + 1,
    updated_at = now()
  returning like_count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_post_like(text) from public;
grant execute on function public.increment_post_like(text) to anon;

drop policy if exists "Public can read post likes" on public.post_likes;
create policy "Public can read post likes"
on public.post_likes
for select
to anon
using (true);

revoke insert, update, delete on public.post_likes from anon;
grant select on public.post_likes to anon;
```

- [ ] **Step 2: Review the SQL for secrets**

Run:

```bash
rg -n "service_role|password|secret|token" docs/supabase-post-likes.sql
```

Expected: no matches.

## Task 2: Add Public Jekyll Configuration

**Files:**
- Modify: `_config.yml`

- [ ] **Step 1: Add disabled default configuration**

Add this block near the existing site-wide settings in `_config.yml`, after `comments:` or another top-level feature config:

```yaml
post_likes:
  enabled: false
  supabase_url:
  supabase_anon_key:
```

- [ ] **Step 2: Verify YAML parses through Jekyll config loading**

Run:

```bash
bundle exec jekyll build
```

Expected: build succeeds and no like component is rendered while `post_likes.enabled` is `false`.

## Task 3: Render The Post-Only Like Component

**Files:**
- Create: `_includes/post-like.html`
- Modify: `_layouts/single.html`

- [ ] **Step 1: Add the include markup**

Create `_includes/post-like.html`:

```html
{% assign post_likes_ready = false %}
{% if site.post_likes.enabled and site.post_likes.supabase_url and site.post_likes.supabase_anon_key %}
  {% assign post_likes_ready = true %}
{% endif %}

{% if page.collection == "posts" and post_likes_ready %}
  <div class="post-like" data-post-like data-post-slug="{{ page.url | escape }}">
    <button class="post-like__button" type="button" data-post-like-button aria-label="Like this post">
      <i class="fa fa-thumbs-up post-like__icon" aria-hidden="true"></i>
      <span class="post-like__label" data-post-like-label>Like</span>
      <span class="post-like__count" data-post-like-count aria-live="polite">--</span>
    </button>
    <span class="post-like__status" data-post-like-status aria-live="polite"></span>
  </div>
{% endif %}
```

- [ ] **Step 2: Include it after post content**

In `_layouts/single.html`, insert this line immediately after the closing `</section>` for `<section class="page__content" itemprop="text">` and before `<footer class="page__meta">`:

```liquid
      {% include post-like.html %}
```

The local context should become:

```liquid
      <section class="page__content" itemprop="text">
        {{ content }}
        {% if page.link %}<div><a href="{{ page.link }}" class="btn">{{ site.data.ui-text[site.locale].ext_link_label | default: "Direct Link" }}</a></div>{% endif %}
      </section>

      {% include post-like.html %}

      <footer class="page__meta">
```

- [ ] **Step 3: Verify disabled state does not render**

Run:

```bash
bundle exec jekyll build
rg -n "data-post-like|post-like__button" _site/posts _site/index.html
```

Expected: no matches while `_config.yml` has `post_likes.enabled: false`.

## Task 4: Conditionally Load Scripts

**Files:**
- Modify: `_includes/scripts.html`

- [ ] **Step 1: Add post-only script loading**

Replace `_includes/scripts.html` with this content:

```html
<script src="{{ base_path }}/assets/js/main.min.js"></script>

{% if page.collection == "posts" and site.post_likes.enabled and site.post_likes.supabase_url and site.post_likes.supabase_anon_key %}
  <script>
    window.postLikesConfig = {
      supabaseUrl: {{ site.post_likes.supabase_url | jsonify }},
      supabaseAnonKey: {{ site.post_likes.supabase_anon_key | jsonify }}
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="{{ base_path }}/assets/js/post-like.js"></script>
{% endif %}

{% include analytics.html %}
{% include /comments-providers/scripts.html %}
```

- [ ] **Step 2: Verify disabled state does not load Supabase scripts**

Run:

```bash
bundle exec jekyll build
rg -n "postLikesConfig|supabase-js|post-like.js" _site
```

Expected: no matches while `_config.yml` has `post_likes.enabled: false`.

## Task 5: Implement The Browser Like Logic

**Files:**
- Create: `assets/js/post-like.js`

- [ ] **Step 1: Add the JavaScript implementation**

Create `assets/js/post-like.js`:

```javascript
(function () {
  "use strict";

  var config = window.postLikesConfig;
  var supabaseGlobal = window.supabase;

  if (!config || !config.supabaseUrl || !config.supabaseAnonKey || !supabaseGlobal) {
    return;
  }

  var client = supabaseGlobal.createClient(config.supabaseUrl, config.supabaseAnonKey);
  var widgets = document.querySelectorAll("[data-post-like]");

  function likedKey(slug) {
    return "post-like:" + slug;
  }

  function hasLiked(slug) {
    try {
      return window.localStorage.getItem(likedKey(slug)) === "1";
    } catch (error) {
      return false;
    }
  }

  function markLiked(slug) {
    try {
      window.localStorage.setItem(likedKey(slug), "1");
    } catch (error) {
      return;
    }
  }

  function setStatus(widget, message) {
    var status = widget.querySelector("[data-post-like-status]");
    if (status) {
      status.textContent = message || "";
    }
  }

  function setLikedState(widget, liked) {
    var button = widget.querySelector("[data-post-like-button]");
    var label = widget.querySelector("[data-post-like-label]");

    if (button) {
      button.disabled = liked;
      button.setAttribute("aria-label", liked ? "Post liked" : "Like this post");
      button.classList.toggle("is-liked", liked);
    }

    if (label) {
      label.textContent = liked ? "Liked" : "Like";
    }
  }

  function setCount(widget, count) {
    var countNode = widget.querySelector("[data-post-like-count]");
    if (countNode) {
      countNode.textContent = typeof count === "number" ? String(count) : "--";
    }
  }

  function fetchCount(widget, slug) {
    return client
      .from("post_likes")
      .select("like_count")
      .eq("post_slug", slug)
      .maybeSingle()
      .then(function (result) {
        if (result.error) {
          throw result.error;
        }

        setCount(widget, result.data ? result.data.like_count : 0);
      })
      .catch(function () {
        setCount(widget, null);
      });
  }

  function incrementLike(widget, slug) {
    var button = widget.querySelector("[data-post-like-button]");

    if (hasLiked(slug)) {
      setLikedState(widget, true);
      return;
    }

    if (button) {
      button.disabled = true;
    }

    setStatus(widget, "");

    client
      .rpc("increment_post_like", { slug: slug })
      .then(function (result) {
        if (result.error) {
          throw result.error;
        }

        setCount(widget, result.data);
        markLiked(slug);
        setLikedState(widget, true);
      })
      .catch(function () {
        if (button) {
          button.disabled = false;
        }
        setStatus(widget, "Could not save like.");
      });
  }

  Array.prototype.forEach.call(widgets, function (widget) {
    var slug = widget.getAttribute("data-post-slug");
    var button = widget.querySelector("[data-post-like-button]");

    if (!slug || !button) {
      return;
    }

    setLikedState(widget, hasLiked(slug));
    fetchCount(widget, slug);

    button.addEventListener("click", function () {
      incrementLike(widget, slug);
    });
  });
})();
```

- [ ] **Step 2: Sanity-check syntax**

Run:

```bash
node --check assets/js/post-like.js
```

Expected: no syntax errors.

## Task 6: Style The Like Component

**Files:**
- Modify: `_sass/_page.scss`

- [ ] **Step 1: Add post-like styles**

Add this block after the `.page__content` block and before `.page__hero`:

```scss
.post-like {
  @include full();
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  margin-top: 2rem;
  padding-top: 1.2rem;
  border-top: 1px solid #e8e6dc;
  color: #87867f;
  font-family: $sans-serif;
  font-size: 0.86rem;
}

.post-like__button {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  gap: 0.45rem;
  padding: 0.38rem 0.72rem;
  border: 1px solid #d1cfc5;
  border-radius: 999px;
  background: #faf9f5;
  color: #4d4c48;
  font-family: $sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  &:hover,
  &:focus {
    border-color: #c2c0b6;
    color: #141413;
  }

  &:disabled {
    cursor: default;
  }

  &.is-liked {
    border-color: #e8d8cf;
    background: #fffaf7;
    color: #141413;
  }
}

.post-like__icon {
  color: #c96442;
  font-size: 0.95rem;
}

.post-like__count {
  color: #141413;
  font-family: Georgia, serif;
  font-size: 1rem;
  font-weight: 500;
}

.post-like__status {
  color: #87867f;
  font-size: 0.82rem;
}
```

- [ ] **Step 2: Build the site**

Run:

```bash
bundle exec jekyll build
```

Expected: build succeeds.

## Task 7: Verify Enabled Rendering With Local Placeholder Config

**Files:**
- Temporarily modify: `_config.yml`

- [ ] **Step 1: Temporarily enable post likes locally**

For local verification only, set:

```yaml
post_likes:
  enabled: true
  supabase_url: "https://example.supabase.co"
  supabase_anon_key: "public-anon-key"
```

Do not use a real secret. The anon key is public, but a placeholder is enough to verify rendering.

- [ ] **Step 2: Build and inspect generated post HTML**

Run:

```bash
bundle exec jekyll build
rg -n "data-post-like|postLikesConfig|post-like.js|supabase-js" _site/posts
```

Expected: matches appear in post HTML.

- [ ] **Step 3: Verify non-post pages do not include the feature**

Run:

```bash
rg -n "data-post-like|postLikesConfig|post-like.js|supabase-js" _site/index.html _site/cv/index.html _site/publications/index.html
```

Expected: no matches.

- [ ] **Step 4: Restore disabled default config before final diff**

Restore `_config.yml` to:

```yaml
post_likes:
  enabled: false
  supabase_url:
  supabase_anon_key:
```

Run:

```bash
git diff -- _config.yml
```

Expected: diff only shows the disabled default `post_likes` block, not placeholder Supabase values.

## Task 8: Browser Verification

**Files:**
- No new source files.

- [ ] **Step 1: Start local Jekyll**

Run:

```bash
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Expected: local site serves at `http://127.0.0.1:4000/`.

- [ ] **Step 2: Open a post page**

Open:

```text
http://127.0.0.1:4000/posts/2026/06/agent-harness/
```

Expected with disabled config: no like component.

- [ ] **Step 3: Repeat with temporary enabled placeholder config**

Temporarily enable placeholder config from Task 7 and restart Jekyll.

Open the same post page.

Expected:

- The like component appears after article content and before taxonomy/share/pagination.
- The button shows a thumbs-up icon, `Like`, and `--` or `0`.
- If Supabase is unreachable because placeholders are used, the article remains readable.
- Mobile viewport keeps the button and status text from overlapping.

- [ ] **Step 4: Restore disabled default config**

Restore the disabled default config from Task 7 before final verification.

## Task 9: Final Verification And Diff Review

**Files:**
- Review all changed files.

- [ ] **Step 1: Run final build**

Run:

```bash
bundle exec jekyll build
```

Expected: build succeeds.

- [ ] **Step 2: Check for accidental secrets**

Run:

```bash
rg -n "service_role|password|secret|token|public-anon-key|example\\.supabase\\.co" _config.yml _includes assets/js docs
```

Expected:

- No `service_role`, password, secret, or private token.
- No placeholder Supabase URL or placeholder anon key remains in `_config.yml`, `_includes`, or `assets/js`.
- `docs/supabase-post-likes.sql` may mention `service_role` only if explaining that it must not be used; this plan's SQL does not mention it.

- [ ] **Step 3: Review scoped diff**

Run:

```bash
git diff -- _config.yml _includes/post-like.html _layouts/single.html _includes/scripts.html assets/js/post-like.js _sass/_page.scss docs/supabase-post-likes.sql docs/superpowers/specs/2026-06-12-post-like-supabase-design.md docs/superpowers/plans/2026-06-12-post-like-supabase.md
```

Expected: all changes map directly to the Supabase post-like feature or its docs.

- [ ] **Step 4: Do not stage or commit unless explicitly requested**

The current repository has unrelated uncommitted changes. Do not run broad staging commands. If the user explicitly asks for a commit later, stage only the files from this feature.
