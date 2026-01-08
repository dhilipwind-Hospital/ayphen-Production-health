import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { v4 as uuid } from 'uuid';
import nodemailer from 'nodemailer';

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';
  issueDate: string;
  dueDate: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
  notes?: string;
  terms?: string;
  taxRate: number;
  discountRate: number;
  pdfUrl?: string;
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded';
  paymentMethod: string;
  transactionId?: string;
  stripePaymentIntentId?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

const router = Router();
const invoices: Invoice[] = [];
const payments: Payment[] = [];

const isAdminOrFinance = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST],
});

// Email service configuration
const emailService = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper: Generate invoice number
const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const count = invoices.length + 1;
  return `INV-${year}${month}-${String(count).padStart(4, '0')}`;
};

// Helper: Calculate amounts
const calculateAmounts = (items: any[], taxRate: number, discountRate: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const discountAmount = (subtotal * discountRate) / 100;
  const totalAmount = subtotal + taxAmount - discountAmount;
  return { subtotal, taxAmount, discountAmount, totalAmount };
};

// Helper: Send invoice email
const sendInvoiceEmail = async (invoice: Invoice) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: invoice.patientEmail,
      subject: `Invoice ${invoice.invoiceNumber} - Ayphen Care`,
      html: `
        <h2>Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${invoice.patientName},</p>
        <p>Please find your invoice details below:</p>
        <table border="1" cellpadding="10">
          <tr>
            <td><strong>Invoice Number:</strong></td>
            <td>${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td><strong>Issue Date:</strong></td>
            <td>${invoice.issueDate}</td>
          </tr>
          <tr>
            <td><strong>Due Date:</strong></td>
            <td>${invoice.dueDate}</td>
          </tr>
          <tr>
            <td><strong>Total Amount:</strong></td>
            <td>$${invoice.totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td>${invoice.status}</td>
          </tr>
        </table>
        <p>Please make payment by the due date.</p>
        <p>Thank you for choosing Ayphen Care!</p>
      `,
    };
    await emailService.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// GET all invoices
router.get('/', authenticate, isAdminOrFinance, (_req: Request, res: Response) => {
  res.json({ success: true, data: invoices });
});

// GET invoice by ID
router.get('/:id', authenticate, isAdminOrFinance, (req: Request, res: Response) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.json({ success: true, data: invoice });
});

// CREATE invoice
router.post('/', authenticate, isAdminOrFinance, (req: Request, res: Response) => {
  try {
    const { patientId, patientName, patientEmail, patientPhone, items, taxRate = 0, discountRate = 0, issueDate, dueDate, notes, terms } = req.body;

    if (!patientId || !patientName || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { subtotal, taxAmount, discountAmount, totalAmount } = calculateAmounts(items, taxRate, discountRate);

    const invoice: Invoice = {
      id: uuid(),
      invoiceNumber: generateInvoiceNumber(),
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      status: 'Draft',
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items,
      notes,
      terms,
      taxRate,
      discountRate,
      emailSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoices.push(invoice);
    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE invoice
router.put('/:id', authenticate, isAdminOrFinance, (req: Request, res: Response) => {
  try {
    const idx = invoices.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoices[idx].status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Can only edit draft invoices' });
    }

    const { items, taxRate, discountRate, notes, terms, issueDate, dueDate } = req.body;
    const { subtotal, taxAmount, discountAmount, totalAmount } = calculateAmounts(items, taxRate, discountRate);

    invoices[idx] = {
      ...invoices[idx],
      items,
      taxRate,
      discountRate,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      dueAmount: totalAmount - invoices[idx].paidAmount,
      notes,
      terms,
      issueDate: issueDate || invoices[idx].issueDate,
      dueDate: dueDate || invoices[idx].dueDate,
      updatedAt: new Date().toISOString(),
    };

    res.json({ success: true, data: invoices[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SEND invoice email
router.post('/:id/send', authenticate, isAdminOrFinance, async (req: Request, res: Response) => {
  try {
    const idx = invoices.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const invoice = invoices[idx];
    const emailSent = await sendInvoiceEmail(invoice);

    if (emailSent) {
      invoices[idx].emailSent = true;
      invoices[idx].emailSentAt = new Date().toISOString();
      invoices[idx].status = 'Sent';
      res.json({ success: true, data: invoices[idx], message: 'Invoice sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// RECORD payment
router.post('/:id/payment', authenticate, isAdminOrFinance, (req: Request, res: Response) => {
  try {
    const { amount, paymentMethod = 'Credit Card', transactionId, reference, notes } = req.body;
    const idx = invoices.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const invoice = invoices[idx];
    if (amount > invoice.dueAmount) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds due amount' });
    }

    const payment: Payment = {
      id: uuid(),
      invoiceId: req.params.id,
      amount,
      status: 'Completed',
      paymentMethod,
      transactionId,
      reference,
      notes,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    payments.push(payment);

    // Update invoice
    invoices[idx].paidAmount += amount;
    invoices[idx].dueAmount = invoices[idx].totalAmount - invoices[idx].paidAmount;
    invoices[idx].status = invoices[idx].dueAmount === 0 ? 'Paid' : 'Partially Paid';
    invoices[idx].updatedAt = new Date().toISOString();

    res.status(201).json({ success: true, data: payment, invoice: invoices[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET payments for invoice
router.get('/:id/payments', authenticate, isAdminOrFinance, (req: Request, res: Response) => {
  const invoicePayments = payments.filter(p => p.invoiceId === req.params.id);
  res.json({ success: true, data: invoicePayments });
});

// DELETE invoice
router.delete('/:id', authenticate, isAdminOrFinance, (req: Request, res: Response) => {
  try {
    const idx = invoices.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoices[idx].status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Can only delete draft invoices' });
    }

    invoices.splice(idx, 1);
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET billing statistics
router.get('/stats/overview', authenticate, isAdminOrFinance, (_req: Request, res: Response) => {
  const totalRevenue = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const pendingAmount = invoices.reduce((sum, i) => sum + i.dueAmount, 0);
  const overdueAmount = invoices
    .filter(i => new Date(i.dueDate) < new Date() && i.status !== 'Paid')
    .reduce((sum, i) => sum + i.dueAmount, 0);
  const collectionRate = invoices.length > 0 ? Math.round((totalRevenue / invoices.reduce((sum, i) => sum + i.totalAmount, 0)) * 100) : 0;

  res.json({
    success: true,
    data: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      collectionRate,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'Paid').length,
      pendingInvoices: invoices.filter(i => i.status === 'Pending' || i.status === 'Partially Paid').length,
      overdueInvoices: invoices.filter(i => new Date(i.dueDate) < new Date() && i.status !== 'Paid').length,
    },
  });
});

export default router;
