const express = require('express'); 
const router = express.Router(); 
const sgMail = require('@sendgrid/mail'); 
const nodemailer = require('nodemailer'); 
 // ===== ENV CONFIG ===== 
 const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY; 
 const VERIFIED_SENDER = 'fanohgejiujitsu@gmail.com'; 
 // Make sure this is verified in SendGrid  
 // ===== EMAIL SERVICE LAYER ===== 
 const useSendGrid = (apiKey) => {   
    sgMail.setApiKey(apiKey);      
    return async (mailOptions) => {     
        try {       
            await sgMail.send(mailOptions);       
            return { success: true };     
        } catch (error) {       
            console.error('SendGrid Email sending failed:', 
                error.response?.body || error.message);       
            return { success: false, error };     
        }   
    }; 
};  
            
// Optional: Use this if you want to switch to SMTP (not used in this setup) 
const useSMTP = (config) => {   
    const transporter = nodemailer.createTransport(config);      
    return async (mailOptions) => {     
        try {       
            await transporter.sendMail(mailOptions);       
            return { success: true };     
        } catch (error) {       
            console.error('SMTP Email sending failed:', error);       
            return { success: false, error };     
        }   
    }; 
};  

// Initialize SendGrid mail sender 
const sendEmail = useSendGrid(SENDGRID_API_KEY);  
// ===== ROUTES =====  
// Contact form submission 

router.post('/contact', async (req, res) => {   
    const { name, email, phone, message } = req.body;    
    try {     
        const result = await sendEmail({       
            to: VERIFIED_SENDER, // Send to your business email       
            from: VERIFIED_SENDER,       
            subject: 'New Contact Form Submission',       
            html: `         
            <h2>New Contact Form Submission</h2>         
            <p><strong>Name:</strong> ${name}</p>         
            <p><strong>Email:</strong> ${email}</p>         
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>         
            <p><strong>Message:</strong> ${message}</p>       `     
        });      
        
        if (result.success) {       
            res.status(200).json({ success: true, message: 'Message sent successfully' });     
        } else {       
            res.status(500).json({ success: false, message: 'Failed to send message' });     
        }   
    } catch (error) {     
        res.status(500).json({ success: false, message: error.message });   
    } 
});  
    
// Newsletter subscription 
router.post('/subscribe', async (req, res) => {   
    const { email } = req.body;    
    if (!email) {     
        return res.status(400).json({ success: false, message: 'Email is required' });   
    }    
    try {     
        // Optional: Save email to DB here      
        const result = await sendEmail({       
            to: email,       
            from: VERIFIED_SENDER,       
            subject: 'Newsletter Subscription Confirmation',       
            html: `         
            <h2>Thank you for subscribing!</h2>         
            <p>You'll now receive updates about new events and exclusive offers.</p>       
            `     
        });      
        
        if (result.success) {       
            res.status(200).json({ success: true, message: 'Subscription successful' });     
        } else {       
            res.status(500).json({ success: false, message: 'Failed to process subscription' });     
        }   
    } catch (error) {     
        res.status(500).json({ success: false, message: error.message });   
    } 
}); 
 
module.exports = router