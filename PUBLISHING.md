# Publishing to Spicetify Marketplace

Marketplace does not take theme submissions by pull request. It discovers **public GitHub repositories** that:

1. have the GitHub topic **`spicetify-themes`**;
2. contain a valid **`manifest.json`** in the repository root.

Source: <https://github.com/spicetify/marketplace/wiki/Publishing-to-Marketplace>

## 1. Create the repository

Create a public repository, for example `spicetify-winter-theme`.

Upload the contents of this folder:

```
manifest.json
README.md
LICENSE
preview.png
theme.js
user.css
color.ini
```

`PUBLISHING.md` is only for you — delete it before pushing if you want.

## 2. Replace the placeholders

In `manifest.json`:

- `YOUR_GITHUB_USERNAME` → your GitHub username (twice: in `include` and in `authors.url`);
- `YOUR_NAME` → the name shown on the Marketplace card.

In `LICENSE`:

- `YOUR_NAME` → your name or nickname.

The `include` link must point to the raw `theme.js` on the default branch:

```
https://raw.githubusercontent.com/<user>/<repo>/main/theme.js
```

Marketplace automatically rewrites GitHub raw links to jsDelivr, so the script loads fast.

> Marketplace themes only inject `user.css` and `color.ini`. The interactive part (`theme.js`) is loaded through the `include` array — this is why the raw link is required.

## 3. Add the topic

On GitHub: **Settings → Topics** → add `spicetify-themes`.

Without this topic the repository will not appear in Marketplace.

## 4. Wait for indexing

Marketplace searches GitHub by topic, so no pull request is needed. A new repository can take a while to appear (GitHub search indexing + Marketplace cache). Reopen Marketplace or restart Spotify to refresh.

## 5. Updating the theme

Push changes to the default branch. Marketplace reads `manifest.json` from GitHub and the CSS/JS from the same branch. If jsDelivr serves an old file, bump the `?v=` query in `include` or wait for its cache to expire.

## Checklist

- [ ] Repository is public
- [ ] Topic `spicetify-themes` added
- [ ] `manifest.json` is in the root and is valid JSON
- [ ] `include` URL opens a raw `theme.js`
- [ ] `preview.png` exists and is referenced by `preview`
- [ ] `README.md` and `color.ini` paths are correct
- [ ] Theme installs from Marketplace and the tree/gear buttons appear
