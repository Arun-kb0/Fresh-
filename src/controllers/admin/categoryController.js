const CustomError = require("../../constants/CustomError")
const { BAD_REQUEST,
  OK, CONFLICT, NOT_FOUND,
  NOT_MODIFIED
} = require('../../constants/httpStatusCodes')
const { viewAdminPage } = require("../../constants/pageConfid")
const { uploadImageToFirebase } = require("../../helpers/uploadImage")
const categoryModel = require("../../model/categoryModel")
const subCategoryModel = require("../../model/subCategoryModel")
const mongoose = require('mongoose')



const getCategoriesController = async (req, res, next) => {
  try {
    const categories = await categoryModel.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "parentId",
          as: "subCategories"
        }
      },
      {
        $addFields: {
          subCategories: {
            $filter: {
              input: "$subCategories",
              as: "subCategory",
              cond: {
                $eq: ["$$subCategory.isDeleted", false]
              }
            }
          }
        }
      }
    ])
    console.log(categories.subCategories)
    // res.status(200).json({ ...viewAdminPage, categories: categories })
    res.render('admin/category/categoriesTable', { ...viewAdminPage, categories })
  } catch (error) {
    next(error)
  }
}


// * edit category
const getEditCategoryController = async (req, res, next) => {
  const { categoryId, subcategory } = req.query
  try {
    const categoryObjectId = mongoose.Types.ObjectId.createFromHexString(categoryId)
    if (subcategory) {
      const category = await subCategoryModel.findOne({ _id: categoryObjectId, isDeleted: false })
      res.render('admin/category/editCategory', { isEdit: true, ...viewAdminPage, category: category })
      return
    }

    const category = await categoryModel.aggregate([
      {
        $match: {
          _id: categoryObjectId,
          isDeleted: false,
        }
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "parentId",
          as: "subCategories"
        }
      },
      {
        $addFields: {
          subCategories: {
            $filter: {
              input: "$subCategories",
              as: "subCategory",
              cond: {
                $eq: ["$$subCategory.isDeleted", false]
              }
            }
          }
        }
      }
    ])

    res.render('admin/category/editCategory', { isEdit: true, ...viewAdminPage, category: category[0] })
  } catch (error) {
    next(error)
  }
}


const editCategoryController = async (req, res, next) => {
  const category = req.body
  try {
    console.log(category)
    if (typeof category.id !== "string" || category.id.length !== 24) {
      const message = "category id is required for editing"
      throw new CustomError(message, BAD_REQUEST)
    }

    const name = category.name.toLowerCase().trim()
    const _id = category.id

    if (category?.parentId) {
      if (typeof category.parentId !== "string" || category.parentId.length !== 24) {
        const message = 'invalid parent id keep it empty string or null'
        throw new CustomError(message, NOT_FOUND)
      }
      const parentCategory = await categoryModel.findOne({ _id: category.parentId, isDeleted: false })
      if (!parentCategory) {
        const message = "no parent exists"
        throw new CustomError(message, NOT_FOUND)
      }
      const isSubCategoryExists = await subCategoryModel.findOne({ _id, isDeleted: false })
      if (!isSubCategoryExists) {
        const message = "no subcategory exists"
        throw new CustomError(message, NOT_FOUND)
      }
      const updatedSubCategory = await subCategoryModel.findOneAndUpdate(
        { _id, isDeleted: false },
        {
          ...category,
          name: name,
        },
        { new: true }
      )
      const message = `sub category for ${parentCategory.name} updated`
      res.status(OK).json({ message, category: updatedSubCategory })
      return
    }

    const isCategoryExists = await categoryModel.findOne({ _id, isDeleted: false })
    if (!isCategoryExists) {
      const message = "no category exists"
      throw new CustomError(message, NOT_FOUND)
    }
    const newCategory = await categoryModel.findOneAndUpdate(
      { _id, isDeleted: false },
      {
        ...category,
        name: name,
      },
      { new: true }
    )
    res.status(OK).json({ message: "category updated", category: newCategory })
  } catch (error) {
    next(error)
  }
}

// * create category
const getCreateCategoryController = async (req, res) => {
  try {
    res.render('admin/category/editCategory', { isEdit: false, ...viewAdminPage })
  } catch (error) {
    next(error)
  }
}

const createCategoryController = async (req, res, next) => {
  const category = req.body
  const file = req.file

  console.log(file, category)
  try {
    if (!category || !category.name) {
      const message = "not enough details to create a category"
      throw new CustomError(message, BAD_REQUEST)
    }

    const name = category.name.toLowerCase().trim()
    const isCategoryExists = await categoryModel.findOne({ name: name, isDeleted: false })
    if (isCategoryExists) {
      const message = "category already exists"
      throw new CustomError(message, CONFLICT)
    }

    if (!file) {
      const message = "image is required to create category"
      throw new CustomError(message, BAD_REQUEST)
    }
    const image = await uploadImageToFirebase(file, 'category')

    if (category?.parentId) {
      if (typeof category.parentId !== "string" || !category.parentId.length === 24) {
        const message = "invalid parent id keep it \"\" or null"
        throw new CustomError(message, NOT_FOUND)
      }
      const parentCategory = await categoryModel.findOne({ _id: category.parentId, isDeleted: false })
      if (!parentCategory) {
        const message = "no parent exists"
        throw new CustomError(message, NOT_FOUND)
      }
      const isChildExists = await subCategoryModel.findOne({ name: name, isDeleted: false })
      if (isChildExists) {
        const message = "subcategory with given name already exists"
        throw new CustomError(message, NOT_FOUND)
      }

      const newSubCategory = await subCategoryModel.create({
        ...category,
        image,
        name: name,
        parentId: parentCategory._id
      })
      const message = `sub category for ${parentCategory.name} created`
      res.status(OK).json({ message, category: newSubCategory })
      return
    }
    const newCategory = await categoryModel.create({
      ...category,
      image,
      name: name,
    })
    res.status(OK).json({ message: "category created", category: newCategory })

  } catch (error) {
    next(error)
  }
}

// * delete
const deleteCategoryController = async (req, res, next) => {
  const { categoryId } = req.query
  try {
    console.log(categoryId)
    if (typeof categoryId !== "string" || categoryId.length !== 24) {
      const message = "category id is required for deleting"
      throw new CustomError(message, BAD_REQUEST)
    }

    const isParent = await categoryModel.findOne({ _id: categoryId, isDeleted: false })
    if (isParent) {
      const parentRes = await categoryModel.updateOne(
        { _id: categoryId, isDeleted: false },
        { isDeleted: true }
      )
      const childRes = await subCategoryModel.updateMany(
        { parentId: categoryId, isDeleted: false },
        { isDeleted: true }
      )

      if (parentRes.modifiedCount === 0) {
        throw new CustomError("category not found", NOT_FOUND)
      }
      console.log(parentRes)
      res.status(OK).json({ message: `deleted parent category` })
      return
    }

    const childRes = await subCategoryModel.updateMany(
      { _id: categoryId, isDeleted: false },
      { isDeleted: true }
    )
    if (childRes.modifiedCount === 0) {
      throw new CustomError("sub category not found", NOT_FOUND)
    }
    console.log(childRes)
    res.status(OK).json({ message: `deleted subcategory` })

  } catch (error) {
    next(error)
  }
}


module.exports = {
  getCategoriesController,
  getEditCategoryController,
  getCreateCategoryController,
  createCategoryController,
  editCategoryController,
  deleteCategoryController,
}