# Matrica OAuth SDK – Examples

This folder contains a single, fully-working **Express example** showing the complete OAuth flow.

## 📄 Example File

• [`server.ts`](./server.ts) – minimal Express server (TypeScript) that:
  1. Generates the authorization URL with every available scope.
  2. Exchanges the code for tokens in `/callback`.
  3. Shows how to fetch profile, wallets, socials and email.


---

## Quick Start

1.  Create a `.env` file in the project root:

    ```env
    MATRICA_CLIENT_ID=your_client_id
    MATRICA_CLIENT_SECRET=your_client_secret
    MATRICA_REDIRECT_URI=http://localhost:3000/callback
    ```

2.  Install dependencies:

    ```bash
    npm install
    # or: pnpm install / yarn install
    ```

3.  Run the example with `ts-node`:

    ```bash
    ts-node examples/server.ts
    ```

   The server will start on `http://localhost:3000` and immediately redirect you through the OAuth flow.

---

## Need Help?

• Main docs: [`README.md`](../README.md)  •  Migration guide: [`MIGRATION.md`](../MIGRATION.md)