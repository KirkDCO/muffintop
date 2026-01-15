import { useState, useEffect } from 'react';
import { useFoodDetail } from '../hooks/useFoodSearch';

interface PortionOption {
  id: string; // 'grams' or portion id
  label: string;
  gramWeight: number;
}

interface PortionSelectorProps {
  fdcId: number;
  initialGrams?: number;
  initialDisplay?: string;
  onChange: (grams: number, displayQuantity: string) => void;
}

export function PortionSelector({
  fdcId,
  initialGrams = 100,
  initialDisplay = '',
  onChange,
}: PortionSelectorProps) {
  const { data: foodDetail, isLoading } = useFoodDetail(fdcId);

  const [amount, setAmount] = useState<number>(1);
  const [selectedPortionId, setSelectedPortionId] = useState<string>('grams');
  const [manualGrams, setManualGrams] = useState<number>(initialGrams);

  // Build portion options from food detail
  const portionOptions: PortionOption[] = [
    { id: 'grams', label: 'grams', gramWeight: 1 },
  ];

  if (foodDetail?.portions) {
    for (const portion of foodDetail.portions) {
      portionOptions.push({
        id: String(portion.id),
        label: portion.description,
        gramWeight: portion.gramWeight,
      });
    }
  }

  // Try to auto-detect initial portion from display string
  useEffect(() => {
    if (foodDetail?.portions && initialDisplay) {
      const displayLower = initialDisplay.toLowerCase();

      // Try to parse amount from display (e.g., "2 cups" -> amount=2)
      const match = displayLower.match(/^([\d.\/]+)\s*(.*)$/);
      if (match) {
        let parsedAmount = 1;
        const amountStr = match[1];

        // Handle fractions like "1/2"
        if (amountStr.includes('/')) {
          const [num, denom] = amountStr.split('/').map(Number);
          parsedAmount = num / denom;
        } else {
          parsedAmount = parseFloat(amountStr) || 1;
        }

        const unitPart = match[2].trim();

        // Find matching portion
        for (const portion of foodDetail.portions) {
          const portionLower = portion.description.toLowerCase();
          if (portionLower.includes(unitPart) || unitPart.includes(portionLower.split(' ')[0])) {
            setAmount(parsedAmount);
            setSelectedPortionId(String(portion.id));
            return;
          }
        }

        // No portion match, keep as grams with parsed amount
        setAmount(parsedAmount);
      }
    }
  }, [foodDetail, initialDisplay]);

  // Calculate grams when amount or portion changes
  useEffect(() => {
    const selectedPortion = portionOptions.find(p => p.id === selectedPortionId);
    let calculatedGrams: number;
    let displayQty: string;

    if (selectedPortionId === 'grams') {
      calculatedGrams = manualGrams;
      displayQty = `${manualGrams}g`;
    } else if (selectedPortion) {
      calculatedGrams = Math.round(amount * selectedPortion.gramWeight);
      displayQty = `${amount} ${selectedPortion.label}`;
    } else {
      calculatedGrams = manualGrams;
      displayQty = `${manualGrams}g`;
    }

    onChange(calculatedGrams, displayQty);
  }, [amount, selectedPortionId, manualGrams, portionOptions.length]);

  const selectedPortion = portionOptions.find(p => p.id === selectedPortionId);
  const calculatedGrams = selectedPortionId === 'grams'
    ? manualGrams
    : Math.round(amount * (selectedPortion?.gramWeight || 1));

  if (isLoading) {
    return <span className="loading">Loading portions...</span>;
  }

  return (
    <div className="portion-selector">
      {selectedPortionId === 'grams' ? (
        <input
          type="number"
          value={manualGrams}
          onChange={(e) => setManualGrams(Math.max(0, parseFloat(e.target.value) || 0))}
          min="0"
          step="1"
          className="amount-input"
        />
      ) : (
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
          min="0"
          step="0.25"
          className="amount-input"
        />
      )}

      <select
        value={selectedPortionId}
        onChange={(e) => setSelectedPortionId(e.target.value)}
        className="portion-select"
      >
        {portionOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.id !== 'grams' && ` (${option.gramWeight}g)`}
          </option>
        ))}
      </select>

      {selectedPortionId !== 'grams' && (
        <span className="calculated-grams">= {calculatedGrams}g</span>
      )}

      <style>{`
        .portion-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .amount-input {
          width: 70px;
          padding: 0.4rem;
        }
        .portion-select {
          padding: 0.4rem;
          min-width: 120px;
          max-width: 200px;
        }
        .calculated-grams {
          color: #888;
          font-size: 0.9rem;
        }
        .loading {
          color: #888;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
