"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function DateInput({ value, onChange }) {
    const [inputValue, setInputValue] = React.useState("");
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    // Sync internal text input when parent value changes
    React.useEffect(() => {
        if (value && isValid(value)) {
            setInputValue(format(value, "dd-MM-yyyy"));
        }
    }, [value]);

    // Handle typing in the text field
    const handleInputChange = (e) => {
        let input = e.target.value.replace(/\D/g, ""); // Remove non-digits

        // Masking logic: dd-mm-yyyy
        if (input.length > 8) input = input.slice(0, 8);

        let formatted = input;
        if (input.length >= 3) {
            formatted = input.slice(0, 2) + "-" + input.slice(2);
        }
        if (input.length >= 5) {
            formatted = formatted.slice(0, 5) + "-" + formatted.slice(5);
        }

        setInputValue(formatted);

        // If we have a full date, try to parse and update parent
        if (input.length === 8) {
            const parsedDate = parse(input, "ddMMyyyy", new Date());
            if (isValid(parsedDate)) {
                onChange(parsedDate);
            }
        } else {
            // If user clears or partial, we might want to clear parent or leave it?
            // For strictness, if invalid, we don't update parent to invalid date, 
            // OR we pass null if empty.
            if (input.length === 0) onChange(null);
        }
    };

    const handleCalendarSelect = (date) => {
        onChange(date);
        setIsPopoverOpen(false);
    };

    return (
        <div className="relative">
            <input
                type="text"
                placeholder="dd-mm-yyyy"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full pl-3 pr-10 py-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all text-sm"
            />

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                    >
                        <CalendarIcon className="w-4 h-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleCalendarSelect}
                        initialFocus
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
