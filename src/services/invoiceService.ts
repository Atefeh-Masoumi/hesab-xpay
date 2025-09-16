import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Summary, InvoiceApiResponse } from '@/types/invoice';

const API_URL = import.meta.env.VITE_APP_API_URL;

export const getSummary = async (): Promise<Summary> => {
  try {
    const response = await axios.get<InvoiceApiResponse>(`${API_URL}/Invoice/GetSummary`);
    
    // Log the response to debug the structure
    console.log('API Response:', response.data);
    
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
    console.error('Failed to fetch summary:', error);
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
