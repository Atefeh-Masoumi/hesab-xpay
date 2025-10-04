import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { DataGrid, DataGridColumnHeader, KeenIcon, useDataGrid } from '@/components';
import { ColumnDef, Column } from '@tanstack/react-table';
import { Customer, CustomerAddRequestBody, CustomerSummary } from '@/types/invoice';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerSummary } from '@/services/customerService';
import { TDataGridRequestParams } from '@/components/data-grid';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerManagementTableContent } from './CustomerManagementTableContent';
import DatePicker, { Calendar, DayValue, utils } from '@hassanmojab/react-modern-calendar-datepicker';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';

const toISODateFromModern = (d: any) => {
  if (!d) return null
  const yyyy = d.year
  const mm = String(d.month).padStart(2, "0")
  const dd = String(d.day).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}
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

  // Date filter state
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'last7' | 'last30' | 'last365' | 'custom'>('today');
  // Uncontrolled Popover to avoid mount/unmount race conditions

  // Initialize with today's date in DayValue format (Persian calendar)
  const utilsFa: any = utils('fa');
  const getTodayDayValue = (): DayValue => utilsFa.getToday();

  const [dateRange, setDateRange] = useState<{ from: DayValue; to: DayValue }>(() => {
    const today = getTodayDayValue();
    return { from: today, to: today };
  });

  // Helper to move DayValue by N days in Persian calendar
  const addDaysDV = (dv: DayValue, delta: number): DayValue => {
    if (!dv) return getTodayDayValue();
    let res: any = { year: (dv as any).year, month: (dv as any).month, day: (dv as any).day };
    if (delta === 0) return res as DayValue;
    if (delta < 0) {
      for (let i = 0; i < -delta; i++) {
        res.day -= 1;
        if (res.day < 1) {
          res.month -= 1;
          if (res.month < 1) {
            res.month = 12;
            res.year -= 1;
          }
          res.day = utilsFa.getMonthLength({ year: res.year, month: res.month, day: 1 });
        }
      }
    } else {
      for (let i = 0; i < delta; i++) {
        const monthLen = utilsFa.getMonthLength({ year: res.year, month: res.month, day: 1 });
        res.day += 1;
        if (res.day > monthLen) {
          res.day = 1;
          res.month += 1;
          if (res.month > 12) {
            res.month = 1;
            res.year += 1;
          }
        }
      }
    }
    return res as DayValue;
  };

  // Range selection handler: accept partial selection to allow second click to set 'to'
  const handleCalendarChange = (value: { from: DayValue; to: DayValue }) => {
    if (!value) return;
    setDateRange(value);
  };
  useEffect(() => {
    if (datePreset === 'custom') return; // Don't override custom selection

    const today = getTodayDayValue();

    if (datePreset === 'today') {
      setDateRange({ from: today, to: today });
    } else if (datePreset === 'yesterday') {
      const yesterdayDV = addDaysDV(today, -1);
      setDateRange({ from: yesterdayDV, to: yesterdayDV });
    } else if (datePreset === 'last7') {
      const weekAgoDV = addDaysDV(today, -6);
      setDateRange({ from: weekAgoDV, to: today });
    } else if (datePreset === 'last30') {
      const monthAgoDV = addDaysDV(today, -29);
      setDateRange({ from: monthAgoDV, to: today });
    } else if (datePreset === 'last365') {
      const yearAgoDV = addDaysDV(today, -364);
      setDateRange({ from: yearAgoDV, to: today });
    }
  }, [datePreset]);

  // When entering custom mode, clear existing range to allow fresh selection
  useEffect(() => {
    if (datePreset === 'custom') {
      setDateRange({ from: null, to: null });
    }
  }, [datePreset]);
  const formatPersianDate = useCallback((d?: Date | null) => {
    if (!d) return '';
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    } catch {
      return d.toLocaleDateString('fa-IR');
    }
  }, []);

  const toISODate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const computeDateRange = useCallback(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (datePreset === 'today') return { from: startOfToday, to: endOfToday };
    if (datePreset === 'yesterday') {
      const y = new Date(startOfToday);
      y.setDate(y.getDate() - 1);
      return { from: y, to: y };
    }
    if (datePreset === 'last7') {
      const from = new Date(startOfToday);
      from.setDate(from.getDate() - 6);
      return { from, to: endOfToday };
    }
    if (datePreset === 'last30') {
      const from = new Date(startOfToday);
      from.setDate(from.getDate() - 29);
      return { from, to: endOfToday };
    }
    if (datePreset === 'last365') {
      const from = new Date(startOfToday);
      from.setDate(from.getDate() - 364);
      return { from, to: endOfToday };
    }
    return { from: dateRange.from ?? startOfToday, to: dateRange.to ?? endOfToday };
  }, [datePreset, dateRange]);

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
      const fromDate = toISODateFromModern(dateRange.from)
      const toDate = toISODateFromModern(dateRange.to)
      return await getCustomers({
        ...params,
        keyword: searchQuery,
            fromDate: fromDate ?? undefined,
            toDate: toDate ?? undefined
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
          <div className="flex items-center gap-2" >
            <Select value={datePreset} onValueChange={(v) => { setDatePreset(v as any); if (v !== 'custom') reload(); }} dir="rtl">
              <SelectTrigger className="w-36" size="sm">
                <SelectValue placeholder="فیلتر تاریخ" />
              </SelectTrigger>
              <SelectContent className="w-44">
                <SelectItem value="today">امروز</SelectItem>
                <SelectItem value="yesterday">دیروز</SelectItem>
                <SelectItem value="last7">هفته گذشته</SelectItem>
                <SelectItem value="last30">ماه گذشته</SelectItem>
                <SelectItem value="last365">سال گذشته</SelectItem>
                <SelectItem value="custom">کاستوم</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              {datePreset === 'custom' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="btn btn-sm btn-light">
                      {dateRange?.from && dateRange?.to
                        ? `${dateRange.from.year}/${String(dateRange.from.month).padStart(2, '0')}/${String(dateRange.from.day).padStart(2, '0')} - ${dateRange.to.year}/${String(dateRange.to.month).padStart(2, '0')}/${String(dateRange.to.day).padStart(2, '0')}`
                        : 'انتخاب بازه'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 z-[9999] bg-white w-full" align="start">
                    <div className="p-3 z-[9999] bg-white w-full">
                      <Calendar
                        value={dateRange}
                        onChange={handleCalendarChange}
                        shouldHighlightWeekends
                        locale="fa"

                      />
                    </div>
                    <div className="flex justify-end gap-2 p-3 pt-0">
                      <button
                        className="btn btn-xs btn-light"
                        onClick={() => {
                          const today = getTodayDayValue();
                          setDateRange({ from: today, to: today });
                        }}
                      >
                        امروز
                      </button>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => {
                          reload();

                        }}
                      >
                        اعمال
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <button className="btn btn-sm btn-light" aria-disabled="true">
                  {dateRange?.from && dateRange?.to
                    ? `${dateRange.from.year}/${String(dateRange.from.month).padStart(2, '0')}/${String(dateRange.from.day).padStart(2, '0')} - ${dateRange.to.year}/${String(dateRange.to.month).padStart(2, '0')}/${String(dateRange.to.day).padStart(2, '0')}`
                    : 'انتخاب بازه'}
                </button>
              )}
            </Popover>

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
