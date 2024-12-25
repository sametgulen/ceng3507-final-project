// JSON Data Store
const salesDataStore = {
    orders: JSON.parse(localStorage.getItem('orders')) || [],
    revenue: JSON.parse(localStorage.getItem('revenue')) || []
};

// DOM Elements
const orderForm = document.getElementById("order-form");
const orderList = document.getElementById("order-list");
const searchOrdersInput = document.getElementById("search-orders");
const orderStatusSelect = document.getElementById("order-status");
const totalRevenueElement = document.getElementById("total-revenue");
const revenuePerCategoryElement = document.getElementById("revenue-per-category");
const reportTypeSelect = document.getElementById("report-type");
const generateReportButton = document.getElementById("generate-report");
const salesChart = document.getElementById("sales-chart");
const exportReportButton = document.getElementById("export-report");
const totalSoldWeightElement = document.getElementById("total-sold-weight");
const averageSalePriceElement = document.getElementById("average-sale-price");
const totalExpenseElement = document.getElementById("total-expense"); // Use the existing element
const netProfitElement = document.getElementById("net-profit"); // Use the existing element
const netProfitAfterTaxElement = document.getElementById("net-profit-after-tax"); // Use the existing element
const taxRateInput = document.getElementById("tax-rate");
const setTaxRateButton = document.getElementById("set-tax-rate");

// Load tax rate from localStorage or set default
let TAX_RATE = parseFloat(localStorage.getItem('taxRate')) || 10; // 10% default tax rate
taxRateInput.value = TAX_RATE; // Set the input value to the current tax rate

// Chart.js initialization
let chart;

// Add Order
orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const orderId = document.getElementById("order-id").value;
    const customerName = document.getElementById("customer-name").value;
    const customerContact = document.getElementById("customer-contact").value;
    const customerAddress = document.getElementById("customer-address").value;
    const orderDate = document.getElementById("order-date").value; // Capture the order date
    const productCategory = document.getElementById("order-product-category").value;
    const quantityOrdered = parseInt(document.getElementById("quantity-ordered").value);
    const unitPrice = productDataStore.prices[productCategory];

    if (quantityOrdered <= 0 || !unitPrice) {
        alert("Quantity must be positive and product category must have a set price.");
        return;
    }

    const totalPrice = quantityOrdered * unitPrice;
    const orderStatus = "Pending";

    const orderData = {
        orderId,
        customerName,
        customerContact,
        customerAddress,
        orderDate, // Store the order date
        productCategory,
        quantityOrdered,
        totalPrice,
        orderStatus
    };

    salesDataStore.orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(salesDataStore.orders));
    alert(`Order ${orderId} added successfully.`);

    updateOrderList();
    updateRevenue();
    updateInventoryAfterSale(productCategory, quantityOrdered);
    updateSalesStatistics(); // Update sales statistics
    orderForm.reset();
});

// Update Order List
function updateOrderList() {
    renderOrderList(salesDataStore.orders);
}

function renderOrderList(orders) {
    orderList.innerHTML = "";
    orders.forEach((order, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>Order ID:</strong> ${order.orderId}, 
            <strong>Customer:</strong> ${order.customerName}, 
            <strong>Category:</strong> ${order.productCategory}, 
            <strong>Quantity:</strong> ${order.quantityOrdered}, 
            <strong>Total Price:</strong> $${order.totalPrice.toFixed(2)}, 
            <strong>Date:</strong> ${order.orderDate}, <!-- Display the order date -->
            <strong>Status:</strong> 
            <select onchange="updateOrderStatus(${index}, this.value)">
                <option value="Pending" ${order.orderStatus === "Pending" ? "selected" : ""}>Pending</option>
                <option value="Processed" ${order.orderStatus === "Processed" ? "selected" : ""}>Processed</option>
                <option value="Shipped" ${order.orderStatus === "Shipped" ? "selected" : ""}>Shipped</option>
                <option value="Delivered" ${order.orderStatus === "Delivered" ? "selected" : ""}>Delivered</option>
            </select>
            <button onclick="deleteOrder(${index})">Delete</button>
        `;
        orderList.appendChild(li);
    });
}

// Update Order Status
function updateOrderStatus(index, newStatus) {
    salesDataStore.orders[index].orderStatus = newStatus;
    localStorage.setItem('orders', JSON.stringify(salesDataStore.orders));
    alert(`Order ${salesDataStore.orders[index].orderId} status updated to ${newStatus}.`);
    updateOrderList();
}

// Delete Order
function deleteOrder(index) {
    const order = salesDataStore.orders[index];
    salesDataStore.orders.splice(index, 1);
    localStorage.setItem('orders', JSON.stringify(salesDataStore.orders));
    alert(`Order ${order.orderId} deleted successfully.`);
    updateOrderList();
    updateRevenue();
}

// Filter Orders by Status
orderStatusSelect.addEventListener("change", () => {
    const selectedStatus = orderStatusSelect.value;
    if (selectedStatus === "all") {
        renderOrderList(salesDataStore.orders);
    } else {
        const filteredOrders = salesDataStore.orders.filter(order => order.orderStatus === selectedStatus);
        renderOrderList(filteredOrders);
    }
});

// Search and Filter Orders
searchOrdersInput.addEventListener("input", () => {
    const searchTerm = searchOrdersInput.value.toLowerCase();
    const filteredOrders = salesDataStore.orders.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.productCategory.toLowerCase().includes(searchTerm)
    );
    renderOrderList(filteredOrders);
});

// Update Revenue
function updateRevenue() {
    const totalRevenue = salesDataStore.orders.reduce((acc, order) => acc + order.totalPrice, 0);
    totalRevenueElement.textContent = `Total Revenue: $${totalRevenue.toFixed(2)}`;

    const revenuePerCategory = salesDataStore.orders.reduce((acc, order) => {
        acc[order.productCategory] = (acc[order.productCategory] || 0) + order.totalPrice;
        return acc;
    }, {});

    revenuePerCategoryElement.innerHTML = "";
    for (const category in revenuePerCategory) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>Category:</strong> ${category}, <strong>Revenue:</strong> $${revenuePerCategory[category].toFixed(2)}`;
        revenuePerCategoryElement.appendChild(li);
    }

    localStorage.setItem('revenue', JSON.stringify(revenuePerCategory));
}

// Update Inventory After Sale
function updateInventoryAfterSale(category, quantityOrdered) {
    const packageWeights = {
        "small": 0.1,
        "medium": 0.25,
        "large": 0.5,
        "extra-large": 1,
        "family-pack": 2,
        "bulk-pack": 5,
        "premium": 1 // Assume 1 kg by default, different logic can be added for special weights
    };

    const weightSold = quantityOrdered * packageWeights[category];

    // Update Total Packaged
    const totalPackagedElement = document.getElementById("total-packaged");
    const totalPackaged = parseFloat(totalPackagedElement.textContent.split(": ")[1].replace("kg", ""));
    totalPackagedElement.textContent = `Total Packaged: ${(totalPackaged - weightSold).toFixed(2)}kg`;

    // Update Inventory
    const categoryIndex = productDataStore.categories.findIndex(cat => cat.category === category);
    if (categoryIndex > -1) {
        productDataStore.categories[categoryIndex].weight -= weightSold;
        localStorage.setItem('categories', JSON.stringify(productDataStore.categories));
    }

    // Update Inventory Tracking
    const inventoryList = document.getElementById("inventory-list");
    const inventoryItems = inventoryList.getElementsByTagName("li");
    for (let item of inventoryItems) {
        if (item.innerHTML.includes(`Category:</strong> ${category}`)) {
            const stockLevel = parseFloat(item.innerHTML.split("Stock Level:</strong> ")[1].split("kg")[0]);
            const packageCount = parseInt(item.innerHTML.split("Package Count:</strong> ")[1]);
            item.innerHTML = `<strong>Category:</strong> ${category}, <strong>Stock Level:</strong> ${(stockLevel - weightSold).toFixed(2)}kg, <strong>Package Count:</strong> ${packageCount - quantityOrdered}`;
        }
    }
}

// Update Sales Statistics
function updateSalesStatistics() {
    const totalWeight = salesDataStore.orders.reduce((acc, order) => {
        const packageWeights = {
            "small": 0.1,
            "medium": 0.25,
            "large": 0.5,
            "extra-large": 1,
            "family-pack": 2,
            "bulk-pack": 5,
            "premium": 1 // Assume 1 kg by default, different logic can be added for special weights
        };
        return acc + (order.quantityOrdered * packageWeights[order.productCategory]);
    }, 0);

    const totalRevenue = salesDataStore.orders.reduce((acc, order) => acc + order.totalPrice, 0);
    const averagePricePerKg = totalWeight ? (totalRevenue / totalWeight) : 0;

    totalSoldWeightElement.textContent = `Total Sold Weight: ${totalWeight.toFixed(2)} kg`;
    averageSalePriceElement.textContent = `Average Sale Price per kg: $${averagePricePerKg.toFixed(2)}`;

    // Calculate Expenses
    const averageCostPerKgText = document.getElementById("average-cost").textContent;
    const averageCostPerKg = parseFloat(averageCostPerKgText.split(": $")[1]);
    const totalExpense = totalWeight * averageCostPerKg;

    totalExpenseElement.textContent = `Total Expense: $${totalExpense.toFixed(2)}`;

    // Calculate Net Profit
    const netProfit = totalRevenue - totalExpense;
    netProfitElement.textContent = `Net Profit: $${netProfit.toFixed(2)}`;

    // Calculate Net Profit After Tax
    const netProfitAfterTax = netProfit - (netProfit * (TAX_RATE / 100));
    netProfitAfterTaxElement.textContent = `Net Profit After Tax: $${netProfitAfterTax.toFixed(2)}`;
}

// Generate Report
generateReportButton.addEventListener("click", () => {
    const reportType = reportTypeSelect.value;
    generateReport(reportType);
});

function generateReport(type) {
    let reportData = [];
    let labels = [];
    let data = [];

    if (type === "category") {
        reportData = salesDataStore.orders.reduce((acc, order) => {
            acc[order.productCategory] = (acc[order.productCategory] || 0) + order.totalPrice;
            return acc;
        }, {});
    } else if (type === "customer") {
        reportData = salesDataStore.orders.reduce((acc, order) => {
            acc[order.customerName] = (acc[order.customerName] || 0) + order.totalPrice;
            return acc;
        }, {});
    } else if (type === "time-period") {
        // Example: Group by month
        reportData = salesDataStore.orders.reduce((acc, order) => {
            const date = new Date(order.date);
            const month = date.toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + order.totalPrice;
            return acc;
        }, {});
    }

    labels = Object.keys(reportData);
    data = Object.values(reportData);

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(salesChart, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Export Report to CSV
exportReportButton.addEventListener("click", () => {
    const reportType = reportTypeSelect.value;
    exportReportToCSV(reportType);
});

function exportReportToCSV(type) {
    let reportData = [];
    let csvContent = "data:text/csv;charset=utf-8,";

    if (type === "category") {
        reportData = salesDataStore.orders.reduce((acc, order) => {
            acc[order.productCategory] = (acc[order.productCategory] || 0) + order.totalPrice;
            return acc;
        }, {});
        csvContent += "Category,Sales\n";
    } else if (type === "customer") {
        reportData = salesDataStore.orders.reduce((acc, order) => {
            acc[order.customerName] = (acc[order.customerName] || 0) + order.totalPrice;
            return acc;
        }, {});
        csvContent += "Customer,Sales\n";
    } else if (type === "time-period") {
        // Example: Group by month
        reportData = salesDataStore.orders.reduce((acc, order) => {
            const date = new Date(order.date);
            const month = date.toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + order.totalPrice;
            return acc;
        }, {});
        csvContent += "Month,Sales\n";
    }

    for (const key in reportData) {
        csvContent += `${key},${reportData[key].toFixed(2)}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Comprehensive Report Generation
document.getElementById("generate-comprehensive-report").addEventListener("click", generateComprehensiveReport);

function generateComprehensiveReport() {
    // Pull values from Sales Statistics section
    const totalIncome = parseFloat(totalRevenueElement.textContent.split(": $")[1]);
    const totalExpenses = parseFloat(totalExpenseElement.textContent.split(": $")[1]);
    const netProfit = parseFloat(netProfitElement.textContent.split(": $")[1]);
    const taxApplied = totalIncome * (TAX_RATE / 100);
    const netProfitAfterTax = netProfit - taxApplied;

    const productsSoldPerCategory = salesDataStore.orders.reduce((acc, order) => {
        acc[order.productCategory] = (acc[order.productCategory] || 0) + order.quantityOrdered;
        return acc;
    }, {});

    const remainingStockPerCategory = productDataStore.categories.reduce((acc, category) => {
        acc[category.category] = (acc[category.category] || 0) + category.weight;
        return acc;
    }, {});

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Total Income,Total Expenses,Tax Applied,Net Profit After Tax\n";
    csvContent += `${totalIncome.toFixed(2)},${totalExpenses.toFixed(2)},${taxApplied.toFixed(2)},${netProfitAfterTax.toFixed(2)}\n\n`;

    csvContent += "Products Sold Per Category\n";
    csvContent += "Category,Quantity Sold\n";
    for (const category in productsSoldPerCategory) {
        csvContent += `${category},${productsSoldPerCategory[category]}\n`;
    }

    csvContent += "\nRemaining Stock Per Category\n";
    csvContent += "Category,Stock Level\n";
    for (const category in remainingStockPerCategory) {
        csvContent += `${category},${remainingStockPerCategory[category].toFixed(2)}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "comprehensive_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Update tax rate
setTaxRateButton.addEventListener("click", () => {
    const newTaxRate = parseFloat(taxRateInput.value);
    if (newTaxRate >= 0) {
        TAX_RATE = newTaxRate;
        localStorage.setItem('taxRate', TAX_RATE); // Store the new tax rate in localStorage
        alert(`Tax rate updated to ${TAX_RATE}%.`);
        updateSalesStatistics(); // Update sales statistics with new tax rate
    } else {
        alert("Please enter a valid tax rate.");
    }
});

// Call updates when the page loads
updateOrderList();
updateRevenue();
updateSalesStatistics(); // Call this function to initialize the statistics on page load