import { DefaultNamingStrategy, type NamingStrategyInterface } from 'typeorm';

/** Maps camelCase properties to snake_case columns (matches the SQL migrations). */
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    if (customName) return customName;
    const base = embeddedPrefixes.length > 0 ? `${embeddedPrefixes.join('_')}_${propertyName}` : propertyName;
    return base.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
}
