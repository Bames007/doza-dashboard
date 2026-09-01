// app/center/dashboard/components/patient_panel/Calculator.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/app/utils/utils";

interface CalculatorProps {
  onResult: (value: number) => void;
  initialValue?: number;
}

export default function Calculator({
  onResult,
  initialValue = 0,
}: CalculatorProps) {
  const [display, setDisplay] = useState(String(initialValue));
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    onResult(0);
  };

  const handleOperator = (op: string) => {
    const current = parseFloat(display);
    if (currentValue === null) {
      setCurrentValue(current);
    } else if (operator) {
      const result = compute(currentValue, current, operator);
      setCurrentValue(result);
      setDisplay(String(result));
    }
    setOperator(op);
    setWaitingForOperand(true);
  };

  const compute = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  };

  const calculateResult = () => {
    const current = parseFloat(display);
    if (currentValue !== null && operator) {
      const result = compute(currentValue, current, operator);
      setDisplay(String(result));
      setCurrentValue(result);
      setOperator(null);
      setWaitingForOperand(true);
      onResult(result);
    } else {
      onResult(current);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key);
      if (e.key === ".") inputDecimal();
      if (e.key === "Enter") calculateResult();
      if (e.key === "Escape") clear();
      if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/")
        handleOperator(e.key);
      if (e.key === "Backspace") {
        setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [display, currentValue, operator, waitingForOperand]);

  const buttons = [
    { label: "7", action: () => inputDigit("7") },
    { label: "8", action: () => inputDigit("8") },
    { label: "9", action: () => inputDigit("9") },
    { label: "/", action: () => handleOperator("/") },
    { label: "4", action: () => inputDigit("4") },
    { label: "5", action: () => inputDigit("5") },
    { label: "6", action: () => inputDigit("6") },
    { label: "*", action: () => handleOperator("*") },
    { label: "1", action: () => inputDigit("1") },
    { label: "2", action: () => inputDigit("2") },
    { label: "3", action: () => inputDigit("3") },
    { label: "-", action: () => handleOperator("-") },
    { label: "0", action: () => inputDigit("0") },
    { label: ".", action: () => inputDecimal() },
    { label: "=", action: () => calculateResult() },
    { label: "+", action: () => handleOperator("+") },
    { label: "C", action: () => clear() },
  ];

  return (
    <div className="bg-slate-100 rounded-xl p-3 border border-slate-300 shadow-sm">
      <div className="bg-white rounded-lg p-2 mb-2 border border-slate-300 text-right text-2xl font-mono text-slate-900 min-h-[48px] shadow-inner">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className={cn(
              "py-2.5 rounded-lg text-sm font-bold transition focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm",
              btn.label === "="
                ? "col-span-1 bg-emerald-600 text-white hover:bg-emerald-700"
                : ["+", "-", "*", "/"].includes(btn.label)
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : btn.label === "C"
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
