import type { User } from './lib/auth/database';

declare namespace App {
  interface Locals {
    user: User | null;
  }
}
