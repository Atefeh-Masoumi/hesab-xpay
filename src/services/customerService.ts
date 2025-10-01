import axios from 'axios';
import { Customer, CustomerAddRequestBody, CustomerSummary, CustomerApiResponse, CustomerSummaryDetailsResponse, PaginationList } from '@/types/invoice';
import { TDataGridRequestParams } from '@/components/data-grid';

const API_URL = import.meta.env.VITE_APP_API_URL;

export const getCustomers = async (params: TDataGridRequestParams & { keyword?: string; fromDate?: string; toDate?: string }): Promise<{ data: Customer[], totalCount: number }> => {
  try {
    const page = params.pageIndex + 1; // Convert to 1-based indexing
    const pageSize = params.pageSize;
    
    let url = `${API_URL}/Customer/All/${page}/${pageSize}`;
    const queryParams: string[] = [];
    if (params.keyword && params.keyword.trim() !== '') {
      queryParams.push(`keyword=${encodeURIComponent(params.keyword)}`);
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

    const response = await axios.get<CustomerApiResponse>(url);
    
    
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

export const createCustomer = async (customerData: CustomerAddRequestBody): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_URL}/Customer/Add`, customerData);
    
    
    return response.status === 200;
  } catch (error) {
    throw error;
  }
};

export const updateCustomer = async (id: number, customerData: Partial<Customer>): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_URL}/Customer/Edit`, {
      id,
      ...customerData
    });
    
    
    return response.status === 200;
  } catch (error) {
    throw error;
  }
};

export const deleteCustomer = async (id: number): Promise<boolean> => {
  try {
    const response = await axios.delete(`${API_URL}/Customer/Delete`, {
      data: { id }
    });
    
    return response.status === 200;
  } catch (error) {
    throw error;
  }
};

export const getCustomerSummary = async (customerId: number): Promise<CustomerSummary | null> => {
  try {
    const response = await axios.get<CustomerSummaryDetailsResponse>(`${API_URL}/Invoice/GetCustomerSummary`, {
      params: { CustomerId: customerId }
    });
        
    if (response.status === 200 && response.data && response.data.value) {
      return response.data.value;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};
