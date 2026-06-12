(function () {
  "use strict";

  var config = window.postLikesConfig;
  var supabaseGlobal = window.supabase;

  if (!config || !config.supabaseUrl || !config.supabaseAnonKey || !supabaseGlobal) {
    return;
  }

  var client = supabaseGlobal.createClient(config.supabaseUrl, config.supabaseAnonKey);
  var widgets = document.querySelectorAll("[data-post-like]");
  var likesEnabled = config.likesEnabled !== false;
  var viewsEnabled = config.viewsEnabled === true;

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

  function setViewCount(widget, count) {
    var countNode = widget.querySelector("[data-post-view-count]");
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

  function incrementView(widget, slug) {
    client
      .rpc("increment_post_view", { slug: slug })
      .then(function (result) {
        if (result.error) {
          throw result.error;
        }

        setViewCount(widget, result.data);
      })
      .catch(function () {
        setViewCount(widget, null);
      });
  }

  Array.prototype.forEach.call(widgets, function (widget) {
    var slug = widget.getAttribute("data-post-slug");
    var button = widget.querySelector("[data-post-like-button]");

    if (!slug) {
      return;
    }

    if (likesEnabled && button) {
      setLikedState(widget, hasLiked(slug));
      fetchCount(widget, slug);

      button.addEventListener("click", function () {
        incrementLike(widget, slug);
      });
    }

    if (viewsEnabled) {
      incrementView(widget, slug);
    }
  });
})();
