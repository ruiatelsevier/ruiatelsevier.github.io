# Blog Side Panel Implementation Plan

{% raw %}

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static right-side blog archive panel to blog archive pages and individual blog posts.

**Architecture:** Jekyll/Liquid generates a reusable blog side panel from `site.posts` at build time. Archive and single-post layouts opt into the panel with narrow guards, and SCSS scopes the visual treatment to `.blog-side-panel` so the left author sidebar and non-blog pages stay unchanged.

**Tech Stack:** Jekyll, Liquid, SCSS, Minimal Mistakes layout conventions, no JavaScript.

---

## File Structure

- Create `_includes/blog-side-panel.html`: reusable static blog navigation panel rendered from `site.posts`.
- Modify `_layouts/archive.html`: render the panel only when a page sets `blog_side_panel: true`.
- Modify `_layouts/single.html`: render the panel only for posts in the `posts` collection.
- Modify `_pages/year-archive.html`: opt into the panel.
- Modify `_pages/tag-archive.html`: opt into the panel.
- Modify `_sass/_sidebar.scss`: add scoped, quiet styles for the blog panel.

Do not touch CV, publications, talks, homepage, post content, existing author sidebar content, generated `_site`, or unrelated dirty files. Do not stage broad paths. Use exact-path staging only if the user explicitly asks for implementation commits.

## Task 1: Add The Blog Side Panel Include

**Files:**
- Create: `_includes/blog-side-panel.html`

- [ ] **Step 1: Create the include with static Liquid markup**

Create `_includes/blog-side-panel.html`:

```liquid
{% include base_path %}

{% assign post_years = '' | split: ',' %}
{% for post in site.posts %}
  {% assign post_year = post.date | date: '%Y' %}
  {% unless post_years contains post_year %}
    {% assign post_years = post_years | push: post_year %}
  {% endunless %}
{% endfor %}
{% assign post_years = post_years | sort | reverse %}

<aside class="sidebar__right blog-side-panel">
  <nav class="blog-side-panel__nav" aria-label="Blog archive">
    <h2 class="blog-side-panel__title">Blog Archive</h2>

    <details class="blog-side-panel__section" open>
      <summary class="blog-side-panel__summary">By Year</summary>
      <ul class="blog-side-panel__list">
        {% for year in post_years %}
          {% assign year_count = 0 %}
          {% for post in site.posts %}
            {% assign post_year = post.date | date: '%Y' %}
            {% if post_year == year %}
              {% assign year_count = year_count | plus: 1 %}
            {% endif %}
          {% endfor %}
          <li class="blog-side-panel__item">
            <a class="blog-side-panel__link" href="{{ base_path }}/year-archive/#{{ year | slugify }}">
              <span>{{ year }}</span>
              <span class="blog-side-panel__count">{{ year_count }}</span>
            </a>
          </li>
        {% endfor %}
      </ul>
    </details>

    {% include group-by-array collection=site.posts field="tags" %}
    {% if group_names.size > 0 %}
      <details class="blog-side-panel__section">
        <summary class="blog-side-panel__summary">By Tags</summary>
        <ul class="blog-side-panel__list">
          {% for tag in group_names %}
            {% assign blog_side_panel_tag_posts = group_items[forloop.index0] %}
            <li class="blog-side-panel__item">
              <a class="blog-side-panel__link" href="{{ base_path }}{{ tag | slugify | prepend: '#' | prepend: site.tag_archive.path }}">
                <span>{{ tag }}</span>
                <span class="blog-side-panel__count">{{ blog_side_panel_tag_posts.size }}</span>
              </a>
            </li>
          {% endfor %}
        </ul>
      </details>
    {% endif %}
  </nav>
</aside>
```

- [ ] **Step 2: Check for Liquid syntax mistakes by building**

Run:

```bash
bundle exec jekyll build
```

Expected: build succeeds. The panel is not visible yet because no layout includes it.

## Task 2: Render The Panel In Blog Contexts Only

**Files:**
- Modify: `_layouts/archive.html`
- Modify: `_layouts/single.html`
- Modify: `_pages/year-archive.html`
- Modify: `_pages/tag-archive.html`

- [ ] **Step 1: Add the archive layout guard**

In `_layouts/archive.html`, replace:

```liquid
<div id="main" role="main">
  {% include sidebar.html %}

  <div class="archive">
```

with:

```liquid
<div id="main"{% if page.blog_side_panel %} class="layout--blog-side-panel"{% endif %} role="main">
  {% include sidebar.html %}

  {% if page.blog_side_panel %}
    {% include blog-side-panel.html %}
  {% endif %}

  <div class="archive">
```

- [ ] **Step 2: Add the single-post layout guard**

In `_layouts/single.html`, replace:

```liquid
<div id="main" role="main">
  {% include sidebar.html %}

  <article class="page" itemscope itemtype="http://schema.org/CreativeWork">
```

with:

```liquid
<div id="main"{% if page.collection == "posts" %} class="layout--blog-side-panel"{% endif %} role="main">
  {% include sidebar.html %}

  {% if page.collection == "posts" %}
    {% include blog-side-panel.html %}
  {% endif %}

  <article class="page" itemscope itemtype="http://schema.org/CreativeWork">
```

- [ ] **Step 3: Opt the year archive page into the panel**

In `_pages/year-archive.html`, change the front matter from:

```yaml
---
layout: archive
permalink: /year-archive/
title: "Blog posts"
author_profile: true
redirect_from:
  - /wordpress/blog-posts/
---
```

to:

```yaml
---
layout: archive
permalink: /year-archive/
title: "Blog posts"
author_profile: true
blog_side_panel: true
redirect_from:
  - /wordpress/blog-posts/
---
```

- [ ] **Step 4: Opt the tag archive page into the panel**

In `_pages/tag-archive.html`, change the front matter from:

```yaml
---
layout: archive
permalink: /tags/
title: "Posts by Tags"
author_profile: true
---
```

to:

```yaml
---
layout: archive
permalink: /tags/
title: "Posts by Tags"
author_profile: true
blog_side_panel: true
---
```

- [ ] **Step 5: Build and verify expected rendered pages**

Run:

```bash
bundle exec jekyll build
rg -n "Blog Archive|blog-side-panel" _site/year-archive/index.html _site/tags/index.html _site/posts/2026/06/agent-harness/index.html
```

Expected:

```text
_site/year-archive/index.html:<line>:...Blog Archive...
_site/tags/index.html:<line>:...Blog Archive...
_site/posts/2026/06/agent-harness/index.html:<line>:...Blog Archive...
```

Then run:

```bash
rg -n "Blog Archive|blog-side-panel" _site/cv/index.html _site/publications/index.html
```

Expected: no matches and exit code `1`.

## Task 3: Style The Panel Without Changing Non-Blog Pages

**Files:**
- Modify: `_sass/_sidebar.scss`

- [ ] **Step 1: Append scoped blog panel styles**

Append this block to `_sass/_sidebar.scss` after the existing `.sidebar__right` block and before the `Author profile and links` section:

```scss
.blog-side-panel {
  color: #5e5d59;
  font-family: $sans-serif;

  @include breakpoint($large) {
    padding-top: 0.25rem;
  }
}

.blog-side-panel__nav {
  padding: 0.85rem 0;
  border-top: 1px solid #e8e6dc;
  border-bottom: 1px solid #e8e6dc;
}

.blog-side-panel__title {
  margin: 0 0 0.75rem;
  color: #141413;
  font-family: Georgia, serif;
  font-size: $type-size-5;
  font-weight: 500;
}

.blog-side-panel__section {
  margin-top: 0.55rem;
}

.blog-side-panel__summary {
  color: #87867f;
  cursor: pointer;
  font-family: $sans-serif-narrow;
  font-size: $type-size-6;
  font-weight: 600;
  line-height: 1.4;
}

.blog-side-panel__list {
  margin: 0.45rem 0 0;
  padding: 0;
  list-style: none;
}

.blog-side-panel__item {
  margin: 0;
}

.blog-side-panel__link {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.22rem 0;
  color: #4d4c48;
  font-size: $type-size-6;
  line-height: 1.35;
  text-decoration: none;

  &:hover,
  &:focus {
    color: #c96442;
    text-decoration: underline;
  }
}

.blog-side-panel__count {
  color: #87867f;
  font-size: 0.75em;
  white-space: nowrap;
}
```

- [ ] **Step 2: Build CSS through Jekyll**

Run:

```bash
bundle exec jekyll build
```

Expected: build succeeds without Sass errors.

- [ ] **Step 3: Check that scoped CSS exists in the generated stylesheet**

Run:

```bash
rg -n "blog-side-panel" _site/assets/css/main.css
```

Expected: matches for `.blog-side-panel`, `.blog-side-panel__link`, and `.blog-side-panel__count`.

## Task 4: Verify Links, Layout, And Scope

**Files:**
- No code changes unless verification shows right-panel overlap.
- Modify only if needed: `_sass/_sidebar.scss`

- [ ] **Step 1: Verify rendered link targets**

Run:

```bash
bundle exec jekyll build
rg -n "href=\"/year-archive/#2026\"" _site/year-archive/index.html _site/tags/index.html _site/posts/2026/06/agent-harness/index.html
rg -n "href=\"/tags/#" _site/year-archive/index.html _site/tags/index.html _site/posts/2026/06/agent-harness/index.html
rg -n "id=\"harness-engineering\"|id=\"writing\"" _site/tags/index.html
```

Expected: the first command finds the `2026` year link, the second command finds rendered tag links, and the third command finds tag heading IDs for current sample tags.

- [ ] **Step 2: Serve the site locally**

Run:

```bash
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Expected: server starts and prints a local URL. Keep this process running for browser verification.

- [ ] **Step 3: Browser-check desktop pages**

Open these pages in the browser at desktop width:

```text
http://127.0.0.1:4000/year-archive/
http://127.0.0.1:4000/tags/
http://127.0.0.1:4000/posts/2026/06/agent-harness/
http://127.0.0.1:4000/cv/
http://127.0.0.1:4000/publications/
```

Expected:

- The first three pages show the right-side `Blog Archive` panel.
- `By Year` is expanded.
- `By Tags` is collapsed.
- CV and publications do not show the panel.
- No content overlaps the panel.
- Left author sidebar remains present where it already appeared.

- [ ] **Step 4: Browser-check mobile layout**

Open the same pages around 390px viewport width.

Expected:

- The panel remains readable.
- Links do not overflow their container.
- Content and sidebars stack coherently.
- No text overlaps.

- [ ] **Step 5: Add scoped layout adjustment only if overlap appears**

If desktop content overlaps the panel, append this scoped block to `_sass/_sidebar.scss` after the blog panel styles:

```scss
.layout--blog-side-panel {
  @include breakpoint($large) {
    .blog-side-panel {
      width: span(2 of 12);
    }

    .archive {
      @include span(7.5 of 12);
      @include prefix(0.5 of 12);
    }

    .page {
      @include span(7.5 of 12);
      @include prefix(0.5 of 12);
      @include suffix(0);
    }
  }
}
```

Then rerun:

```bash
bundle exec jekyll build
```

Expected: build succeeds and browser recheck shows no overlap.

## Task 5: Final Verification And Optional Commit

**Files:**
- Review only the implementation files:
  - `_includes/blog-side-panel.html`
  - `_layouts/archive.html`
  - `_layouts/single.html`
  - `_pages/year-archive.html`
  - `_pages/tag-archive.html`
  - `_sass/_sidebar.scss`

- [ ] **Step 1: Run final build**

Run:

```bash
bundle exec jekyll build
```

Expected: build succeeds.

- [ ] **Step 2: Check implementation diff scope**

Run:

```bash
git diff -- _includes/blog-side-panel.html _layouts/archive.html _layouts/single.html _pages/year-archive.html _pages/tag-archive.html _sass/_sidebar.scss
git status --short
```

Expected: implementation diff is limited to the listed files. Existing unrelated dirty files may still appear in `git status`; do not stage or modify them.

- [ ] **Step 3: Commit only if the user explicitly asks for a commit**

If the user has explicitly requested an implementation commit, run exact-path staging:

```bash
git add _includes/blog-side-panel.html _layouts/archive.html _layouts/single.html _pages/year-archive.html _pages/tag-archive.html _sass/_sidebar.scss
git commit -m "feat: add blog archive side panel"
```

Expected: commit succeeds and includes only the implementation files.
{% endraw %}
