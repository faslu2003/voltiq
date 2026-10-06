const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const bcrypt = require('bcrypt');

const fs = require('fs');
const path = require('path');



exports.signin = async (body) => {

    const { email, password } = body;

    const user = await User.findOne({ email: email });

    if (!user) {
        return {
            success: false,
            message: "Invalid email or password"
        }
    }

    if (!email) {
        return {
            success: false,
            message: "Please enter your email address"
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "Please enter a valid email address"
        }
    }

    if (!password) {
        return {
            success: false,
            message: "Please enter your password"
        }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return {
            success: false,
            message: "Please enter the correct password"
        }
    }

    if (user.role !== "admin") {
        return {
            success: false,
            message: "Invalid email or password"
        }
    }

    return {
        success: true,
        user: user
    }
}


exports.getCustomers = async (page = 1, search, status, registered) => {

    let filter = { role: "user" };

    if (search) {
        filter.$or = [
            {
                fullName: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                email: {
                    $regex: search,
                    $options: "i"
                }
            }
        ]
    }

    if (status === "blocked") {
        filter.isBlocked = true;
    }
    if (status === "unblocked") {
        filter.isBlocked = false;
    }

    if (registered === "this-month") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        filter.createdAt = {
            $gte: startOfMonth
        };
    }
    if (registered === "this-year") {
        const startOfYear = new Date();
        startOfYear.setMonth(0);
        startOfYear.setDate(1);
        startOfYear.setHours(0, 0, 0, 0);
        filter.createdAt = {
            $gte: startOfYear
        };
    }

    const limit = 5;
    const skip = (page - 1) * limit;

    const customers = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const totalCustomers = await User.countDocuments(filter);

    return {
        success: true,
        customers,
        totalCustomers,
        stats: [],
        pagination: {
            from: skip + 1,
            to: Math.min(skip + limit, totalCustomers),
            total: totalCustomers,
            currentPage: page,
            lastPage: Math.ceil(totalCustomers / limit)
        }
    }
}

exports.updateCustomerStatus = async (userId, isBlocked) => {

    await User.updateOne({ _id: userId }, { $set: { isBlocked: isBlocked } });

    return {
        success: true
    }
}


exports.getCategories = async (page, limit) => {

    const skip = (page - 1) * limit;

    const categories = await Category.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

    const totalCategories = await Category.countDocuments();

    const activeCategories = await Category.countDocuments({ isActive: true });
    const inactiveCategories = await Category.countDocuments({ isActive: false });

    for (category of categories) {
        category.productCount = await Product.countDocuments({ categoryId: category._id });
    }

    const totalPages = Math.ceil(totalCategories / limit);

    return {
        categories,
        currentPage: page,
        totalPages,
        totalCategories,
        activeCategories,
        inactiveCategories,
    };
}

exports.AddCategory = async (body, file) => {

    const { name, description } = body;

    if (!name && !description) {
        return {
            success: false,
            message: "Please fill in all the fields."
        }
    }

    if (!name) {
        return {
            success: false,
            message: "Please enter a category name."
        }
    }

    if (!description) {
        return {
            success: false,
            message: "Please enter the category description."
        }
    }

    if (!file) {
        return {
            success: false,
            message: "Please upload the category image."
        }
    }

    const alreadyExists = await Category.findOne({ categoryName: { $regex: `^${name}$`, $options: 'i' } });

    if (alreadyExists) {
        return {
            success: false,
            message: "A category in the same name already exists."
        }
    }

    await Category.create({
        categoryName: name,
        description: description,
        imgUrl: `/uploads/${file.filename}`,
    })

    return {
        success: true,
        message: "Category added successfully."
    }
}

exports.editCategory = async (body, file) => {

    const { id, name, description, isVisible } = body;

    if (file) {
        await Category.updateOne({ _id: id }, { imgUrl: `/uploads/${file.filename}` });
    }

    const alreadyExists = await Category.findOne({ categoryName: { $regex: `^${name}$`, $options: 'i' }, _id: { $ne: id } });

    if (alreadyExists) {
        return {
            success: false,
            message: "A category with the same name already exists."
        }
    }

    await Category.updateOne({ _id: id }, { $set: { categoryName: name, description: description, isActive: isVisible === "on" } });

    return {
        success: true,
        message: "Category edited successfully"
    }
}

exports.toggleCategoryStatus = async (body) => {

    const { id, isActive } = body;

    await Category.updateOne({ _id: id }, { $set: { isActive: isActive } });

    return {
        success: true,
        message: "Category status updated successfully."
    }
}

exports.deleteCategory = async (id) => {

    const category = await Category.findById(id);

    if (!category) {
        return {
            success: false,
            message: "Category not found."
        }
    }

    await Category.findByIdAndDelete(id);

    return {
        success: true,
        message: "Category deleted successfully."
    };
}



exports.getProducts = async (
    page, limit, search, categoryFilter, statusFilter
) => {

    const searchQuery = {};

    if (search) {
        searchQuery.name = {
            $regex: search,
            $options: 'i'
        };
    }

    if (categoryFilter && categoryFilter !== 'all') {
        searchQuery.categoryId = categoryFilter;
    }

    const products = await Product.find(searchQuery)
        .populate('categoryId', 'categoryName')
        .sort({ createdAt: -1 })

    const inventory = [];

    products.forEach(product => {
        product.variants.forEach(variant => {
            inventory.push({ product, variant });
        });
    });

    let filteredInventory = inventory;

    if (statusFilter && statusFilter !== 'all') {
        filteredInventory = inventory.filter(item => {
            const stock = item.variant.stock;

            if (statusFilter === 'Out of Stock') {
                return stock === 0;
            }

            if (statusFilter === 'Low Stock') {
                return stock > 0 && stock <= 10;
            }

            if (statusFilter === 'In Stock') {
                return stock > 10;
            }

            return true;
        });
    }

    const totalItems = filteredInventory.length;
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const paginatedInventory = filteredInventory.slice(skip, skip + limit);

    // Number of total products for the card
    const totalProducts = await Product.countDocuments();

    // allProducts -> to populate the edit product modal

    return {
        products: paginatedInventory,
        allProducts: products,
        currentPage: page,
        totalPages,
        totalItems,
        search,
        totalProducts
    }
}


exports.AddProducts = async (body, files) => {

    const { name, description, highlights, categoryId, brandId, isActive } = body;

    if (!name) {
        return {
            success: false,
            message: "Please enter a product name."
        }
    }

    if (!description) {
        return {
            success: false,
            message: "Please enter a product description."
        }
    }

    if (!highlights || highlights.length < 3) {
        return {
            success: false,
            message: "Please enter atleast 3 product highlights."
        }
    }

    if (!categoryId) {
        return {
            success: false,
            message: "Please select a category."
        }
    }

    if (!brandId) {
        return {
            success: false,
            message: "Please select a brand."
        }
    }

    if (!files || files.length === 0) {
        return {
            success: false,
            message: "Please upload at least one product image."
        }
    }

    const variants = body.variants || [];
    const formattedVariants = [];

    for (let idx = 0; idx < variants.length; idx++) {
        const variant = variants[idx];

        if (!variant) continue;

        if (!variant.color) {
            return {
                success: false,
                message: `Please enter a color for variant ${idx + 1}.`
            }
        }

        for (let j = 0; j < idx; j++) {
            if (variant.color === variants[j].color && variant.storage === variants[j].storage) {
                return {
                    success: false,
                    message: "Variant with the same color and storage already exists."
                }
            }
        }

        // if (!variant.colorCode) {
        //     return {
        //         success: false,
        //         message: `Please select a color for variant ${idx + 1}`
        //     }
        // }

        if (!variant.storage) {
            return {
                success: false,
                message: `Please enter storage for variant ${idx + 1}.`
            }
        }

        if (variant.stock === undefined || variant.stock === "") {
            return {
                success: false,
                message: `Please enter stock for variant ${idx + 1}.`
            }
        }
        if (variant.stock < 0) {
            return {
                success: false,
                message: `The stock quantity entered for variant ${idx + 1} is negative.`
            }
        }

        if (!variant.price) {
            return {
                success: false,
                message: `Please enter a price for variant ${idx + 1}.`
            }
        }
        if (variant.price < 0) {
            return {
                success: false,
                message: `The price entered for variant ${idx + 1} is negative.`
            }
        }

        const variantImages = files.filter(file => file.fieldname === `variantImages_${idx}[]`);
        if (variantImages.length < 4) {
            return {
                success: false,
                message: `Please upload at least four images for variant ${idx + 1}.`
            }
        }
        variantImages.map(file => file.filename);

        formattedVariants.push({
            color: variant.color,
            colorCode: variant.colorCode,
            storage: variant.storage,
            stock: variant.stock,
            price: Number(variant.price),
            imgUrls: variantImages.map(file => `/uploads/${file.filename}`)
        });
    }

    if (formattedVariants.length === 0) {
        return {
            success: false,
            message: "Please add at least one product variant."
        }
    }

    await Product.create({
        name,
        description,
        highlights,
        isActive: isActive === "on",
        categoryId,
        brandId,
        variants: formattedVariants
    });

    return {
        success: true,
        message: "Product added successfully."
    }
}

exports.toggleProductStatus = async (id) => {

    const product = await Product.findById(id);

    if (!product) {
        return {
            success: false,
            message: "Product not found."
        }
    }

    product.isActive = !product.isActive;

    await product.save();

    return {
        success: true,
        message: product.isActive
            ? "Product activated successfully."
            : "Product deactivated successfully.",
        isActive: product.isActive
    };
}


exports.editProduct = async (body, files) => {

    const { productId, name, description, highlights, categoryId, brandId, isActive } = body;

    const product = await Product.findById(productId);

    if (!product) {
        return {
            success: false,
            message: "Product not found."
        }
    }

    if (!name) {
        return {
            success: false,
            message: "Please enter a product name."
        }
    }

    if (!description) {
        return {
            success: false,
            message: "Please enter a product description."
        }
    }

    if (!highlights || highlights.length < 0) {
        return {
            success: false,
            message: "Please enter atleast 3 product highlights."
        };
    }

    if (!categoryId) {
        return {
            success: false,
            message: "Please select a category."
        }
    }

    if (!brandId) {
        return {
            success: false,
            message: "Please select a brand."
        }
    }

    product.name = name;
    product.description = description;
    product.highlights = Array.isArray(highlights)
        ? highlights
        : [highlights];
    product.categoryId = categoryId;
    product.brandId = brandId;
    product.isActive = isActive === "on";

    const variants = body.variants || [];

    for (const variantData of variants) {

        for (const otherVariant of variants) {

            if (otherVariant.variantId === variantData.variantId) {
                continue;
            }

            if (variantData.color === otherVariant.color && variantData.storage === otherVariant.storage) {
                return {
                    success: false,
                    message: "A variant with the same color & storage already exists."
                };
            }
        }

        if (variantData.variantId) {

            const variant = product.variants.id(variantData.variantId);

            if (!variant) {
                return {
                    success: false,
                    message: "Variant not found."
                }
            }

            if (!variantData.color) {
                return {
                    success: false,
                    message: "Please enter a color for the variant."
                };
            }

            if (!variantData.storage) {
                return {
                    success: false,
                    message: "Please enter storage for the variant."
                };
            }

            if (variantData.stock === undefined || variantData.stock === "") {
                return {
                    success: false,
                    message: "Please enter stock for the variant."
                };
            }

            if (variantData.stock < 0) {
                return {
                    success: false,
                    message: "The stock entered for the variant is a negative number."
                }
            }

            if (variantData.price === undefined || variantData.price === "") {
                return {
                    success: false,
                    message: "Please enter a price for the variant."
                };
            }

            if (variantData.price < 0) {
                return {
                    success: false,
                    message: "The price entered for the variant is a negative number."
                }
            }

            variant.color = variantData.color;
            // variant.colorCode = variantData.colorCode;
            variant.storage = variantData.storage;
            variant.stock = Number(variantData.stock);
            variant.price = Number(variantData.price);
        }
        else {
            const newVariant = product.variants.create({
                color: variantData.color,
                colorCode: variantData.colorCode,
                storage: variantData.storage,
                price: Number(variantData.price),
                stock: Number(variantData.stock),
                imgUrls: []
            });

            product.variants.push(newVariant);
            variantData.variantId = newVariant._id.toString();
        }
    };

    if (files && files.length > 0) {

        files.forEach((file) => {

            const match = file.fieldname.match(/^variantImages_(\d+)\[\]$/);

            if (!match) return;

            const variantIndex = Number(match[1]);
            const variantData = variants[variantIndex];

            if (!variantData) return;

            const variant = product.variants.id(variantData.variantId);

            if (!variant) return;

            const imgUrl = `/uploads/${file.filename}`;
            variant.imgUrls.push(imgUrl);
        });
    }

    if (body.removedVariantImages) {

        const removedImages = JSON.parse(body.removedVariantImages);

        removedImages.forEach((item) => {

            const variant = product.variants.id(item.variantId);

            if (!variant) return;

            variant.imgUrls = variant.imgUrls.filter(url => url !== item.imageUrl);
        });
    }

    await product.save();

    return {
        success: true,
        message: "Product edited successfully."
    };
}


exports.deleteProduct = async (id) => {

    const product = await Product.findById(id);

    if (!product) {
        return {
            success: false,
            message: "Product not found."
        }
    }

    const imgUrls = [];

    product.variants.forEach(variant => {
        variant.imgUrls.forEach(url => {
            imgUrls.push(url);
        })
    })

    await Product.findByIdAndDelete(id);

    imgUrls.forEach(imgUrl => {
        const fileName = path.basename(imgUrl);
        const filePath = path.join(__dirname, '../uploads/', fileName);

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    return {
        success: true,
        message: "Product deleted successfully."
    };
}