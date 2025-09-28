import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toAbsoluteUrl } from "@/utils"

type SymbolType = {
    id: number
    title: string
}

export function CurrencySelect({
    selectedSymbol,
    setSelectedSymbol,
    filteredSymbols,
}: {
    selectedSymbol: number | null
    setSelectedSymbol: (id: number | null) => void
    filteredSymbols: SymbolType[]
}) {
    return (
        <div dir="rtl">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع ارز
            </label>

            <Select
                value={selectedSymbol ? String(selectedSymbol) : ""}
                onValueChange={(val) => setSelectedSymbol(val ? Number(val) : null)}
                dir="rtl"
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب ارز" />
                </SelectTrigger>

                <SelectContent className="z-[9999]">
                    {filteredSymbols.map((symbol) => (
                        <SelectItem key={symbol.id} value={String(symbol.id)}>
                            <div className="flex items-center gap-2">
                                {symbol.title === "تتر" && <span className="ki-outline ki-dollar text-lg" />}
                                {symbol.title === "تومان" && (
                                    <img
                                        src={toAbsoluteUrl("/media/images/toman.jpg")}
                                        className="w-4 h-4"
                                        alt="تومان"
                                    />
                                )}
                                {symbol.title}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

        </div>
    )
}
