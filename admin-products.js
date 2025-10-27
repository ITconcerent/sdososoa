// Глобальні змінні
let products = JSON.parse(localStorage.getItem('adminProducts')) || [];
let currentEditingId = null;
let productToDelete = null;
let productImages = [];

// Broadcast Channel для синхронізації
const broadcastChannel = new BroadcastChannel('products_updates');

// Ініціалізація
document.addEventListener('DOMContentLoaded', function() {
    console.log('Ініціалізація модуля товарів...');
    loadProducts();
    updateProductsCount();
    setupBroadcastListener();
    autoSyncOnLoad();
});

// Налаштування слухача оновлень
function setupBroadcastListener() {
    broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'products_updated') {
            console.log('Отримано оновлення товарів');
            loadProducts();
            updateProductsCount();
        }
    };
}

// Завантаження товарів
function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">📦</div>
                <h3 style="margin-bottom: 10px; color: #333;">Немає товарів</h3>
                <p style="margin-bottom: 25px; color: #666;">Додайте перший товар до вашого магазину</p>
                <button class="btn btn-primary" onclick="openAddProductModal()">
                    <i class="fas fa-plus"></i>
                    Додати товар
                </button>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-category="${product.category}" data-status="${product.status || 'in-stock'}">
            <div class="product-image">
                ${product.mainImage || product.image ? 
                    `<img src="${product.mainImage || product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"> 
                     <div class="placeholder" style="display: none;"><i class="fas fa-image"></i></div>` :
                    `<div class="placeholder"><i class="fas fa-image"></i></div>`
                }
            </div>
            <div class="product-info">
                <div class="product-model">${product.model}</div>
                <h3>${product.name}</h3>
                <div class="product-specs">${product.specs || ''}</div>
                <div class="product-price">${formatPrice(product.price)} ₴</div>
                <div class="product-status" style="font-size: 12px; color: ${product.status === 'out-of-stock' ? '#e53935' : '#4CAF50'}; margin-bottom: 10px;">
                    ${product.status === 'out-of-stock' ? '❌ Немає в наявності' : '✅ В наявності'}
                </div>
                <div class="product-actions">
                    <button class="btn btn-outline" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                        Редагувати
                    </button>
                    <button class="btn btn-danger" onclick="openDeleteModal(${product.id})">
                        <i class="fas fa-trash"></i>
                        Видалити
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Форматування ціни
function formatPrice(price) {
    return parseInt(price).toLocaleString('uk-UA');
}

// Оновлення лічильника товарів
function updateProductsCount() {
    const countElement = document.getElementById('products-count');
    countElement.textContent = `${products.length} товар${products.length % 10 === 1 ? '' : 'и'}`;
}

// Фільтрація товарів
function filterProducts() {
    const searchTerm = document.getElementById('search-products').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent.toLowerCase();
        const productCategory = card.getAttribute('data-category');
        const productStatus = card.getAttribute('data-status');
        
        const matchesSearch = productName.includes(searchTerm);
        const matchesCategory = !categoryFilter || productCategory === categoryFilter;
        const matchesStatus = !statusFilter || productStatus === statusFilter;
        
        card.style.display = (matchesSearch && matchesCategory && matchesStatus) ? 'block' : 'none';
    });
}

// Відкриття модалки додавання товару
function openAddProductModal() {
    currentEditingId = null;
    productImages = [];
    document.getElementById('modal-title').textContent = 'Додати товар';
    document.getElementById('product-form').reset();
    updateImagePreviews();
    document.getElementById('characteristics-container').innerHTML = '';
    document.getElementById('product-modal').classList.add('active');
}

// Закриття модалки товару
function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

// Обробка завантаження кількох фото
function handleImageUpload(event) {
    const files = event.target.files;
    const previewsContainer = document.getElementById('image-previews');
    
    const placeholder = previewsContainer.querySelector('.image-preview-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    for (let i = 0; i < files.length; i++) {
        if (productImages.length >= 5) {
            alert('Максимально можна завантажити 5 фото');
            break;
        }
        
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const imageData = {
                id: Date.now() + i,
                data: e.target.result,
                isMain: productImages.length === 0
            };
            
            productImages.push(imageData);
            updateImagePreviews();
        };
        
        reader.readAsDataURL(file);
    }
    
    event.target.value = '';
}

// Оновлення відображення прев'ю фото
function updateImagePreviews() {
    const previewsContainer = document.getElementById('image-previews');
    previewsContainer.innerHTML = '';
    
    if (productImages.length === 0) {
        previewsContainer.innerHTML = `
            <div class="image-preview-placeholder">
                <i class="fas fa-images"></i>
                <span>Додайте фото товару</span>
            </div>
        `;
        return;
    }
    
    productImages.forEach((image, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = `image-preview-item ${image.isMain ? 'main-image' : ''}`;
        previewItem.innerHTML = `
            <img src="${image.data}" alt="Preview ${index + 1}">
            ${image.isMain ? '<div class="main-badge">Головне</div>' : ''}
            <div class="image-actions">
                <button class="image-action-btn" onclick="setAsMainImage(${image.id})" title="Зробити головним">
                    <i class="fas fa-star"></i>
                </button>
                <button class="image-action-btn" onclick="removeImage(${image.id})" title="Видалити">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        previewsContainer.appendChild(previewItem);
    });
}

// Встановити фото як головне
function setAsMainImage(imageId) {
    productImages.forEach(image => {
        image.isMain = image.id === imageId;
    });
    updateImagePreviews();
}

// Видалити фото
function removeImage(imageId) {
    const imageIndex = productImages.findIndex(img => img.id === imageId);
    const isMain = productImages[imageIndex].isMain;
    
    productImages.splice(imageIndex, 1);
    
    if (isMain && productImages.length > 0) {
        productImages[0].isMain = true;
    }
    
    updateImagePreviews();
}

// Очистити всі фото
function clearAllImages() {
    productImages = [];
    updateImagePreviews();
}

// Додавання характеристики
function addCharacteristic() {
    const container = document.getElementById('characteristics-container');
    const index = container.children.length;
    
    const characteristicRow = document.createElement('div');
    characteristicRow.className = 'characteristic-row';
    characteristicRow.innerHTML = `
        <input type="text" placeholder="Назва характеристики (напр. Процесор)" name="characteristic-key-${index}">
        <input type="text" placeholder="Значення (напр. A15 Bionic)" name="characteristic-value-${index}">
        <button type="button" class="remove-characteristic" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(characteristicRow);
}

// Збереження товару
function saveProduct(event) {
    event.preventDefault();
    
    const formData = {
        id: currentEditingId || Date.now(),
        name: document.getElementById('product-name').value,
        model: document.getElementById('product-model').value,
        category: document.getElementById('product-category').value,
        price: parseInt(document.getElementById('product-price').value),
        specs: document.getElementById('product-specs').value,
        description: document.getElementById('product-description').value,
        status: 'in-stock',
        createdAt: new Date().toISOString(),
        lastUpdated: Date.now()
    };
    
    formData.images = productImages.map(img => img.data);
    formData.mainImage = productImages.find(img => img.isMain)?.data || '';
    
    finalizeSave(formData);
}

function finalizeSave(formData) {
    const characteristics = {};
    const characteristicRows = document.querySelectorAll('.characteristic-row');
    
    characteristicRows.forEach(row => {
        const keyInput = row.querySelector('input[name^="characteristic-key"]');
        const valueInput = row.querySelector('input[name^="characteristic-value"]');
        
        if (keyInput.value && valueInput.value) {
            characteristics[keyInput.value] = valueInput.value;
        }
    });
    
    if (Object.keys(characteristics).length > 0) {
        formData.characteristics = characteristics;
    }
    
    if (currentEditingId) {
        const index = products.findIndex(p => p.id === currentEditingId);
        if (index !== -1) {
            products[index] = { ...products[index], ...formData };
        }
    } else {
        products.push(formData);
    }
    
    localStorage.setItem('adminProducts', JSON.stringify(products));
    
    // АВТОМАТИЧНА СИНХРОНІЗАЦІЯ
    syncWithMainSite();
    
    loadProducts();
    updateProductsCount();
    closeProductModal();
    
    alert(currentEditingId ? 'Товар успішно оновлено!' : 'Товар успішно додано!');
}

// Редагування товару
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentEditingId = productId;
    document.getElementById('modal-title').textContent = 'Редагувати товар';
    
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-model').value = product.model;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-specs').value = product.specs || '';
    document.getElementById('product-description').value = product.description || '';
    
    productImages = [];
    if (product.images && product.images.length > 0) {
        product.images.forEach((imageData, index) => {
            productImages.push({
                id: Date.now() + index,
                data: imageData,
                isMain: index === 0 || imageData === product.mainImage
            });
        });
    } else if (product.image) {
        productImages.push({
            id: Date.now(),
            data: product.image,
            isMain: true
        });
    }
    updateImagePreviews();
    
    const container = document.getElementById('characteristics-container');
    container.innerHTML = '';
    
    if (product.characteristics) {
        Object.entries(product.characteristics).forEach(([key, value], index) => {
            const characteristicRow = document.createElement('div');
            characteristicRow.className = 'characteristic-row';
            characteristicRow.innerHTML = `
                <input type="text" placeholder="Назва характеристики" name="characteristic-key-${index}" value="${key}">
                <input type="text" placeholder="Значення" name="characteristic-value-${index}" value="${value}">
                <button type="button" class="remove-characteristic" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(characteristicRow);
        });
    }
    
    document.getElementById('product-modal').classList.add('active');
}

// Відкриття модалки видалення
function openDeleteModal(productId) {
    productToDelete = productId;
    document.getElementById('delete-modal').classList.add('active');
}

// Закриття модалки видалення
function closeDeleteModal() {
    productToDelete = null;
    document.getElementById('delete-modal').classList.remove('active');
}

// Підтвердження видалення
function confirmDelete() {
    if (productToDelete) {
        products = products.filter(p => p.id !== productToDelete);
        localStorage.setItem('adminProducts', JSON.stringify(products));
        
        syncWithMainSite();
        
        loadProducts();
        updateProductsCount();
        closeDeleteModal();
        alert('Товар успішно видалено!');
    }
}

// Експорт товарів
function exportProducts() {
    if (products.length === 0) {
        alert('Немає товарів для експорту!');
        return;
    }
    
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `istore-products-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// АВТОМАТИЧНА СИНХРОНІЗАЦІЯ
function syncWithMainSite() {
    // Зберігаємо для основного сайту
    localStorage.setItem('storeProducts', JSON.stringify(products));
    localStorage.setItem('productsLastUpdate', Date.now().toString());
    
    // Відправляємо сповіщення через Broadcast Channel
    broadcastChannel.postMessage({
        type: 'products_updated',
        timestamp: Date.now(),
        count: products.length
    });
    
    // Спроба оновити відкриті вкладки основного сайту
    if (window.opener && !window.opener.closed) {
        try {
            window.opener.postMessage({
                type: 'products_updated',
                timestamp: Date.now()
            }, '*');
        } catch (e) {
            console.log('Не вдалось оновити основну вкладку');
        }
    }
    
    alert('✅ Товари синхронізовані! Всі користувачі побачать оновлення.');
}

// Автоматична синхронізація при завантаженні
function autoSyncOnLoad() {
    const adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
    const storeProducts = JSON.parse(localStorage.getItem('storeProducts')) || [];
    
    if (adminProducts.length > 0 && storeProducts.length === 0) {
        syncWithMainSite();
    }
}