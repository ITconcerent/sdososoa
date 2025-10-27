// cart.js - ОНОВЛЕНА ВЕРСІЯ З НОВОЮ СИСТЕМОЮ ОФОРМЛЕННЯ

// Глобальні змінні для кошика
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartCount = cart.reduce((total, item) => total + item.quantity, 0);

// Функція додавання товару в кошик з анімацією
function addToCart(productId, category, event = null) {
    const product = productsDatabase[category].find(p => p.id === productId);
    
    if (!product) {
        console.error('Товар не знайдено:', productId, category);
        showNotification('❌ Товар не знайдено!', 'error');
        return;
    }
    
    console.log('🛒 Додаємо товар:', product.name);
    
    // Створюємо ефект "польоту" товару в кошик (якщо event передано)
    if (event) {
        createFlyingAnimation(product, event);
    }
    
    // Додаємо товар в кошик
    const existingItem = cart.find(item => item.id === productId && item.category === category);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            model: product.model,
            price: product.price,
            image: product.mainImage || product.image,
            category: category,
            quantity: 1
        });
    }
    
    cartCount++;
    updateCartUI();
    saveCartToStorage();
    
    // Показуємо сповіщення
    showAddToCartNotification(product);
}

// Створення анімації польоту
function createFlyingAnimation(product, event) {
    console.log('✈️ Запуск анімації для:', product.name);
    
    try {
        // Створюємо елемент для анімації
        const flyingItem = document.createElement('div');
        flyingItem.className = 'flying-item';
        flyingItem.innerHTML = '📱';
        flyingItem.style.cssText = `
            position: fixed;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #007aff, #0056cc);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            pointer-events: none;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            border: 2px solid white;
        `;
        
        // Отримуємо позицію кнопки
        const button = event.target.closest('.buy-btn') || event.target;
        const buttonRect = button.getBoundingClientRect();
        const startX = buttonRect.left + window.scrollX;
        const startY = buttonRect.top + window.scrollY;
        
        // Встановлюємо стартову позицію
        flyingItem.style.left = startX + 'px';
        flyingItem.style.top = startY + 'px';
        
        // Додаємо елемент на сторінку
        document.body.appendChild(flyingItem);
        
        // Знаходимо позицію кошика
        const cartIcon = document.querySelector('.user-actions a:last-child');
        if (!cartIcon) {
            console.error('Не знайдено іконку кошика');
            flyingItem.remove();
            return;
        }
        
        const cartRect = cartIcon.getBoundingClientRect();
        const endX = cartRect.left + window.scrollX + (cartRect.width / 2) - 25;
        const endY = cartRect.top + window.scrollY + (cartRect.height / 2) - 25;
        
        // Запускаємо анімацію
        setTimeout(() => {
            flyingItem.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            flyingItem.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0.3)`;
            flyingItem.style.opacity = '0.5';
        }, 10);
        
        // Видаляємо елемент після анімації
        setTimeout(() => {
            if (flyingItem.parentNode) {
                flyingItem.remove();
            }
        }, 800);
        
    } catch (error) {
        console.error('Помилка анімації:', error);
    }
}

// Сповіщення про додавання в кошик
function showAddToCartNotification(product) {
    const notification = document.createElement('div');
    notification.className = 'add-to-cart-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        z-index: 1000;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
        animation: slideInRight 0.5s ease-out;
        border-left: 4px solid #2E7D32;
        max-width: 300px;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">✅</span>
            <div>
                <strong style="display: block; margin-bottom: 5px;">${product.name}</strong>
                <small style="opacity: 0.9;">Додано до кошика!</small>
                <div style="font-size: 12px; margin-top: 3px;">Ціна: ${product.price.toLocaleString('uk-UA')} ₴</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматично видаляємо сповіщення через 3 секунди
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.5s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 500);
        }
    }, 3000);
}

// Функція для сповіщень
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#e53935' : '#007aff'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Оновлення UI кошика
function updateCartUI() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
        // ПОПРАВКА: показуємо лічильник тільки якщо є товари
        element.style.display = cartCount > 0 ? 'inline-block' : 'none';
    });
    
    // Анімація іконки кошика
    const cartIcon = document.querySelector('.user-actions a:last-child');
    if (cartIcon && cartCount > 0) {
        cartIcon.classList.add('cart-bounce');
        setTimeout(() => {
            cartIcon.classList.remove('cart-bounce');
        }, 600);
    }
}

// Збереження кошика в localStorage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartCount', cartCount.toString());
    console.log('💾 Кошик збережено:', cart);
}

// Завантаження кошика з localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    const savedCount = localStorage.getItem('cartCount');
    
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    if (savedCount) {
        cartCount = parseInt(savedCount);
    }
    
    console.log('📥 Кошик завантажено:', {
        items: cart.length,
        totalCount: cartCount,
        totalPrice: calculateTotal()
    });
}

// Відкриття модального вікна кошика
function openCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) {
        console.error('❌ Модальне вікно кошика не знайдено');
        createCartModal();
        return;
    }
    
    updateCartModal();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закриття модального вікна
function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Створення модального вікна кошика
function createCartModal() {
    const cartModal = document.createElement('div');
    cartModal.id = 'cart-modal';
    cartModal.className = 'cart-modal';
    cartModal.innerHTML = `
        <div class="cart-content">
            <button class="close-cart" onclick="closeCart()">×</button>
            <h2 style="margin-bottom: 20px; color: #000; padding-right: 40px;">
                <i class="fas fa-shopping-cart"></i>
                Ваш кошик
            </h2>
            <div class="cart-items" id="cart-items"></div>
            <div style="flex-shrink: 0;">
                <div class="cart-total">
                    Загальна сума: <span id="cart-total">0 ₴</span>
                </div>
                <div class="checkout-section">
                    <button class="checkout-btn" onclick="proceedToCheckout()">
                        <i class="fas fa-arrow-right"></i>
                        Перейти до оформлення
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(cartModal);
    console.log('✅ Модальне вікно кошика створено');
}

// Оновлення вмісту модального вікна кошика
function updateCartModal() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartTotal) {
        console.error('❌ Елементи кошика не знайдені');
        return;
    }
    
    cartItems.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        showEmptyCart();
        return;
    }
    
    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" 
                 style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px;"
                 onerror="this.src='https://via.placeholder.com/60x60/007AFF/FFFFFF?text=No+Image'">
            <div style="flex-grow: 1;">
                <div style="font-weight: bold; margin-bottom: 5px;">${item.name}</div>
                <div style="color: #666; font-size: 14px; margin-bottom: 5px;">${item.model}</div>
                <div style="color: #e53935; font-weight: bold;">${item.price.toLocaleString('uk-UA')} ₴</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="changeQuantity(${index}, -1)" 
                        style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">-</button>
                <span style="min-width: 30px; text-align: center; font-weight: bold;">${item.quantity}</span>
                <button onclick="changeQuantity(${index}, 1)" 
                        style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">+</button>
            </div>
            <button onclick="removeFromCart(${index})" 
                    style="background: #ff4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin-left: 10px; display: flex; align-items: center; gap: 5px;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = `${total.toLocaleString('uk-UA')} ₴`;
}

// Зміна кількості товару
function changeQuantity(index, change) {
    if (index < 0 || index >= cart.length) {
        console.error('❌ Неправильний індекс товару:', index);
        return;
    }
    
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        cartCount += change;
        updateCartUI();
        updateCartModal();
        saveCartToStorage();
        
        // Показати сповіщення про зміну кількості
        if (change > 0) {
            showNotification(`✅ Кількість товару "${cart[index].name}" збільшено`, 'success');
        } else {
            showNotification(`ℹ️ Кількість товару "${cart[index].name}" зменшено`, 'info');
        }
    }
}

// Видалення товару з кошика
function removeFromCart(index) {
    if (index < 0 || index >= cart.length) {
        console.error('❌ Неправильний індекс товару для видалення:', index);
        return;
    }
    
    const removedItem = cart[index];
    cartCount -= removedItem.quantity;
    cart.splice(index, 1);
    
    updateCartUI();
    saveCartToStorage();
    
    // Показати сповіщення про видалення
    showNotification(`🗑️ Товар "${removedItem.name}" видалено з кошика`, 'info');
    
    if (cart.length === 0) {
        showEmptyCart();
    } else {
        updateCartModal();
    }
}

// Показати порожній кошик
function showEmptyCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems) return;
    
    cartItems.innerHTML = `
        <div class="empty-cart">
            <div style="font-size: 80px; margin-bottom: 20px;">🛒</div>
            <h3 style="margin-bottom: 10px; color: #333;">Кошик порожній</h3>
            <p style="margin-bottom: 20px; color: #666;">Додайте товари, щоб зробити замовлення</p>
            <div style="display: flex; justify-content: center;">
                <button onclick="closeCart()" 
                        style="padding: 12px 24px; background: #007aff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-shopping-bag"></i>
                    Продовжити покупки
                </button>
            </div>
        </div>
    `;
    
    if (cartTotal) {
        cartTotal.textContent = '0 ₴';
    }
}

// ⭐⭐⭐ ОНОВЛЕНА ФУНКЦІЯ ОФОРМЛЕННЯ ЗАМОВЛЕННЯ ⭐⭐⭐
function proceedToCheckout() {
    console.log('🚀 Спроба переходу до оформлення замовлення...');
    
    if (cart.length === 0) {
        showNotification('❌ Кошик порожній! Додайте товари перед оформленням замовлення.', 'error');
        return;
    }
    
    // Зберігаємо кошик в localStorage для передачі на сторінку оформлення
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartTotal', calculateTotal().toString());
    
    // Очищаємо попередні дані оформлення (якщо є)
    localStorage.removeItem('deliveryData');
    localStorage.removeItem('paymentData');
    localStorage.removeItem('selectedPayment');
    localStorage.removeItem('currentOrder');
    
    console.log('📊 Дані для оформлення:', {
        товарів: cart.length,
        загальна_сума: calculateTotal(),
        кошик: cart
    });
    
    // Закриваємо модальне вікно кошика
    closeCart();
    
    // ⭐ ВИПРАВЛЕНИЙ ШЛЯХ - переходимо до ПЕРШОГО кроку оформлення
    setTimeout(() => {
        window.location.href = 'checkout-step1.html';
    }, 500);
}

// Розрахунок загальної суми
function calculateTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Очищення кошика
function clearCart() {
    cart = [];
    cartCount = 0;
    updateCartUI();
    saveCartToStorage();
    showNotification('🗑️ Кошик очищено', 'info');
}

// Функція для ініціалізації кошика при завантаженні сторінки
function initCart() {
    console.log('🛒 Ініціалізація кошика...');
    
    // Завантажуємо дані з localStorage
    loadCartFromStorage();
    
    // Оновлюємо лічильник кошика
    updateCartUI();
    
    // Додаємо обробник для посилання кошика
    const cartLink = document.querySelector('.user-actions a:last-child');
    if (cartLink) {
        cartLink.addEventListener('click', function(e) {
            e.preventDefault();
            openCart();
        });
    }
    
    // Створюємо модальне вікно кошика (якщо ще не створено)
    if (!document.getElementById('cart-modal')) {
        createCartModal();
    }
    
    console.log('✅ Кошик ініціалізовано успішно');
}

// Додаємо обробники подій при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM завантажено, ініціалізація кошика...');
    initCart();
});

// Додаємо CSS анімації глобально (якщо ще не додано)
if (!document.querySelector('#cart-animations')) {
    const style = document.createElement('style');
    style.id = 'cart-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
                transform: translate3d(0,0,0);
            }
            40%, 43% {
                transform: translate3d(0,-8px,0);
            }
            70% {
                transform: translate3d(0,-4px,0);
            }
            90% {
                transform: translate3d(0,-2px,0);
            }
        }
        
        .cart-bounce {
            animation: bounce 0.6s ease;
        }
        
        .flying-item {
            /* Стилі вже встановлені в JavaScript */
        }
        
        /* Стилі для кнопки оформлення в кошику */
        .checkout-btn {
            background: #007aff;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-top: 15px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .checkout-btn:hover {
            background: #0056cc;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
        }
        
        .checkout-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .empty-cart {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .cart-item {
            animation: fadeIn 0.3s ease-out;
        }
        
        /* Стилі для модального вікна кошика */
        .cart-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            backdrop-filter: blur(5px);
            justify-content: center;
            align-items: center;
        }
        
        .cart-modal.active {
            display: flex;
        }
        
        .cart-content {
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 800px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            position: relative;
            margin: 20px;
            display: flex;
            flex-direction: column;
        }
        
        .close-cart {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
            cursor: pointer;
            background: none;
            border: none;
            color: #666;
            z-index: 1;
        }
        
        .cart-items {
            margin: 20px 0;
            max-height: 400px;
            overflow-y: auto;
            flex: 1;
        }
        
        .cart-total {
            text-align: right;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            padding-top: 20px;
            border-top: 2px solid #eee;
        }
        
        .checkout-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
    `;
    document.head.appendChild(style);
}

// Експорт функцій для глобального використання
if (typeof window !== 'undefined') {
    window.addToCart = addToCart;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.changeQuantity = changeQuantity;
    window.removeFromCart = removeFromCart;
    window.proceedToCheckout = proceedToCheckout;
    window.updateCartUI = updateCartUI;
    window.clearCart = clearCart;
}

console.log('🛒 cart.js завантажено успішно!');