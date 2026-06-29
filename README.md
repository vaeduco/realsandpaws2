# RealAndPaws 🐾

RealAndPaws is a simple, friendly static website for dog lovers — browse popular
breeds, enjoy fun trivia, and pick up practical care tips. It's plain HTML, CSS,
and JavaScript — no build step, no framework, no dependencies.

The breed photos are loaded at runtime from the free [Dog CEO API](https://dog.ceo)
(`dog.ceo`), so an internet connection is required for images to appear.

## File structure

```
realsandpaws2/
├── index.html       # Homepage — hero, intro, links to every page
├── breeds.html      # Popular breeds gallery (photos via the Dog CEO API)
├── trivia.html      # Fun dog facts + a random-fact generator
├── care.html        # Care tips accordion (feeding, grooming, exercise, health)
├── styles.css       # Shared styles for the whole site
├── script.js        # Shared JS (mobile nav, active link, footer year)
├── favicon.svg      # Site icon
├── vercel.json      # Vercel static-hosting config
├── README.md        # This file
└── .gitignore
```

## Run locally

No tooling needed beyond Python (preinstalled on most systems):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Deploy on Vercel

This is a pure static site — there is **no build command** and **no framework**.
Vercel serves the directory as-is.

### Option A — One-click deploy button

Once this project is on GitHub, deploy it in a single click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vaeduco/realsandpaws2)

> The button clones [`vaeduco/realsandpaws2`](https://github.com/vaeduco/realsandpaws2)
> into the visitor's Vercel account and deploys it as-is, with no extra configuration.
> Anyone who opens the repo can deploy their own copy the same way.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel            # deploy a preview
vercel --prod     # deploy to production
```

### Option C — GitHub + vercel.com

1. Push this folder to GitHub:
   ```bash
   git remote add origin https://github.com/vaeduco/realsandpaws2.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and import the repo.
3. Set **Framework Preset** to **Other**.
4. Leave the **Build Command** empty.
5. Set the **Output Directory** to the project root (`.`).
6. Deploy.

Because the breed photos come from `dog.ceo` at runtime, the deployed site needs
internet access to display images — nothing is bundled or cached server-side.
