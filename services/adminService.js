const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const bcrypt = require('bcrypt');



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
    const totalPages = Math.ceil(totalCategories / limit);

    return {
        categories,
        currentPage: page,
        totalPages,
        totalCategories
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

    const alreadyExists = await Category.findOne({ categoryName: name });

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



exports.getProducts = async (page, limit) => {

    const skip = (page - 1) * limit;

    const products = await Product.find()
    .populate('categoryId', 'categoryName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalProducts = await Product.countDocuments();

    const totalPages = Math.ceil(totalProducts / limit);

    return {
        products,
        currentPage: page,
        totalPages,
        totalProducts
    }
}


exports.AddProducts = async (body, files) => {

    const { name, description, basePrice, highlights, categoryId, brandId, isActive } = body;

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

    if (!basePrice) {
        return {
            success: false,
            message: "Please enter a base price."
        }
    }

    if (!highlights || highlights.length === 0) {
        return {
            success: false,
            message: "Please enter the product highlight(s)."
        }
    }

    if (!categoryId) {
        return {
            success: false,
            message: "Please select a category."
        }
    }

    // if (!brandId) {
    //     return {
    //         success: false,
    //         message: "Please select a brand."
    //     }
    // }

    if (!files || files.length === 0) {
        return {
            success: false,
            message: "Please upload at least one product image."
        }
    }

    const productImages = files.filter(file => file.fieldname === "productImages");
    if (productImages.length === 0) {
        return {
            success: false,
            message: "Please upload at least one product image."
        };
    }

    if (productImages.length > 7) {
        return {
            success: false,
            message: "You can upload a maximum of 7 product images."
        }
    }

    const imgUrls = productImages.map(file => `/uploads/${file.filename}`);


    const variants = body.variants || [];
    const formattedVariants = [];

    for (let idx = 0; idx < variants.length; idx++) {
        const variant = variants[idx];

        if (!variant) continue;

        if (!variant.color) {
            return {
                success: false,
                message: `Please enter a color for varaint ${idx + 1}.`
            }
        }

        if (!variant.storage) {
            return {
                success: false,
                message: `Please enter storage for variant ${idx + 1}.`
            }
        }

        if (!variant.stock === undefined || variant.stock === "") {
            return {
                success: false,
                message: `Please enter stock for variant ${idx + 1}.`
            }
        }

        const variantImages = files.filter(file => file.fieldname === `variantImages_${idx}[]`);
        if (variantImages.length === 0) {
            return {
                success: false,
                message: `Please upload at least one image for variant ${idx + 1}.`
            }
        }

        formattedVariants.push({
            color: variant.color,
            storage: variant.storage,
            stock: variant.stock,
            additionalPrice: variant.additionalPrice,
            imgUrls: variantImages.map(file => `/uploads/${file.filename}`)
        });
    }

    if (formattedVariants.length === 0) {
        return {
            success: false,
            messgae: "Please add at least one product variant."
        }
    }

    await Product.create({
        name,
        description,
        basePrice: Number(basePrice),
        highlights,
        isActive: isActive === "on",
        categoryId,
        brandId,
        imgUrls,
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

    const { productId, variantId, name, description, basePrice, highlights, categoryId, brandId, color, storage, additionalPrice, isActive } = body;

    const product = await Product.findById(productId);
    if (!product) {
        return {
            success: false,
            message: "Product not found."
        }
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
        return {
            success: false,
            message: "Variant not found."
        }
    }

    product.name = name;
    product.description = description;
    product.basePrice = basePrice;
    product.highlights = Array.isArray(highlights) ? highlights : [highlights];
    product.categoryId = categoryId;
    product.brandId = brandId;
    product.isActive = isActive === "on";

    variant.color = color;
    variant.storage = storage;
    variant.additionalPrice = Number(additionalPrice);


    if (body.removedProductImages) {
        const removedImages = JSON.parse(body.removedProductImages);

        product.imgUrls = product.imgUrls.filter(url => !removedImages.includes(url));
    }

    if (body.removedVariantImages) {
        const removedVariantImages = JSON.parse(body.removedVariantImages);

        variant.imgUrls = variant.imgUrls.filter(url => !removedVariantImages.includes(url));
    }


    if (files) {

        const productImages = files.filter(file => file.fieldname === "productImages");

        if (productImages.length > 7) {
            return {
                success: false,
                message: "You can upload a maximum of 7 product images."
            }
        }

        if (productImages.length > 0) {
            const newProductImages = productImages.map(file => `/uploads/${file.filename}`);

            product.imgUrls.push(...newProductImages);
        }


        const replacementFiles = files.filter(file => file.fieldname === "replacedProductImagesFiles");

        if (replacementFiles.length > 0) {
            const replacements = body.replacedProductImages
                ? JSON.parse(body.replacedProductImages)
                : [];
            replacements.forEach(replacement => {
                const replacementFile =
                    replacementFiles[replacement.fileIndex];
                if (!replacementFile) return;

                const newUrl = `/uploads/${replacementFile.filename}`;

                const imageIndex = product.imgUrls.indexOf(replacement.oldUrl);
                if (imageIndex !== -1) product.imgUrls[imageIndex] = newUrl;
            });
        }


        const variantImages = files.filter(file => file.fieldname === "variantImages");

        if (variantImages.length > 0) {
            const newVariantImages = variantImages.map(file => `/uploads/${file.filename}`);

            variant.imgUrls.push(...newVariantImages);
        }
    }

    await product.save();

    return {
        success: true,
        message: "Product edited successfully."
    };
}