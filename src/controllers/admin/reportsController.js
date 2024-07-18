const mongoose = require("mongoose")
const { OK, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const orderModel = require("../../model/orderModel");
const { viewAdminPage } = require("../../constants/pageConfid");
const excelJs = require('exceljs');
const { getSalesReportAggregation } = require("../../helpers/aggregationPipelines");
const CustomError = require("../../constants/CustomError");
const htmlToPdf = require('html-pdf-node')
const ejs = require('ejs')
const path = require('path')
// const tmp = require('../../../views/admin/reports/salesReportTable.ejs')


const getSalesReportController = async (req, res, next) => {
  const endDateDefault = new Date();
  const startDateDefault = new Date(endDateDefault.getTime() - 10 * 24 * 60 * 60 * 1000); // Subtract 10 days

  let { startDate, endDate, page = 1, isPdfDownload, isExcelDownload } = req.query;
  startDate = startDate ? new Date(startDate) : startDateDefault;
  endDate = endDate ? new Date(endDate) : endDateDefault;
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await orderModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    // console.log("startDate ", startDate)
    // console.log("endDate ", endDate)

    const report = await getSalesReportAggregation({
      startDate,
      endDate,
      sort: { createdAt: 1 },
      skip: startIndex,
      limit: LIMIT
    })
    const reportDetails = report ? report : []

    // * pdf download
    if (isPdfDownload) {
      const filePath = path.join(__dirname, '../../../views/admin/reports/salesReportTable.ejs')
      const renderedFile = await ejs.renderFile(filePath, {
      // const file = await ejs.renderFile('/admin/reports/salesReportTable', {
        ...viewAdminPage,
        reportDetails,
        numberOfPages,
        page,
      })
      const file = { content: renderedFile }
      const options = { format: 'A4' }
      const pdfBuffer = await htmlToPdf.generatePdf(file, options)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment;filename="sales_report.pdf"');
      res.status(OK).send(pdfBuffer);
      return
    }
    // * excel download
    if (isExcelDownload) {
      let workbook = new excelJs.Workbook()
      const sheet = workbook.addWorksheet('books')

      sheet.columns = [
        { header: 'Product', key: 'product', width: 50 },
        { header: 'Order Id', key: 'orderId', width: 50 },
        { header: 'Order status', key: 'orderStatus', width: 25 },
        { header: 'Total', key: 'total', width: 25 },
        { header: 'Payment method', key: 'paymentMethod', width: 25 },
        { header: 'Payment status', key: 'paymentStatus', width: 25 },
        { header: 'Created at', key: 'createdAt', width: 25 },
        { header: 'User', key: 'user', width: 40 },
        { header: 'Address', key: 'address', width: 100 },
      ]

      reportDetails.map(item => {
        const productNames = []
        item.products.map((product) => {
          productNames.push(product.productDetails.name)
        })

        const user = `
          ${item.userDetails.name},
          ${item.userDetails.username ? item.userDetails.username : ''}
        `
        const address = `
          ${item.addressDetails.name},
          ${item.addressDetails.phone},
          ${item.addressDetails.email},
          ${item.addressDetails?.place}, ${item.addressDetails?.city}, ${item.addressDetails?.state}, ${item.addressDetails?.country},
          ${item.addressDetails.pinCode},
        `
        sheet.addRow({
          product: productNames.toString(),
          orderId: item._id,
          orderStatus: item.orderStatus,
          total: item.total,
          paymentMethod: item.paymentMethod,
          paymentStatus: item.paymentStatus,
          createdAt: item.createdAt,
          user: user,
          address: address
        })
      })

      res.setHeader(
        'content-Type',
        "application/vnd.openxlformats-officedocument.spreadsheetml.sheet"
      )
      res.setHeader(
        "Content-Disposition",
        "attachment;filename=" + "sales_report.xlsx"
      )
      workbook.xlsx.write(res)
      return
    }

    // res.status(OK).json({ report })
    res.render('admin/reports/salesReportTable', {
      ...viewAdminPage,
      reportDetails,
      numberOfPages,
      page: Number(page)
    })

  } catch (error) {
    next(error)
  }
}



module.exports = {
  getSalesReportController,
}