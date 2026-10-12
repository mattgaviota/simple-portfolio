# Portfolio

Responsive product gallery with a protected admin area. Next.js (App Router) + Tailwind, Firebase **client SDK only** (Auth, Firestore, Storage). There is no server-side Firebase code.

- `/` public gallery
- `/admin` Google sign-in (single allowlisted email), create / edit / delete products

- `/cart` cart + contact form, pays through Mercado Pago Checkout Pro
- `/admin/orders` read-only order list

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
  --build-arg NEXT_PUBLIC_SHIPPING_COUNTRY=Argentina \
  -t portfolio .

docker run -p 3000:3000 portfolio
```

## Mercado Pago (Checkout Pro)

Payments use Mercado Pago Checkout Pro (the buyer pays on a page hosted by Mercado Pago). Prices are in ARS and checkout is guest-only: the cart collects only name, email and phone, because shipping is arranged personally with the buyer after the purchase (the cart says so).

### How it works

1. `/cart` posts the cart and the contact data to `POST /api/checkout`. The server re-reads prices, names and stock from Firestore (the client never sends a price), saves an `orders` document as `pending` and creates a Mercado Pago preference with the order id as `external_reference`.
2. The buyer is redirected to Mercado Pago and pays. Afterwards Mercado Pago sends them to `/checkout/result?order=<id>`, which polls `GET /api/orders/[id]` (status only) for about 30 seconds and clears the cart once approved.
3. Mercado Pago also notifies the server with a signed Webhook to `POST /api/webhooks/mercadopago?data.id=<payment id>&type=payment`. The route is the source of truth for order status:
   - When `MP_WEBHOOK_SECRET` is set, the `x-signature` header is validated and invalid or unsigned requests get a 401. Nothing else in the request is trusted: the payment is re-fetched from Mercado Pago with the access token, and its amount and currency must match the order.
   - Status is saved in a Firestore transaction. Stock is decremented once, when the payment is approved, and restored on a refund.
   - A later failed attempt cannot overwrite an order already paid by another payment.
4. The admin manages orders in `/admin/orders`: view the detail, mark as shipped (only approved orders) and cancel. Orders are never deleted: cancelled orders move to the "Cancelados" tab.

### Setup

1. **Mercado Pago application.** In the developers panel (Tus integraciones) create an application for Checkout Pro and copy its Access Token from Credentials. Test credentials and production credentials are separate sets.
2. **Webhooks.** In the application open Webhooks (Notifications) and configure the **test** mode and the **production** mode separately, each with the URL `{APP_URL}/api/webhooks/mercadopago` and the **Payments** event. Each mode has its own "Clave secreta" (signature secret). Put the one that matches your `MP_ACCESS_TOKEN` in `MP_WEBHOOK_SECRET`. The preference does not set a `notification_url`: notifications come only from the Webhooks configured in the panel. IPN is not supported.
3. **Firebase service account.** In Project settings > Service accounts generate a private key. Put the JSON, collapsed to one line, in `FIREBASE_SERVICE_ACCOUNT`. The server uses it (Admin SDK) to write orders, because client rules do not allow it.
4. **Environment variables** in `.env.local` (all server-side, never prefix them with `NEXT_PUBLIC_`):

   | Variable | Value |
   | --- | --- |
   | `MP_ACCESS_TOKEN` | Access Token of the application (test or production) |
   | `MP_WEBHOOK_SECRET` | Optional. Webhook signature secret (Webhooks > Clave secreta). If empty the signature is not checked; payments are still re-fetched from Mercado Pago and matched to the order |
   | `APP_URL` | Public HTTPS base URL of the site, no trailing slash, e.g. `https://example.com` |
   | `FIREBASE_SERVICE_ACCOUNT` | Service account JSON on one line |
   | `CHECKOUT_EXPIRATION_HOURS` | Optional. Hours the payment link stays valid (default `24`, `0` disables it) |
   | `RESEND_API_KEY` | Resend API key (see Order confirmation email) |
   | `EMAIL_FROM` | Sender address, e.g. `Mi Tienda <pedidos@example.com>` |
   | `NEXT_PUBLIC_SHIPPING_COUNTRY` | Country shipping is limited to (e.g. `Argentina`). Shown in the cart and the confirmation email; leave empty to hide it. Public variable: set it at build time in Docker |
   | `EMAIL_REPLY_TO` | Optional. Address that receives the buyers' replies |

   `APP_URL` is used for the return URLs and the notification URL, so it must be reachable by Mercado Pago and the buyer's browser.
5. **Firestore rules.** Publish `firestore.rules`. The `orders` collection is readable by the admin only, can be created only by the server, the admin can only change the shipping fields (`shippedAt`, `updatedAt`), and nothing can be deleted.
6. **Local development.** Mercado Pago must reach your machine, so expose the app with a tunnel (cloudflared, ngrok) and use its URL as `APP_URL`. If the tunnel uses a custom hostname, add it to `allowedDevOrigins` in `next.config.ts`. Restart `npm run dev` after editing `.env.local`.
7. **Docker.** These variables are read at runtime, not build time, so pass them to the container instead of as build args:

   ```bash
   docker run -p 3000:3000 --env-file .env.local portfolio
   ```
8. **Testing.** Use test credentials and Mercado Pago test users (a seller and a buyer) and test cards from the Mercado Pago documentation. Send a test notification from the panel too (it returns 200 and is ignored, since the id does not exist). Check that the order moves from `pending` to `approved` in `/admin/orders` and that stock drops.
9. **Going live.** Replace `MP_ACCESS_TOKEN` with the production Access Token, set `APP_URL` to the production domain, configure the production Webhook (URL, Payments event) and set `MP_WEBHOOK_SECRET` to its secret, and make one small real payment.

### Order confirmation email (Resend)

When a payment is approved, the buyer gets an email with the order number and the products bought (with their images), sent with [Resend](https://resend.com). Orders get a sequential number (`#1`, `#2`, ...) from a counter in Firestore.

1. Create a Resend account and an API key (Sending access is enough) and put it in `RESEND_API_KEY`.
2. Add and verify your sending domain in Resend (DNS records), then set `EMAIL_FROM` to an address on it, e.g. `Mi Tienda <pedidos@example.com>`. Without a verified domain Resend only lets you send to your own account email, so real buyers will not receive it.
3. The email header (store name, slogan and logo) comes from `/admin/settings`. The logo is shown only if it is an `https` image URL.
4. The email asks the buyer to reply with address, city, province, postal code and an optional note, and, if `NEXT_PUBLIC_SHIPPING_COUNTRY` is set, says shipping is only inside that country. Replies go to `EMAIL_REPLY_TO` (set it to an inbox you read) or, if unset, to `EMAIL_FROM`.

The email is sent once, by the notification that moves the order to approved. If sending fails or the variables are missing, the payment and stock are still processed and the error is logged; `/admin/orders/[id]` shows whether the email went out. Orders created before this feature show a short id instead of a number.

### Known limitations

- Stock is decremented when the approved payment notification arrives, not when the order is created, so two buyers can pay for the last unit. Such orders are flagged in `/admin/orders` and need a manual refund.
- Shipping cost is not charged at checkout. The cart tells the buyer shipping is arranged afterwards, personally.
- Cancelling from `/admin/orders` (`POST /api/orders/[id]/cancel`, admin only, verified with the Firebase ID token): an approved order is fully refunded in Mercado Pago (`POST /v1/payments/{id}/refunds`) and its stock is restored; a pending order has its payment cancelled (`PUT /v1/payments/{id}` with `status: cancelled`) when the buyer had already started one. If Mercado Pago rejects the call, the order is left unchanged. A pending order whose buyer has not paid yet has no payment to cancel, so the Mercado Pago page stays open until the preference expires (`CHECKOUT_EXPIRATION_HOURS`); if that buyer pays before then, the payment is refunded automatically.
- Orders left `pending` by abandoned checkouts are not cleaned up automatically; cancel them from `/admin/orders`.
