import { useState, useEffect } from 'react';
import { useFoodDetail } from '../hooks/useFoodSearch';
import { useCustomFood } from '../hooks/useCustomFoods';
import { useRecipe } from '../hooks/useRecipes';

interface PortionOption {
  id: string;
  label: string;
  value: number; // For USDA: gram weight. For custom/recipe: serving multiplier.
}

interface PortionSelectorProps {
  fdcId?: number;
  customFoodId?: number;
  ingredientRecipeId?: number;
  initialValue?: number; // For USDA: grams. For custom/recipe: servings.
  initialDisplay?: string;
  onChange: (value: number, displayQuantity: string) => void;
}

export function PortionSelector({
  fdcId,
  customFoodId,
  ingredientRecipeId,
  initialValue = fdcId ? 100 : 1, // Default 100g for USDA, 1 serving for custom/recipe
  initialDisplay = '',
  onChange,
}: PortionSelectorProps) {
  // Fetch USDA food detail if fdcId provided
  const { data: foodDetail, isLoading: isFoodLoading } = useFoodDetail(fdcId ?? null);
  // Fetch custom food detail if customFoodId provided
  const { data: customFoodDetail, isLoading: isCustomFoodLoading } = useCustomFood(customFoodId ?? null);
  // Fetch recipe detail if ingredientRecipeId provided (used for loading state)
  const { isLoading: isRecipeLoading } = useRecipe(ingredientRecipeId ?? null);

  const isLoading = fdcId ? isFoodLoading : customFoodId ? isCustomFoodLoading : ingredientRecipeId ? isRecipeLoading : false;
  // Custom foods and recipes both work in servings
  const isServingsMode = !!customFoodId || !!ingredientRecipeId;

  const [amount, setAmount] = useState<number>(1);
  const [selectedPortionId, setSelectedPortionId] = useState<string>(isServingsMode ? 'servings' : 'grams');
  const [manualValue, setManualValue] = useState<number>(initialValue);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Build portion options based on food type
  const portionOptions: PortionOption[] = [];

  if (ingredientRecipeId) {
    // Recipe ingredient: work in servings (recipes don't have custom portions)
    portionOptions.push({ id: 'servings', label: 'serving(s)', value: 1 });
  } else if (customFoodId) {
    // Custom food: work in servings
    portionOptions.push({ id: 'servings', label: 'serving(s)', value: 1 });

    if (customFoodDetail?.portions) {
      for (const portion of customFoodDetail.portions) {
        portionOptions.push({
          id: String(portion.id),
          label: portion.description,
          value: portion.servingMultiplier,
        });
      }
    }
  } else {
    // USDA food: work in grams
    portionOptions.push({ id: 'grams', label: 'grams', value: 1 });

    if (foodDetail?.portions) {
      for (const portion of foodDetail.portions) {
        portionOptions.push({
          id: String(portion.id),
          label: portion.description,
          value: portion.gramWeight,
        });
      }
    }
  }

  // Default to first portion (serving) when available, instead of grams
  useEffect(() => {
    if (fdcId && foodDetail?.portions && foodDetail.portions.length > 0 && !hasUserInteracted) {
      // Default to first portion (usually "serving") instead of grams
      setSelectedPortionId(String(foodDetail.portions[0].id));
      setAmount(1);
    }
  }, [fdcId, foodDetail?.portions?.length, hasUserInteracted]);

  // Try to auto-detect initial portion from display string
  useEffect(() => {
    const portions = fdcId ? foodDetail?.portions : customFoodDetail?.portions;
    if (portions && initialDisplay) {
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
        for (const portion of portions) {
          const portionLower = portion.description.toLowerCase();
          if (portionLower.includes(unitPart) || unitPart.includes(portionLower.split(' ')[0])) {
            setAmount(parsedAmount);
            setSelectedPortionId(String(portion.id));
            return;
          }
        }

        // No portion match, keep manual mode with parsed amount
        setAmount(parsedAmount);
      }
    }
  }, [fdcId, foodDetail, customFoodDetail, initialDisplay]);

  // Calculate value when amount or portion changes - only after user interaction
  useEffect(() => {
    if (!hasUserInteracted) return;

    const selectedPortion = portionOptions.find(p => p.id === selectedPortionId);
    let calculatedValue: number;
    let displayQty: string;

    const isManualMode = selectedPortionId === 'grams' || selectedPortionId === 'servings';

    if (isManualMode) {
      calculatedValue = manualValue;
      displayQty = isServingsMode ? `${manualValue} serving(s)` : `${manualValue}g`;
    } else if (selectedPortion) {
      calculatedValue = isServingsMode
        ? amount * selectedPortion.value  // servings
        : Math.round(amount * selectedPortion.value);  // grams
      displayQty = `${amount} ${selectedPortion.label}`;
    } else {
      calculatedValue = manualValue;
      displayQty = isServingsMode ? `${manualValue} serving(s)` : `${manualValue}g`;
    }

    onChange(calculatedValue, displayQty);
  }, [hasUserInteracted, amount, selectedPortionId, manualValue, portionOptions.length, isServingsMode]);

  // Calculate display value for the "= X" label
  const selectedPortion = portionOptions.find(p => p.id === selectedPortionId);
  const isManualMode = selectedPortionId === 'grams' || selectedPortionId === 'servings';
  const calculatedValue = isManualMode
    ? manualValue
    : isServingsMode
      ? amount * (selectedPortion?.value || 1)
      : Math.round(amount * (selectedPortion?.value || 1));

  if (isLoading) {
    return <span className="loading">Loading portions...</span>;
  }

  const handleAmountChange = (value: number) => {
    setHasUserInteracted(true);
    setAmount(value);
  };

  const handleManualValueChange = (value: number) => {
    setHasUserInteracted(true);
    setManualValue(value);
  };

  const handlePortionSelect = (portionId: string) => {
    setHasUserInteracted(true);
    setSelectedPortionId(portionId);
  };

  return (
    <div className="portion-selector">
      {isManualMode ? (
        <input
          type="number"
          value={manualValue}
          onChange={(e) => handleManualValueChange(Math.max(0, parseFloat(e.target.value) || 0))}
          min="0"
          step={isServingsMode ? '0.25' : '1'}
          className="amount-input"
        />
      ) : (
        <input
          type="number"
          value={amount}
          onChange={(e) => handleAmountChange(Math.max(0, parseFloat(e.target.value) || 0))}
          min="0"
          step="0.25"
          className="amount-input"
        />
      )}

      <select
        value={selectedPortionId}
        onChange={(e) => handlePortionSelect(e.target.value)}
        className="portion-select"
      >
        {portionOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {/* For USDA portions, show gram weight. For custom/recipe portions, show serving multiplier if != 1 */}
            {!isServingsMode && option.id !== 'grams' && ` (${option.value}g)`}
            {isServingsMode && option.id !== 'servings' && option.value !== 1 && ` (${option.value} srv)`}
          </option>
        ))}
      </select>

      {/* Show calculated value for non-manual selections */}
      {!isManualMode && (
        <span className="calculated-value">
          = {isServingsMode ? `${calculatedValue} srv` : `${calculatedValue}g`}
        </span>
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
        .calculated-value {
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
