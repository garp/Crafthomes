import nodemailer from 'nodemailer';
import { EMAIL_CONFIG, FRONTEND_URL } from '../../../config/server.js';

class EmailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: EMAIL_CONFIG.SMTP_HOST,
			port: EMAIL_CONFIG.SMTP_PORT,
			secure: EMAIL_CONFIG.SMTP_SECURE,
			auth: {
				user: EMAIL_CONFIG.SMTP_USER,
				pass: EMAIL_CONFIG.SMTP_PASSWORD,
			},
		});
	}

	isConfigured() {
		return Boolean(EMAIL_CONFIG.SMTP_USER && EMAIL_CONFIG.SMTP_PASSWORD && EMAIL_CONFIG.FROM_EMAIL);
	}

	async sendMentionInCommentEmail({ toEmail, toName, mentionedByName, taskName, taskId, projectId, commentHtml }) {
		try {
			if (!toEmail) return { success: false, error: 'Missing recipient email' };
			if (!this.isConfigured()) {
				// Do not throw - email should never break main flows
				console.warn('EmailService: SMTP not configured, skipping mention email');
				return { success: false, skipped: true };
			}

			// Build task URL with project path: /projects/{projectId}/task?taskId={taskId}
			let taskUrl = FRONTEND_URL;
			if (projectId && taskId) {
				taskUrl = `${FRONTEND_URL}/projects/${projectId}/task?taskId=${taskId}`;
			} else if (taskId) {
				taskUrl = `${FRONTEND_URL}/task?taskId=${taskId}`;
			}

			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: toEmail,
				subject: `${mentionedByName || 'Someone'} mentioned you in a comment${taskName ? ` • ${taskName}` : ''}`,
				html: this.getMentionInCommentTemplate({
					toName,
					mentionedByName,
					taskName,
					taskUrl,
					taskId,
					commentHtml,
				}),
			};

			const info = await this.transporter.sendMail(mailOptions);
			console.info('EmailService: mention email sent', { toEmail, messageId: info.messageId });
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending mention email:', error);
			return { success: false, error: error.message };
		}
	}

	async sendTimesheetReminderEmail({ toEmail, toName, employeeName, missedDays, lastTimesheetDate }) {
		try {
			if (!toEmail) return { success: false, error: 'Missing recipient email' };
			if (!this.isConfigured()) {
				console.warn('EmailService: SMTP not configured, skipping timesheet reminder email');
				return { success: false, skipped: true };
			}

			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: toEmail,
				subject: `Timesheet reminder${employeeName ? ` • ${employeeName}` : ''}`,
				html: this.getTimesheetReminderTemplate({ toName, employeeName, missedDays, lastTimesheetDate }),
			};

			const info = await this.transporter.sendMail(mailOptions);
			console.info('EmailService: timesheet reminder email sent', { toEmail, messageId: info.messageId });
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending timesheet reminder email:', error);
			return { success: false, error: error.message };
		}
	}

	getTimesheetReminderTemplate({ toName, employeeName, missedDays, lastTimesheetDate }) {
		const effectiveEmployee = employeeName || 'An employee';
		const missed = missedDays ? `${missedDays}` : 'some';
		const lastDateText = lastTimesheetDate ? `Last timesheet date: <strong>${lastTimesheetDate}</strong>` : '';
		return `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #6c63ff; color: white; padding: 16px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">Timesheet Reminder</h2>
        </div>
        <p>Hello ${toName || 'User'},</p>
        <p>This is a reminder that <strong>${effectiveEmployee}</strong> has missed timesheet entries for <strong>${missed}</strong> day(s).</p>
        ${lastDateText ? `<p style="color:#444;">${lastDateText}</p>` : ''}
        <div style="text-align:center; margin: 22px 0;">
          <a href="${FRONTEND_URL}/timesheet"
             style="background-color: #6c63ff; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Open Timesheet
          </a>
        </div>
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
	}

	getMentionInCommentTemplate({ toName, mentionedByName, taskName, taskUrl, taskId, commentHtml }) {
		return `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #6c63ff; color: white; padding: 16px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">You were mentioned</h2>
        </div>

        <p>Hello ${toName || 'User'},</p>
        <p><strong>${mentionedByName || 'Someone'}</strong> mentioned you in a comment${taskName ? ` on <strong>${taskName}</strong>` : ''}.</p>

        ${
					commentHtml
						? `<div style="background:#f9f9f9; padding: 14px; border-left: 4px solid #6c63ff; margin: 16px 0;">
              ${commentHtml}
            </div>`
						: ''
				}

        ${taskId ? `<p style="font-size: 13px; color: #666; margin-top: 8px;"><strong>Task ID:</strong> ${taskId}</p>` : ''}

        <div style="text-align:center; margin: 22px 0;">
          <a href="${taskUrl}"
             style="background-color: #6c63ff; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View in Estate Craft
          </a>
        </div>

        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
	}

	async sendOTPEmail(email, otp, name, options = {}) {
		try {
			if (!this.isConfigured()) {
				console.warn('EmailService: SMTP not configured, skipping OTP email');
				return { success: false, skipped: true };
			}
			const subject = options.purpose === 'login' ? 'Your login verification code' : 'Your verification code';
			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: email,
				subject,
				html: this.getOTPEmailTemplate(otp, name, options),
			};

			const info = await this.transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending OTP email:', error);
			return { success: false, error: error.message };
		}
	}

	async sendPasswordResetConfirmationEmail(email, name) {
		try {
			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: email,
				subject: 'Password Successfully Reset',
				html: this.getPasswordResetConfirmationTemplate(name),
			};

			const info = await this.transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending password reset confirmation email:', error);
			return { success: false, error: error.message };
		}
	}

	getOTPEmailTemplate(otp, name, options = {}) {
		const otpRef = options.otpRef || '';
		const copyUrl = otpRef ? `${FRONTEND_URL}/login/otp?ref=${encodeURIComponent(otpRef)}` : '';
		const isLogin = options.purpose === 'login';
		const heading = isLogin ? 'Your login verification code' : 'Your verification code';
		const intro = isLogin
			? 'Use the code below to sign in to your Estate Craft account.'
			: 'We received a request to reset your password. Use the code below to proceed.';

		return `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #6c63ff; color: white; padding: 16px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">${heading}</h2>
        </div>
        <p>Hello ${name || 'User'},</p>
        <p>${intro}</p>
        <div style="background-color: #f9f9f9; padding: 20px; font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 8px; border-left: 4px solid #6c63ff; margin: 20px 0; border-radius: 0 8px 8px 0;">
          ${otp}
        </div>
        ${copyUrl ? `
        <div style="text-align: center; margin: 22px 0;">
          <a href="${copyUrl}"
             style="background-color: #6c63ff; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Copy code
          </a>
        </div>
        ` : ''}
        <p style="font-size: 13px; color: #666;">This code is valid for 10 minutes only.</p>
        <p style="font-size: 13px; color: #666;">If you didn't request this, please ignore this email or contact support.</p>
        <p>Regards,<br><strong>Estate Craft Team</strong></p>
        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 24px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
	}

	getPasswordResetConfirmationTemplate(name) {
		const currentDate = new Date().toLocaleString('en-US', {
			dateStyle: 'long',
			timeStyle: 'short',
		});

		return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">✓ Password Successfully Reset</h2>
        </div>
        
        <p>Hello ${name || 'User'},</p>
        
        <p>Your password has been successfully reset for your Estate Craft account.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${currentDate}</p>
          <p style="margin: 5px 0;"><strong>Action:</strong> Password Reset</p>
        </div>
        
        <p><strong>What does this mean?</strong></p>
        <p>You can now log in to your account using your new password.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Security Notice:</strong> If you did not make this change, please contact our support team immediately as your account may be compromised.</p>
        </div>
        
        <p style="margin-top: 30px;">Thank you for using Estate Craft!</p>
        
        <p>Regards,<br><strong>Estate Craft Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
	}

	async sendClientInvitationEmail(email, name, userId) {
		try {
			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: email,
				subject: 'Welcome to Estate Craft - Client Invitation',
				html: this.getClientInvitationTemplate(name, userId),
			};

			const info = await this.transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending client invitation email:', error);
			return { success: false, error: error.message };
		}
	}

	async sendVendorInvitationEmail(email, name, userId) {
		try {
			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: email,
				subject: 'Welcome to Estate Craft - Vendor Invitation',
				html: this.getVendorInvitationTemplate(name, userId),
			};

			const info = await this.transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending vendor invitation email:', error);
			return { success: false, error: error.message };
		}
	}

	async sendInternalUserInvitationEmail(email, name, userId, roleName = 'Team Member') {
		try {
			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: email,
				subject: 'Welcome to Estate Craft - Team Invitation',
				html: this.getInternalUserInvitationTemplate(name, userId, roleName),
			};

			const info = await this.transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending internal user invitation email:', error);
			return { success: false, error: error.message };
		}
	}

	async sendClientContactInvitationEmail(email, name, userId) {
		try {
			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: email,
				subject: 'Welcome to Estate Craft - Client Contact Invitation',
				html: this.getClientContactInvitationTemplate(name, userId),
			};

			const info = await this.transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending client contact invitation email:', error);
			return { success: false, error: error.message };
		}
	}

	async sendVendorContactInvitationEmail(email, name, userId) {
		try {
			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: email,
				subject: 'Welcome to Estate Craft - Vendor Contact Invitation',
				html: this.getVendorContactInvitationTemplate(name, userId),
			};

			const info = await this.transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending vendor contact invitation email:', error);
			return { success: false, error: error.message };
		}
	}

	getClientInvitationTemplate(name, userId) {
		const onboardingUrl = `${FRONTEND_URL}/login/onboarding/${userId}`;

		return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">🏠 Welcome to Estate Craft</h2>
        </div>
        
        <p>Hello ${name || 'Valued Client'},</p>
        
        <p>You have been invited to join Estate Craft as a <strong>Client</strong>. We're excited to have you on board!</p>
        
        <p>Estate Craft is your comprehensive solution for managing construction projects, tracking progress, and collaborating with our team.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>What's next?</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Accept your invitation</li>
            <li>Set up your password</li>
            <li>Start managing your projects</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${onboardingUrl}" 
             style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${onboardingUrl}" style="color: #2196F3; word-break: break-all;">${onboardingUrl}</a>
        </p>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <p style="margin: 0;"><strong>💡 Tip:</strong> This invitation link is unique to you. Please complete the onboarding process to access your account.</p>
        </div>
        
        <p style="margin-top: 30px;">If you have any questions or need assistance, feel free to reach out to our support team.</p>
        
        <p>Regards,<br><strong>Estate Craft Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.<br>
          If you did not expect this invitation, please contact our support team.
        </p>
      </div>
    `;
	}

	getVendorInvitationTemplate(name, userId) {
		const onboardingUrl = `${FRONTEND_URL}/login/onboarding/${userId}`;

		return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">🔧 Welcome to Estate Craft</h2>
        </div>
        
        <p>Hello ${name || 'Valued Vendor'},</p>
        
        <p>You have been invited to join Estate Craft as a <strong>Vendor</strong>. We're thrilled to have you as part of our network!</p>
        
        <p>Estate Craft is a comprehensive platform for managing construction projects, tracking work progress, and streamlining collaboration with project teams.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>What's next?</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Accept your invitation</li>
            <li>Set up your password</li>
            <li>Access your vendor dashboard</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${onboardingUrl}" 
             style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${onboardingUrl}" style="color: #FF9800; word-break: break-all;">${onboardingUrl}</a>
        </p>
        
        <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
          <p style="margin: 0;"><strong>💡 Tip:</strong> This invitation link is unique to you. Please complete the onboarding process to access your vendor account.</p>
        </div>
        
        <p style="margin-top: 30px;">If you have any questions or need assistance, feel free to reach out to our support team.</p>
        
        <p>Regards,<br><strong>Estate Craft Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.<br>
          If you did not expect this invitation, please contact our support team.
        </p>
      </div>
    `;
	}

	getInternalUserInvitationTemplate(name, userId, roleName) {
		const onboardingUrl = `${FRONTEND_URL}/login/onboarding/${userId}`;

		return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">👋 Welcome to the Team!</h2>
        </div>
        
        <p>Hello ${name || 'Team Member'},</p>
        
        <p>You have been invited to join Estate Craft as a <strong>${roleName}</strong>. Welcome aboard!</p>
        
        <p>Estate Craft is our comprehensive project management platform for construction projects. You'll be able to collaborate with the team, manage tasks, and track project progress.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Getting Started:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Accept your invitation</li>
            <li>Create your secure password</li>
            <li>Access your dashboard and start collaborating</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${onboardingUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accept Invitation & Set Up Account
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${onboardingUrl}" style="color: #4CAF50; word-break: break-all;">${onboardingUrl}</a>
        </p>
        
        <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <p style="margin: 0;"><strong>💡 Security Notice:</strong> This invitation link is unique and secure. Complete your onboarding to access the platform.</p>
        </div>
        
        <p style="margin-top: 30px;">Looking forward to working with you!</p>
        
        <p>Regards,<br><strong>Estate Craft Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.<br>
          If you did not expect this invitation, please contact support immediately.
        </p>
      </div>
    `;
	}

	getClientContactInvitationTemplate(name, userId) {
		const onboardingUrl = `${FRONTEND_URL}/login/onboarding/${userId}`;

		return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">🏠 Welcome to Estate Craft</h2>
        </div>
        
        <p>Hello ${name || 'Team Member'},</p>
        
        <p>You have been added as a <strong>Client Contact</strong> on Estate Craft. You'll now have access to your organization's projects and updates.</p>
        
        <p>Estate Craft enables you to track project progress, communicate with the team, and stay informed about all developments.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>What's next?</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Accept your invitation</li>
            <li>Set up your password</li>
            <li>View your organization's projects</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${onboardingUrl}" 
             style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${onboardingUrl}" style="color: #2196F3; word-break: break-all;">${onboardingUrl}</a>
        </p>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <p style="margin: 0;"><strong>💡 Tip:</strong> This invitation link is unique to you. Complete the onboarding process to access your account.</p>
        </div>
        
        <p style="margin-top: 30px;">If you have any questions, please reach out to your organization administrator or our support team.</p>
        
        <p>Regards,<br><strong>Estate Craft Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.<br>
          If you did not expect this invitation, please contact your administrator.
        </p>
      </div>
    `;
	}

	getVendorContactInvitationTemplate(name, userId) {
		const onboardingUrl = `${FRONTEND_URL}/login/onboarding/${userId}`;

		return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">🔧 Welcome to Estate Craft</h2>
        </div>
        
        <p>Hello ${name || 'Team Member'},</p>
        
        <p>You have been added as a <strong>Vendor Contact</strong> on Estate Craft. You'll now have access to your organization's projects and work orders.</p>
        
        <p>Estate Craft helps you manage project tasks, track work progress, and collaborate effectively with project teams.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>What's next?</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Accept your invitation</li>
            <li>Set up your password</li>
            <li>Access your vendor dashboard</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${onboardingUrl}" 
             style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${onboardingUrl}" style="color: #FF9800; word-break: break-all;">${onboardingUrl}</a>
        </p>
        
        <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
          <p style="margin: 0;"><strong>💡 Tip:</strong> This invitation link is unique to you. Complete the onboarding process to access your account.</p>
        </div>
        
        <p style="margin-top: 30px;">If you have any questions, please reach out to your organization administrator or our support team.</p>
        
        <p>Regards,<br><strong>Estate Craft Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.<br>
          If you did not expect this invitation, please contact your administrator.
        </p>
      </div>
    `;
	}

	/**
	 * Send email notification when a task is assigned to a user
	 */
	async sendTaskAssignmentEmail({
		toEmail,
		toName,
		taskName,
		taskId,
		projectId,
		assignedByName,
		projectName,
		priority,
		dueDate,
	}) {
		try {
			if (!toEmail) return { success: false, error: 'Missing recipient email' };
			if (!this.isConfigured()) {
				console.warn('EmailService: SMTP not configured, skipping task assignment email');
				return { success: false, skipped: true };
			}

			// Build task URL with project path: /projects/{projectId}/task?taskId={taskId}
			let taskUrl = FRONTEND_URL;
			if (projectId && taskId) {
				taskUrl = `${FRONTEND_URL}/projects/${projectId}/task?taskId=${taskId}`;
			} else if (taskId) {
				taskUrl = `${FRONTEND_URL}/task?taskId=${taskId}`;
			}

			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: toEmail,
				subject: `New Task Assigned: ${taskName}${projectName ? ` • ${projectName}` : ''}`,
				html: this.getTaskAssignmentTemplate({
					toName,
					taskName,
					taskId,
					taskUrl,
					assignedByName,
					projectName,
					priority,
					dueDate,
				}),
			};

			const info = await this.transporter.sendMail(mailOptions);
			console.info('EmailService: task assignment email sent', { toEmail, messageId: info.messageId });
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending task assignment email:', error);
			return { success: false, error: error.message };
		}
	}

	async sendMOMShareEmail({ toEmails, momData, sharedByName }) {
		try {
			if (!toEmails || toEmails.length === 0) return { success: false, error: 'Missing recipient emails' };
			if (!this.isConfigured()) {
				console.warn('EmailService: SMTP not configured, skipping MOM share email');
				return { success: false, skipped: true };
			}

			const mailOptions = {
				from: `"Estate Craft" <${EMAIL_CONFIG.FROM_EMAIL}>`,
				to: toEmails.join(','),
				subject: `Meeting Minutes: ${momData.title}${momData.project?.name ? ` • ${momData.project.name}` : ''}`,
				html: this.getMOMShareTemplate({ momData, sharedByName }),
			};

			const info = await this.transporter.sendMail(mailOptions);
			console.info('EmailService: MOM share email sent', { toEmails, messageId: info.messageId });
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending MOM share email:', error);
			return { success: false, error: error.message };
		}
	}

	getMOMShareTemplate({ momData, sharedByName }) {
		const statusColors = {
			PENDING: '#ffc107',
			SCHEDULED: '#17a2b8',
			COMPLETED: '#28a745',
			CANCELLED: '#dc3545',
		};
		const statusColor = statusColors[momData.momStatus] || '#6c757d';

		const formattedDate = momData.startDate
			? new Date(momData.startDate).toLocaleDateString('en-US', { dateStyle: 'full' })
			: 'Not specified';

		const attendeesList =
			momData.momAttendees?.length > 0
				? momData.momAttendees
						.map(a => `<li style="margin: 5px 0;">${a.user?.name || 'Unknown'} (${a.user?.email || 'N/A'})</li>`)
						.join('')
				: '<li style="color: #666;">No attendees listed</li>';

		const attachmentsList =
			momData.attachments?.length > 0
				? momData.attachments
						.map(
							att =>
								`<li style="margin: 5px 0;"><a href="${att.url}" style="color: #6c63ff;">${att.name || 'Attachment'}</a></li>`
						)
						.join('')
				: '';

		return `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #6c63ff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">📝 Minutes of Meeting</h2>
        </div>
        
        <p>Hello,</p>
        
        <p><strong>${sharedByName || 'A team member'}</strong> has shared the following meeting minutes with you.</p>
        
        <!-- Meeting Title & Status -->
        <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #6c63ff; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">${momData.title}</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; width: 140px; color: #666;"><strong>Status:</strong></td>
              <td style="padding: 8px 0;">
                <span style="background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">${momData.momStatus}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Project:</strong></td>
              <td style="padding: 8px 0;">${momData.project?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            ${
							momData.heldOn
								? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Held On:</strong></td>
              <td style="padding: 8px 0;">${momData.heldOn}</td>
            </tr>
            `
								: ''
						}
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Created By:</strong></td>
              <td style="padding: 8px 0;">${momData.createdByUser?.name || 'N/A'} (${momData.createdByUser?.email || ''})</td>
            </tr>
          </table>
        </div>

        <!-- Purpose -->
        ${
					momData.purpose
						? `
        <div style="margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #6c63ff; padding-bottom: 5px; display: inline-block;">Purpose</h4>
          <p style="margin: 10px 0; color: #444; line-height: 1.6;">${momData.purpose}</p>
        </div>
        `
						: ''
				}

        <!-- Attendees -->
        <div style="margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #6c63ff; padding-bottom: 5px; display: inline-block;">Attendees</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #444;">
            ${attendeesList}
          </ul>
        </div>

        <!-- Attachments -->
        ${
					attachmentsList
						? `
        <div style="margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #6c63ff; padding-bottom: 5px; display: inline-block;">Attachments</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${attachmentsList}
          </ul>
        </div>
        `
						: ''
				}

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          This email was sent via Estate Craft. Please do not reply to this email.
        </p>
      </div>
    `;
	}

	getTaskAssignmentTemplate({ toName, taskName, taskId, taskUrl, assignedByName, projectName, priority, dueDate }) {
		const priorityColors = {
			LOW: '#28a745',
			MEDIUM: '#ffc107',
			HIGH: '#fd7e14',
			URGENT: '#dc3545',
		};
		const priorityColor = priorityColors[priority] || '#6c757d';

		const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : null;

		return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #6c63ff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">📋 New Task Assigned</h2>
        </div>
        
        <p>Hello ${toName || 'Team Member'},</p>
        
        <p><strong>${assignedByName || 'Someone'}</strong> has assigned you a new task${projectName ? ` on <strong>${projectName}</strong>` : ''}.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #6c63ff; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${taskName}</h3>
          
          ${
						priority
							? `
          <p style="margin: 5px 0;">
            <strong>Priority:</strong> 
            <span style="background-color: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${priority}</span>
          </p>
          `
							: ''
					}
          
          ${
						formattedDueDate
							? `
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formattedDueDate}</p>
          `
							: ''
					}
          
          ${
						projectName
							? `
          <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
          `
							: ''
					}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${taskUrl}" 
             style="background-color: #6c63ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View Task
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${taskUrl}" style="color: #6c63ff; word-break: break-all;">${taskUrl}</a>
        </p>
        
        <p style="margin-top: 30px;">Good luck with your task!</p>
        
        <p>Regards,<br><strong>Estate Craft Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
	}
}

export default new EmailService();
