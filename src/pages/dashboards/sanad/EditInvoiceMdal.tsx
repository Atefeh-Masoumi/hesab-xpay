import React, { Dispatch, SetStateAction } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CurrencySelect } from './currentSelct';
import { Button } from '@/components/ui/button';
import { Invoice, InvoiceAddRequestBody, Enum, Customer } from '@/types/invoice';
import { digitSeparator } from '@/utils';

interface EditInvoiceMdalProps {
    isEditModalOpen: boolean;
    setIsEditModalOpen: Dispatch<SetStateAction<boolean>>;
    selectedInvoice: Invoice | null;
    setSelectedInvoice: Dispatch<SetStateAction<Invoice | null>>;
    invoiceInfo: InvoiceAddRequestBody;
    setInvoiceInfo: Dispatch<SetStateAction<InvoiceAddRequestBody>>;
    amountDisplay: string;
    setAmountDisplay: Dispatch<SetStateAction<string>>;
    filteredTypes: Enum[];
    customers: Customer[];
    selectedCustomer: number | null;
    setSelectedCustomer: Dispatch<SetStateAction<number | null>>;
    selectedType: number | null;
    setSelectedType: Dispatch<SetStateAction<number | null>>;
    selectedSymbol: number | null;
    setSelectedSymbol: Dispatch<SetStateAction<number | null>>;
    filteredSymbols: Enum[];
    resetInvoiceInfo: () => void;
    handleEditInvoiceSubmit: () => void;
}

const EditInvoiceMdal = ({
    isEditModalOpen,
    setIsEditModalOpen,
    selectedInvoice,
    setSelectedInvoice,
    invoiceInfo,
    setInvoiceInfo,
    amountDisplay,
    setAmountDisplay,
    filteredTypes,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    selectedType,
    setSelectedType,
    selectedSymbol,
    setSelectedSymbol,
    filteredSymbols,
    resetInvoiceInfo,
    handleEditInvoiceSubmit,
}: EditInvoiceMdalProps) => {

    const removeCommaFromNumber = (value: string): number => {
        return Number(value.replace(/,/g, ''));
    };
    return (
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
    )
}

export default EditInvoiceMdal