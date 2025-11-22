// Minimal email function without nodemailer
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // Just log the email for now
  // console.log('🚨 ACTUAL EMAIL WOULD BE SENT:');
  // console.log('================================');
  // console.log('To:', to);
  // console.log('Subject:', subject);
  // console.log('Body:', html.replace(/<[^>]*>/g, ''));
  // console.log('================================');
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true, message: 'Email logged to console' };
}