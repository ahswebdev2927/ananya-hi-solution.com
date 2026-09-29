import { NextResponse } from "next/server";
import { readDb, writeDb } from "../db-helper";
import nodemailer from "nodemailer";

// Next.js API route to process job applications and trigger automated notifications to vedabhavishya.gudivaka@gmail.com
export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const message = formData.get("message");
    const jobId = formData.get("jobId");
    const jobTitle = formData.get("jobTitle");
    const resumeFile = formData.get("resume");

    // 1. Strict validation of all mandatory fields
    if (!name || !email || !phone || !message || !jobId || !jobTitle || !resumeFile) {
      return NextResponse.json({ error: "All application fields are mandatory." }, { status: 400 });
    }

    // 2. Validate file type (strictly PDF, DOC, or DOCX)
    const fileName = resumeFile.name.toLowerCase();
    const isAllowedExt = fileName.endsWith(".pdf") || fileName.endsWith(".doc") || fileName.endsWith(".docx");
    
    if (!isAllowedExt) {
      return NextResponse.json({ error: "Only PDF or Word documents (.doc, .docx) are allowed." }, { status: 400 });
    }

    // 3. Staging and persisting the application record in the database
    const db = await readDb();
    if (!db.applications) {
      db.applications = [];
    }

    const newApplication = {
      id: "app-" + Date.now(),
      jobId,
      jobTitle,
      candidateName: name,
      candidateEmail: email,
      candidatePhone: phone,
      coverLetter: message,
      resumeFileName: resumeFile.name,
      resumeSize: resumeFile.size,
      appliedAt: new Date().toISOString()
    };

    db.applications.push(newApplication);
    await writeDb(db);

    // 4. Real Email Sending via Nodemailer / SMTP with graceful fallback
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

        // Convert the file blob/arrayBuffer to Buffer for nodemailer attachment
        const arrayBuffer = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await transporter.sendMail({
          from: smtpFrom,
          to: adminEmail,
          replyTo: email,
          subject: `New Job Application - ${jobTitle} - ${name}`,
          text: `Dear HR Team,

A new application has been successfully submitted for the "${jobTitle}" position.

Candidate Profile:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Cover Letter:
  "${message}"

Attachment:
- Resume File: ${resumeFile.name} (${(resumeFile.size / 1024).toFixed(2)} KB)

Best Regards,
Ananya Hi Solutions Careers Portal`,
          attachments: [
            {
              filename: resumeFile.name,
              content: buffer
            }
          ]
        });

        emailSent = true;
        console.log(`[SMTP DISPATCH SYSTEM] Email successfully sent to ${adminEmail} via ${smtpHost}`);
      } catch (err) {
        emailError = err.message;
        console.error("[SMTP ERROR] Failed to send email via nodemailer:", err);
      }
    }

    if (!emailSent) {
      console.log(`
================================================================================
[AUTOMATED EMAIL DISPATCH SYSTEM - SIMULATION]
To: vedabhavishya.gudivaka@gmail.com
Subject: New Job Application - ${jobTitle} - ${name}
--------------------------------------------------------------------------------
Dear HR Team,

A new application has been successfully submitted for the "${jobTitle}" position.

Candidate Profile:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Cover Letter:
  "${message}"

Attachment:
- Resume File: ${resumeFile.name} (${(resumeFile.size / 1024).toFixed(2)} KB)

[SYSTEM STATUS]: simulated (reason: ${smtpHost ? `Error: ${emailError}` : 'SMTP credentials not configured in environment variables'}).
================================================================================
      `);
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Application submitted successfully and notification email has been dispatched to ${adminEmail} automatically.`
        : `Application submitted successfully (Simulated notification email logged to server logs; SMTP environment variables not configured).`,
      application: newApplication
    });

  } catch (err) {
    console.error("Error processing job application:", err);
    return NextResponse.json({ error: "Internal server error occurred while processing your application." }, { status: 500 });
  }
}
