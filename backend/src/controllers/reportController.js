const { generateHrSummaryPdf } = require('../services/reportService');

async function hrSummaryPdfController(_req, res, next) {
  try {
    await generateHrSummaryPdf(res);
  } catch (error) {
    next(error);
  }
}

module.exports = { hrSummaryPdfController };
