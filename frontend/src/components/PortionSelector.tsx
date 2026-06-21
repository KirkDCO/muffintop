import { useState, useEffect, useRef } from 'react';
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

  const [amount, setAmount] = useState<string>('1');
  const [selectedPortionId, setSelectedPortionId] = useState<string>(isServingsMode ? 'servings' : 'grams');
  const [manualValue, setManualValue] = useState<string>(String(initialValue));
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const lastReportedRef = useRef<{ value: number; display: string } | null>(null);
  // Capture initialDisplay once at mount — never re-read from the prop, since onChange
  // causes the parent to update displayQuantity which flows back here and would create
  // a feedback loop if used as an effect dependency.
  const initialDisplayRef = useRef(initialDisplay);

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

  // Initialize portion selection when food data loads. Merged from two separate effects to
  // eliminate the race where they fired independently and set conflicting state. Uses
  // initialDisplayRef (not the prop) to avoid a feedback loop: onChange → parent updates
  // displayQuantity → initialDisplay prop changes → effect re-fires with corrupted value.
  useEffect(() => {
    if (hasUserInteracted) return;
    const portions = fdcId ? foodDetail?.portions : customFoodDetail?.portions;
    if (!portions || portions.length === 0) return;

    const initDisplay = initialDisplayRef.current;

    if (initDisplay) {
      const displayLower = initDisplay.toLowerCase();
      const match = displayLower.match(/^([\d./]+)\s*(.*)$/);
      if (match) {
        let parsedAmount = 1;
        const amountStr = match[1];

        if (amountStr.includes('/')) {
          const [num, denom] = amountStr.split('/').map(Number);
          parsedAmount = num / denom;
        } else {
          parsedAmount = parseFloat(amountStr) || 1;
        }

        const unitPart = match[2].trim();

        if (!isServingsMode && unitPart === 'g') {
          setSelectedPortionId('grams');
          setManualValue(String(parsedAmount));
          return;
        }

        for (const portion of portions) {
          const portionLower = portion.description.toLowerCase();
          if (portionLower.includes(unitPart) || unitPart.includes(portionLower.split(' ')[0])) {
            setAmount(String(parsedAmount));
            setSelectedPortionId(String(portion.id));
            return;
          }
        }

        setAmount(String(parsedAmount));
        return;
      }
    }

    // No initDisplay or unparseable: default to first portion (USDA foods only)
    if (fdcId) {
      setSelectedPortionId(String(portions[0].id));
      setAmount('1');
    }
  }, [fdcId, foodDetail, customFoodDetail, hasUserInteracted, isServingsMode]);

  // Calculate value when amount or portion changes
  useEffect(() => {
    const selectedPortion = portionOptions.find(p => p.id === selectedPortionId);
    const amountNum = parseFloat(amount) || 0;
    const manualNum = parseFloat(manualValue) || 0;
    let calculatedValue: number;
    let displayQty: string;

    const isManualMode = selectedPortionId === 'grams' || selectedPortionId === 'servings';

    if (isManualMode) {
      calculatedValue = manualNum;
      displayQty = isServingsMode ? `${manualNum} serving(s)` : `${manualNum}g`;
    } else if (selectedPortion) {
      calculatedValue = isServingsMode
        ? amountNum * selectedPortion.value  // servings
        : Math.round(amountNum * selectedPortion.value);  // grams
      displayQty = `${amountNum} ${selectedPortion.label}`;
    } else {
      calculatedValue = manualNum;
      displayQty = isServingsMode ? `${manualNum} serving(s)` : `${manualNum}g`;
    }

    // Dedup: skip if value and display are unchanged from last reported
    const last = lastReportedRef.current;
    if (last && last.value === calculatedValue && last.display === displayQty) return;

    lastReportedRef.current = { value: calculatedValue, display: displayQty };
    onChange(calculatedValue, displayQty);
  }, [amount, selectedPortionId, manualValue, portionOptions.length, isServingsMode]);

  // Calculate display value for the "= X" label
  const selectedPortion = portionOptions.find(p => p.id === selectedPortionId);
  const isManualMode = selectedPortionId === 'grams' || selectedPortionId === 'servings';
  const amountNum = parseFloat(amount) || 0;
  const manualNum = parseFloat(manualValue) || 0;
  const calculatedValue = isManualMode
    ? manualNum
    : isServingsMode
      ? amountNum * (selectedPortion?.value || 1)
      : Math.round(amountNum * (selectedPortion?.value || 1));

  if (isLoading) {
    return <span className="loading">Loading portions...</span>;
  }

  const handleAmountChange = (value: string) => {
    setHasUserInteracted(true);
    setAmount(value);
  };

  const handleAmountBlur = () => {
    const val = parseFloat(amount) || 0;
    setAmount(String(Math.max(0, val)));
  };

  const handleManualValueChange = (value: string) => {
    setHasUserInteracted(true);
    setManualValue(value);
  };

  const handleManualValueBlur = () => {
    const val = parseFloat(manualValue) || 0;
    setManualValue(String(Math.max(0, val)));
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
          onChange={(e) => handleManualValueChange(e.target.value)}
          onBlur={handleManualValueBlur}
          min="0"
          step={isServingsMode ? '0.25' : '1'}
          className="amount-input"
        />
      ) : (
        <input
          type="number"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          onBlur={handleAmountBlur}
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
