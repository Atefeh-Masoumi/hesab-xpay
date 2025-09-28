import React, { useMemo, useState, useEffect, Fragment, useRef, useCallback } from 'react';
import { DataGrid, DataGridColumnHeader, KeenIcon, Container, useDataGrid } from '@/components';
import { Toolbar, ToolbarHeading } from '@/layouts/demo1/toolbar';
import { ColumnDef } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Invoice, InvoiceAddRequestBody, Enum, Customer } from '@/types/invoice';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, getInvoiceTypes, getInvoiceSymbols } from '@/services/invoiceService';
import { getCustomers } from '@/services/customerService';
import { digitSeparator, toAbsoluteUrl } from '@/utils';
import { TDataGridRequestParams } from '@/components/data-grid';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';
import { CurrencySelect } from './currentSelct';

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
      return await getInvoices({
        ...params,
        keyword: searchQuery,
        type: typeFilter !== -1 ? typeFilter : undefined,
        symbol: symbolFilter !== -1 ? symbolFilter : undefined,
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
      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <ModalContent className="max-w-4xl">
          <ModalHeader>
            <ModalTitle>افزودن سند جدید</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مشتری</label>
              <Select
                value={selectedCustomer ? String(selectedCustomer) : ""}
                onValueChange={(val) => setSelectedCustomer(val ? Number(val) : null)}
                dir="rtl"
              >
                 <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="انتخاب مشتری" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.firstName} {customer.lastName}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4" dir="rtl">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع تراکنش
                </label>

                <Select
                  value={selectedType ? String(selectedType) : ""}
                  onValueChange={(val) => setSelectedType(val ? Number(val) : null)}
                  dir="rtl"
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="انتخاب نوع" />
                  </SelectTrigger>

                  <SelectContent className="z-[9999]">
                    {filteredTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Symbol Selection */}
              <div>
                <CurrencySelect
                  selectedSymbol={selectedSymbol}
                  setSelectedSymbol={setSelectedSymbol}
                  filteredSymbols={filteredSymbols}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مقدار</label>
                <Input
                  value={amountDisplay}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers and commas
                    if (/^[0-9,]*$/.test(value)) {
                      setAmountDisplay(value);
                      const numericValue = removeCommaFromNumber(value);
                      if (!isNaN(numericValue)) {
                        setInvoiceInfo({ ...invoiceInfo, amount: numericValue });
                      }
                    }
                  }}
                  onBlur={() => {
                    // Format on blur
                    if (invoiceInfo.amount > 0) {
                      setAmountDisplay(digitSeparator(invoiceInfo.amount));
                    }
                  }}
                  placeholder="مقدار را وارد کنید"
                />
              </div>

              {/* Rate - only show if not symbol 3 (IRT) */}
              {selectedSymbol !== 3 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نرخ</label>
                  <Input
                    value={rateDisplay}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers and commas
                      if (/^[0-9,]*$/.test(value)) {
                        setRateDisplay(value);
                        const numericValue = removeCommaFromNumber(value);
                        if (!isNaN(numericValue)) {
                          setInvoiceInfo({ ...invoiceInfo, rate: numericValue });
                        }
                      }
                    }}
                    onBlur={() => {
                      // Format on blur
                      if (invoiceInfo.rate > 0) {
                        setRateDisplay(digitSeparator(invoiceInfo.rate));
                      }
                    }}
                    placeholder="نرخ را وارد کنید"
                  />
                </div>
              )}
            </div>

            {/* Transaction Hash - only show for symbol 1 (USDT) */}
            {selectedSymbol === 1 && selectedType !== 1 && selectedType !== 2 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">هش تراکنش</label>
                <Input
                  value={invoiceInfo.txId}
                  onChange={(e) => setInvoiceInfo({ ...invoiceInfo, txId: e.target.value })}
                  placeholder="هش تراکنش را وارد کنید"
                />
              </div>
            )}
            {selectedSymbol === 3 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">کد پیگیری</label>
                <Input
                  value={invoiceInfo.txId}
                  onChange={(e) => setInvoiceInfo({ ...invoiceInfo, txId: e.target.value })}
                  placeholder=" کد پیگیری را وارد کنید"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={invoiceInfo.description}
                onChange={(e) => setInvoiceInfo({ ...invoiceInfo, description: e.target.value })}
                placeholder="توضیحات اختیاری..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCreateModalOpen(false);
                resetInvoiceInfo();
              }}>
                لغو
              </Button>
              <Button onClick={handleCreateInvoice}>
                افزودن
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <ModalContent className="max-w-4xl">
          <ModalHeader>
            <ModalTitle>ویرایش سند</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">


            {/* Customer Selection */}
            <div>
              <label className="font-[Dana] block text-sm font-medium text-gray-700 mb-1">مشتری</label>
              <select
                value={selectedCustomer || ''}
                onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)}
                disabled={true}
                className="font-[Dana] flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm ring-offset-background cursor-not-allowed opacity-60"
              >
                <option value="">انتخاب مشتری</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع تراکنش</label>
                <Select
                  value={selectedType ? String(selectedType) : ""}
                  onValueChange={(val) => setSelectedType(val ? Number(val) : null)}
                  dir="rtl"
                  >
                   <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="انتخاب نوع" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                  {filteredTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.title}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Symbol Selection */}
              <div>
                  
                <CurrencySelect
                  selectedSymbol={selectedSymbol}
                  setSelectedSymbol={setSelectedSymbol}
                  filteredSymbols={filteredSymbols}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مقدار</label>
                <Input
                  value={amountDisplay}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers and commas
                    if (/^[0-9,]*$/.test(value)) {
                      setAmountDisplay(value);
                      const numericValue = removeCommaFromNumber(value);
                      if (!isNaN(numericValue)) {
                        setInvoiceInfo({ ...invoiceInfo, amount: numericValue });
                      }
                    }
                  }}
                  onBlur={() => {
                    // Format on blur
                    if (invoiceInfo.amount > 0) {
                      setAmountDisplay(digitSeparator(invoiceInfo.amount));
                    }
                  }}
                  placeholder="مقدار را وارد کنید"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نرخ</label>
                <Input
                  value={digitSeparator(invoiceInfo.rate)}
                  onChange={(e) => setInvoiceInfo({ ...invoiceInfo, rate: removeCommaFromNumber(e.target.value) })}
                  placeholder="نرخ را وارد کنید"
                />
              </div>
            </div>

            {/* Transaction Hash */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">هش تراکنش</label>
              <Input
                value={invoiceInfo.txId}
                onChange={(e) => setInvoiceInfo({ ...invoiceInfo, txId: e.target.value })}
                placeholder="هش تراکنش را وارد کنید"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={invoiceInfo.description}
                onChange={(e) => setInvoiceInfo({ ...invoiceInfo, description: e.target.value })}
                placeholder="توضیحات اختیاری..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setSelectedInvoice(null);
                resetInvoiceInfo();
              }}>
                لغو
              </Button>
              <Button onClick={handleEditInvoiceSubmit}>
                ذخیره تغییرات
              </Button>
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
                    آیا از حذف این سند اطمینان دارید؟
                  </p>
                  {selectedInvoice && (
                    <p className="text-gray-600 text-sm mt-1">
                      سند شماره: {selectedInvoice.id}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600">
                این عمل قابل بازگشت نیست و تمام اطلاعات سند حذف خواهد شد.
              </p>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedInvoice(null);
                }}>
                  لغو
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteInvoice}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <KeenIcon icon="trash" className="mr-1" />
                  حذف سند
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Fragment>
  );
};

export default SanadPage;
