---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

{% if author.googlescholar %}
  <p class="publication-note">
    This list is generated from <code>data/citations.bib</code>. You can also find the live profile on
    <a href="{{ author.googlescholar }}">Google Scholar</a>.
  </p>
{% endif %}

{% include base_path %}

{% assign publications = site.data.publications | sort: "year" | reverse %}

<div class="publication-list">
  {% for publication in publications %}
    <article class="publication-item">
      <div class="publication-year">
        {% if publication.year and publication.year != 0 %}{{ publication.year }}{% else %}n.d.{% endif %}
      </div>
      <div class="publication-body">
        <h2>{{ publication.title }}</h2>
        {% if publication.authors %}
          <p class="publication-authors">{{ publication.authors }}</p>
        {% endif %}
        <p class="publication-meta">
          {% if publication.venue %}<span>{{ publication.venue }}</span>{% endif %}
          {% if publication.type_label %}<span>{{ publication.type_label }}</span>{% endif %}
          {% if publication.volume %}<span>Vol. {{ publication.volume }}{% if publication.number %}({{ publication.number }}){% endif %}</span>{% endif %}
          {% if publication.pages %}<span>pp. {{ publication.pages }}</span>{% endif %}
        </p>
      </div>
    </article>
  {% endfor %}
</div>
