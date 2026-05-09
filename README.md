# Rabiulawalshuvo Forms

Rabiulawalshuvo Forms is a branded reusable contact-form backend with a lightweight HTML frontend. It accepts contact submissions, protects the endpoint with basic rate limiting and a honeypot field, then sends inquiries through Ethereal, SMTP, or the Resend API.

The project is plain Node.js, Express, Nodemailer, Resend, HTML, CSS, and JavaScript. It does not use React or TypeScript.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Configure `.env`:

   ```env
   EMAIL_MODE=smtp
   PORT=3000

   RESEND_API_KEY=your_resend_api_key_here
   RESEND_FROM="Rabiulawalshuvo Form <notification@rabiulawalshuvo.com>"

   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_USER=resend
   SMTP_PASS=your_resend_api_key_here
   SMTP_FROM="Rabiulawalshuvo Form <notification@rabiulawalshuvo.com>"

   TO_EMAIL=your_receiver_email@gmail.com
   ```

   Never commit `.env`. It contains private API keys and SMTP credentials.

## Email Modes

Use `EMAIL_MODE=ethereal` for local preview testing. Ethereal is useful during development because it creates a browser preview URL, but it does not deliver to a real inbox.

Use `EMAIL_MODE=smtp` for production SMTP sending. The included example uses Resend SMTP with `smtp.resend.com`, port `465`, user `resend`, and your Resend API key as the password.

Use `EMAIL_MODE=resend` to send through the Resend API instead of SMTP. Set `RESEND_API_KEY`, `RESEND_FROM`, and `TO_EMAIL`.

For production sending from `notification@rabiulawalshuvo.com`, verify the domain in your SMTP or email API provider, configure the required DNS records, and use that verified sender in `SMTP_FROM` or `RESEND_FROM`.

## Run Locally

Start the server:

```bash
npm run dev
```

Open the form:

```text
http://localhost:3000
```

Check the health endpoint:

```text
http://localhost:3000/health
```

Submit the form and confirm the inquiry is sent through your selected email mode. In Ethereal mode, open the returned preview URL to view the email.

## Notes

The frontend never receives API keys, SMTP passwords, or other private credentials. All sending secrets stay in `.env` on the backend.

IMAP cannot send email. IMAP is for reading and managing mailbox messages. Use SMTP or an email API service such as Resend for sending.

For Nodemailer SMTP, port `587` uses `secure: false`, while port `465` uses `secure: true`.
