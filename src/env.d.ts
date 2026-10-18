interface LocalsUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: number;
}

declare namespace App {
  interface Locals {
    user: LocalsUser | null;
  }
}
