// products.js - База даних товарів з автоматичною синхронізацією

let productsDatabase = {
    iphone: [],
    ipad: [], 
    macbook: [],
    'apple-watch': []
};

// Broadcast Channel для отримання оновлень
const productsBroadcast = new BroadcastChannel('products_updates');

// Функція завантаження товарів з localStorage
function loadProductsToDatabase() {
    const storedProducts = localStorage.getItem('storeProducts');
    if (storedProducts) {
        console.log('🔄 Завантаження товарів з адмінки...');
        const adminProducts = JSON.parse(storedProducts);
        updateMainProductsDatabase(adminProducts);
        
        console.log('✅ Товари завантажено:', {
            iphone: productsDatabase.iphone.length,
            ipad: productsDatabase.ipad.length,
            macbook: productsDatabase.macbook.length,
            'apple-watch': productsDatabase['apple-watch'].length
        });
    } else {
        console.log('ℹ️ Товарів з адмінки не знайдено. Додайте товари через адмін-панель.');
    }
}

// Функція для оновлення бази товарів з адмінки
function updateMainProductsDatabase(newProducts) {
    console.log('Оновлення бази товарів з адмінки...', newProducts);
    
    const convertedProducts = {
        iphone: newProducts.filter(p => p.category === 'iphone'),
        ipad: newProducts.filter(p => p.category === 'ipad'),
        macbook: newProducts.filter(p => p.category === 'macbook'),
        'apple-watch': newProducts.filter(p => p.category === 'apple-watch')
    };
    
    Object.keys(convertedProducts).forEach(category => {
        productsDatabase[category] = convertedProducts[category];
    });
    
    console.log('✅ База товарів оновлена!');
    
    // Сповіщення про оновлення
    if (typeof showNotification === 'function') {
        showNotification('🔄 Товари оновлено!', 'success');
    }
}

// Функція для отримання товару за ID та категорією
function getProductById(productId, category) {
    if (!productsDatabase[category]) {
        console.error('Категорія не знайдена:', category);
        return null;
    }
    
    const product = productsDatabase[category].find(p => p.id === productId);
    if (!product) {
        console.error('Товар не знайдений:', productId, 'в категорії', category);
        return null;
    }
    return product;
}

// Функція для отримання всіх товарів категорії
function getProductsByCategory(category) {
    return productsDatabase[category] || [];
}

// Функція для отримання всіх товарів (для пошуку)
function getAllProducts() {
    const allProducts = [];
    Object.values(productsDatabase).forEach(categoryProducts => {
        allProducts.push(...categoryProducts);
    });
    return allProducts;
}

// Функція для отримання унікальних моделей по категорії
function getUniqueModelsByCategory(category) {
    if (!productsDatabase[category]) return [];
    
    const models = new Set();
    productsDatabase[category].forEach(product => {
        if (product && product.model) {
            models.add(product.model);
        }
    });
    return Array.from(models);
}

// Функція для фільтрації товарів по категорії та ціні
function getFilteredProducts(category, maxPrice, selectedModels = []) {
    if (!productsDatabase[category]) return [];
    
    let filtered = productsDatabase[category].filter(product => {
        if (!product) return false;
        
        const priceMatch = product.price <= maxPrice;
        const modelMatch = selectedModels.length === 0 || selectedModels.includes(product.model);
        
        return priceMatch && modelMatch;
    });
    
    return filtered;
}

// Функція для перевірки оновлень (для виклику з кнопки)
function checkForUpdates() {
    const storedProducts = localStorage.getItem('storeProducts');
    if (storedProducts) {
        const adminProducts = JSON.parse(storedProducts);
        if (adminProducts.length > 0) {
            updateMainProductsDatabase(adminProducts);
            if (typeof showNotification === 'function') {
                showNotification('✅ Товари оновлено!', 'success');
            }
            return true;
        }
    } else {
        if (typeof showNotification === 'function') {
            showNotification('❌ Немає нових товарів для оновлення', 'error');
        }
    }
    return false;
}

// Слухач оновлень від адмінки
function setupProductsUpdateListener() {
    productsBroadcast.onmessage = (event) => {
        if (event.data.type === 'products_updated') {
            console.log('🔔 Отримано оновлення товарів від адмінки');
            loadProductsToDatabase();
            
            // Оновлюємо відображення, якщо функція існує
            if (typeof displayProducts === 'function' && typeof currentCategory !== 'undefined') {
                displayProducts(currentCategory);
            }
            
            // Сповіщення для користувача
            if (typeof showNotification === 'function') {
                showNotification('🔄 Каталог оновлено!', 'info');
            }
        }
    };
}

// Слухач повідомлень між вкладками
function setupWindowMessageListener() {
    window.addEventListener('message', (event) => {
        if (event.data.type === 'products_updated') {
            console.log('Отримано оновлення з іншої вкладки');
            loadProductsToDatabase();
            
            // Оновлюємо відображення, якщо функція існує
            if (typeof displayProducts === 'function' && typeof currentCategory !== 'undefined') {
                displayProducts(currentCategory);
            }
        }
    });
}

// Автоматична перевірка оновлень кожні 30 секунд
function startAutoUpdateCheck() {
    setInterval(() => {
        const lastUpdate = localStorage.getItem('productsLastUpdate');
        const currentUpdate = localStorage.getItem('storeProducts');
        
        if (lastUpdate && currentUpdate) {
            loadProductsToDatabase();
            
            // Оновлюємо відображення, якщо функція існує
            if (typeof displayProducts === 'function' && typeof currentCategory !== 'undefined') {
                displayProducts(currentCategory);
            }
        }
    }, 30000);
}

// Функція для пошуку товарів
function searchProducts(searchTerm) {
    const allProducts = getAllProducts();
    const searchLower = searchTerm.toLowerCase().trim();
    
    if (!searchLower) return [];
    
    const exactMatches = [];
    const similarMatches = [];
    
    allProducts.forEach(product => {
        if (!product) return;
        
        const productName = product.name ? product.name.toLowerCase() : '';
        const productModel = product.model ? product.model.toLowerCase() : '';
        const productSpecs = product.specs ? product.specs.toLowerCase() : '';
        const productDescription = product.description ? product.description.toLowerCase() : '';
        
        // Точні збіги
        if (productName.includes(searchLower) || 
            productModel.includes(searchLower) ||
            productSpecs.includes(searchLower)) {
            exactMatches.push(product);
        }
        // Схожі збіги (тільки для довгих запитів)
        else if (searchLower.length > 2) {
            const searchWords = searchLower.split(' ');
            const productText = `${productName} ${productModel} ${productSpecs} ${productDescription}`;
            
            const hasSimilarWords = searchWords.some(word => 
                productText.includes(word)
            );
            
            if (hasSimilarWords) {
                similarMatches.push(product);
            }
        }
    });
    
    return {
        exact: exactMatches,
        similar: similarMatches
    };
}

// Функція для отримання випадкових товарів (для рекомендацій)
function getRandomProducts(count = 4) {
    const allProducts = getAllProducts();
    if (allProducts.length === 0) return [];
    
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Функція для отримання товарів за статусом
function getProductsByStatus(status) {
    const allProducts = getAllProducts();
    return allProducts.filter(product => product.status === status);
}

// Функція для отримання категорій з товарами
function getCategoriesWithProducts() {
    const categories = [];
    Object.keys(productsDatabase).forEach(category => {
        if (productsDatabase[category].length > 0) {
            categories.push(category);
        }
    });
    return categories;
}

// Ініціалізація бази даних при завантаженні
function initializeProductsDatabase() {
    console.log('🔄 Ініціалізація бази товарів...');
    loadProductsToDatabase();
    setupProductsUpdateListener();
    setupWindowMessageListener();
    startAutoUpdateCheck();
}

// Автоматичне завантаження товарів при ініціалізації
document.addEventListener('DOMContentLoaded', function() {
    initializeProductsDatabase();
});

// Експорт функцій для використання в інших файлах
if (typeof window !== 'undefined') {
    window.productsDatabase = productsDatabase;
    window.loadProductsToDatabase = loadProductsToDatabase;
    window.updateMainProductsDatabase = updateMainProductsDatabase;
    window.getProductById = getProductById;
    window.getProductsByCategory = getProductsByCategory;
    window.getAllProducts = getAllProducts;
    window.getUniqueModelsByCategory = getUniqueModelsByCategory;
    window.getFilteredProducts = getFilteredProducts;
    window.checkForUpdates = checkForUpdates;
    window.searchProducts = searchProducts;
    window.getRandomProducts = getRandomProducts;
    window.getProductsByStatus = getProductsByStatus;
    window.getCategoriesWithProducts = getCategoriesWithProducts;
    window.initializeProductsDatabase = initializeProductsDatabase;
}