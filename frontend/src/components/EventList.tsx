import { useState } from 'react';
import { useEvents, useDeleteEvent } from '../hooks/useEvents';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EventList() {
  const { data: events, isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleDelete = async (eventId: number) => {
    if (confirmDeleteId === eventId) {
      try {
        await deleteEvent.mutateAsync(eventId);
        setConfirmDeleteId(null);
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    } else {
      setConfirmDeleteId(eventId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  if (isLoading) {
    return <p className="event-list-loading">Loading events...</p>;
  }

  if (!events || events.length === 0) {
    return <p className="event-list-empty">No events recorded yet.</p>;
  }

  return (
    <div className="event-list">
      <h4>Recent Events</h4>
      <ul>
        {events.slice(0, 10).map((event) => {
          const isConfirming = confirmDeleteId === event.id;
          return (
          <li key={event.id} className="event-item">
            <span
              className="event-color-indicator"
              style={{ backgroundColor: event.color }}
            />
            <span className="event-date">{formatDate(event.eventDate)}</span>
            <span className="event-description">{event.description}</span>
            <button
              className={`event-delete-btn ${isConfirming ? 'confirm' : ''}`}
              onClick={() => handleDelete(event.id)}
              disabled={deleteEvent.isPending}
              title={isConfirming ? 'Click to confirm' : 'Delete event'}
            >
              {isConfirming ? '?' : '\u00d7'}
            </button>
          </li>
          );
        })}
      </ul>

      <style>{`
        .event-list {
          margin-top: 1.5rem;
        }
        .event-list h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
          color: #888;
        }
        .event-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .event-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #333;
        }
        .event-item:last-child {
          border-bottom: none;
        }
        .event-color-indicator {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .event-date {
          font-size: 0.85rem;
          color: #888;
          flex-shrink: 0;
        }
        .event-description {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .event-delete-btn {
          padding: 0.25rem 0.5rem;
          background: transparent;
          border: 1px solid #555;
          border-radius: 4px;
          color: #888;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
        }
        .event-delete-btn:hover:not(:disabled) {
          border-color: #f44;
          color: #f44;
        }
        .event-delete-btn.confirm {
          background: #f44;
          border-color: #f44;
          color: white;
        }
        .event-delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .event-list-loading,
        .event-list-empty {
          color: #888;
          font-size: 0.9rem;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
