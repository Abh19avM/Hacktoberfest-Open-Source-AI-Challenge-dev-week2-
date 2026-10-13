export const SAMPLE_INVOICES = [
  {
    id: 'sample-1',
    name: 'AWS Cloud Services (Monthly Compute)',
    badge: 'Cloud Hosting',
    categoryHint: 'Software & Infrastructure',
    deductibleRate: 100,
    text: `AMAZON WEB SERVICES, INC.
INVOICE NUMBER: INV-AWS-9081248
INVOICE DATE: October 01, 2026
DUE DATE: October 15, 2026
ACCOUNT ID: 4920-1892-3310

BILL TO:
Alex Rivera (Independent Developer)
742 Evergreen Terrace, Suite 4B
Portland, OR 97201

LINE ITEMS:
1. Amazon Elastic Compute Cloud (EC2) - Production API Cluster: $148.50
2. Amazon Simple Storage Service (S3) - Database Backups (320 GB): $7.36
3. Amazon RDS PostgreSQL - Multi-AZ db.t4g.medium: $68.20
4. Route 53 DNS & CloudFront Edge Distribution: $14.15

SUBTOTAL: $238.21
ESTIMATED TAX (0.00%): $0.00
TOTAL AMOUNT DUE: $238.21 USD
PAYMENT METHOD: Visa ending in 4092 (Auto-debited)
STATUS: PAID`,
  },
  {
    id: 'sample-2',
    name: 'Apex Studio (UI/UX Subcontractor)',
    badge: 'Contract Labor',
    categoryHint: 'Professional Services',
    deductibleRate: 100,
    text: `APEX DIGITAL DESIGN LLC
Tax ID / EIN: 84-2910481
INVOICE #: APX-2026-042
DATE: October 08, 2026
PAYMENT TERMS: Net 15

CLIENT:
Alex Rivera Consulting
Portland, OR 97201

PROJECT: Client Portal Redesign Sprint 2
SERVICES RENDERED:
1. Mobile UX Wireframes & Prototype (20 hrs @ $85/hr): $1,700.00
2. Design System Tokens & Figma Component Library (12 hrs @ $85/hr): $1,020.00
3. Client User Testing & Synthesis Report: $450.00

SUBTOTAL: $3,170.00
STATE SALES TAX: $0.00 (Exempt Professional Service)
TOTAL: $3,170.00 USD
PAYABLE TO: Apex Digital Design LLC via ACH Wire
NOTE: Contractor 1099-NEC required at year-end (> $600).`,
  },
  {
    id: 'sample-3',
    name: 'Bistro Voltaire (Client Dinner)',
    badge: '50% Meal Limit',
    categoryHint: 'Business Meals',
    deductibleRate: 50,
    text: `BISTRO VOLTAIRE RESTAURANT
148 Market Street, San Francisco, CA 94105
Tel: (415) 555-0199
RECEIPT #: BV-88410
DATE: Oct 09, 2026 8:42 PM
SERVER: Jean-Luc
TABLE: 14 (Guests: 3)

ORDER DETAILS:
1x Pan-Seared Scallops ........... $42.00
2x Dry-Aged Ribeye Steak ........ $136.00
1x Roasted Wild Mushrooms ....... $18.00
1x Bottle Chateau Margaux ....... $125.00
3x Espresso ..................... $15.00

SUBTOTAL: $336.00
SF Mandate Surcharge (4.5%): $15.12
CA Sales Tax (8.625%): $30.28
GRATUITY (20%): $70.00
TOTAL CHARGED: $451.40 USD
PAYMENT: Mastercard ending in 8812

BUSINESS PURPOSE: Dinner with Enterprise Client CTO (SaaS Retainer Renewal Pitch).
ATTENDEES: Alex Rivera, David Chen (CTO, Horizon Labs), Sarah Miller (VP Eng).`,
  },
  {
    id: 'sample-4',
    name: 'B&H Photo (Dell 4K Work Monitor)',
    badge: 'Equipment / Sec 179',
    categoryHint: 'Hardware & Tech Gear',
    deductibleRate: 100,
    text: `B&H PHOTO VIDEO PRO AUDIO
420 9th Ave, New York, NY 10001
ORDER # 109823441
INVOICE DATE: October 03, 2026

SHIP TO:
Alex Rivera Development Office
Portland, OR 97201

ITEMS PURCHASED:
1. Dell UltraSharp U3224KB 31.5" 6K HDR Monitor: $1,499.99
   Serial Number: CN-0M892-742-18A
2. CalDigit TS4 Thunderbolt 4 Docking Station: $399.95
3. High-Speed Braided Thunderbolt 4 Cable 2m: $49.00

SUBTOTAL: $1,948.94
SHIPPING & HANDLING: FREE
SALES TAX: $0.00 (Oregon Delivery - 0% State Tax)
TOTAL PAID: $1,948.94 USD
PAYMENT METHOD: Apple Pay (Business Amex)`,
  },
  {
    id: 'sample-5',
    name: 'Suspicious Cash Receipt (Audit Flag Demo)',
    badge: 'Audit Alert',
    categoryHint: 'Incomplete / High Risk',
    deductibleRate: 0,
    text: `QUICK CASH RECEIPT
Store: Corner Mart & Electronics
DATE: Recent (No specific timestamp)
RECEIPT NO: 0012

Items:
Miscellaneous Services & Hardware Supplies: $850.00
Paid in Cash: $850.00

TOTAL: $850.00
NO TAX ID PROVIDED. NO ITEMIZATION. ROUND SUM.`,
  },
];
