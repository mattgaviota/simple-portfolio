# Portfolio

Responsive product gallery with a protected admin area. Next.js (App Router) + Tailwind, Firebase **client SDK only** (Auth, Firestore, Storage). There is no server-side Firebase code.

- `/` public gallery
- `/admin` Google sign-in (single allowlisted email), create / edit / delete products

Product fields: name, image, description, price, amount (stock; the gallery shows a "Sold out" badge at 0).

## Firebase setup

1. Create a Firebase project and add a Web app; copy its config values.
2. Authentication: enable the Google provider. Add your deployed domain under Authorized domains.
3. Firestore: create a database, then publish `firestore.rules`.
4. Storage: enable it (may require the Blaze plan), then publish `storage.rules`.
5. In both rules files replace `REPLACE_WITH_ADMIN_EMAIL` with your admin Google email. The rules are the real access control; the client-side check is only for UX.

## Local development

```bash
cp .env.local.example .env.local   # fill in the values
npm install
npm run dev
```

## Docker

`NEXT_PUBLIC_*` values are baked into the client bundle at build time, so pass them as build args:

```bash
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=... \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=... \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=... \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=... \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=... \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=... \
  --build-arg NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com \
  -t portfolio .

docker run -p 3000:3000 portfolio
```
