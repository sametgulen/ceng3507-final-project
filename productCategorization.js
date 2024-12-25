// JSON Data Store
const productDataStore = {
    categories: JSON.parse(localStorage.getItem('categories')) || [],
    prices: JSON.parse(localStorage.getItem('prices')) || {},
    inventory: JSON.parse(localStorage.getItem('inventory')) || {}
};

// DOM Elements
const categorizationForm = document.getElementById("categorization-form");
const categoryList = document.getElementById("category-list");
const categoryPriceInput = document.getElementById("category-price");
const setPriceButton = document.getElementById("set-price");
const pricingList = document.getElementById("pricing-list");
const inventoryList = document.getElementById("inventory-list");
const totalPurchasedElement = document.getElementById("total-purchased");
const totalPackagedElement = document.getElementById("total-packaged");
const stockThresholdInput = document.getElementById("stock-threshold");
const setStockThresholdButton = document.getElementById("set-stock-threshold");

// Load stock threshold from localStorage or set default
let STOCK_THRESHOLD = parseFloat(localStorage.getItem('stockThreshold')) || 3; // 3 kg threshold
stockThresholdInput.value = STOCK_THRESHOLD; // Set the input value to the current threshold
const CHECK_INTERVAL = 5000; // Check every 5 seconds

// Track which categories have already shown alerts
let shownAlerts = {};

// Stock level check function
function checkStockLevels(inventory) {
    for (const category in inventory) {
        const stockLevel = inventory[category];
        // Only show alert if stock is low AND we haven't shown an alert for this category yet
        if (stockLevel < STOCK_THRESHOLD && !shownAlerts[category]) {
            alert(`Low Stock Warning: ${category} has fallen below ${STOCK_THRESHOLD}kg (Current: ${stockLevel.toFixed(2)}kg)`);
            shownAlerts[category] = true;
        }
        // Reset alert if stock returns to normal
        else if (stockLevel >= STOCK_THRESHOLD && shownAlerts[category]) {
            shownAlerts[category] = false;
        }
    }
}

// Continuous stock level monitoring
function startStockMonitoring() {
    setInterval(() => {
        const inventory = productDataStore.categories.reduce((acc, category) => {
            acc[category.category] = (acc[category.category] || 0) + category.weight;
            return acc;
        }, {});
        checkStockLevels(inventory);
    }, CHECK_INTERVAL);
}

// Start monitoring when page loads
document.addEventListener('DOMContentLoaded', startStockMonitoring);

// Update stock threshold
setStockThresholdButton.addEventListener("click", () => {
    const newThreshold = parseFloat(stockThresholdInput.value);
    if (newThreshold >= 0) {
        STOCK_THRESHOLD = newThreshold;
        localStorage.setItem('stockThreshold', STOCK_THRESHOLD); // Store the new threshold in localStorage
        alert(`Stock threshold updated to ${STOCK_THRESHOLD} kg.`);
    } else {
        alert("Please enter a valid threshold value.");
    }
});

// Assign Product to Category
categorizationForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const productId = document.getElementById("product-id").value;
    const weight = parseFloat(document.getElementById("product-weight").value);
    const category = document.getElementById("product-category").value;

    // Check for duplicate product ID
    const existingProduct = productDataStore.categories.find(product => product.productId === productId);
    if (existingProduct) {
        alert(`Product ID ${productId} already exists. Please use a unique Product ID.`);
        return;
    }

    // Calculate total purchased from farmers
    const totalPurchased = dataStore.purchases.reduce((acc, purchase) => acc + purchase.quantity, 0);

    // Calculate current stock level
    const totalPackaged = productDataStore.categories.reduce((acc, category) => acc + category.weight, 0);

    // Check if there is enough stock to package this amount
    if (totalPackaged + weight > totalPurchased) {
        alert("Insufficient stock to package this amount.");
        return;
    }

    const categoryData = {
        productId,
        weight,
        category
    };

    productDataStore.categories.push(categoryData);
    localStorage.setItem('categories', JSON.stringify(productDataStore.categories));
    alert(`Product ${productId} assigned to category ${category} successfully.`);

    updateCategoryList();
    updateInventoryList();
    updateTotalPackaged();
    updateTotalPurchased();
    categorizationForm.reset();
});

// Update Category List
function updateCategoryList() {
    renderCategoryList(productDataStore.categories);
}

function renderCategoryList(categories) {
    categoryList.innerHTML = "";
    categories.forEach((category, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>Product ID:</strong> ${category.productId}, <strong>Weight:</strong> ${category.weight}kg, <strong>Category:</strong> ${category.category} <button onclick="deleteCategory(${index})">Delete</button>`;
        categoryList.appendChild(li);
    });
}

// Delete Category
function deleteCategory(index) {
    const category = productDataStore.categories[index];
    productDataStore.categories.splice(index, 1);
    localStorage.setItem('categories', JSON.stringify(productDataStore.categories));
    
    // Calculate remaining inventory after deletion
    const inventory = productDataStore.categories.reduce((acc, cat) => {
        acc[cat.category] = (acc[cat.category] || 0) + cat.weight;
        return acc;
    }, {});

    // Check stock levels after deletion
    checkStockLevels(inventory);

    alert(`Category for product ${category.productId} deleted successfully.`);
    updateCategoryList();
    updateInventoryList();
    updateTotalPackaged();
    updateTotalPurchased();
}

// Set Category Prices
setPriceButton.addEventListener("click", () => {
    const category = document.getElementById("product-category").value;
    const price = parseFloat(categoryPriceInput.value);

    productDataStore.prices[category] = price;
    localStorage.setItem('prices', JSON.stringify(productDataStore.prices));
    alert(`Price for category ${category} set to $${price.toFixed(2)}.`);

    updatePricingList();
    categoryPriceInput.value = "";
});

// Update Pricing List
function updatePricingList() {
    renderPricingList(productDataStore.prices);
}

function renderPricingList(prices) {
    pricingList.innerHTML = "";
    for (const category in prices) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>Category:</strong> ${category}, <strong>Price:</strong> $${prices[category].toFixed(2)} <button onclick="deletePrice('${category}')">Delete</button>`;
        pricingList.appendChild(li);
    }
}

// Delete Price
function deletePrice(category) {
    delete productDataStore.prices[category];
    localStorage.setItem('prices', JSON.stringify(productDataStore.prices));
    alert(`Price for category ${category} deleted successfully.`);
    updatePricingList();
}

// Update Inventory List
function updateInventoryList() {
    renderInventoryList(productDataStore.categories);
}

function renderInventoryList(categories) {
    inventoryList.innerHTML = "";
    const inventory = categories.reduce((acc, category) => {
        acc[category.category] = (acc[category.category] || 0) + category.weight;
        return acc;
    }, {});

    for (const category in inventory) {
        const packageCount = calculatePackageCount(category, inventory[category]);
        const li = document.createElement("li");
        li.innerHTML = `<strong>Category:</strong> ${category}, <strong>Stock Level:</strong> ${inventory[category]}kg, <strong>Package Count:</strong> ${packageCount}`;
        inventoryList.appendChild(li);
    }

    checkStockLevels(inventory); // Check immediately after rendering
}

// Calculate Package Count
function calculatePackageCount(category, weight) {
    const packageWeights = {
        "small": 0.1,
        "medium": 0.25,
        "large": 0.5,
        "extra-large": 1,
        "family-pack": 2,
        "bulk-pack": 5,
        "premium": 1 // Assume 1 kg by default, different logic can be added for special weights
    };
    return Math.floor(weight / packageWeights[category]);
}

// Update Total Packaged
function updateTotalPackaged() {
    const totalPackaged = productDataStore.categories.reduce((acc, category) => acc + category.weight, 0);
    totalPackagedElement.textContent = `Total Packaged: ${totalPackaged}kg`;
}

// Update Total Purchased
function updateTotalPurchased() {
    const totalPurchased = dataStore.purchases.reduce((acc, purchase) => acc + purchase.quantity, 0);
    const totalPackaged = productDataStore.categories.reduce((acc, category) => acc + category.weight, 0);
    totalPurchasedElement.textContent = `Total Purchased: ${totalPurchased - totalPackaged}kg`;
}

// Call updates when the page loads
updateCategoryList();
updatePricingList();
updateInventoryList();
updateTotalPurchased();
updateTotalPackaged();