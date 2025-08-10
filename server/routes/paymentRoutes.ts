import { Router } from 'express';
import { storage } from '../storage';
import { ccavenueService } from '../services/ccavenueService';
import { applicantAuth } from '../middleware/applicantAuth';

const router = Router();

// Create payment
router.post('/create', applicantAuth, async (req: any, res) => {
  try {
    const { amount, applicantId } = req.body;
    
    if (!amount || !applicantId) {
      return res.status(400).json({ message: "Amount and applicant ID are required" });
    }

    // Verify applicant exists
    const applicant = await storage.getApplicantById(applicantId);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    // Check if payment already exists
    const existingPayment = await storage.getPaymentByApplicantId(applicantId);
    if (existingPayment && existingPayment.status === 'success') {
      return res.status(400).json({ message: "Payment already completed" });
    }

    // Create payment record
    const payment = await storage.createPayment({
      applicantId,
      amount: parseFloat(amount),
      status: 'pending',
      paymentMethod: 'ccavenue'
    });

    // Generate CCAvenue form data
    const formData = ccavenueService.generatePaymentForm({
      orderId: payment.id,
      amount: payment.amount,
      customerName: applicant.name,
      customerEmail: applicant.email,
      customerPhone: applicant.mobile,
      redirectUrl: `${req.protocol}://${req.get('host')}/payment/callback`,
      cancelUrl: `${req.protocol}://${req.get('host')}/payment/cancel`
    });

    res.json({
      paymentId: payment.id,
      formData,
      action: ccavenueService.getPaymentURL()
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({ message: "Failed to create payment" });
  }
});

// Payment callback
router.post('/callback', async (req, res) => {
  try {
    const encResponse = req.body.encResp;
    if (!encResponse) {
      return res.status(400).json({ message: "Invalid callback data" });
    }

    const decryptedData = ccavenueService.decrypt(encResponse);
    const paymentData = ccavenueService.parseResponse(decryptedData);

    // Update payment status
    const payment = await storage.updatePaymentStatus(
      paymentData.order_id,
      paymentData.order_status === 'Success' ? 'success' : 'failed',
      {
        transactionId: paymentData.tracking_id,
        bankRefNo: paymentData.bank_ref_no,
        responseData: paymentData
      }
    );

    if (paymentData.order_status === 'Success') {
      // Update applicant status to paid
      await storage.updateApplicantStatus(payment.applicantId, 'paid');
      
      // Send success email
      const applicant = await storage.getApplicantById(payment.applicantId);
      if (applicant) {
        // Email notification would go here
      }
    }

    // Redirect to appropriate page
    const redirectUrl = paymentData.order_status === 'Success' 
      ? '/payment-success' 
      : '/payment-failed';
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Payment callback error:", error);
    res.redirect('/payment-failed');
  }
});

// Payment status check
router.get('/status/:paymentId', applicantAuth, async (req: any, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await storage.getPaymentById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      createdAt: payment.createdAt,
      transactionId: payment.transactionId
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    res.status(500).json({ message: "Failed to check payment status" });
  }
});

// Admin payment management
router.get('/', async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { page = 1, limit = 50, status = '' } = req.query;
    const payments = await storage.getPayments({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

export { router as paymentRoutes };