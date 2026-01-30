import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RESEND_API_KEY } from '$env/static/private';

// Rate limiting map
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

function getClientIP(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	const realIP = request.headers.get('x-real-ip');
	return forwarded?.split(',')[0] || realIP || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
	const now = Date.now();
	const requests = rateLimitMap.get(ip) || [];
	const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

	if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
		const oldestRequest = Math.min(...recentRequests);
		return {
			allowed: false,
			remaining: 0,
			resetTime: oldestRequest + RATE_LIMIT_WINDOW
		};
	}

	recentRequests.push(now);
	rateLimitMap.set(ip, recentRequests);

	// Cleanup old entries
	if (rateLimitMap.size > 100) {
		for (const [key, timestamps] of rateLimitMap.entries()) {
			const filtered = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
			if (filtered.length === 0) {
				rateLimitMap.delete(key);
			} else {
				rateLimitMap.set(key, filtered);
			}
		}
	}

	return {
		allowed: true,
		remaining: MAX_REQUESTS_PER_WINDOW - recentRequests.length,
		resetTime: now + RATE_LIMIT_WINDOW
	};
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const ip = getClientIP(request);
		const rateLimit = checkRateLimit(ip);

		if (!rateLimit.allowed) {
			const resetMinutes = Math.ceil((rateLimit.resetTime - Date.now()) / (60 * 1000));
			return json(
				{ error: `Too many requests. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.` },
				{ status: 429 }
			);
		}

		const body = await request.json();
		const { name, email, message } = body;

		if (!name || !email || !message) {
			return json({ error: 'All fields are required' }, { status: 400 });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		if (!RESEND_API_KEY) {
			console.error('RESEND_API_KEY is not set');
			return json({ error: 'Email service is not configured' }, { status: 500 });
		}

		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${RESEND_API_KEY}`,
			},
			body: JSON.stringify({
				from: 'onboarding@resend.dev',
				to: 'yomalpraveen614@gmail.com',
				subject: `Portfolio Contact: ${name}`,
				html: `
					<h2>New Contact Form Submission</h2>
					<p><strong>Name:</strong> ${name}</p>
					<p><strong>Email:</strong> ${email}</p>
					<p><strong>Message:</strong></p>
					<p>${message.replace(/\n/g, '<br>')}</p>
				`,
				reply_to: email,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('Resend API error:', errorData);
			throw new Error('Failed to send email');
		}

		return json({ message: "Thank you for your message! I'll get back to you soon.", success: true });
	} catch (error) {
		console.error('Error sending email:', error);
		return json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
	}
};
