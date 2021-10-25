module.exports = function (app) {
  app.use((req, res, next) => {
    res.setHeader("Document-Policy", "js-profiling:1;");
    next();
  });
};
