import { useState, useEffect } from 'react';
import { useUser } from '../providers/UserProvider';
import { useNutrients } from '../providers/NutrientProvider';
import { useNutrientPreferences, useUpdateNutrientPreferences } from '../hooks/useNutrientPreferences';
import { useTargets, useUpdateTargets } from '../hooks/useTargets';
import { useWeightHistory } from '../hooks/useWeightMetrics';
import { NutrientPreferencesEditor } from '../components/NutrientPreferencesEditor';
import { TargetSetup } from '../components/TargetSetup';
import { WeightLogger } from '../components/WeightLogger';
import { WeightTrend } from '../components/WeightTrend';
import { EventLogger } from '../components/EventLogger';
import { EventList } from '../components/EventList';
import type { NutrientKey, NutrientTarget } from '@muffintop/shared/types';

export function Settings() {
  const { currentUser, setCurrentUser } = useUser();
  const { visibleNutrients } = useNutrients();
  const { data: preferences, isLoading: loadingPrefs } = useNutrientPreferences(currentUser?.id ?? null);
  const updatePreferences = useUpdateNutrientPreferences(currentUser?.id ?? 0);
  const { data: targetData, isLoading: loadingTargets } = useTargets();
  const updateTargets = useUpdateTargets();
  const { data: weightData } = useWeightHistory();

  const [selectedNutrients, setSelectedNutrients] = useState<NutrientKey[]>(visibleNutrients);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Target editing state
  const [basalCalories, setBasalCalories] = useState(2000);
  const [nutrientTargets, setNutrientTargets] = useState<Partial<Record<NutrientKey, NutrientTarget>>>({});
  const [hasTargetChanges, setHasTargetChanges] = useState(false);
  const [targetSaveStatus, setTargetSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Update local state when preferences load
  useEffect(() => {
    if (preferences?.visibleNutrients) {
      setSelectedNutrients(preferences.visibleNutrients);
      setHasChanges(false);
    }
  }, [preferences]);

  // Update local state when targets load
  useEffect(() => {
    if (targetData?.target) {
      setBasalCalories(targetData.target.basalCalories);
      setNutrientTargets(targetData.target.nutrientTargets || {});
      setHasTargetChanges(false);
    }
  }, [targetData]);

  const handleNutrientsChange = (nutrients: NutrientKey[]) => {
    setSelectedNutrients(nutrients);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setSaveStatus('saving');
    try {
      await updatePreferences.mutateAsync(selectedNutrients);
      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setSaveStatus('error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleBasalChange = (value: number) => {
    setBasalCalories(value);
    setHasTargetChanges(true);
    setTargetSaveStatus('idle');
  };

  const handleNutrientTargetsChange = (targets: Partial<Record<NutrientKey, NutrientTarget>>) => {
    setNutrientTargets(targets);
    setHasTargetChanges(true);
    setTargetSaveStatus('idle');
  };

  const handleSaveTargets = async () => {
    if (!currentUser) return;

    setTargetSaveStatus('saving');
    try {
      await updateTargets.mutateAsync({
        basalCalories,
        nutrientTargets,
      });
      setTargetSaveStatus('saved');
      setHasTargetChanges(false);
      setTimeout(() => setTargetSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save targets:', err);
      setTargetSaveStatus('error');
    }
  };

  if (loadingPrefs || loadingTargets) {
    return <div className="settings">Loading settings...</div>;
  }

  return (
    <div className="settings">
      <h1>Settings</h1>

      <section className="settings-section">
        <h2>Current User</h2>
        <div className="user-info">
          <span className="user-name">{currentUser?.name}</span>
          <button className="logout-button" onClick={handleLogout}>
            Switch User
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2>Nutrient Display Preferences</h2>
        <p className="section-description">
          Choose which nutrients to show in your daily summary and food details. All nutrients are
          tracked regardless of display settings.
        </p>

        <NutrientPreferencesEditor
          selectedNutrients={selectedNutrients}
          onChange={handleNutrientsChange}
          disabled={updatePreferences.isPending}
        />

        <div className="save-actions">
          <button
            className="save-button"
            onClick={handleSave}
            disabled={!hasChanges || updatePreferences.isPending}
          >
            {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
          </button>
          {saveStatus === 'saved' && <span className="save-status success">Saved!</span>}
          {saveStatus === 'error' && (
            <span className="save-status error">Failed to save. Please try again.</span>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h2>Daily Targets</h2>
        <p className="section-description">
          Set your baseline daily calorie budget and nutrient targets. Activity calories are added
          daily on the Dashboard.
        </p>

        <TargetSetup
          selectedNutrients={selectedNutrients}
          basalCalories={basalCalories}
          nutrientTargets={nutrientTargets}
          onBasalChange={handleBasalChange}
          onTargetsChange={handleNutrientTargetsChange}
          disabled={updateTargets.isPending}
        />

        <div className="save-actions">
          <button
            className="save-button"
            onClick={handleSaveTargets}
            disabled={!hasTargetChanges || updateTargets.isPending || basalCalories < 500}
          >
            {updateTargets.isPending ? 'Saving...' : 'Save Targets'}
          </button>
          {targetSaveStatus === 'saved' && <span className="save-status success">Saved!</span>}
          {targetSaveStatus === 'error' && (
            <span className="save-status error">Failed to save. Please try again.</span>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h2>Weight Tracking</h2>
        <p className="section-description">
          Track your weight over time to monitor your progress.
        </p>

        <WeightLogger
          latestValue={weightData?.latestValue}
          latestUnit={weightData?.latestUnit}
        />

        <WeightTrend />
      </section>

      <section className="settings-section">
        <h2>Event Tracking</h2>
        <p className="section-description">
          Track health events (illness, GI issues, etc.) that appear as colored markers on your
          trends chart.
        </p>

        <EventLogger />
        <EventList />
      </section>

      <style>{`
        .settings {
          max-width: 800px;
          margin: 0 auto;
        }
        .settings h1 {
          margin-bottom: 2rem;
        }
        .settings-section {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .settings-section h2 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
        }
        .section-description {
          color: #888;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .user-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .user-name {
          font-size: 1.1rem;
          font-weight: 500;
        }
        .logout-button {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid #555;
        }
        .logout-button:hover {
          border-color: #888;
        }
        .save-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .save-button {
          padding: 0.75rem 1.5rem;
          background: #646cff;
          color: white;
          border: none;
          font-size: 1rem;
        }
        .save-button:hover:not(:disabled) {
          background: #535bf2;
        }
        .save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .save-status {
          font-size: 0.9rem;
        }
        .save-status.success {
          color: #4caf50;
        }
        .save-status.error {
          color: #f44336;
        }
      `}</style>
    </div>
  );
}
