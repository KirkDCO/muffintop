import { useState, useEffect } from 'react';
import {
  NUTRIENT_REGISTRY,
  DEFAULT_TARGET_DIRECTIONS,
  DEFAULT_INTAKE_DIRECTIONS,
  type NutrientKey,
  type NutrientTarget,
  type TargetDirection,
  type IntakeType,
  type IntakeTarget,
  type WaterUnit,
  mlToFlOz,
  flOzToMl,
} from '@muffintop/shared/types';

interface TargetSetupProps {
  selectedNutrients: NutrientKey[];
  basalCalories: number;
  nutrientTargets: Partial<Record<NutrientKey, NutrientTarget>>;
  intakeTargets: Partial<Record<IntakeType, IntakeTarget>>;
  waterUnit: WaterUnit;
  onBasalChange: (calories: number) => void;
  onTargetsChange: (targets: Partial<Record<NutrientKey, NutrientTarget>>) => void;
  onIntakeTargetsChange: (targets: Partial<Record<IntakeType, IntakeTarget>>) => void;
  onWaterUnitChange: (unit: WaterUnit) => void;
  disabled?: boolean;
}

export function TargetSetup({
  selectedNutrients,
  basalCalories,
  nutrientTargets,
  intakeTargets,
  waterUnit,
  onBasalChange,
  onTargetsChange,
  onIntakeTargetsChange,
  onWaterUnitChange,
  disabled = false,
}: TargetSetupProps) {
  // Local state for basal calories to allow clearing before entering new values
  const [localBasalCalories, setLocalBasalCalories] = useState(String(basalCalories));

  // Sync local state when prop changes
  useEffect(() => {
    setLocalBasalCalories(String(basalCalories));
  }, [basalCalories]);

  // Filter to nutrients that make sense for targets (exclude calories - handled separately)
  const targetableNutrients = selectedNutrients.filter((k) => k !== 'calories');

  const handleTargetChange = (
    key: NutrientKey,
    value: number | null,
    direction: TargetDirection
  ) => {
    const newTargets = { ...nutrientTargets };
    if (value === null || value === 0) {
      delete newTargets[key];
    } else {
      newTargets[key] = { value, direction };
    }
    onTargetsChange(newTargets);
  };

  const handleValueChange = (key: NutrientKey, valueStr: string) => {
    const value = valueStr ? parseInt(valueStr, 10) : null;
    const current = nutrientTargets[key];
    const direction = current?.direction || DEFAULT_TARGET_DIRECTIONS[key] || 'max';
    handleTargetChange(key, value, direction);
  };

  const handleDirectionChange = (key: NutrientKey, direction: TargetDirection) => {
    const current = nutrientTargets[key];
    if (current?.value) {
      handleTargetChange(key, current.value, direction);
    }
  };

  const handleIntakeValueChange = (type: IntakeType, valueStr: string) => {
    const newTargets = { ...intakeTargets };
    if (!valueStr) {
      delete newTargets[type];
    } else {
      let value = parseFloat(valueStr);
      // If water and fl_oz, convert display value to mL for storage
      if (type === 'water' && waterUnit === 'fl_oz') {
        value = flOzToMl(value);
      }
      const direction = newTargets[type]?.direction || DEFAULT_INTAKE_DIRECTIONS[type];
      newTargets[type] = { value, direction };
    }
    onIntakeTargetsChange(newTargets);
  };

  const handleIntakeDirectionChange = (type: IntakeType, direction: TargetDirection) => {
    const current = intakeTargets[type];
    if (current?.value) {
      const newTargets = { ...intakeTargets };
      newTargets[type] = { value: current.value, direction };
      onIntakeTargetsChange(newTargets);
    }
  };

  const handleWaterUnitSwitch = (newUnit: WaterUnit) => {
    onWaterUnitChange(newUnit);
  };

  // Display value for water target (convert from internal mL to display unit)
  const getWaterDisplayValue = (): string => {
    const wt = intakeTargets.water;
    if (!wt?.value) return '';
    if (waterUnit === 'fl_oz') {
      return String(Math.round(mlToFlOz(wt.value)));
    }
    return String(Math.round(wt.value));
  };

  return (
    <div className="target-setup">
      <div className="basal-calories-section">
        <label className="basal-label">
          <span className="label-text">Daily Calorie Budget (basal)</span>
          <div className="input-row">
            <input
              type="number"
              value={localBasalCalories}
              onChange={(e) => setLocalBasalCalories(e.target.value)}
              onBlur={() => {
                const val = parseInt(localBasalCalories, 10) || 0;
                const clamped = Math.max(500, Math.min(10000, val));
                setLocalBasalCalories(String(clamped));
                onBasalChange(clamped);
              }}
              min={500}
              max={10000}
              step={50}
              disabled={disabled}
            />
            <span className="unit">kcal</span>
          </div>
        </label>
        <p className="helper-text">
          Your base calorie target before activity. Activity calories burned will be added to this.
        </p>
      </div>

      {targetableNutrients.length > 0 && (
        <div className="nutrient-targets-section">
          <h4>Nutrient Targets (optional)</h4>
          <p className="helper-text">
            Set targets for nutrients you want to track. Min = try to reach, Max = stay under.
          </p>

          <div className="targets-list">
            {targetableNutrients.map((key) => {
              const def = NUTRIENT_REGISTRY[key];
              const current = nutrientTargets[key];
              const defaultDirection = DEFAULT_TARGET_DIRECTIONS[key] || 'max';

              return (
                <div key={key} className="nutrient-target-row">
                  <span className="nutrient-name">{def.displayName}</span>
                  <input
                    type="number"
                    value={current?.value || ''}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    placeholder="No target"
                    min={0}
                    disabled={disabled}
                    className="target-input"
                  />
                  <span className="unit">{def.unit}</span>
                  <select
                    value={current?.direction || defaultDirection}
                    onChange={(e) => handleDirectionChange(key, e.target.value as TargetDirection)}
                    disabled={disabled || !current?.value}
                    className="direction-select"
                  >
                    <option value="min">Min (reach)</option>
                    <option value="max">Max (limit)</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="intake-targets-section">
          <h4>Intake Targets (optional)</h4>
          <p className="helper-text">
            Set daily intake targets for water and caffeine tracking.
          </p>

          <div className="targets-list">
            <div className="nutrient-target-row">
              <span className="nutrient-name">Water</span>
              <input
                type="number"
                value={getWaterDisplayValue()}
                onChange={(e) => handleIntakeValueChange('water', e.target.value)}
                placeholder="No target"
                min={0}
                disabled={disabled}
                className="target-input"
              />
              <select
                value={waterUnit}
                onChange={(e) => handleWaterUnitSwitch(e.target.value as WaterUnit)}
                disabled={disabled}
                className="direction-select"
              >
                <option value="ml">mL</option>
                <option value="fl_oz">fl oz</option>
              </select>
              <select
                value={intakeTargets.water?.direction || DEFAULT_INTAKE_DIRECTIONS.water}
                onChange={(e) => handleIntakeDirectionChange('water', e.target.value as TargetDirection)}
                disabled={disabled || !intakeTargets.water?.value}
                className="direction-select"
              >
                <option value="min">Min (reach)</option>
                <option value="max">Max (limit)</option>
              </select>
            </div>

            <div className="nutrient-target-row">
              <span className="nutrient-name">Caffeine</span>
              <input
                type="number"
                value={intakeTargets.caffeine?.value || ''}
                onChange={(e) => handleIntakeValueChange('caffeine', e.target.value)}
                placeholder="No target"
                min={0}
                disabled={disabled}
                className="target-input"
              />
              <span className="unit">mg</span>
              <select
                value={intakeTargets.caffeine?.direction || DEFAULT_INTAKE_DIRECTIONS.caffeine}
                onChange={(e) => handleIntakeDirectionChange('caffeine', e.target.value as TargetDirection)}
                disabled={disabled || !intakeTargets.caffeine?.value}
                className="direction-select"
              >
                <option value="min">Min (reach)</option>
                <option value="max">Max (limit)</option>
              </select>
            </div>
          </div>
        </div>

      <style>{`
        .target-setup {
          border: 1px solid #444;
          border-radius: 8px;
          padding: 1rem;
        }
        .basal-calories-section {
          margin-bottom: 1.5rem;
        }
        .basal-label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .label-text {
          font-weight: 500;
        }
        .input-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .input-row input {
          width: 120px;
          padding: 0.5rem;
          font-size: 1rem;
        }
        .unit {
          color: #888;
        }
        .helper-text {
          color: #888;
          font-size: 0.85rem;
          margin: 0.5rem 0 0 0;
        }
        .nutrient-targets-section {
          border-top: 1px solid #444;
          padding-top: 1rem;
        }
        .nutrient-targets-section h4 {
          margin: 0 0 0.5rem 0;
        }
        .targets-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .nutrient-target-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #252525;
          border-radius: 4px;
        }
        .nutrient-name {
          flex: 1;
          min-width: 120px;
        }
        .target-input {
          width: 80px;
          padding: 0.25rem 0.5rem;
        }
        .direction-select {
          padding: 0.25rem;
          background: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 4px;
        }
        .direction-select:disabled {
          opacity: 0.5;
        }
        .intake-targets-section {
          border-top: 1px solid #444;
          padding-top: 1rem;
          margin-top: 1rem;
        }
        .intake-targets-section h4 {
          margin: 0 0 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
