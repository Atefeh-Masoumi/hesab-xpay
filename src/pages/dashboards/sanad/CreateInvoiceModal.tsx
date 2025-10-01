import React, { Dispatch, SetStateAction } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CurrencySelect } from './currentSelct';
import { Button } from '@/components/ui/button';
import { Invoice, InvoiceAddRequestBody, Enum, Customer } from '@/types/invoice';
import { digitSeparator, toAbsoluteUrl } from '@/utils';

interface CreateInvoiceModalProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: Dispatch<SetStateAction<boolean>>;
  customers: Customer[];
  symbols: Enum[];
  selectedCustomer: number | null;
  setSelectedCustomer: Dispatch<SetStateAction<number | null>>;
  selectedType: number | null;
  setSelectedType: Dispatch<SetStateAction<number | null>>;
  selectedSymbol: number | null;
  setSelectedSymbol: Dispatch<SetStateAction<number | null>>;
  filteredTypes: Enum[];
  filteredSymbols: Enum[];
  invoiceInfo: InvoiceAddRequestBody;
  setInvoiceInfo: Dispatch<SetStateAction<InvoiceAddRequestBody>>;
  amountDisplay: string;
  setAmountDisplay: Dispatch<SetStateAction<string>>;
  rateDisplay: string;
  setRateDisplay: Dispatch<SetStateAction<string>>;
  resetInvoiceInfo: () => void;
  handleCreateInvoice: () => void;
}
const CreateInvoiceModal = ({
    isCreateModalOpen,
    setIsCreateModalOpen,
    customers,
    symbols,
    selectedCustomer,
    setSelectedCustomer,
    selectedType,
    setSelectedType,
    selectedSymbol,
    setSelectedSymbol,
    filteredTypes,
    filteredSymbols,
    invoiceInfo,
    setInvoiceInfo,
    amountDisplay,
    setAmountDisplay,
    rateDisplay,
    setRateDisplay,
    resetInvoiceInfo,
    handleCreateInvoice,
}:CreateInvoiceModalProps) => {

    const removeCommaFromNumber = (value: string): number => {
        return Number(value.replace(/,/g, ''));
      };
  return (
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
  )
}

export default CreateInvoiceModal