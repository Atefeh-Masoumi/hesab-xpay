import { useCallback, useMemo, useState } from 'react';
import { DataGrid, DataGridColumnHeader, KeenIcon, useDataGrid } from '@/components';
import { ColumnDef, Column } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Report } from '@/types/invoice';
import { getCustomersSummary } from '@/services/invoiceService';
import { digitSeparator } from '@/utils';
import { TDataGridRequestParams } from '@/components/data-grid';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

export const CustomerSummaryTable = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'last7' | 'last30' | 'last365' | 'custom'>('today');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null}>({ from: new Date(), to: new Date() });
  
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
  
  // Helper function to replace کاربر with مشتری in type titles
  const transformTypeTitle = (title: string): string => {
    return title.replace(/کاربر/g, 'مشتری');
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

  const columns = useMemo<ColumnDef<Report>[]>(
    () => [
      {
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        id: 'customer',
        header: ({ column }) => (
          <DataGridColumnHeader title="مشتری" filter={<ColumnInputFilter column={column} />} column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-900">
                {customer.firstName} {customer.lastName}
              </span>
              <span className="text-2sm text-gray-700 font-normal" dir="ltr">
                {customer.phoneNumber}
              </span>
            </div>
          );
        },
        meta: {
          className: 'min-w-[200px]',
          cellClassName: 'text-gray-800 font-normal',
        }
      },
      {
        accessorFn: (row) => row.customerCode,
        id: 'customerCode',
        header: ({ column }) => <DataGridColumnHeader title="کد مشتری" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const customerCode = row.original.customerCode;
          
          const copyToClipboard = async (text: string) => {
            try {
              await navigator.clipboard.writeText(text);
              toast.success('کد مشتری کپی شد');
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
                onClick={() => copyToClipboard(customerCode)}
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
        accessorFn: (row) => row.tether,
        id: 'tether',
        header: ({ column }) => <DataGridColumnHeader title="تتر" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const value = row.original.tether;
          const color = value === 0 ? 'text-gray-900' : value > 0 ? 'text-green-600' : 'text-red-600';
          
          return (
            <span className={`text-sm font-semibold ${color}`} dir="ltr">
              {digitSeparator(value)}
            </span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
        }
      },
      {
        accessorFn: (row) => row.irt,
        id: 'irt',
        header: ({ column }) => <DataGridColumnHeader title="تومان" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const value = row.original.irt;
          const color = value === 0 ? 'text-gray-900' : value > 0 ? 'text-green-600' : 'text-red-600';
          
          return (
            <span className={`text-sm font-semibold ${color}`} dir="ltr">
              {digitSeparator(value)}
            </span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
        }
      },
      {
        accessorFn: (row) => row.pm,
        id: 'pm',
        header: ({ column }) => <DataGridColumnHeader title="پرفکت مانی" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const value = row.original.pm;
          const color = value === 0 ? 'text-gray-900' : value > 0 ? 'text-green-600' : 'text-red-600';
          
          return (
            <span className={`text-sm font-semibold ${color}`} dir="ltr">
              {digitSeparator(value)}
            </span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
        }
      },
    ],
    []
  );

  const fetchCustomersSummary = async (params: TDataGridRequestParams) => {
    try {
      const range = computeDateRange();
      const fromDate = range.from ? toISODate(range.from) : undefined;
      const toDate = range.to ? toISODate(range.to) : undefined;
      return await getCustomersSummary({
        ...params,
        keyword: searchQuery,
      });
    } catch (error) {
      toast.error('خطا در دریافت اطلاعات مشتریان');
      return {
        data: [],
        totalCount: 0
      };
    }
  };

  const Toolbar = () => {
    const { table,reload } = useDataGrid();

    const handleSearch = () => {
      // Trigger refetch by updating the table
      reload();
      table.resetPageIndex();
    };

    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">خلاصه مشتریان</h3>

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
              <PopoverTrigger asChild>
                <button className="btn btn-sm btn-light" disabled={datePreset !== 'custom'}>
                  {(() => { const r = computeDateRange(); return r.from && r.to ? `${formatPersianDate(r.from)} - ${formatPersianDate(r.to)}` : 'انتخاب بازه'; })()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 z-[9999] bg-white w-full" align="start">
                <div className="p-3 z-[9999] bg-white w-full">
                  <DatePicker
                    value={[dateRange.from, dateRange.to].filter(Boolean) as any}
                    onChange={(values: any) => {
                      const [from, to] = Array.isArray(values) ? values : [values];
                      const toDateObj = (v: any) => (v && v.toDate ? v.toDate() : v ? new Date(v) : null);
                      setDateRange({ from: toDateObj(from), to: toDateObj(to) });
                    }}
                    numberOfMonths={2}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-center"
                    className="range custom-jalali w-full bg-white z-[9999]"
                  />
                </div>
                <div className="flex justify-end gap-2 p-3 pt-0">
                  <button className="btn btn-xs btn-light" onClick={() => setDateRange({ from: new Date(), to: new Date() })}>امروز</button>
                  <button className="btn btn-xs btn-primary" onClick={() => reload()}>اعمال</button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <button className="btn btn-sm btn-primary" onClick={handleSearch}>
            <KeenIcon icon="magnifier" />
            جستجو
          </button>
        </div>
      </div>
    );
  };

  return (
    <DataGrid
      columns={columns}
      onFetchData={fetchCustomersSummary}
      serverSide={true}
      pagination={{ size: 10 }}
      sorting={[{ id: 'customer', desc: false }]}
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  );
};
