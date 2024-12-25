// JSON Data Store
const dataStore = {
    farmers: JSON.parse(localStorage.getItem('farmers')) || [], // Farmer information
    purchases: JSON.parse(localStorage.getItem('purchases')) || [], // Purchase records
};

// DOM Elements
const farmerForm = document.getElementById("farmer-form");
const farmerList = document.getElementById("farmer-list");
const searchFarmersInput = document.getElementById("search-farmers");
const purchaseForm = document.getElementById("purchase-form");
const purchaseList = document.getElementById("purchase-list");
const totalExpensesElement = document.getElementById("total-expenses");
const expensePeriodSelect = document.getElementById("expense-period");
const sortPurchasesSelect = document.getElementById("sort-purchases");
const exportFarmersButton = document.getElementById("export-farmers");
const totalWeightElement = document.getElementById("total-weight");
const averageCostElement = document.getElementById("average-cost");
const totalSpentElement = document.getElementById("total-spent");
const farmerEarningsList = document.getElementById("farmer-earnings-list");

// Add or Update Farmer
farmerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const farmerId = document.getElementById("farmer-id").value;
    const name = document.getElementById("farmer-name").value;
    const contact = document.getElementById("farmer-contact").value;
    const location = document.getElementById("farmer-location").value;

    const existingFarmer = dataStore.farmers.find(farmer => farmer.farmerId === farmerId);
    if (existingFarmer) {
        // Update Farmer
        existingFarmer.name = name;
        existingFarmer.contact = contact;
        existingFarmer.location = location;
        alert(`Farmer ${name} updated successfully.`);
    } else {
        // Add New Farmer
        dataStore.farmers.push({ farmerId, name, contact, location });
        alert(`Farmer ${name} added successfully.`);
    }

    localStorage.setItem('farmers', JSON.stringify(dataStore.farmers));
    updateFarmerList();
    updateFarmerEarnings();
    farmerForm.reset();
});

// Delete Farmer
document.getElementById("delete-farmer").addEventListener("click", () => {
    const farmerId = document.getElementById("farmer-id").value;

    const farmerIndex = dataStore.farmers.findIndex(farmer => farmer.farmerId === farmerId);
    if (farmerIndex > -1) {
        dataStore.farmers.splice(farmerIndex, 1);
        localStorage.setItem('farmers', JSON.stringify(dataStore.farmers));
        alert(`Farmer with ID ${farmerId} deleted successfully.`);
        updateFarmerList();
        updateFarmerEarnings();
        farmerForm.reset();
    } else {
        alert("Farmer not found.");
    }
});

// Search and Filter Farmers
searchFarmersInput.addEventListener("input", () => {
    const searchTerm = searchFarmersInput.value.toLowerCase();
    const filteredFarmers = dataStore.farmers.filter(farmer =>
        farmer.name.toLowerCase().includes(searchTerm) ||
        farmer.location.toLowerCase().includes(searchTerm)
    );
    renderFarmerList(filteredFarmers);
});

// Update Farmer List
function updateFarmerList() {
    renderFarmerList(dataStore.farmers);
}

function renderFarmerList(farmers) {
    farmerList.innerHTML = "";
    farmers.forEach(farmer => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>ID:</strong> ${farmer.farmerId}, <strong>Name:</strong> ${farmer.name}, <strong>Contact:</strong> ${farmer.contact}, <strong>Location:</strong> ${farmer.location}`;
        farmerList.appendChild(li);
    });
}

// Add Purchase
purchaseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const purchaseId = document.getElementById("purchase-id").value;
    const farmerId = document.getElementById("purchase-farmer-id").value;
    const date = document.getElementById("purchase-date").value;
    const quantity = parseFloat(document.getElementById("purchase-quantity").value);
    const pricePerKg = parseFloat(document.getElementById("purchase-price").value);

    if (quantity <= 0 || pricePerKg <= 0) {
        alert("Quantity and Price per kg must be positive values.");
        return;
    }

    const existingPurchase = dataStore.purchases.find(purchase => purchase.purchaseId === purchaseId);
    if (existingPurchase) {
        alert("Purchase ID already exists. Please use a unique Purchase ID.");
        return;
    }

    const farmer = dataStore.farmers.find(farmer => farmer.farmerId === farmerId);
    if (!farmer) {
        alert("Farmer ID not found. Please add the farmer first.");
        return;
    }

    const totalCost = quantity * pricePerKg;

    dataStore.purchases.push({ purchaseId, farmerId, date, quantity, pricePerKg, totalCost });
    localStorage.setItem('purchases', JSON.stringify(dataStore.purchases));
    alert(`Purchase added successfully. Total Cost: $${totalCost.toFixed(2)}`);

    updatePurchaseList();
    updateExpenseSummary();
    updateFarmerEarnings();
    purchaseForm.reset();
});

// Update Purchase List
function updatePurchaseList() {
    renderPurchaseList(dataStore.purchases);
}

function renderPurchaseList(purchases) {
    purchaseList.innerHTML = "";
    purchases.forEach(purchase => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>ID:</strong> ${purchase.purchaseId}, <strong>Farmer ID:</strong> ${purchase.farmerId}, <strong>Date:</strong> ${purchase.date}, <strong>Quantity:</strong> ${purchase.quantity}kg, <strong>Price per kg:</strong> $${purchase.pricePerKg}, <strong>Total Cost:</strong> $${purchase.totalCost.toFixed(2)} <button onclick="deletePurchase('${purchase.purchaseId}')">Delete</button>`;
        purchaseList.appendChild(li);
    });
}

// Delete Purchase
function deletePurchase(purchaseId) {
    const purchaseIndex = dataStore.purchases.findIndex(purchase => purchase.purchaseId === purchaseId);
    if (purchaseIndex > -1) {
        dataStore.purchases.splice(purchaseIndex, 1);
        localStorage.setItem('purchases', JSON.stringify(dataStore.purchases));
        alert(`Purchase with ID ${purchaseId} deleted successfully.`);
        updatePurchaseList();
        calculateExpenses(); // Update expense calculations
        updateExpenseSummary();
        updateFarmerEarnings();
    } else {
        alert("Purchase not found.");
    }
}

// Sort Purchases
sortPurchasesSelect.addEventListener("change", () => {
    const sortBy = sortPurchasesSelect.value;
    let sortedPurchases = [...dataStore.purchases];

    if (sortBy === "date") {
        sortedPurchases.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === "farmer") {
        sortedPurchases.sort((a, b) => a.farmerId.localeCompare(b.farmerId));
    } else if (sortBy === "amount") {
        sortedPurchases.sort((a, b) => b.totalCost - a.totalCost);
    }

    renderPurchaseList(sortedPurchases);
});

// Calculate Expenses
document.getElementById("calculate-expenses").addEventListener("click", calculateExpenses);

function calculateExpenses() {
    const selectedPeriod = expensePeriodSelect.value;
    const now = new Date();

    const filteredPurchases = dataStore.purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.date);
        if (selectedPeriod === "daily") {
            return now.toDateString() === purchaseDate.toDateString();
        } else if (selectedPeriod === "weekly") {
            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(now.getDate() - 7);
            return purchaseDate >= oneWeekAgo && purchaseDate <= now;
        } else if (selectedPeriod === "monthly") {
            return (
                purchaseDate.getMonth() === now.getMonth() &&
                purchaseDate.getFullYear() === now.getFullYear()
            );
        }
        return false;
    });

    const totalExpenses = filteredPurchases.reduce((acc, purchase) => acc + purchase.totalCost, 0);
    totalExpensesElement.textContent = `Total Expenses: $${totalExpenses.toFixed(2)}`;
    alert(`Total Expenses Calculated: $${totalExpenses.toFixed(2)}`);
}

// Export Farmers Data to CSV
exportFarmersButton.addEventListener("click", () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Farmer ID,Name,Contact,Location\n"
        + dataStore.farmers.map(farmer => `${farmer.farmerId},${farmer.name},${farmer.contact},${farmer.location}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "farmers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Update Farmer Earnings
function updateFarmerEarnings() {
    const earnings = dataStore.purchases.reduce((acc, purchase) => {
        acc[purchase.farmerId] = (acc[purchase.farmerId] || 0) + purchase.totalCost;
        return acc;
    }, {});

    farmerEarningsList.innerHTML = "";
    for (const farmerId in earnings) {
        const farmer = dataStore.farmers.find(farmer => farmer.farmerId === farmerId);
        if (farmer) {
            const li = document.createElement("li");
            li.innerHTML = `<strong>Farmer ID:</strong> ${farmerId}, <strong>Name:</strong> ${farmer.name}, <strong>Total Earnings:</strong> $${earnings[farmerId].toFixed(2)}`;
            farmerEarningsList.appendChild(li);
        }
    }
}

// Smooth Scroll for Navigation Links
document.querySelectorAll('nav ul li a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Module Navigation
document.querySelectorAll('.sidebar ul li a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelectorAll('.module').forEach(section => {
            section.classList.remove('active');
        });

        const target = document.getElementById(this.getAttribute('data-target'));
        target.classList.add('active');
    });
});

// Initialize the first module as active
document.getElementById('supplier-management').classList.add('active');

// Call updates when the page loads
updateFarmerList();
updatePurchaseList();
updateExpenseSummary();
updateFarmerEarnings();

// Update Expense Summary
function updateExpenseSummary() {
    const totalWeight = dataStore.purchases.reduce((acc, purchase) => acc + purchase.quantity, 0);
    const totalSpent = dataStore.purchases.reduce((acc, purchase) => acc + purchase.totalCost, 0);
    const averageCost = totalWeight ? (totalSpent / totalWeight) : 0;

    totalWeightElement.textContent = `Total Weight: ${totalWeight.toFixed(2)} kg`;
    averageCostElement.textContent = `Average Cost per kg: $${averageCost.toFixed(2)}`;
    totalSpentElement.textContent = `Total Spent: $${totalSpent.toFixed(2)}`;
}
