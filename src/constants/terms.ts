/**
 * Pre-order terms, refund policy and privacy policy that shops agree to before requesting a
 * pre-order (TermsModal). Standard drafts written from how the portal works; have them reviewed.
 *
 * TERMS_VERSION must match TERMS_VERSION in hiteffect-dis-backend (src/constants/terms.js).
 * Change both whenever the text changes: shops are then asked to agree again, and each request
 * records the version it was made under.
 */
export const TERMS_VERSION = '2026-10-30'

export interface TermsSection {
  id: string
  title: string
  /** Numbered clauses. */
  clauses: string[]
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'preorder',
    title: 'Pre-order terms',
    clauses: [
      'This portal is for registered shops buying from Deck Drive Distribution at wholesale prices. Prices are per box and include VAT. The price of a pre-order is fixed when we make you an offer.',
      'A request is not an order and costs nothing. It tells us how many boxes you would like. You can change or withdraw it until the request deadline.',
      'Supply from the publisher is limited. After the deadline we share the boxes between all requests using your tier and purchase history. You may be offered fewer boxes than you asked for, or none.',
      'If you are offered boxes, you can accept all or part of the offer before it expires. Accepting is a firm order. Offers you do not answer in time expire, and repeatedly letting offers expire may be taken into account in future pre-orders.',
      'When you accept, you pay a deposit (the percentage shown on the pre-order, 30% unless stated otherwise) on the goods. Your boxes are confirmed once we have checked the deposit.',
      'When the stock arrives we ask for the balance: the rest of the goods, plus shipping if you chose Thailand Post EMS. It must be paid by 23:59 (Bangkok time) on the payment deadline shown.',
      'If the balance is not paid by the deadline, the order is cancelled, the deposit is kept, and the boxes are released.',
      'Release and arrival dates come from the publisher and can change. We will tell you about any change through the portal and by e-mail.',
      'If fewer boxes arrive than we were promised, accepted orders are reduced fairly in the same way, and any deposit paid for boxes you will not receive is refunded. If the publisher cancels, we cancel the pre-order and refund any deposit in full.',
      'Delivery is by Thailand Post EMS to the address in your profile, or pick-up at our warehouse once the order is paid. Please check parcels when they arrive.',
    ],
  },
  {
    id: 'refund',
    title: 'Refund and return policy',
    clauses: [
      'Deposits are not refundable when you cancel an accepted order or do not pay the balance in time.',
      'Deposits are refunded in full when we cancel a pre-order, and in part when fewer boxes arrive than you accepted (see the pre-order terms).',
      'Products are sealed trading card and board game products. We do not accept returns for change of mind, and we cannot refund for the contents of booster packs or boxes.',
      'If a product arrives damaged, or you receive the wrong product or quantity, tell us within 3 days of receiving it, with photos and, where possible, an unboxing video. We will replace it or refund it.',
      'Shipping fees are refunded only when the problem was our mistake.',
      'Refunds are paid by bank transfer to an account in the shop’s name, normally within 7 business days of being agreed.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy policy',
    clauses: [
      'We collect the details you give us: shop and contact names, e-mail, phone, delivery address, tax details for invoices, and the payment slips you upload.',
      'We use them to run your account and orders: offers, payments, delivery, tax invoices, and notifications about your orders.',
      'We share only what is needed with the services we rely on: Thailand Post (name, address and phone for delivery), our e-mail provider (to send notifications), and our hosting and database providers. We do not sell your data.',
      'We keep your details while your account is active, and accounting records for as long as Thai law requires.',
      'Under the Personal Data Protection Act (PDPA) you can ask to see, correct or delete your data, subject to records we must keep by law. Contact us to make a request.',
    ],
  },
]
