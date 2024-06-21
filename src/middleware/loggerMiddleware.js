const logger = (req, res, next) => {
  const format = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  console.log(format);
  next();
};


module.exports = {
  logger
}