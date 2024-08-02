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

  let { startDate, endDate } = req.query
  const {
    page = 1,
    day, month, year,
    isPdfDownload, isExcelDownload,
  } = req.query;
  console.log("day, month, year ", day, month, year)
  startDate = startDate ? new Date(startDate) : startDateDefault;
  endDate = endDate ? new Date(endDate) : endDateDefault;
  try {
    const LIMIT = 10
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await orderModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    if (day) {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()
      startDate = new Date(currentYear, currentMonth, day)
      endDate = new Date(currentYear, currentMonth, day, 23, 59, 59, 999)
    } else if (month) {
      const startMonth = month - 1
      const currentYear = new Date().getFullYear()
      startDate = new Date(currentYear, startMonth, 1)
      endDate = new Date(currentYear, startMonth + 1, 0, 23, 59, 59, 999)
    } else if (year) {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    const result = await getSalesReportAggregation({
      startDate,
      endDate,
      sort: { createdAt: 1 },
      skip: startIndex,
      limit: LIMIT
    })
    console.log(result)

    if (!result || result.length === 0) {
      res.render('admin/reports/salesReportTable', {
        ...viewAdminPage,
        reportDetails:[],
        data:[],
        numberOfPages,
        isDownload: false,
        page: Number(page)
      })
      return
    }

    const reportDetails = result[0]?.docs ? result[0]?.docs : []

    const data = {
      totalAmount: result[0].totalAmount,
      maxTotalAmount: result[0].maxTotalAmount,
      totalDiscountAmount: result[0].totalDiscountAmount,
      totalOrders: result[0].totalOrders,
      totalPendingOrders: result[0].totalPendingOrders,
      totalSuccessedOrders: result[0].totalSuccessedOrders,
      totalCancelledOrders: result[0].totalCancelledOrders,
      totalReturnedOrders: result[0].totalReturnedOrders,
      totalPendingPayments: result[0].totalPendingPayments,
      totalFailedPayments: result[0].totalFailedPayments,
      totalCompletedPayments: result[0].totalCompletedPayments,
      totalOnlinePayments: result[0].totalOnlinePayments,
      totalCodPayments: result[0].totalCodPayments,
    }

    // * pdf download
    if (isPdfDownload) {
      const filePath = path.join(__dirname, '../../../views/admin/reports/salesReportTable.ejs')
      const renderedFile = await ejs.renderFile(filePath, {
        // const file = await ejs.renderFile('/admin/reports/salesReportTable', {
        ...viewAdminPage,
        reportDetails,
        data,
        numberOfPages,
        isDownload: true,
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

        // * data
        { header: '', key: '', width: 25 },
        { header: '', key: '', width: 25 },
        { header: 'Report Details', key: 'reportDetails', width: 30 },
        { header: 'Values', key: 'value', width: 25 }
      ]
      
      reportDetails.map(item => {
        const productNames = []
        item.products.map((product) => {
          productNames.push(product?.productDetails?.name)
        })

        const user = `
          ${item?.userDetails?.name},
          ${item?.userDetails?.username ? item?.userDetails?.username : ''}
        `
        const address = `
          ${item.addressDetails?.name},
          ${item.addressDetails?.phone},
          ${item.addressDetails?.email},
          ${item.addressDetails?.place}, ${item.addressDetails?.city}, ${item.addressDetails?.state}, ${item.addressDetails?.country},
          ${item.addressDetails?.pinCode},
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

      const summaryData = {
        'Total Amount': data?.totalAmount,
        'Max Total Amount': data?.maxTotalAmount,
        'Total Discount Amount': data?.totalDiscountAmount,
        'Total Orders': data?.totalOrders,
        'Total Pending Orders': data?.totalPendingOrders,
        'Total Successed Orders': data?.totalSuccessedOrders,
        'Total Cancelled Orders': data?.totalCancelledOrders,
        'Total Returned Orders': data?.totalReturnedOrders,
        'Total Pending Payments': data?.totalPendingPayments,
        'Total Failed Payments': data?.totalFailedPayments,
        'Total Completed Payments': data?.totalCompletedPayments,
        'Total Online Payments': data?.totalOnlinePayments,
        'Total COD Payments': data?.totalCodPayments
      };

      Object.entries(summaryData).forEach(([detail, value]) => {
        sheet.addRow({
          reportDetails: detail,
          value: value
        });
      });
      

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

    console.log('get sales report page call ')
    // res.status(OK).json({ report })
    res.render('admin/reports/salesReportTable', {
      ...viewAdminPage,
      reportDetails,
      data,
      numberOfPages,
      isDownload: false,
      page: Number(page)
    })

  } catch (error) {
    next(error)
  }
}



module.exports = {
  getSalesReportController,
}