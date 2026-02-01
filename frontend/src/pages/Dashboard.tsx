import { useState } from 'react';
import { useUser } from '../providers/UserProvider';
import { useFoodLog, useRecentFoods, useCreateFoodLog, useUpdateFoodLog, useDeleteFoodLog, useHideRecentFood } from '../hooks/useFoodLog';
import { useTargets } from '../hooks/useTargets';
import { useActivity } from '../hooks/useActivity';
import { DailySummary } from '../components/DailySummary';
import { DailyChart } from '../components/DailyChart';
import { TrendChart } from '../components/TrendChart';
import { FoodLogEntry } from '../components/FoodLogEntry';
import { RecentFoods } from '../components/RecentFoods';
import { LogFoodModal } from '../components/LogFoodModal';
import { ActivityInput } from '../components/ActivityInput';
import type { CreateFoodLogInput, MealCategory } from '@muffintop/shared/types';

function getToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMealByTime(): MealCategory {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return 'breakfast';
  if (hour >= 11 && hour < 13) return 'lunch';
  if (hour >= 18 && hour < 20) return 'dinner';
  return 'snack';
}

export function Dashboard() {
  const { currentUser } = useUser();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showLogModal, setShowLogModal] = useState(false);
  const { data: foodLogData, isLoading: loadingLog } = useFoodLog(selectedDate);
  const { data: recentData } = useRecentFoods(getToday());
  const { data: targetData } = useTargets();
  const { data: activityData } = useActivity(selectedDate);
  const createFoodLog = useCreateFoodLog();
  const updateFoodLog = useUpdateFoodLog();
  const deleteFoodLog = useDeleteFoodLog();
  const hideRecentFood = useHideRecentFood();

  const handleLogFood = async (input: CreateFoodLogInput) => {
    try {
      await createFoodLog.mutateAsync(input);
      setShowLogModal(false);
    } catch (err) {
      console.error('Failed to log food:', err);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    try {
      await deleteFoodLog.mutateAsync(entryId);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const handleMoveEntry = async (entryId: number, mealCategory: MealCategory) => {
    try {
      await updateFoodLog.mutateAsync({ entryId, input: { mealCategory } });
    } catch (err) {
      console.error('Failed to move entry:', err);
    }
  };

  const handleHideRecentFood = async (input: { foodId?: number; customFoodId?: number; recipeId?: number }) => {
    try {
      await hideRecentFood.mutateAsync(input);
    } catch (err) {
      console.error('Failed to hide recent food:', err);
    }
  };

  const entries = foodLogData?.entries || [];
  const recentFoods = recentData?.recentFoods || [];
  const target = targetData?.target;
  const activityCalories = activityData?.entries?.[0]?.activityCalories || 0;

  // Group entries by meal
  const mealOrder: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const entriesByMeal = mealOrder.reduce((acc, meal) => {
    acc[meal] = entries.filter((e) => e.mealCategory === meal);
    return acc;
  }, {} as Record<MealCategory, typeof entries>);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Hello, {currentUser?.name}</h1>
        <div className="date-nav">
          <button
            onClick={() => {
              const d = new Date(selectedDate + 'T00:00:00');
              d.setDate(d.getDate() - 1);
              setSelectedDate(formatLocalDate(d));
            }}
          >
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            onClick={() => {
              const d = new Date(selectedDate + 'T00:00:00');
              d.setDate(d.getDate() + 1);
              setSelectedDate(formatLocalDate(d));
            }}
            disabled={selectedDate >= getToday()}
          >
            →
          </button>
        </div>
      </div>

      {/* Activity input - shows if targets are set */}
      {target && <ActivityInput date={selectedDate} basalCalories={target.basalCalories} />}

      <DailySummary
        entries={entries}
        date={selectedDate}
        target={target}
        activityCalories={activityCalories}
      />

      <DailyChart target={target} />

      <TrendChart target={target} />

      {recentFoods.length > 0 && (
        <RecentFoods
          recentFoods={recentFoods}
          date={selectedDate}
          mealCategory={getMealByTime()}
          onQuickLog={handleLogFood}
          onHide={handleHideRecentFood}
        />
      )}

      <div className="log-action">
        <button className="log-button" onClick={() => setShowLogModal(true)}>
          + Log Food
        </button>
      </div>

      {loadingLog ? (
        <div>Loading...</div>
      ) : (
        <div className="food-log">
          {mealOrder.map((meal) => (
            <div key={meal} className="meal-section">
              <h3 className="meal-title">{meal}</h3>
              {entriesByMeal[meal].length === 0 ? (
                <p className="no-entries">No entries</p>
              ) : (
                <div className="entries-list">
                  {entriesByMeal[meal].map((entry) => (
                    <FoodLogEntry
                      key={entry.id}
                      entry={entry}
                      onDelete={handleDeleteEntry}
                      onMove={handleMoveEntry}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showLogModal && (
        <LogFoodModal
          date={selectedDate}
          onLog={handleLogFood}
          onClose={() => setShowLogModal(false)}
        />
      )}

      <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .dashboard-header h1 {
          margin: 0;
        }
        .date-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .date-nav button {
          padding: 0.5rem 0.75rem;
        }
        .date-nav input {
          padding: 0.5rem;
        }
        .log-action {
          margin-bottom: 1.5rem;
        }
        .log-button {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          background: #646cff;
          color: white;
          border: none;
        }
        .log-button:hover {
          background: #535bf2;
        }
        .food-log {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .meal-section {
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1rem;
        }
        .meal-title {
          margin: 0 0 0.75rem 0;
          text-transform: capitalize;
          font-size: 1rem;
          color: #888;
        }
        .no-entries {
          color: #555;
          font-style: italic;
          margin: 0;
        }
        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}
