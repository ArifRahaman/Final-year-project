import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
  try {
    console.log("📨 Preparing to send email...");
    console.log("➡️ To:", to);
    console.log("➡️ Subject:", subject);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD, // Gmail App Password
      },
    });

    // Verify transporter
    await transporter.verify();
    console.log("✅ SMTP transporter verified");

    const info = await transporter.sendMail({
      from: `"Course Platform" <${process.env.USER_EMAIL}>`,
      to,
      subject,
      text,
    });

    console.log("✅ Email sent successfully!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📬 Response:", info.response);

    return true;
  } catch (error) {
    console.error("❌ Failed to send email");
    console.error(error);
    return false;
  }
};

export default sendEmail;
