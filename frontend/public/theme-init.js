// Applies the dark class before React mounts so a dark page never flashes
// white on load. The last-known account is only a hint for paint, never authentication.
// Keep this script same-origin so it runs before the SPA bundle under CSP.
(function () {
  var theme;
  try {
    var cachedUser = localStorage.getItem("excalidash-user");
    var user = cachedUser && JSON.parse(cachedUser);
    var key = user && typeof user.id === "string"
      ? "excalidash-preferences:" + user.id
      : "excalidash-preferences";
    var raw = localStorage.getItem(key);
    if (raw) {
      theme = JSON.parse(raw).theme;
    } else if (!user) {
      theme = localStorage.getItem("theme");
    }
  } catch (e) {
    /* storage unavailable or corrupt: fall back to the OS theme */
  }
  if (theme !== "light" && theme !== "dark") {
    theme =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  }
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  }
})();
