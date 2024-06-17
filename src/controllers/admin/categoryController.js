const CustomError = require("../../constants/CustomError")
const { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK, CONFLICT, NOT_FOUND } = require('../../constants/httpStatusCodes')
const categoryModel = require("../../model/categorySchema")
const subCategoryModel = require("../../model/subCategoryModel")




const getCategoriesController = async (req, res) => {
  try {
    res.render('admin/category/categoriesTable', { isAuthPage: false })
  } catch (error) {
    next(error)
  }
}


const getEditCategoryController = async (req, res) => {
  try {
    res.render('admin/category/editCategory', { isEdit: true, isAuthPage: false })
  } catch (error) {
    next(error)
  }
}

const editCategoryController = async (req, res) => {
  try {
    res.render('admin/category/editCategory', { isEdit: true, isAuthPage: false })
  } catch (error) {
    next(error)
  }
}


const getCreateCategoryController = async (req, res) => {
  try {
    res.render('admin/category/editCategory', { isEdit: false, isAuthPage: false })
  } catch (error) {
    next(error)
  }
}


const createCategoryController = async (req, res, next) => {
  const category = req.body
  try {
    console.log(category.name.toLowerCase())

    if (!category || !category.name) {
      const message = "not enough details to create a category"
      throw new CustomError(message, BAD_REQUEST)
    }

    const name = category.name.toLowerCase().trim()
    const isCategoryExists = await categoryModel.findOne({ name: name })
    if (isCategoryExists) {
      const message = "category already exists"
      throw new CustomError(message, CONFLICT)
    }
    if (category?.parentId && !category.parentId==="") {
      if (typeof category.parentId !== "string" || !category.parentId.length === 24) {
        const message = "invalid parent id keep it \"\" or null"
        throw new CustomError(message, NOT_FOUND)
      }
      const parentCategory = await categoryModel.findOne({ _id: category.parentId })
      if (!parentCategory) {
        const message = "no parent exists"
        throw new CustomError(message, NOT_FOUND)
      }
      const newSubCategory = await subCategoryModel.create({
        ...category,
        name: name,
        parentId: parentCategory._id
      })
      const message = `sub category for ${parentCategory.name} created`
      res.status(OK).json({ message, category: newSubCategory })
      return
    }
    const newCategory = await categoryModel.create({
        ...category,
        name: name,
    })
    res.status(OK).json({ message: "category created", category: newCategory })

  } catch (error) {
    next(error)
  }
}




module.exports = {
  getCategoriesController,
  getEditCategoryController,
  getCreateCategoryController,
  createCategoryController,
  editCategoryController
}