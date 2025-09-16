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

export interface Report {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  customerCode: string;
  tether: number;
  irt: number;
  pm: number;
}

export interface PaginationData {
  pageSize: number;
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
}

export interface PaginationList<T> {
  pagination: PaginationData;
  items: T[];
}

export interface InvoiceApiResponse {
  data: Summary;
  status: number;
  message?: string;
}

export interface CustomerSummaryApiResponse {
  value: PaginationList<Report>;
  status: number;
  message?: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  customerCode: string;
  description: string;
}

export interface CustomerAddRequestBody {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  description: string;
}

export interface CustomerSummary {
  irt: number;
  pm: number;
  tether: number;
}

export interface CustomerApiResponse {
  value: PaginationList<Customer>;
  status: number;
  message?: string;
}

export interface CustomerSummaryDetailsResponse {
  value: CustomerSummary;
  status: number;
  message?: string;
}
