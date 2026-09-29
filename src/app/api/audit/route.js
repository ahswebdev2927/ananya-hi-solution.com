import { NextResponse } from "next/server";
import { readDb, writeDb } from "../db-helper";
import nodemailer from "nodemailer";

// Next.js API route to process free audit requests and send notifications to the admin
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, website } = body;

    // 1. Validation of mandatory fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, Email, and Phone Number are required fields." },
        { status: 400 }
      );
    }

    // 2. Persist the audit request in the database
    const db = await readDb();
    if (!db.audits) {
      db.audits = [];
    }

    const newAudit = {
      id: "audit-" + Date.now(),
      name,
      email,
      phone,
      company: company || "",
      website: website || "",
      submittedAt: new Date().toISOString()
    };

    db.audits.push(newAudit);
    await writeDb(db);

    // 3. Email notification via SMTP with nodemailer
    let emailSent = false;
    let emailError = null;

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpUser = process.env.SMTP_USER || "bhavishyagudivaka18@gmail.com";
    const smtpPass = process.env.SMTP_PASS || "wqbj eqhr pbwu jkrj";
    const adminEmail = process.env.ADMIN_EMAIL || "vedabhavishya.gudivaka@gmail.com";

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const smtpPort = parseInt(process.env.SMTP_PORT || "587");
        const smtpSecure = process.env.SMTP_SECURE === "true";
        const smtpFrom = process.env.SMTP_FROM || `"${name} via Audit System" <${smtpUser}>`;

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: adminEmail,
          replyTo: email,
          subject: `New Free Audit Request from ${name}`,
          text: `Dear Admin,

You have received a new Free Audit Request from the website's navigation header.

Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Company: ${company || "Not provided"}
- Website URL: ${website || "Not provided"}

Best Regards,
Ananya Hi Solutions Support System`,
        });

        emailSent = true;
        console.log(`[SMTP DISPATCH SYSTEM] Audit email successfully sent to ${adminEmail} via ${smtpHost}`);
      } catch (err) {
        emailError = err.message;
        console.error("[SMTP ERROR] Failed to send audit email via nodemailer:", err);
      }
    }

    if (!emailSent) {
      console.log(`
================================================================================
[AUTOMATED EMAIL DISPATCH SYSTEM - SIMULATION]
To: ${adminEmail}
Subject: New Free Audit Request from ${name}
--------------------------------------------------------------------------------
Dear Admin,

You have received a new Free Audit Request from the website's navigation header.

Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Company: ${company || "Not provided"}
- Website URL: ${website || "Not provided"}

[SYSTEM STATUS]: simulated (reason: SMTP configuration failed or bypassed; logged to console).
================================================================================
      `);
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Your audit request has been sent successfully and a notification has been dispatched to ${adminEmail}.`
        : `Your audit request has been saved successfully.`,
      audit: newAudit
    });

  } catch (err) {
    console.error("Error processing audit request:", err);
    return NextResponse.json(
      { error: "Internal server error occurred while processing your audit request." },
      { status: 500 }
    );
  }
}
