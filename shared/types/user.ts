/**
 * User entity types
 */

export interface User {
  id: number;
  name: string;
  createdAt: string; // ISO 8601
}

export interface CreateUserInput {
  name: string;
}
