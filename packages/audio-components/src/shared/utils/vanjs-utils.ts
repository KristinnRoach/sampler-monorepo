// todo: maybe add this to vanjs util
export const when = (condition: any, elementFn: () => any) =>
  condition ? elementFn() : null;

// export const when = <T>(
//   condition: T,
//   elementFn: (value: NonNullable<T>) => any
// ) => (condition ? elementFn(condition as NonNullable<T>) : null);
