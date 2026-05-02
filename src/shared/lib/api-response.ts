export type ItemEnvelope<T> = {
  item: T;
};

export function unwrapItem<T>(payload: T | ItemEnvelope<T>): T {
  if (payload && typeof payload === "object" && "item" in payload) {
    return (payload as ItemEnvelope<T>).item;
  }

  return payload as T;
}
