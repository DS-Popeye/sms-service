import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const EMAIL_MODE = process.env.EMAIL_MODE || "ethereal";
const BRAND_NAME = "Rabiulawalshuvo Forms";
const SENDER_BRAND = "Rabiulawalshuvo Form";
const DEFAULT_SITE_ID = "rabiulawalshuvo_forms";
const DEFAULT_SUBJECT = "New inquiry from Rabiulawalshuvo Forms";
const SITE_CONFIG = {
  rabiulawalshuvo_forms: {
    siteId: DEFAULT_SITE_ID,
    subject: DEFAULT_SUBJECT,
  },
  test_site: {
    siteId: DEFAULT_SITE_ID,
    subject: DEFAULT_SUBJECT,
  },
};

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many contact attempts. Please try again later.",
  },
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Form backend is running." });
});

async function createEmailTransport() {
  if (EMAIL_MODE === "ethereal") {
    const testAccount = await nodemailer.createTestAccount();

    return {
      transporter: nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      }),
      from: `"${SENDER_BRAND}" <${testAccount.user}>`,
      isEthereal: true,
    };
  }

  if (EMAIL_MODE !== "smtp") {
    throw new Error("EMAIL_MODE must be ethereal, smtp, or resend.");
  }

  const requiredEnv = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
  ];

  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missingEnv.join(", ")}`);
  }

  const smtpPort = Number(process.env.SMTP_PORT);

  return {
    transporter: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }),
    from: process.env.SMTP_FROM,
    isEthereal: false,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSiteConfig(siteId) {
  return SITE_CONFIG[siteId] || {
    siteId: siteId || DEFAULT_SITE_ID,
    subject: DEFAULT_SUBJECT,
  };
}

function buildEmailBody({ siteId, name, email, phone, message, page_url, userAgent, time }) {
  const fields = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone || "N/A"],
    ["Site ID", siteId || "N/A"],
    ["Page URL", page_url || "N/A"],
    ["User Agent", userAgent],
    ["Time", time],
  ];

  const text = [
    ...fields.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    message,
  ].join("\n");

  const detailRows = fields
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; width: 120px; vertical-align: top;">${escapeHtml(label)}</td>
          <td style="padding: 12px 0; color: #0f172a; font-size: 15px; line-height: 1.55; vertical-align: top;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <!doctype html>
    <html>
      <body style="margin: 0; padding: 0; background: #f4f7fb; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f4f7fb; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.10);">
                <tr>
                  <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #164e63 100%); color: #ffffff;">
                    <div style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #bae6fd; font-weight: 700;">${escapeHtml(BRAND_NAME)}</div>
                    <h1 style="margin: 10px 0 0; font-size: 26px; line-height: 1.25;">New Inquiry</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px 32px 8px;">
                    <span style="display: inline-block; padding: 7px 12px; border-radius: 999px; background: #ecfeff; color: #0e7490; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">New Inquiry</span>
                    <p style="margin: 18px 0 0; color: #334155; font-size: 16px; line-height: 1.65;">A new message was submitted through ${escapeHtml(BRAND_NAME)}.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 32px 4px;">
                    <div style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fbfdff;">
                      <div style="color: #64748b; font-size: 13px; font-weight: 700; margin-bottom: 8px;">Message</div>
                      <div style="color: #0f172a; font-size: 16px; line-height: 1.7;">${escapeHtml(message).replaceAll("\n", "<br>")}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 32px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                      ${detailRows}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">
                    Sent securely via ${escapeHtml(BRAND_NAME)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { text, html };
}

async function sendResendEmail({ to, replyTo, subject, text, html }) {
  const requiredEnv = ["RESEND_API_KEY", "RESEND_FROM"];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    throw new Error(`Missing Resend configuration: ${missingEnv.join(", ")}`);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to,
    replyTo,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(`Resend send failed: ${JSON.stringify(error)}`);
  }

  return data;
}

app.post("/api/contact", contactLimiter, async (req, res) => {
  const {
    site_id = "",
    name = "",
    email = "",
    phone = "",
    message = "",
    page_url = "",
    website = "",
  } = req.body;

  if (website.trim()) {
    return res.json({
      success: true,
      message: "Your inquiry has been sent successfully.",
    });
  }

  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and message are required.",
    });
  }

  if (!process.env.TO_EMAIL) {
    return res.status(500).json({
      success: false,
      message: "Missing email configuration: TO_EMAIL",
    });
  }

  const time = new Date().toISOString();
  const userAgent = req.get("user-agent") || "Unknown";
  const siteConfig = getSiteConfig(site_id);
  const subject = siteConfig.subject || DEFAULT_SUBJECT;

  const { text, html } = buildEmailBody({
    siteId: siteConfig.siteId,
    name,
    email,
    phone,
    message,
    page_url,
    userAgent,
    time,
  });

  try {
    if (EMAIL_MODE === "resend") {
      await sendResendEmail({
        to: process.env.TO_EMAIL,
        replyTo: email,
        subject,
        text,
        html,
      });

      return res.json({
        success: true,
        message: "Your inquiry has been sent successfully.",
      });
    }

    const { transporter, from, isEthereal } = await createEmailTransport();
    const info = await transporter.sendMail({
      from,
      to: process.env.TO_EMAIL,
      replyTo: email,
      subject,
      text,
      html,
    });

    const response = {
      success: true,
      message: "Your inquiry has been sent successfully.",
    };

    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`Ethereal preview URL: ${previewUrl}`);
      response.previewUrl = previewUrl;
    }

    return res.json(response);
  } catch (error) {
    console.error("Email send failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send message right now. Please try again later.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Contact form backend running at http://localhost:${PORT}`);
});
