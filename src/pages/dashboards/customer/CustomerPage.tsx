import { Fragment } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/layouts/demo1/toolbar';
import { CustomerManagementTable } from '@/components/CustomerManagementTable';

const CustomerPage = () => {
  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading title="مدیریت مشتریان" description="مشاهده، ویرایش و مدیریت اطلاعات مشتریان" />
        </Toolbar>
      </Container>

      <Container>
        <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
          <CustomerManagementTable />
        </div>
      </Container>
    </Fragment>
  );
};

export default CustomerPage;