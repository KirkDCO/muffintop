import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../providers/UserProvider';
import { useUsers, useCreateUser, useDeleteUser } from '../hooks/useUsers';
import { useCreateTargetsForUser } from '../hooks/useTargets';
import { UserSelector } from '../components/UserSelector';
import { NutrientPreferencesEditor } from '../components/NutrientPreferencesEditor';
import { TargetSetup } from '../components/TargetSetup';
import {
  DEFAULT_VISIBLE_NUTRIENTS,
  type User,
  type NutrientKey,
  type NutrientTarget,
} from '@muffintop/shared/types';

type CreateStep = 'name' | 'nutrients' | 'targets';

export function SelectUser() {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
  const { data, isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const createTargets = useCreateTargetsForUser();

  const [newUserName, setNewUserName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>('name');
  const [selectedNutrients, setSelectedNutrients] = useState<NutrientKey[]>([
    ...DEFAULT_VISIBLE_NUTRIENTS,
  ]);
  const [basalCalories, setBasalCalories] = useState(2000);
  const [nutrientTargets, setNutrientTargets] = useState<
    Partial<Record<NutrientKey, NutrientTarget>>
  >({});

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    navigate('/');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    setCreateStep('nutrients');
  };

  const handleNutrientsSubmit = () => {
    setCreateStep('targets');
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return;

    try {
      // Create the user first
      const user = await createUser.mutateAsync({
        name: newUserName.trim(),
        visibleNutrients: selectedNutrients,
      });

      // Create targets for the new user
      await createTargets.mutateAsync({
        userId: user.id,
        input: {
          basalCalories,
          nutrientTargets,
        },
      });

      // Reset form state
      setNewUserName('');
      setShowCreate(false);
      setCreateStep('name');
      setSelectedNutrients([...DEFAULT_VISIBLE_NUTRIENTS]);
      setBasalCalories(2000);
      setNutrientTargets({});

      // Navigate to dashboard
      handleSelectUser(user);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleCancelCreate = () => {
    setShowCreate(false);
    setCreateStep('name');
    setNewUserName('');
    setSelectedNutrients([...DEFAULT_VISIBLE_NUTRIENTS]);
    setBasalCalories(2000);
    setNutrientTargets({});
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser.mutateAsync(userId);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const isPending = createUser.isPending || createTargets.isPending;

  if (isLoading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">Failed to load users. Is the server running?</div>;
  }

  const users = data?.users || [];

  return (
    <div className="select-user-page">
      <h1>MuffinTop</h1>
      <h2>Select User</h2>

      <UserSelector users={users} onSelect={handleSelectUser} onDelete={handleDeleteUser} />

      {showCreate ? (
        <div className="create-flow">
          {createStep === 'name' && (
            <form onSubmit={handleNameSubmit} className="create-form">
              <h3>Create New User</h3>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                maxLength={50}
              />
              <div className="form-actions">
                <button type="submit" disabled={!newUserName.trim()}>
                  Next
                </button>
                <button type="button" onClick={handleCancelCreate}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {createStep === 'nutrients' && (
            <div className="create-form">
              <h3>Welcome, {newUserName}!</h3>
              <p className="step-description">
                Select which nutrients you want to track. You can change this later in Settings.
              </p>
              <NutrientPreferencesEditor
                selectedNutrients={selectedNutrients}
                onChange={setSelectedNutrients}
                disabled={isPending}
              />
              <div className="form-actions">
                <button type="button" onClick={() => setCreateStep('name')}>
                  Back
                </button>
                <button type="button" onClick={handleNutrientsSubmit} className="primary">
                  Next
                </button>
              </div>
            </div>
          )}

          {createStep === 'targets' && (
            <div className="create-form">
              <h3>Set Your Targets</h3>
              <p className="step-description">
                Set your daily calorie budget and nutrient targets. Activity calories will be added
                to your budget each day.
              </p>
              <TargetSetup
                selectedNutrients={selectedNutrients}
                basalCalories={basalCalories}
                nutrientTargets={nutrientTargets}
                onBasalChange={setBasalCalories}
                onTargetsChange={setNutrientTargets}
                disabled={isPending}
              />
              <div className="form-actions">
                <button type="button" onClick={() => setCreateStep('nutrients')}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateUser}
                  disabled={isPending || basalCalories < 500}
                  className="primary"
                >
                  {isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          {(createUser.error || createTargets.error) && (
            <p className="error-message">
              {(createUser.error as Error)?.message ||
                (createTargets.error as Error)?.message ||
                'Failed to create user'}
            </p>
          )}

          <div className="step-indicator">
            <span className={createStep === 'name' ? 'active' : ''}>1. Name</span>
            <span className={createStep === 'nutrients' ? 'active' : ''}>2. Nutrients</span>
            <span className={createStep === 'targets' ? 'active' : ''}>3. Targets</span>
          </div>
        </div>
      ) : (
        <button className="add-user-button" onClick={() => setShowCreate(true)}>
          + Add New User
        </button>
      )}

      <style>{`
        .select-user-page {
          max-width: 600px;
          margin: 2rem auto;
          text-align: center;
        }
        .select-user-page h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .select-user-page h2 {
          font-weight: normal;
          color: #888;
          margin-bottom: 2rem;
        }
        .create-flow {
          text-align: left;
        }
        .create-flow h3 {
          text-align: center;
          margin: 0 0 1rem 0;
        }
        .step-description {
          text-align: center;
          color: #888;
          margin-bottom: 1rem;
        }
        .create-form {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .create-form input[type="text"] {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
        }
        .form-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .form-actions button {
          flex: 1;
          padding: 0.75rem;
        }
        .form-actions button.primary {
          background-color: #646cff;
          color: white;
          border: none;
        }
        .form-actions button.primary:hover:not(:disabled) {
          background-color: #535bf2;
        }
        .add-user-button {
          margin-top: 1.5rem;
          width: 100%;
          padding: 1rem;
          font-size: 1rem;
          background-color: #646cff;
          color: white;
          border: none;
        }
        .add-user-button:hover {
          background-color: #535bf2;
        }
        .error-message {
          color: #f44;
          margin-top: 0.5rem;
          text-align: center;
        }
        .loading, .error {
          padding: 2rem;
          text-align: center;
        }
        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #333;
        }
        .step-indicator span {
          color: #666;
          font-size: 0.85rem;
        }
        .step-indicator span.active {
          color: #646cff;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
