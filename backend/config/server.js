import dotenv from 'dotenv';

dotenv.config({
	path: `./.env.${process.env.NODE_ENV}`,
});

export const { REDIS_URL } = process.env;

export const SERVER = {
	NODE_ENV: process.env.NODE_ENV,
	// Number(undefined) is NaN, and NaN is not nullish, so `?? 3000` would not work.
	// Use a safe parse with fallback for production platforms that inject PORT.
	// NOTE: 2nd argument is radix (base). It must be 10 here.
	PORT: Number.parseInt(process.env.PORT, 5005) || 5005,
	HOST_URL: process.env.HOST_URL ?? 'http://localhost:5005',
	CLIENT_ORG: process.env.CLIENT_ORG ?? 'BYTIVE',
};
console.log('Running App : ', process.env.CLIENT_ORG);

export const AWS_CONFIG = {
	ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
	SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
	REGION: process.env.AWS_REGION,
	BUCKET_NAME: process.env.AWS_BUCKET_NAME,
};

export const CORS = {
	ORIGIN: process.env.CORS_ORIGIN,
	CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
};

export const JWT = {
	ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'access_secret',
	REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'refresh',
	ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION ?? '5d',
	ACCESS_EXPIRATION_IN_SECONDS: process.env.JWT_ACCESS_EXPIRATION_IN_SECONDS ?? 60 * 60 * 24 * 5,
	REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION ?? '15d',
	REFRESH_EXPIRATION_IN_SECONDS: process.env.JWT_REFRESH_EXPIRATION_IN_SECONDS ?? 60 * 60 * 24 * 15,
};

export const PASSWORD = {
	ROUND: Number(process.env.PASSWORD_ROUND),
	FORGET_PASSWORD_EXPIRATION: Number(process.env.FORGET_PASSWORD_EXPIRATION) || 15, // 15 minutes default
};

export const PDF_SERVICE = {
	URL: process.env.HTML_TO_PDF,
};
export const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

export const EMAIL_CONFIG = {
	SMTP_HOST: process.env.SMTP_HOST ?? 'smtp.gmail.com',
	SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
	SMTP_SECURE: process.env.SMTP_SECURE === 'true',
	SMTP_USER: process.env.SMTP_USER ?? '',
	SMTP_PASSWORD: process.env.SMTP_PASSWORD ?? '',
	FROM_EMAIL: process.env.FROM_EMAIL ?? 'no-reply@estatecraft.com',
};

export const REDIS = {
	URL: process.env.REDIS_URL || 'redis://default:Bytive%40100@194.238.19.238:6363',
	PERMISSION_CACHE_TTL: Number(process.env.REDIS_PERMISSION_TTL) || 172800, // 48 hours
};

export const MEDIA_COMPRESSOR = {
	URL: process.env.MEDIA_COMPRESSOR_URL || 'https://assets-compress.bytive.in',
	AES_KEY: process.env.MEDIA_COMPRESSOR_AES_KEY || '',
	TIMEOUT: Number(process.env.MEDIA_COMPRESSOR_TIMEOUT) || 300000, // 5 minutes default
};
