import { NextResponse } from "next/server";
import { getDbClient, initDatabaseSchema } from "../db-helper";
import nodemailer from "nodemailer";

// Next.js API route to process contact messages and send email notifications to the admin
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, email, message } = body;

    // 1. Strict validation of all mandatory fields
    if (!name || !phone || !email || !message) {
      return NextResponse.json({ error: "All fields are mandatory." }, { status: 400 });
    }

    // 2. Persist the message in the database
    await initDatabaseSchema();
    const db = getDbClient();

    const newMessage = {
      id: "msg-" + Date.now(),
      name,
      phone,
      email,
      message,
      submittedAt: new Date().toISOString()
    };

    await db.execute({
      sql: `INSERT INTO contact_messages (id, name, phone, email, message, submitted_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        newMessage.id,
        newMessage.name,
        newMessage.phone,
        newMessage.email,
        newMessage.message,
        newMessage.submittedAt
      ]
    });

    // 3. Real Email Sending via SMTP with fallbacks
    let emailSent = false;

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

        await transporter.sendMail({
          from: smtpFrom,
          to: adminEmail,
          replyTo: email,
          subject: `New Contact Inquiry from ${name}`,
          text: `Dear Admin,

You have received a new contact inquiry from the website's "Send Us a Message" form.

Inquiry Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Message:
  "${message}"

Best Regards,
Ananya Hi Solutions Support System`,
        });

        emailSent = true;
        console.log(`[SMTP DISPATCH SYSTEM] Contact email successfully sent to ${adminEmail} via ${smtpHost}`);
      } catch (err) {
        console.error("[SMTP ERROR] Failed to send contact email via nodemailer:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Your message has been sent successfully and a notification has been dispatched to ${adminEmail}.`
        : `Your message has been saved successfully (Simulated notification email logged).`,
      contact: newMessage
    });

  } catch (err) {
    console.error("Error processing contact message:", err);
    return NextResponse.json({ error: "Internal server error occurred while processing your message." }, { status: 500 });
  }
}
