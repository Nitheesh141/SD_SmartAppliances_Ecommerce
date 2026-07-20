import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendPasswordResetEmail = async (
  toEmail: string,
  userName: string,
  code: string
): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"SD Smart Appliances" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Password Reset Code – SD Smart Appliances",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Password Reset</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#D71920,#b8141a);padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">SD Smart Appliances</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Password Reset Request</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#333;font-size:16px;margin:0 0 12px;">Hello <strong>${userName}</strong>,</p>
                    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      We received a request to reset your SD Smart Appliances account password. Use the verification code below to proceed. This code is valid for <strong>10 minutes</strong>.
                    </p>
                    <!-- OTP Box -->
                    <div style="background:#f9f9f9;border:2px dashed #D71920;border-radius:10px;padding:24px;text-align:center;margin:0 0 28px;">
                      <p style="color:#999;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Your Verification Code</p>
                      <span style="font-size:42px;font-weight:800;color:#D71920;letter-spacing:10px;display:block;">${code}</span>
                    </div>
                    <p style="color:#555;font-size:13px;line-height:1.6;margin:0 0 8px;">
                      If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
                    </p>
                    <p style="color:#888;font-size:12px;margin:0;">
                      For your security, do not share this code with anyone.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
                    <p style="color:#aaa;font-size:12px;margin:0;">
                      © ${new Date().getFullYear()} SD Smart Appliances. All rights reserved.<br/>
                      This is an automated message, please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendServiceRequestConfirmationEmail = async (
  toEmail: string,
  customerName: string,
  ticketId: string,
  mobileNumber: string,
  productName: string,
  requestDate: string
): Promise<void> => {
  const transporter = createTransporter();

  const trackUrl = `http://localhost:3000/service-request/track?ticket=${encodeURIComponent(ticketId)}&mobile=${encodeURIComponent(mobileNumber)}`;

  const mailOptions = {
    from: `"SD Smart Appliances" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your Service Request Ticket ${ticketId} has been Submitted – SD Smart Appliances`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Service Request Confirmation</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#D71920,#b8141a);padding:32px 40px;text-align:center;">
                    <img src="http://localhost:3000/SD-logo.png" alt="SD SMART" style="height:50px;width:auto;margin-bottom:12px;display:inline-block;" />
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">SD Smart Appliances</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Service Request Submitted</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#333;font-size:16px;margin:0 0 12px;">Dear <strong>${customerName}</strong>,</p>
                    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Thank you for contacting SD Smart Appliances. We have received your service request. A ticket has been created, and our service team is reviewing it.
                    </p>
                    <!-- Ticket Details Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:20px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#666;width:40%;"><strong>Ticket ID:</strong></td>
                        <td style="padding:6px 0;font-size:13px;color:#333;font-weight:bold;">${ticketId}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#666;"><strong>Product:</strong></td>
                        <td style="padding:6px 0;font-size:13px;color:#333;">${productName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#666;"><strong>Registered Mobile:</strong></td>
                        <td style="padding:6px 0;font-size:13px;color:#333;">${mobileNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#666;"><strong>Request Date:</strong></td>
                        <td style="padding:6px 0;font-size:13px;color:#333;">${requestDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#666;"><strong>Service Timeline:</strong></td>
                        <td style="padding:6px 0;font-size:13px;color:#D71920;font-weight:bold;">Within 2–7 Working Days</td>
                      </tr>
                    </table>
                    
                    <!-- Track Button -->
                    <div style="text-align:center;margin-bottom:28px;">
                      <a href="${trackUrl}" target="_blank" style="background-color:#D71920;color:#ffffff;padding:12px 30px;font-size:14px;font-weight:bold;text-decoration:none;border-radius:6px;display:inline-block;box-shadow:0 4px 10px rgba(215,25,32,0.3);text-transform:uppercase;letter-spacing:0.5px;">Track My Service Request</a>
                    </div>
                    
                    <p style="color:#555;font-size:13px;line-height:1.6;margin:0 0 8px;">
                      If you have any questions or would like to provide more details about the issue, please reply to this email or contact our support team.
                    </p>
                    <p style="color:#888;font-size:12px;margin:0;">
                      For your convenience, you can bookmark the tracking link or visit our website to check status.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
                    <p style="color:#aaa;font-size:12px;margin:0;">
                      © ${new Date().getFullYear()} SD Smart Appliances. All rights reserved.<br/>
                      This is an automated message, please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
