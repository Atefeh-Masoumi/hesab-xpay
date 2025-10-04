import React, { useMemo, useState, useEffect, Fragment, useRef, useCallback } from 'react';
import { DataGrid, DataGridColumnHeader, KeenIcon, Container, useDataGrid } from '@/components';
import { Toolbar, ToolbarHeading } from '@/layouts/demo1/toolbar';
import { ColumnDef } from '@tanstack/react-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import DatePicker from 'react-multi-date-picker';
// import persian from 'react-date-object/calendars/persian';
// import persian_fa from 'react-date-object/locales/persian_fa';
import { Invoice, InvoiceAddRequestBody, Enum, Customer } from '@/types/invoice';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, getInvoiceTypes, getInvoiceSymbols } from '@/services/invoiceService';
import { getCustomers } from '@/services/customerService';
import { digitSeparator, toAbsoluteUrl } from '@/utils';
import { TDataGridRequestParams } from '@/components/data-grid';
import { toast } from 'sonner';
import CreateInvoiceModal from './CreateInvoiceModal';
import EditInvoiceMdal from './EditInvoiceMdal';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';
import DatePicker, { Calendar, DayValue, utils } from '@hassanmojab/react-modern-calendar-datepicker';
// Using Gregorian calculation to generate DayValue; no additional locale utils

const toISODateFromModern = (d: any) => {
  if (!d) return null
  const yyyy = d.year
  const mm = String(d.month).padStart(2, "0")
  const dd = String(d.day).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}
const SanadPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(-1);
  const [symbolFilter, setSymbolFilter] = useState(-1);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [types, setTypes] = useState<Enum[]>([]);
  const [symbols, setSymbols] = useState<Enum[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Invoice form state
  const [invoiceInfo, setInvoiceInfo] = useState<InvoiceAddRequestBody>({
    amount: 0,
    rate: 0,
    symbol: { id: 0, title: "" },
    type: { id: 0, title: "" },
    description: "",
    txId: "",
    customerId: 0
  });

  // Separate state for display values to avoid formatting conflicts
  const [amountDisplay, setAmountDisplay] = useState<string>('');
  const [rateDisplay, setRateDisplay] = useState<string>('');

  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<number | null>(null);
  const [filteredTypes, setFilteredTypes] = useState<Enum[]>([]);
  const [filteredSymbols, setFilteredSymbols] = useState<Enum[]>([]);

  // Date filter state
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'last7' | 'last30' | 'last365' | 'custom'>('today');
  // Uncontrolled Popover to avoid mount/unmount race conditions

  // Initialize with today's date in DayValue format (Persian calendar)
  const utilsFa: any = utils('fa');
  const getTodayDayValue = (): DayValue => utilsFa.getToday();

  const [dateRange, setDateRange] = useState<{ from: DayValue ; to: DayValue }>(() => {
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

  const formatPersianDate = useCallback((d?: Date ) => {
    if (!d) return '';
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    } catch {
      return d.toLocaleDateString('fa-IR');
    }
  }, []);

  // Update dateRange when preset changes
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

  // Helper function to replace کاربر with مشتری in type titles
  const transformTypeTitle = (title: string): string => {
    return title.replace(/کاربر/g, 'مشتری');
  };

  // Load enums and customers on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [typesData, symbolsData, customersData] = await Promise.all([
          getInvoiceTypes(),
          getInvoiceSymbols(),
          getCustomers({ pageIndex: 0, pageSize: 999 })
        ]);

        // Transform type titles to replace کاربر with مشتری
        const transformedTypes = typesData.map(type => ({
          ...type,
          title: transformTypeTitle(type.title)
        }));

        // Filter out "پرفکت مانی" (id: 2) from symbols
        const filteredSymbolsData = symbolsData.filter(symbol => symbol.id !== 2);

        setTypes(transformedTypes);
        setSymbols(filteredSymbolsData);
        setCustomers(customersData.data);
        setFilteredTypes(transformedTypes);
        setFilteredSymbols(filteredSymbolsData);


      } catch (error) {
        toast.error('خطا در دریافت اطلاعات اولیه');
      }
    };

    loadData();
  }, []);

  // Filter types and symbols based on selections
  useEffect(() => {
    if (selectedType === 1 || selectedType === 2) {
      setFilteredSymbols(symbols.filter(symbol => symbol.id !== 3));
    } else {
      setFilteredSymbols(symbols);
    }

    if (selectedSymbol === 3) {
      setFilteredTypes(types.filter(type => type.id !== 1 && type.id !== 2));
    } else {
      setFilteredTypes(types);
    }
  }, [selectedSymbol, selectedType, types, symbols]);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const resetInvoiceInfo = () => {
    setInvoiceInfo({
      amount: 0,
      rate: 0,
      symbol: { id: 0, title: "" },
      type: { id: 0, title: "" },
      description: "",
      txId: "",
      customerId: 0
    });
    setAmountDisplay('');
    setRateDisplay('');
    setSelectedCustomer(null);
    setSelectedType(null);
    setSelectedSymbol(null);
  };

  const removeCommaFromNumber = (value: string): number => {
    return Number(value.replace(/,/g, ''));
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomer || !selectedType || !selectedSymbol) {
      toast.error('لطفاً تمام فیلدهای اجباری را پر کنید');
      return;
    }

    try {
      const success = await createInvoice({
        amount: invoiceInfo.amount,
        rate: selectedSymbol === 3 ? undefined : invoiceInfo.rate,
        symbol: selectedSymbol,
        type: selectedType,
        description: invoiceInfo.description,
        txId: invoiceInfo.txId,
        customerId: selectedCustomer,
      });

      if (success) {
        toast.success('سند با موفقیت اضافه شد');
        setIsCreateModalOpen(false);
        resetInvoiceInfo();
        triggerRefresh();
      } else {
        toast.error('خطا در افزودن سند');
      }
    } catch (error) {
      toast.error('خطا در افزودن سند');
    }
  };

  const handleEditInvoiceSubmit = async () => {


    if (!selectedInvoice || !selectedCustomer || !selectedType || !selectedSymbol) {
      toast.error('لطفاً تمام فیلدهای اجباری را پر کنید');
      return;
    }

    try {
      const success = await updateInvoice({
        id: selectedInvoice.id,
        amount: invoiceInfo.amount,
        rate: invoiceInfo.rate,
        symbol: selectedSymbol,
        type: selectedType,
        description: invoiceInfo.description,
        txId: invoiceInfo.txId,
        customerId: selectedCustomer,
      });

      if (success) {
        toast.success('سند با موفقیت ویرایش شد');
        setIsEditModalOpen(false);
        setSelectedInvoice(null);
        resetInvoiceInfo();
        triggerRefresh();
      } else {
        toast.error('خطا در ویرایش سند');
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('خطا در ویرایش سند');
    }
  };

  const confirmDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      const success = await deleteInvoice(selectedInvoice.id);
      if (success) {
        toast.success('سند با موفقیت حذف شد');
        setIsDeleteModalOpen(false);
        setSelectedInvoice(null);
        triggerRefresh();
      } else {
        toast.error('خطا در حذف سند');
      }
    } catch (error) {
      toast.error('خطا در حذف سند');
    }
  };

  // Load invoice data when edit modal opens
  useEffect(() => {
    if (isEditModalOpen && selectedInvoice && customers.length > 0) {

      // Try to find customer by name or phone number if customerId is not available
      let matchedCustomer = null;
      if (selectedInvoice.customerId) {
        matchedCustomer = customers.find(customer => customer.id === selectedInvoice.customerId);
      } else {
        // Try to find by name and phone
        matchedCustomer = customers.find(customer =>
          customer.firstName + ' ' + customer.lastName === selectedInvoice.name ||
          customer.phoneNumber === selectedInvoice.phoneNumber
        );
      }


      setInvoiceInfo({
        amount: selectedInvoice.amount,
        rate: selectedInvoice.rate,
        symbol: selectedInvoice.symbol,
        type: selectedInvoice.type,
        description: selectedInvoice.description,
        txId: selectedInvoice.txId,
        customerId: matchedCustomer?.id || 0,
      });

      // Set display values
      setAmountDisplay(selectedInvoice.amount > 0 ? digitSeparator(selectedInvoice.amount) : '');
      setRateDisplay(selectedInvoice.rate > 0 ? digitSeparator(selectedInvoice.rate) : '');



      // Use setTimeout to ensure state updates properly
      setTimeout(() => {
        setSelectedCustomer(matchedCustomer?.id || null);
        setSelectedType(selectedInvoice.type.id);
        setSelectedSymbol(selectedInvoice.symbol.id);
      }, 100);

    } else if (isEditModalOpen) {
      console.log('Edit modal opened but missing data:', {
        selectedInvoice: !!selectedInvoice,
        customersLoaded: customers.length
      });
    }
  }, [isEditModalOpen, selectedInvoice, customers]);

  const fetchInvoices = async (params: TDataGridRequestParams) => {
    try {

      const fromDate = toISODateFromModern(dateRange.from)
      const toDate = toISODateFromModern(dateRange.to)
      return await getInvoices({
        ...params,
        keyword: searchQuery,
        type: typeFilter !== -1 ? typeFilter : undefined,
        symbol: symbolFilter !== -1 ? symbolFilter : undefined,
        fromDate: fromDate ?? undefined,
        toDate: toDate ?? undefined,
      });
    } catch (error) {
      toast.error('خطا در دریافت اطلاعات سندها');
      return {
        data: [],
        totalCount: 0
      };
    }
  };

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorFn: (row) => row.type.title,
        id: 'type',
        header: ({ column }) => (
          <DataGridColumnHeader title="نوع تراکنش" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <span className="text-sm font-medium text-gray-900">
              {transformTypeTitle(row.original.type.title)}
            </span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
        }
      },
      {
        accessorFn: (row) => row.name,
        id: 'name',
        header: ({ column }) => <DataGridColumnHeader title="نام" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <span className="text-sm font-medium text-gray-900">
              {row.original.name}
            </span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
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
        accessorFn: (row) => row.symbol.title,
        id: 'symbol',
        header: ({ column }) => <DataGridColumnHeader title="نوع ارز" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
              {row.original.symbol.title === "تتر" && <div className="flex items-center justify-center clearfix bshadow0 pbs text-lg">
                <span className="ki-outline ki-dollar"><span className="path1"></span><span className="path2"></span></span>

              </div>}
              {row.original.symbol.title === "تومان" && <img src={toAbsoluteUrl('/media/images/toman.jpg')} className="w-4 h-4" alt="تومان" />}
              {row.original.symbol.title === "پرفکت مانی" && "💳 "}
              {row.original.symbol.title}
            </span>
          );
        },
        meta: {
          className: 'min-w-[100px]',
        }
      },
      {
        accessorFn: (row) => row.amount,
        id: 'amount',
        header: ({ column }) => <DataGridColumnHeader title="مقدار" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <span className="text-sm font-mono" dir="ltr">
              {digitSeparator(row.original.amount)}
            </span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
        }
      },
      {
        accessorFn: (row) => row.rate,
        id: 'rate',
        header: ({ column }) => <DataGridColumnHeader title="نرخ" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <span className="text-sm font-mono" dir="ltr">
              {digitSeparator(row.original.rate)}
            </span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
        }
      },
      {
        accessorFn: (row) => row.txId,
        id: 'txId',
        header: ({ column }) => <DataGridColumnHeader title="هش تراکنش" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const txId = row.original.txId;
          return (
            <span className="text-sm font-mono text-gray-700" title={txId}>
              {txId ? (txId.length > 20 ? `${txId.substring(0, 20)}...` : txId) : '-'}
            </span>
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
              {description && description.length > 30 ? `${description.substring(0, 30)}...` : description || '-'}
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
          const invoice = row.original;

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditInvoice(invoice)}
                className="btn btn-icon btn-xs btn-clear btn-light"
                title="ویرایش"
              >
                <KeenIcon icon="notepad-edit" className="text-gray-500" />
              </button>

              {/* <button
                onClick={() => handleDeleteInvoice(invoice)}
                className="btn btn-icon btn-xs btn-clear btn-light"
                title="حذف"
              >
                <KeenIcon icon="trash" className="text-red-500" />
              </button> */}
            </div>
          );
        },
        meta: {
          className: 'w-[100px]',
        }
      },
    ],
    [handleEditInvoice, handleDeleteInvoice]
  );

  // Simple search query update without triggering refresh
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const TableToolbar = () => {
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
        <h3 className="card-title font-medium text-sm">مدیریت سندها</h3>

        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="جستجوی سند..."
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

          {/* Type Filter */}
          <div className="flex">
            <Select value={typeFilter.toString()} onValueChange={(value) => setTypeFilter(Number(value))} dir="rtl">
              <SelectTrigger className="w-40" size="sm">
                <SelectValue placeholder="همه انواع" />
              </SelectTrigger>
              <SelectContent className="w-40">
                <SelectItem value="-1">همه انواع</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Symbol Filter */}
          <div className="flex" >
            <Select value={symbolFilter.toString()} onValueChange={(value) => setSymbolFilter(Number(value))} dir="rtl">
              <SelectTrigger className="w-32" size="sm">
                <SelectValue placeholder="همه ارزها" />
              </SelectTrigger>
              <SelectContent className="w-34">
                <SelectItem value="-1">همه ارزها</SelectItem>
                {symbols.map((symbol) => (
                  <SelectItem key={symbol.id} value={symbol.id.toString()} className="flex items-center gap-1">
                    {symbol.title === "تتر" && <span className="ki-outline ki-dollar text-md px-1" />}
                    {symbol.title === "تومان" && <img src={toAbsoluteUrl('/media/images/toman.jpg')} className="mx-1 w-4 h-4 inline-flex" alt="تومان" />}
                    {symbol.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
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
                      ? `${dateRange.from.year}/${String(dateRange.from.month).padStart(2,'0')}/${String(dateRange.from.day).padStart(2,'0')} - ${dateRange.to.year}/${String(dateRange.to.month).padStart(2,'0')}/${String(dateRange.to.day).padStart(2,'0')}`
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
                    ? `${dateRange.from.year}/${String(dateRange.from.month).padStart(2,'0')}/${String(dateRange.from.day).padStart(2,'0')} - ${dateRange.to.year}/${String(dateRange.to.month).padStart(2,'0')}/${String(dateRange.to.day).padStart(2,'0')}`
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
            افزودن سند
          </button>
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading title="مدیریت سند ها" description="مشاهده، ویرایش و مدیریت سندهای فروش و خرید" />
        </Toolbar>
      </Container>

      <Container>
        <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
          <DataGrid
            columns={columns}
            onFetchData={fetchInvoices}
            serverSide={true}
            pagination={{ size: 10 }}
            sorting={[{ id: 'type', desc: false }]}
            toolbar={<TableToolbar />}
            layout={{ card: true }}
            key={refreshKey}
          />
        </div>
      </Container>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        customers={customers}
        symbols={symbols}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        filteredTypes={filteredTypes}
        filteredSymbols={filteredSymbols}
        invoiceInfo={invoiceInfo}
        setInvoiceInfo={setInvoiceInfo}
        amountDisplay={amountDisplay}
        setAmountDisplay={setAmountDisplay}
        rateDisplay={rateDisplay}
        setRateDisplay={setRateDisplay}
        resetInvoiceInfo={resetInvoiceInfo}
        handleCreateInvoice={handleCreateInvoice}
      />

      {/* Edit Invoice Modal */}
      <EditInvoiceMdal
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        selectedInvoice={selectedInvoice}
        setSelectedInvoice={setSelectedInvoice}
        invoiceInfo={invoiceInfo}
        setInvoiceInfo={setInvoiceInfo}
        amountDisplay={amountDisplay}
        setAmountDisplay={setAmountDisplay}
        filteredTypes={filteredTypes}
        customers={customers}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        filteredSymbols={filteredSymbols}
        resetInvoiceInfo={resetInvoiceInfo}
        handleEditInvoiceSubmit={handleEditInvoiceSubmit}
      />

      {/* Delete Confirmation Modal */}

    </Fragment>
  );
};

export default SanadPage;
