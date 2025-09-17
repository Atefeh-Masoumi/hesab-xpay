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

export interface Enum {
  id: number;
  title: string;
}

export interface Invoice {
  id: string;
  amount: number;
  rate: number;
  symbol: Enum;
  type: Enum;
  description: string;
  txId: string;
  customerId: number;
  name: string;
  phoneNumber: string;
}

export interface InvoiceAddRequestBody {
  amount: number;
  rate: number;
  symbol: Enum;
  type: Enum;
  description: string;
  txId: string;
  customerId: number;
}

export interface InvoiceEditRequestBody {
  id: string;
  amount: number;
  rate: number;
  symbol: number;
  type: number;
  description: string;
  txId: string;
  customerId: number;
}

export interface InvoiceApiResponseList {
  value: PaginationList<Invoice>;
  status: number;
  message?: string;
}

export interface EnumApiResponse {
  value: Enum[];
  status: number;
  message?: string;
}
