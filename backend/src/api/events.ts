import { Router } from 'express';
import { eventService } from '../services/event-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createEventSchema, eventQuerySchema } from '../models/user-event.js';

export const eventsRouter = Router({ mergeParams: true });

// All routes require user context
eventsRouter.use(requireUser);

/**
 * GET /users/:userId/events - Get events with optional date filtering
 */
eventsRouter.get('/', validateQuery(eventQuerySchema), (req, res) => {
  const events = eventService.getByQuery(
    req.userId!,
    req.query as { startDate?: string; endDate?: string }
  );
  res.json(events);
});

/**
 * POST /users/:userId/events - Create a new event
 */
eventsRouter.post('/', validateBody(createEventSchema), (req, res) => {
  const event = eventService.create(req.userId!, req.body);
  res.status(201).json(event);
});

/**
 * DELETE /users/:userId/events/:id - Delete an event
 */
eventsRouter.delete('/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  eventService.delete(req.userId!, eventId);
  res.status(204).send();
});
