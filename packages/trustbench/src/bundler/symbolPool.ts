import { SymbolTag } from '../modelSymbol';
import { classifySymbol } from '../symbolLoader';
import {
  NamedSymbolWithContext,
  SymbolContextMetadata,
  SymbolWithContext,
} from './context';

export function toUntaggedSymbolRef(metadata: SymbolContextMetadata): string {
  return toAbsoluteRef(metadata.entityName, metadata.name);
}

export function toSymbolRef(
  symbolType: SymbolTag,
  metadata: SymbolContextMetadata,
): string {
  return toAbsoluteRef(
    metadata.entityName,
    taggedRef(symbolType, metadata.name),
  );
}

export function toAbsoluteRef(entityName: string, relativeRef: string): string {
  return `/${entityName}/${relativeRef}`;
}

export function taggedRef(symbolType: SymbolTag, ref: string): string {
  return `${ref}.${classifySymbol(symbolType).type}`;
}

//if this is an absolute ref, return it
//if this is a relative ref, turn it into an absolute ref using the entityName
export function normaliseRef(entityName: string, ref: string): string {
  if (ref.startsWith('/')) return ref;
  return toAbsoluteRef(entityName, ref);
}

export class SymbolPool {
  private symbols: Map<string, NamedSymbolWithContext>;
  constructor(snapshot: NamedSymbolWithContext[] = []) {
    this.symbols = new Map();
    for (const symbolContext of snapshot) {
      this.set(symbolContext);
    }
  }

  getAny(absoluteRef: string): NamedSymbolWithContext['context'] | undefined {
    const context = this.symbols.get(absoluteRef);
    return context?.context;
  }

  get<S extends SymbolWithContext['type']>(
    type: S,
    absoluteRef: string,
  ): Extract<NamedSymbolWithContext, { type: S }> | undefined {
    const context = this.symbols.get(taggedRef(type, absoluteRef));
    if (!context) return undefined;
    if (context.type === type) {
      return context as any;
    }
    return undefined;
  }

  set<S extends NamedSymbolWithContext>(symbol: S) {
    const ref = toSymbolRef(symbol.type, symbol.metadata);
    this.symbols.set(ref, symbol);
  }

  snapshot(): NamedSymbolWithContext[] {
    const symbolContexts: NamedSymbolWithContext[] = [];
    for (const [, symbolContext] of this.symbols) {
      symbolContexts.push(symbolContext);
    }

    return symbolContexts;
  }
}
