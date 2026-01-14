import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../providers/UserProvider';
import { useUsers, useCreateUser, useDeleteUser } from '../hooks/useUsers';
import { UserSelector } from '../components/UserSelector';
import type { User } from '@muffintop/shared/types';

export function SelectUser() {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
  const { data, isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const [newUserName, setNewUserName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    navigate('/');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    try {
      const user = await createUser.mutateAsync({ name: newUserName.trim() });
      setNewUserName('');
      setShowCreate(false);
      handleSelectUser(user);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser.mutateAsync(userId);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

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
        <form onSubmit={handleCreateUser} className="create-form">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            maxLength={50}
          />
          <div className="form-actions">
            <button type="submit" disabled={!newUserName.trim() || createUser.isPending}>
              {createUser.isPending ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
          {createUser.error && (
            <p className="error-message">
              {(createUser.error as Error).message || 'Failed to create user'}
            </p>
          )}
        </form>
      ) : (
        <button className="add-user-button" onClick={() => setShowCreate(true)}>
          + Add New User
        </button>
      )}

      <style>{`
        .select-user-page {
          max-width: 400px;
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
        .create-form {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .create-form input {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
        }
        .form-actions {
          display: flex;
          gap: 0.5rem;
        }
        .form-actions button {
          flex: 1;
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
        }
        .loading, .error {
          padding: 2rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
