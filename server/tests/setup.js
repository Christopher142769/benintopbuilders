process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-characters!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-characters!';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/benin-top-builders-test';
process.env.SMTP_HOST = '';
