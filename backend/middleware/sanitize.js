// Minimal NoSQL-injection guard: strips keys starting with "$" or containing "."
// from req.body / req.query / req.params (replacement for express-mongo-sanitize).
function clean(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      clean(obj[key]);
    }
  }
  return obj;
}

module.exports = (req, _res, next) => {
  clean(req.body);
  clean(req.params);
  // req.query is a getter in some Express versions; mutate in place
  clean(req.query);
  next();
};
