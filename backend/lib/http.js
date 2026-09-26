// Express 4 doesn't catch rejected promises; forward them to the error handler.
export const route = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export function parseId(value) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}
