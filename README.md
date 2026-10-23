# Cut Tracker (website version)

A calorie and weight tracker for Knox College students. Log meals from photos, match them to the Hard Knox Café and Gizmo menus, and track your weight trend. Works in any phone browser, with no account needed.

## What's in here

| File | What it does |
|---|---|
| `index.html` | The whole app |
| `menus/` | Café menus as small JSON files, refreshed every night |
| `scripts/fetch-menus.mjs` | Reads the café website and writes the menu files |
| `.github/workflows/site.yml` | Runs the menu script nightly and publishes the site |
| `manifest.json`, `icon-*.png` | Lets people add the app to their home screen |

## Put it online (about 10 minutes, free)

1. **Create a GitHub account** at github.com if you don't have one.
2. **Make a new repository.** Click **+ → New repository**, name it `cut-tracker`, choose **Public**, and click **Create repository**.
3. **Upload the files.** On the new repo page, click **uploading an existing file**, then drag in everything from this folder and click **Commit changes**.
   - The `.github` folder is hidden on Mac and may not upload by dragging. If it's missing afterward, click **Add file → Create new file**, type `.github/workflows/site.yml` as the name, paste in the contents of that file, and commit.
4. **Turn on the website.** Go to **Settings → Pages**. Under **Source**, pick **GitHub Actions**.
5. **Run it once.** Go to the **Actions** tab, click **Menus and site**, then **Run workflow**. After a minute or two, your link appears in the run summary: `https://YOUR-USERNAME.github.io/cut-tracker/`

From then on, menus refresh by themselves every evening (about 8:17 PM) and every morning (about 6:17 AM). If a run fails, GitHub emails you.

## Using the app

1. **Open the link on your phone**, then use Share → **Add to Home Screen** so it opens like an app.
2. **Fill in the setup screen.** Moving from the Claude version? Tap **Import a backup** there instead.
3. **Turn on photo analysis.** Get a free Gemini API key at https://aistudio.google.com/apikey, then paste it under **You → Photo analysis**.

## Good to know

- **Data stays on each phone.** Nothing is sent to you or stored online. Clearing browser data erases it, so download a backup now and then (You → Export).
- **Each person uses their own Gemini key.** Your key is never shared, and photo analysis costs you nothing.
- **Gemini free tier:** there's a daily limit, and Google may use what's sent to improve its products.
- **Menus come from the public Bon Appétit Knox College site.** Before sharing this widely or turning it into a product, check with Knox dining services.
- **Estimates only.** Calorie targets use the Mifflin-St Jeor formula and never go below 1,200 (women) or 1,500 (men). Weight loss is blocked for anyone under 18.

## Updating the app

Edit `index.html` on GitHub (pencil icon) or upload a new version. The site republishes automatically after each change.
