import { useState, useEffect } from 'react';
import { FoodSearch } from '../components/FoodSearch';
import { FoodDetail } from '../components/FoodDetail';
import { CustomFoodList } from '../components/CustomFoodList';
import { CustomFoodForm } from '../components/CustomFoodForm';
import { CustomFoodDetail } from '../components/CustomFoodDetail';
import {
  useCustomFoods,
  useCustomFood,
  useCreateCustomFood,
  useUpdateCustomFood,
  useDeleteCustomFood,
} from '../hooks/useCustomFoods';
import { useUser } from '../providers/UserProvider';
import type { FoodSummary, CustomFoodSummary, CreateCustomFoodInput } from '@muffintop/shared/types';

type Tab = 'usda' | 'custom';
type CustomFoodViewMode = 'list' | 'create' | 'edit' | 'detail';

export function Foods() {
  const [activeTab, setActiveTab] = useState<Tab>('usda');
  const [selectedFood, setSelectedFood] = useState<FoodSummary | null>(null);

  // Custom foods state
  const [customViewMode, setCustomViewMode] = useState<CustomFoodViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCustomFoodId, setSelectedCustomFoodId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { currentUser } = useUser();
  const currentUserId = currentUser?.id;

  const { data: customFoodsData, isLoading: isLoadingCustomFoods } = useCustomFoods(
    debouncedQuery ? { search: debouncedQuery } : undefined
  );
  const { data: selectedCustomFood } = useCustomFood(selectedCustomFoodId);

  const createMutation = useCreateCustomFood();
  const updateMutation = useUpdateCustomFood();
  const deleteMutation = useDeleteCustomFood();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCustomFood = (food: CustomFoodSummary) => {
    setSelectedCustomFoodId(food.id);
    setCustomViewMode('detail');
  };

  const handleEditCustomFood = (food: CustomFoodSummary) => {
    setSelectedCustomFoodId(food.id);
    setCustomViewMode('edit');
  };

  const handleDeleteCustomFood = (food: CustomFoodSummary) => {
    setDeleteError(null);
    deleteMutation.mutate(food.id, {
      onError: (error) => {
        // Extract message from API error response
        const message = (error as { message?: string })?.message
          || 'Failed to delete custom food';
        setDeleteError(message);
        // Auto-clear error after 5 seconds
        setTimeout(() => setDeleteError(null), 5000);
      },
    });
  };

  const handleCreateCustomFood = (input: CreateCustomFoodInput) => {
    createMutation.mutate(input, {
      onSuccess: () => setCustomViewMode('list'),
    });
  };

  const handleUpdateCustomFood = (input: CreateCustomFoodInput) => {
    if (!selectedCustomFoodId) return;
    updateMutation.mutate(
      { customFoodId: selectedCustomFoodId, input },
      { onSuccess: () => setCustomViewMode('list') }
    );
  };

  const handleCustomBack = () => {
    setCustomViewMode('list');
    setSelectedCustomFoodId(null);
  };

  // Reset custom view mode when switching tabs
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'usda') {
      setSelectedFood(null);
    } else {
      setCustomViewMode('list');
      setSelectedCustomFoodId(null);
    }
  };

  return (
    <div className="foods-page">
      <h1>Foods</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'usda' ? 'active' : ''}`}
          onClick={() => handleTabChange('usda')}
        >
          USDA Database
        </button>
        <button
          className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => handleTabChange('custom')}
        >
          Custom Foods
        </button>
      </div>

      {activeTab === 'usda' && (
        <div className="usda-content">
          <p className="subtitle">Search the USDA food database for nutritional information</p>

          <div className="foods-layout">
            <div className="search-panel">
              <FoodSearch onSelect={setSelectedFood} />
            </div>

            {selectedFood && (
              <div className="detail-panel">
                <FoodDetail
                  fdcId={selectedFood.fdcId}
                  onClose={() => setSelectedFood(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="custom-content">
          {customViewMode === 'list' && (
            <>
              <div className="custom-header">
                <p className="subtitle">Create and manage your own custom foods</p>
                <button className="primary-btn" onClick={() => setCustomViewMode('create')}>
                  + Add Custom Food
                </button>
              </div>

              <div className="search-row">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your custom foods..."
                  className="search-input"
                />
              </div>

              {deleteError && (
                <div className="error-message">{deleteError}</div>
              )}

              {isLoadingCustomFoods ? (
                <p className="status">Loading custom foods...</p>
              ) : (
                <CustomFoodList
                  customFoods={customFoodsData?.customFoods || []}
                  currentUserId={currentUserId}
                  onSelect={handleSelectCustomFood}
                  onEdit={handleEditCustomFood}
                  onDelete={handleDeleteCustomFood}
                  emptyMessage={
                    debouncedQuery
                      ? `No custom foods found for "${debouncedQuery}"`
                      : 'No custom foods yet. Create one!'
                  }
                />
              )}
            </>
          )}

          {customViewMode === 'create' && (
            <>
              <div className="custom-header">
                <button className="back-btn" onClick={handleCustomBack}>
                  ← Back to Custom Foods
                </button>
              </div>
              <h2>Create Custom Food</h2>
              <CustomFoodForm
                onSave={handleCreateCustomFood}
                onCancel={handleCustomBack}
                isLoading={createMutation.isPending}
              />
            </>
          )}

          {customViewMode === 'edit' && selectedCustomFood && (
            <>
              <div className="custom-header">
                <button className="back-btn" onClick={handleCustomBack}>
                  ← Back to Custom Foods
                </button>
              </div>
              <h2>Edit Custom Food</h2>
              <CustomFoodForm
                initialData={selectedCustomFood}
                onSave={handleUpdateCustomFood}
                onCancel={handleCustomBack}
                isLoading={updateMutation.isPending}
              />
            </>
          )}

          {customViewMode === 'detail' && selectedCustomFoodId && (
            <>
              <div className="custom-header">
                <button className="back-btn" onClick={handleCustomBack}>
                  ← Back to Custom Foods
                </button>
              </div>
              <CustomFoodDetail
                customFoodId={selectedCustomFoodId}
                currentUserId={currentUserId}
                onEdit={() => setCustomViewMode('edit')}
                onClose={handleCustomBack}
              />
            </>
          )}
        </div>
      )}

      <style>{`
        .foods-page h1 {
          margin-bottom: 1rem;
        }
        .foods-page h2 {
          margin: 0 0 1rem 0;
        }
        .tabs {
          display: flex;
          gap: 0;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #333;
        }
        .tab {
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #888;
          cursor: pointer;
          font-size: 1rem;
        }
        .tab:hover {
          color: #ccc;
        }
        .tab.active {
          color: #fff;
          border-bottom-color: #646cff;
        }
        .subtitle {
          color: #888;
          margin: 0 0 1rem 0;
        }
        .foods-layout {
          display: flex;
          gap: 2rem;
        }
        .search-panel {
          flex: 1;
          min-width: 0;
        }
        .detail-panel {
          flex-shrink: 0;
        }
        @media (max-width: 800px) {
          .foods-layout {
            flex-direction: column;
          }
        }
        .custom-content {
          max-width: 700px;
        }
        .custom-content .custom-food-list {
          max-height: 60vh;
          overflow-y: auto;
        }
        .custom-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .primary-btn {
          padding: 0.75rem 1.25rem;
          background: #646cff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .primary-btn:hover {
          background: #535bf2;
        }
        .back-btn {
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 0;
          font-size: 0.95rem;
        }
        .back-btn:hover {
          color: #ccc;
        }
        .search-row {
          margin-bottom: 1rem;
        }
        .search-input {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
        }
        .status {
          color: #888;
        }
        .error-message {
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          background: #4a1c1c;
          border: 1px solid #8b3333;
          border-radius: 4px;
          color: #ff9999;
        }
      `}</style>
    </div>
  );
}
