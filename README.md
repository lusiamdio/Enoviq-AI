<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2358154f-f253-4d3c-be89-a1db9ea92a1c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Whop checkout setup

Set these environment variables before running the app with Whop checkout redirects:

- `VITE_WHOP_WINE_CHECKOUT_URL`: Generic Whop checkout link used by every wine detail `Buy Now` button.
- `VITE_WHOP_CUPIDO_CHECKOUT_URL`: Whop checkout link used by Cupido Gold upgrades.
