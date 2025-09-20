import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { DataGrid, DataGridColumnHeader, KeenIcon, useDataGrid } from '@/components';
import { ColumnDef, Column } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Customer, CustomerAddRequestBody, CustomerSummary } from '@/types/invoice';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerSummary } from '@/services/customerService';
import { digitSeparator } from '@/utils';
import { TDataGridRequestParams } from '@/components/data-grid';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

interface CustomerManagementTableContentProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  confirmDeleteCustomer: () => void;
}

const CustomerManagementTableContent = ({ 
  searchQuery, 
  setSearchQuery, 
  onRefresh, 
  isCreateModalOpen, 
  setIsCreateModalOpen,
  isEditModalOpen,
  setIsEditModalOpen,
  isInfoModalOpen,
  setIsInfoModalOpen,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  selectedCustomer,
  setSelectedCustomer,
  confirmDeleteCustomer
}: CustomerManagementTableContentProps) => {
  const [infoLoading, setInfoLoading] = useState(false);
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerAddRequestBody>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    description: '',
  });

  const resetCustomerInfo = () => {
    setCustomerInfo({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      description: '',
    });
  };

  const ColumnInputFilter = <TData, TValue>({ column }: IColumnFilterProps<TData, TValue>) => {
    return (
      <Input
        placeholder="جستجو..."
        value={(column.getFilterValue() as string) ?? ''}
        onChange={(event) => column.setFilterValue(event.target.value)}
        className="h-9 w-full max-w-40"
      />
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} کپی شد`);
    } catch (err) {
      toast.error('خطا در کپی کردن');
    }
  };

  const handleCreateCustomer = async () => {
    try {
      const success = await createCustomer(customerInfo);
      if (success) {
        toast.success('مشتری با موفقیت اضافه شد');
        setIsCreateModalOpen(false);
        resetCustomerInfo();
        onRefresh(); // Use parent's refresh function
      } else {
        toast.error('خطا در افزودن مشتری');
      }
    } catch (error) {
      toast.error('خطا در افزودن مشتری');
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      const success = await updateCustomer(selectedCustomer.id, {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        phoneNumber: customerInfo.phoneNumber,
        description: customerInfo.description,
      });
      
      if (success) {
        toast.success('مشتری با موفقیت ویرایش شد');
        setIsEditModalOpen(false);
        setSelectedCustomer(null);
        resetCustomerInfo();
        onRefresh(); // Use parent's refresh function
      } else {
        toast.error('خطا در ویرایش مشتری');
      }
    } catch (error) {
      toast.error('خطا در ویرایش مشتری');
    }
  };


  // Load customer summary when info modal opens
  React.useEffect(() => {
    if (isInfoModalOpen && selectedCustomer) {
      setInfoLoading(true);
      getCustomerSummary(selectedCustomer.id)
        .then(setCustomerSummary)
        .catch(() => toast.error('خطا در دریافت اطلاعات مشتری'))
        .finally(() => setInfoLoading(false));
    }
  }, [isInfoModalOpen, selectedCustomer]);

  // Load customer data when edit modal opens
  React.useEffect(() => {
    if (isEditModalOpen && selectedCustomer) {
      setCustomerInfo({
        firstName: selectedCustomer.firstName,
        lastName: selectedCustomer.lastName,
        phoneNumber: selectedCustomer.phoneNumber,
        description: selectedCustomer.description,
      });
    }
  }, [isEditModalOpen, selectedCustomer]);


  const Toolbar = () => {
    const handleSearch = () => {
      onRefresh(); // Use parent's refresh function
    };

    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">مدیریت مشتریان</h3>

        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="جستجوی مشتری..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </label>
          </div>

          <button className="btn btn-sm btn-primary" onClick={handleSearch}>
            <KeenIcon icon="magnifier" />
            جستجو
          </button>

          <button 
            className="btn btn-sm btn-success"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <KeenIcon icon="plus" />
            افزودن مشتری
          </button>
        </div>
      </div>
    );
  };

  return (
    <>

      {/* Create Customer Modal */}
      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>افزودن مشتری جدید</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
                <Input
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                  placeholder="نام را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام خانوادگی</label>
                <Input
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                  placeholder="نام خانوادگی را وارد کنید"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره تلفن</label>
              <Input
                value={customerInfo.phoneNumber}
                onChange={(e) => setCustomerInfo({...customerInfo, phoneNumber: e.target.value})}
                placeholder="شماره تلفن را وارد کنید"
                maxLength={11}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={customerInfo.description}
                onChange={(e) => setCustomerInfo({...customerInfo, description: e.target.value})}
                placeholder="توضیحات اختیاری..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCreateModalOpen(false);
                resetCustomerInfo();
              }}>
                لغو
              </Button>
              <Button onClick={handleCreateCustomer}>
                افزودن
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>ویرایش مشتری</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
                <Input
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                  placeholder="نام را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام خانوادگی</label>
                <Input
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                  placeholder="نام خانوادگی را وارد کنید"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره تلفن</label>
              <Input
                value={customerInfo.phoneNumber}
                onChange={(e) => setCustomerInfo({...customerInfo, phoneNumber: e.target.value})}
                placeholder="شماره تلفن را وارد کنید"
                maxLength={11}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={customerInfo.description}
                onChange={(e) => setCustomerInfo({...customerInfo, description: e.target.value})}
                placeholder="توضیحات اختیاری..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setSelectedCustomer(null);
                resetCustomerInfo();
              }}>
                لغو
              </Button>
              <Button onClick={handleEditCustomer}>
                ذخیره تغییرات
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Customer Info Modal */}
      <Modal open={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)}>
        <ModalContent className="max-w-3xl">
          <ModalHeader>
            <ModalTitle>
              {selectedCustomer ? 
                `صورتحساب ${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 
                'صورتحساب مشتری'
              }
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {selectedCustomer && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">نام:</span>
                    <span className="ml-2 font-medium">{selectedCustomer.firstName}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">نام خانوادگی:</span>
                    <span className="ml-2 font-medium">{selectedCustomer.lastName}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">شماره تلفن:</span>
                    <span className="ml-2 font-mono" dir="ltr">{selectedCustomer.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">کد مشتری:</span>
                    <span className="ml-2 font-mono" dir="ltr">{selectedCustomer.customerCode}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">مانده حساب‌ها</h4>
                
                {infoLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="spinner spinner-sm"></div>
                  </div>
                ) : customerSummary ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold text-sm">₹</span>
                        </div>
                        <span className="font-medium">تومان</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${customerSummary.irt > 0 ? 'text-green-600' : customerSummary.irt < 0 ? 'text-red-600' : 'text-gray-900'}`} dir="ltr">
                          {digitSeparator(customerSummary.irt)}
                        </div>
                        <div className={`text-sm ${customerSummary.irt > 0 ? 'text-green-600' : customerSummary.irt < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {customerSummary.irt > 0 ? 'بستانکار' : customerSummary.irt < 0 ? 'بدهکار' : 'بدون بدهی'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">$</span>
                        </div>
                        <span className="font-medium">تتر</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${customerSummary.tether > 0 ? 'text-green-600' : customerSummary.tether < 0 ? 'text-red-600' : 'text-gray-900'}`} dir="ltr">
                          {digitSeparator(customerSummary.tether)}
                        </div>
                        <div className={`text-sm ${customerSummary.tether > 0 ? 'text-green-600' : customerSummary.tether < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {customerSummary.tether > 0 ? 'بستانکار' : customerSummary.tether < 0 ? 'بدهکار' : 'بدون بدهی'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-bold text-sm">P</span>
                        </div>
                        <span className="font-medium">پرفکت مانی</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${customerSummary.pm > 0 ? 'text-green-600' : customerSummary.pm < 0 ? 'text-red-600' : 'text-gray-900'}`} dir="ltr">
                          {digitSeparator(customerSummary.pm)}
                        </div>
                        <div className={`text-sm ${customerSummary.pm > 0 ? 'text-green-600' : customerSummary.pm < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {customerSummary.pm > 0 ? 'بستانکار' : customerSummary.pm < 0 ? 'بدهکار' : 'بدون بدهی'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    اطلاعات مالی در دسترس نیست
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={() => {
                  setIsInfoModalOpen(false);
                  setSelectedCustomer(null);
                  setCustomerSummary(null);
                }}>
                  بستن
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>تایید حذف</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <KeenIcon icon="trash" className="text-red-600 text-lg" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">
                    آیا از حذف این مشتری اطمینان دارید؟
                  </p>
                  {selectedCustomer && (
                    <p className="text-gray-600 text-sm mt-1">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </p>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                این عمل قابل بازگشت نیست و تمام اطلاعات مشتری حذف خواهد شد.
              </p>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedCustomer(null);
                }}>
                  لغو
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteCustomer}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <KeenIcon icon="trash" className="mr-1" />
                  حذف مشتری
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export const CustomerManagementTable = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleCustomerInfo = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsInfoModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      const success = await deleteCustomer(selectedCustomer.id);
      if (success) {
        toast.success('مشتری با موفقیت حذف شد');
        setIsDeleteModalOpen(false);
        setSelectedCustomer(null);
        triggerRefresh();
      } else {
        toast.error('خطا در حذف مشتری');
      }
    } catch (error) {
      toast.error('خطا در حذف مشتری');
    }
  };

  const fetchCustomers = async (params: TDataGridRequestParams) => {
    try {
      return await getCustomers({
        ...params,
        keyword: searchQuery
      });
    } catch (error) {
      toast.error('خطا در دریافت اطلاعات مشتریان');
      return {
        data: [],
        totalCount: 0
      };
    }
  };

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorFn: (row) => row.firstName,
        id: 'firstName',
        header: ({ column }) => (
          <DataGridColumnHeader title="نام" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <span className="text-sm font-medium text-gray-900">
              {row.original.firstName}
            </span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
        }
      },
      {
        accessorFn: (row) => row.lastName,
        id: 'lastName',
        header: ({ column }) => <DataGridColumnHeader title="نام خانوادگی" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <span className="text-sm font-medium text-gray-900">
              {row.original.lastName}
            </span>
          );
        },
        meta: {
          className: 'min-w-[140px]',
        }
      },
      {
        accessorFn: (row) => row.phoneNumber,
        id: 'phoneNumber',
        header: ({ column }) => <DataGridColumnHeader title="شماره تلفن" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <span className="text-sm font-mono" dir="ltr">
              {row.original.phoneNumber}
            </span>
          );
        },
        meta: {
          className: 'min-w-[140px]',
        }
      },
      {
        accessorFn: (row) => row.customerCode,
        id: 'customerCode',
        header: ({ column }) => <DataGridColumnHeader title="کد مشتری" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const customerCode = row.original.customerCode;
          
          const copyToClipboard = async (text: string, label: string) => {
            try {
              await navigator.clipboard.writeText(text);
              toast.success(`${label} کپی شد`);
            } catch (err) {
              toast.error('خطا در کپی کردن');
            }
          };
          
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono" dir="ltr">
                {customerCode}
              </span>
              <button
                onClick={() => copyToClipboard(customerCode, 'کد مشتری')}
                className="btn btn-icon btn-xs btn-clear btn-light"
                title="کپی کد مشتری"
              >
                <KeenIcon icon="copy" className="text-gray-500" />
              </button>
            </div>
          );
        },
        meta: {
          className: 'min-w-[180px]',
        }
      },
      {
        accessorFn: (row) => row.description,
        id: 'description',
        header: ({ column }) => <DataGridColumnHeader title="توضیحات" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const description = row.original.description;
          return (
            <span className="text-sm text-gray-700" title={description}>
              {description.length > 30 ? `${description.substring(0, 30)}...` : description}
            </span>
          );
        },
        meta: {
          className: 'min-w-[200px]',
        }
      },
      {
        id: 'actions',
        header: () => 'عملیات',
        enableSorting: false,
        cell: ({ row }) => {
          const customer = row.original;
          
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditCustomer(customer)}
                className="btn btn-icon btn-xs btn-clear btn-light"
                title="ویرایش"
              >
                <KeenIcon icon="notepad-edit" className="text-gray-500" />
              </button>
              
              <button
                onClick={() => handleCustomerInfo(customer)}
                className="btn btn-icon btn-xs btn-clear btn-light"
                title="مشاهده جزئیات"
              >
                <KeenIcon icon="information-5" className="text-gray-500" />
              </button>
              
              {/* <button
                onClick={() => handleDeleteCustomer(customer)}
                className="btn btn-icon btn-xs btn-clear btn-light"
                title="حذف"
              >
                <KeenIcon icon="trash" className="text-red-500" />
              </button> */}
            </div>
          );
        },
        meta: {
          className: 'w-[120px]',
        }
      },
    ],
    [handleEditCustomer, handleCustomerInfo, handleDeleteCustomer]
  );

  // We'll handle debounced search inside the Toolbar component using DataGrid's reload method

  // Simple search query update without triggering refresh
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const Toolbar = () => {
    const { reload } = useDataGrid(); // Use DataGrid's reload method

    // Debounced search effect - safely uses reload without affecting input focus
    useEffect(() => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        reload(); // Use DataGrid's native reload
      }, 300);

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [searchQuery]); // Remove reload from dependencies to prevent infinite loop

    const handleSearch = () => {
      reload(); // Use DataGrid's native reload instead of key manipulation
    };

    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">مدیریت مشتریان</h3>

        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="جستجوی مشتری..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </label>
          </div>

          <button className="btn btn-sm btn-primary" onClick={handleSearch}>
            <KeenIcon icon="magnifier" />
            جستجو
          </button>

          <button 
            className="btn btn-sm btn-success"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <KeenIcon icon="plus" />
            افزودن مشتری
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <DataGrid
        columns={columns}
        onFetchData={fetchCustomers}
        serverSide={true}
        pagination={{ size: 10 }}
        sorting={[{ id: 'firstName', desc: false }]}
        toolbar={<Toolbar />}
        layout={{ card: true }}
        key={refreshKey} // This will force refresh when key changes
      />
      <CustomerManagementTableContent 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onRefresh={triggerRefresh}
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        isInfoModalOpen={isInfoModalOpen}
        setIsInfoModalOpen={setIsInfoModalOpen}
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        confirmDeleteCustomer={confirmDeleteCustomer}
      />
    </>
  );
};
