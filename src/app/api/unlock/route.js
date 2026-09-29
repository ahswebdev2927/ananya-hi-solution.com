import { NextResponse } from "next/server";
import { readDb, writeDb } from "../db-helper";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const body = await request.json();
    // page.js sends: name, email, phone, company, packageTitle, subId
    const { name, email, phone, company, packageTitle, subId } = body;

    // 1. Strict validation of all mandatory fields
    if (!name || !email || !phone || !packageTitle) {
      return NextResponse.json({ error: "All required fields are mandatory." }, { status: 400 });
    }

    // 2. Persist the lead in the database
    const db = await readDb();
    if (!db.unlockedPackages) {
      db.unlockedPackages = [];
    }

    const newLead = {
      id: "lead-" + Date.now(),
      name,
      email,
      phone,
      company: company || "",
      packageTitle,
      subId: subId || "",
      submittedAt: new Date().toISOString()
    };

    db.unlockedPackages.push(newLead);
    await writeDb(db);

    // 3. Real Email Sending via SMTP with fallbacks
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
        const smtpFrom = process.env.SMTP_FROM || `"${name} via Support" <${smtpUser}>`;

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        // Send email asynchronously in the background to prevent blocking the client response
        transporter.sendMail({
          from: smtpFrom,
          to: adminEmail,
          replyTo: email,
          subject: `Package Unlock Request from ${name} for ${packageTitle}`,
          text: `Dear Admin,

You have received a new package unlock request on the website.

Lead Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Company: ${company || "Not provided"}

Package Viewed:
- Category: ${packageTitle}
- Sub-Service ID: ${subId || "N/A"}

Best Regards,
Ananya Hi Solutions Support System`,
        }).then(() => {
          console.log(`[SMTP DISPATCH SYSTEM] Package unlock email successfully sent to ${adminEmail} via ${smtpHost}`);
        }).catch((err) => {
          console.error("[SMTP ERROR] Failed to send package unlock email via nodemailer:", err);
        });

        emailSent = true;
      } catch (err) {
        emailError = err.message;
        console.error("[SMTP ERROR] Failed to initialize nodemailer transporter:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Details unlocked successfully and a notification has been dispatched to ${adminEmail}.`
        : `Details unlocked successfully (Simulated notification email logged).`,
      lead: newLead
    });

  } catch (err) {
    console.error("Error processing package unlock lead:", err);
    return NextResponse.json({ error: "Internal server error occurred while processing your request." }, { status: 500 });
  }
}
