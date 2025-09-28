import { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarActions, ToolbarHeading } from '@/layouts/demo1/toolbar';

import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { KeenIcon } from '@/components/keenicons';
import { useSummary } from '@/services/invoiceService';
import { digitSeparator } from '@/utils';
import { CustomerSummaryTable } from '@/components/CustomerSummaryTable';

const CustomerSummaryPage = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 20),
    to: addDays(new Date(2025, 0, 20), 20)
  });

  const { data: summary, isLoading, error } = useSummary();



  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading title="جدول خلاصه مشتریان" description="" />
        </Toolbar>
      </Container>

      <Container>
        <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
          

          {error && (
            <div className="alert alert-danger">
              <KeenIcon icon="information-5" />
              خطا در دریافت اطلاعات. لطفا دوباره تلاش کنید.
            </div>
          )}

          

          {/* Customer Summary Table */}
          <div className="flex flex-col gap-5 lg:gap-7.5">
            <CustomerSummaryTable />
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { CustomerSummaryPage };
