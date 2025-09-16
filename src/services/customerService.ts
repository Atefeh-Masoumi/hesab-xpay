import axios from 'axios';
import { Customer, CustomerAddRequestBody, CustomerSummary, CustomerApiResponse, CustomerSummaryDetailsResponse, PaginationList } from '@/types/invoice';
import { TDataGridRequestParams } from '@/components/data-grid';

const API_URL = import.meta.env.VITE_APP_API_URL;

export const getCustomers = async (params: TDataGridRequestParams & { keyword?: string }): Promise<{ data: Customer[], totalCount: number }> => {
  try {
    const page = params.pageIndex + 1; // Convert to 1-based indexing
    const pageSize = params.pageSize;
    
    let url = `${API_URL}/Customer/All/${page}/${pageSize}`;
    
    if (params.keyword && params.keyword.trim() !== '') {
      url += `?keyword=${encodeURIComponent(params.keyword)}`;
    }

    const response = await axios.get<CustomerApiResponse>(url);
    
    console.log('Customer API Response:', response.data);
    
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
    console.error('Failed to fetch customers:', error);
    return {
      data: [],
      totalCount: 0
    };
  }
};

export const createCustomer = async (customerData: CustomerAddRequestBody): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_URL}/Customer/Add`, customerData);
    
    console.log('Create Customer Response:', response.data);
    
    return response.status === 200;
  } catch (error) {
    console.error('Failed to create customer:', error);
    throw error;
  }
};

export const updateCustomer = async (id: number, customerData: Partial<Customer>): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_URL}/Customer/Edit`, {
      id,
      ...customerData
    });
    
    console.log('Update Customer Response:', response.data);
    
    return response.status === 200;
  } catch (error) {
    console.error('Failed to update customer:', error);
    throw error;
  }
};

export const deleteCustomer = async (id: number): Promise<boolean> => {
  try {
    const response = await axios.delete(`${API_URL}/Customer/Delete`, {
      data: { id }
    });
    
    console.log('Delete Customer Response:', response.data);
    
    return response.status === 200;
  } catch (error) {
    console.error('Failed to delete customer:', error);
    throw error;
  }
};

export const getCustomerSummary = async (customerId: number): Promise<CustomerSummary | null> => {
  try {
    const response = await axios.get<CustomerSummaryDetailsResponse>(`${API_URL}/Invoice/GetCustomerSummary`, {
      params: { CustomerId: customerId }
    });
    
    console.log('Customer Summary Response:', response.data);
    
    if (response.status === 200 && response.data && response.data.value) {
      return response.data.value;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch customer summary:', error);
    return null;
  }
};
