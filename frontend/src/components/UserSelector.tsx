import { useState } from 'react';
import type { User } from '@muffintop/shared/types';

interface UserSelectorProps {
  users: User[];
  onSelect: (user: User) => void;
  onDelete?: (userId: number) => void;
}

export function UserSelector({ users, onSelect, onDelete }: UserSelectorProps) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleDelete = (userId: number) => {
    if (confirmDelete === userId) {
      onDelete?.(userId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(userId);
    }
  };

  return (
    <div className="user-selector">
      {users.length === 0 ? (
        <p>No users yet. Create one to get started!</p>
      ) : (
        <ul className="user-list">
          {users.map((user) => (
            <li key={user.id} className="user-item">
              <button className="user-button" onClick={() => onSelect(user)}>
                <span className="user-name">{user.name}</span>
              </button>
              {onDelete && (
                <button
                  className={`delete-button ${confirmDelete === user.id ? 'confirm' : ''}`}
                  onClick={() => handleDelete(user.id)}
                  title={confirmDelete === user.id ? 'Click again to confirm' : 'Delete user'}
                >
                  {confirmDelete === user.id ? 'Confirm?' : '×'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <style>{`
        .user-selector {
          width: 100%;
        }
        .user-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .user-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .user-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 1rem;
          font-size: 1.1rem;
          text-align: left;
        }
        .user-button:hover {
          background-color: #333;
        }
        .user-name {
          font-weight: 500;
        }
        .delete-button {
          padding: 0.5rem 0.75rem;
          font-size: 1.2rem;
          background: transparent;
          border: 1px solid #666;
        }
        .delete-button:hover {
          border-color: #f44;
          color: #f44;
        }
        .delete-button.confirm {
          background-color: #f44;
          border-color: #f44;
          color: white;
        }
      `}</style>
    </div>
  );
}
