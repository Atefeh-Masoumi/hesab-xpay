export interface Summary {
  countBuyInvoices?: number;
  countSellInvoices?: number;
  countTotalInvoices?: number;
  volumeBuyPm?: number;
  volumeSellPm?: number;
  volumeBuyUsdt?: number;
  volumeSellUsdt?: number;
  volumeBuyIRT?: number;
  volumeSellIRT?: number;
  averagePriceBuyPm?: number;
  averagePriceSellPm?: number;
  averagePriceBuyTether?: number;
  averagePriceSellTether?: number;
  volumeReceivedUsdt?: number;
  volumeReceivedIRT?: number;
  volumePaymentUsdt?: number;
  volumePaymentIRT?: number;
}

export interface InvoiceApiResponse {
  data: Summary;
  status: number;
  message?: string;
}
