import { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/layouts/demo1/toolbar';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { KeenIcon } from '@/components/keenicons';
import { useSummary } from '@/services/invoiceService';
import { digitSeparator } from '@/utils';

const Demo1LightSidebarPage = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 20),
    to: addDays(new Date(2025, 0, 20), 20)
  });

  const { data: summary, isLoading, error } = useSummary();

  const summaryCards = [
    {
      title: 'معاملات',
      items: [
        { label: 'تعداد معاملات خرید', value: summary?.countBuyInvoices },
        { label: 'تعداد معاملات فروش', value: summary?.countSellInvoices },
        { label: 'تعداد کل معاملات', value: summary?.countTotalInvoices },
      ]
    },
    {
      title: 'حجم معاملات',
      items: [
        // { label: 'جمع خرید پرفکت مانی', value: summary?.volumeBuyPm },
        // { label: 'جمع فروش پرفکت مانی', value: summary?.volumeSellPm },
        { label: 'جمع خرید دلاری', value: summary?.volumeBuyUsdt },
        { label: 'جمع فروش دلاری', value: summary?.volumeSellUsdt },
        { label: 'جمع خرید تومانی', value: summary?.volumeBuyIRT },
        { label: 'جمع فروش تومانی', value: summary?.volumeSellIRT },
      ]
    },
    {
      title: 'میانگین قیمت‌ها',
      items: [
        { label: 'میانگین سود خرید  تتر', value: summary?.averagePriceBuyPm },
        { label: 'میانگین سود فروش  تتر', value: summary?.averagePriceSellPm },
        { label: 'میانگین قیمت خرید تتر', value: summary?.averagePriceBuyTether },
        { label: 'میانگین قیمت فروش تتر', value: summary?.averagePriceSellTether },
      ]
    },
    {
      title: 'دریافت و پرداخت',
      items: [
        { label: 'جمع دریافت از کاربر دلاری', value: summary?.volumeReceivedUsdt },
        { label: 'جمع دریافت از کاربر تومانی', value: summary?.volumeReceivedIRT },
        { label: 'جمع پرداخت به کاربر دلاری', value: summary?.volumePaymentUsdt },
        { label: 'جمع پرداخت به کاربر تومانی', value: summary?.volumePaymentIRT },
      ]
    }
  ];

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading title="پیشخوان" description="" />
        </Toolbar>
      </Container>

      <Container>
        <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
          <div className="flex flex-wrap items-center gap-5 justify-between">
            <h3 className="text-lg text-gray-800 font-semibold">خلاصه اطلاعات</h3>
          </div>

          {error && (
            <div className="alert alert-danger">
              <KeenIcon icon="information-5" />
              خطا در دریافت اطلاعات. لطفا دوباره تلاش کنید.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-7.5">
            {summaryCards.map((card, cardIndex) => (
              <div key={cardIndex} className="card">
                <div className="card-header">
                  <h3 className="card-title">{card.title}</h3>
                </div>
                <div className="card-body">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="spinner spinner-sm"></div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {card.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between py-2 border-b border-input border-dashed last:border-b-0" dir="rtl">
                          
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {digitSeparator(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          
        </div>
      </Container>
    </Fragment>
  );
};

export { Demo1LightSidebarPage };
