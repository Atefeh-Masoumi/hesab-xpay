import { useMemo, useState } from 'react';
import { DataGrid, DataGridColumnHeader, KeenIcon, useDataGrid } from '@/components';
import { ColumnDef, Column } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Report } from '@/types/invoice';
import { getCustomersSummary } from '@/services/invoiceService';
import { digitSeparator } from '@/utils';
import { TDataGridRequestParams } from '@/components/data-grid';
import { toast } from 'sonner';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

export const CustomerSummaryTable = () => {
  const [searchQuery, setSearchQuery] = useState('');

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
      return await getCustomersSummary({
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

  const Toolbar = () => {
    const { table } = useDataGrid();

    const handleSearch = () => {
      // Trigger refetch by updating the table
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
