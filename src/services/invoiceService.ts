import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Summary, InvoiceApiResponse, Report, PaginationList, CustomerSummaryApiResponse, Invoice, InvoiceEditRequestBody, Enum, InvoiceApiResponseList, EnumApiResponse } from '@/types/invoice';
import { TDataGridRequestParams } from '@/components/data-grid';

const API_URL = import.meta.env.VITE_APP_API_URL;

export const getSummary = async (): Promise<Summary> => {
  try {
    const response = await axios.get<InvoiceApiResponse>(`${API_URL}/Invoice/GetSummary`);
    
    
    // Check if the response has the expected structure
    if (response.data && typeof response.data === 'object') {
      // If the API returns data directly (not wrapped in a data property)
      if (response.data.data.countBuyInvoices !== undefined || response.data.data.countSellInvoices !== undefined) {
        return response.data as Summary;
      }
      // If the API wraps data in a data property
      if (response.data.data) {
        return response.data.data;
      }
    }
    
    // Return empty object with default values if no data
    return {
      countBuyInvoices: 0,
      countSellInvoices: 0,
      countTotalInvoices: 0,
      volumeBuyPm: 0,
      volumeSellPm: 0,
      volumeBuyUsdt: 0,
      volumeSellUsdt: 0,
      volumeBuyIRT: 0,
      volumeSellIRT: 0,
      averagePriceBuyPm: 0,
      averagePriceSellPm: 0,
      averagePriceBuyTether: 0,
      averagePriceSellTether: 0,
      volumeReceivedUsdt: 0,
      volumeReceivedIRT: 0,
      volumePaymentUsdt: 0,
      volumePaymentIRT: 0,
    };
  } catch (error) {
    // Return default values instead of throwing
    return {
      countBuyInvoices: 0,
      countSellInvoices: 0,
      countTotalInvoices: 0,
      volumeBuyPm: 0,
      volumeSellPm: 0,
      volumeBuyUsdt: 0,
      volumeSellUsdt: 0,
      volumeBuyIRT: 0,
      volumeSellIRT: 0,
      averagePriceBuyPm: 0,
      averagePriceSellPm: 0,
      averagePriceBuyTether: 0,
      averagePriceSellTether: 0,
      volumeReceivedUsdt: 0,
      volumeReceivedIRT: 0,
      volumePaymentUsdt: 0,
      volumePaymentIRT: 0,
    };
  }
};

export const useSummary = () => {
  return useQuery({
    queryKey: ['invoice', 'summary'],
    queryFn: getSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const getCustomersSummary = async (params: TDataGridRequestParams & { keyword?: string }): Promise<{ data: Report[], totalCount: number }> => {
  try {
    const page = params.pageIndex + 1; // Convert to 1-based indexing
    const pageSize = params.pageSize;
    
    let url = `${API_URL}/Invoice/GetCustomersSummary/${page}/${pageSize}`;
    
    if (params.keyword && params.keyword.trim() !== '') {
      url += `?keyword=${encodeURIComponent(params.keyword)}`;
    }

    const response = await axios.get<CustomerSummaryApiResponse>(url);
    
    
    if (response.status === 200 && response.data && response.data.value) {
      return {
        data: response.data.value.items,
        totalCount: response.data.value.pagination.totalCount
      };
    }
    
    return {
      data: [],
      totalCount: 0
    };
  } catch (error) {
    return {
      data: [],
      totalCount: 0
    };
  }
};

// Invoice Management Functions
export const getInvoices = async (params: TDataGridRequestParams & { 
  keyword?: string; 
  type?: number; 
  symbol?: number; 
  fromDate?: string; // ISO string
  toDate?: string;   // ISO string
}): Promise<{ data: Invoice[], totalCount: number }> => {
  try {
    const page = params.pageIndex + 1; // Convert to 1-based indexing
    const pageSize = params.pageSize;
    
    let url = `${API_URL}/Invoice/All/${page}/${pageSize}`;
    const queryParams = [];
    
    if (params.keyword && params.keyword.trim() !== '') {
      queryParams.push(`keyword=${encodeURIComponent(params.keyword)}`);
    }
    
    if (params.type && params.type !== -1) {
      queryParams.push(`type=${params.type}`);
    }
    
    if (params.symbol && params.symbol !== -1) {
      queryParams.push(`symbol=${params.symbol}`);
    }
    
    if (params.fromDate) {
      queryParams.push(`fromDate=${encodeURIComponent(params.fromDate)}`);
    }
    if (params.toDate) {
      queryParams.push(`toDate=${encodeURIComponent(params.toDate)}`);
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    const response = await axios.get<InvoiceApiResponseList>(url);
    
    
    if (response.status === 200 && response.data && response.data.value) {
      return {
        data: response.data.value.items,
        totalCount: response.data.value.pagination.totalCount
      };
    }
    
    return {
      data: [],
      totalCount: 0
    };
  } catch (error) {
    return {
      data: [],
      totalCount: 0
    };
  }
};

export const createInvoice = async (invoiceData: {
  amount: number;
  rate?: number;
  symbol: number;
  type: number;
  description: string;
  txId: string;
  customerId: number;
}): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_URL}/Invoice/Add`, invoiceData);
    
    
    return response.status === 200;
  } catch (error) {
    throw error;
  }
};

export const updateInvoice = async (invoiceData: InvoiceEditRequestBody): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_URL}/Invoice/Edit`, invoiceData);
    
    
    return response.status === 200;
  } catch (error) {
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<boolean> => {
  try {
    const response = await axios.delete(`${API_URL}/Invoice/Delete`, {
      data: { id }
    });
    
    return response.status === 200;
  } catch (error) {
    throw error;
  }
};

export const getInvoiceTypes = async (): Promise<Enum[]> => {
  try {
    const response = await axios.get<EnumApiResponse>(`${API_URL}/Enum/InvoiceType`);
    
    
    if (response.status === 200 && response.data && response.data.value) {
      return response.data.value;
    }
    
    return [];
  } catch (error) {
    return [];
  }
};

export const getInvoiceSymbols = async (): Promise<Enum[]> => {
  try {
    const response = await axios.get<EnumApiResponse>(`${API_URL}/Enum/InvoiceSymbol`);
    
    
    if (response.status === 200 && response.data && response.data.value) {
      return response.data.value;
    }
    
    return [];
  } catch (error) {
    return [];
  }
};
