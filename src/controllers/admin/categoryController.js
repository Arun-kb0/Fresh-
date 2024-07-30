const CustomError = require("../../constants/CustomError")
const { BAD_REQUEST,
  OK, CONFLICT, NOT_FOUND,
  NOT_MODIFIED,
  METHOD_NOT_ALLOWED
} = require('../../constants/httpStatusCodes')
const { viewAdminPage, viewPageNotFound } = require("../../constants/pageConfid")
const { uploadImageToFirebase } = require("../../helpers/uploadImage")
const categoryModel = require("../../model/categoryModel")
const productModel = require("../../model/productModel")
const subCategoryModel = require("../../model/subCategoryModel")
const mongoose = require('mongoose')



const getCategoriesController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await categoryModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

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
      },
      { $sort: { createdAt: -1 } },
      { $skip: startIndex },
      { $limit: LIMIT },
    ])
    res.render('admin/category/categoriesTable', {
      ...viewAdminPage,
      categories,
      page: Number(page),
      numberOfPages,
    })
  } catch (error) {
    next(error)
  }
}


// * edit category
const getEditCategoryController = async (req, res, next) => {
  const { categoryId, subcategory } = req.query
  console.log(categoryId,subcategory)
  try {
    if (!mongoose.isObjectIdOrHexString(categoryId)) {
      console.log('invalid category id')
      res.render('user/notfound/notFound', { ...viewPageNotFound, backToAdmin: true })
      return
    }
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
    const categories = await categoryModel.find({ isDeleted: false })
    res.render('admin/category/editCategory', {
      isEdit: true,
      ...viewAdminPage,
      category: category[0],
      categories,
    })
  } catch (error) {
    next(error)
  }
}


const editCategoryController = async (req, res, next) => {
  const category = req.body
  const file = req.file
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
      let image = isSubCategoryExists.image
      if (file) {
        image = await uploadImageToFirebase(file, 'category')
      }
      const updatedSubCategory = await subCategoryModel.findOneAndUpdate(
        { _id, isDeleted: false },
        {
          ...category,
          name: name,
          image,
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
    let image = isCategoryExists.image
    if (file) {
      image = await uploadImageToFirebase(file, 'category')
    }
    const newCategory = await categoryModel.findOneAndUpdate(
      { _id, isDeleted: false },
      {
        ...category,
        name: name,
        image
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
    const categories = await categoryModel.find({ isDeleted: false })
    res.render('admin/category/editCategory', { isEdit: false, ...viewAdminPage, categories })
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
    if (!category.parentId && isCategoryExists ) {
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
      const subcategory = await subCategoryModel.find({ parentId: isParent._id, isDeleted: false })
      console.log(subcategory)
      if (subcategory?.length!==0) {
        throw new CustomError('there are subcategories under this category ', METHOD_NOT_ALLOWED)
      }

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

    const subcategory = await subCategoryModel.find({ _id: categoryId , isDeleted:false })
    if (!subcategory) {
      throw new CustomError('category not found', BAD_REQUEST)
    }
    const subCategoryIds = subcategory.map(subCat => subCat._id);
    const products = await productModel.find({ categoryId: { $in: subCategoryIds }, isDeleted: false })
    
    if (products.length !== 0) {
      throw new CustomError('there are products under this subcategory ', METHOD_NOT_ALLOWED)
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


const getAllCategoriesForDropDown = async (req, res, next) => {
  try {
    const categories = await (await categoryModel.find({ isDeleted: false }))
    res.status(OK).json({ message: "get categories success", categories })
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
  getAllCategoriesForDropDown
}