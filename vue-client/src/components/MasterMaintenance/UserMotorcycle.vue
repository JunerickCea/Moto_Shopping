<template>

    <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">

        <v-card-title class="flex items-center  border-b bg-black text-white"
            style="position: sticky; top: 0px; z-index: 10;">
            <v-icon class="mr-2">mdi-motorbike</v-icon>
            <h1 class="text-lg sm:text-xl">Premiumbikes Shop</h1>
        </v-card-title>
        <v-container class="px-2 px-sm-4">
            <br>
            <v-toolbar class="bg-gray-600 text-white text-lg font-seibold"><v-icon
                    class="ml-3 text-yellow-500">mdi-star</v-icon>Featured Motorcycles</v-toolbar>
            <v-carousel v-model="currentSlide" :height="carouselHeight" interval="5000"
                :show-arrows="$vuetify.display.xs ? false : 'hover'"
                transition="fade-transition" reverse-transition="fade-transition" hide-delimiters-on-hover
                class="bg-gradient-to-t from-slate-800 via-slate-900 to-black" cycle>
                <v-carousel-item v-for="motorcycle in motorcycleDetails" :key="motorcycle._id">
                    <v-img :src="motorcycle.Image" alt="Motorcycle"
                        class="w-full h-full object-cover rounded-lg hover:scale-110 transition-transform"></v-img>
                    <div class="absolute inset-0 flex flex-col justify-between text-white px-4 py-4 sm:px-10 sm:py-8">
                        <div>
                            <h1 class="px-3 py-1 text-xs font-semibold tracking-wide  uppercase">
                                <v-icon class="mr-2 text-yellow-600">mdi-star</v-icon>
                                Featured
                            </h1>
                            <h2 class="mt-2 sm:mt-4 text-2xl sm:text-4xl font-bold">
                                {{ motorcycle.Brand }} {{ motorcycle.MotorcycleName }}
                            </h2>
                            <p class="mt-2 text-base sm:text-lg opacity-80">
                                {{ motorcycle.Brand }}
                            </p>
                            <p class="mt-2 sm:mt-4 text-xl sm:text-3xl font-bold">
                                {{ peso(motorcycle.Price) }}
                            </p>
                        </div>

                        <div class="flex gap-3">
                            <v-btn @click="openEyeDialog(motorcycle)" color="primary"><v-icon>mdi-eye</v-icon>View
                                Details</v-btn>
                        </div>
                    </div>
                </v-carousel-item>
            </v-carousel>


            <br>
            <br>

            <v-card class="pa-5 bg-gray-600 text-white">
                <div class="flex flex-col sm:flex-row gap-2">
                    <v-select class="w-full" density="compact" :items="brandItems" label="Filter by Brand"
                        variant="outlined" prepend-inner-icon="mdi-filter-variant" v-model="motorBrand" />
                    <v-select class="w-full" density="compact" :items="sortOptions" item-title="label"
                        item-value="value" label="Sort by" variant="outlined" prepend-inner-icon="mdi-sort"
                        v-model="sortBy" />
                    <v-text-field v-model="search" class="w-full" density="compact" label="Search Motorcycle..."
                        prepend-inner-icon="mdi-magnify" variant="outlined" />
                    <v-btn prepend-icon="mdi-filter-remove-outline" color="warning" @click="clearFilter()"
                        class="w-full sm:w-auto">Clear Filter</v-btn>
                </div>
            </v-card>
            <BrandMarquee class="mt-4" :stocked-brands="brandItems" @select="(brand) => motorBrand = brand" />
            <br>


            <v-lazy :options="{threshold: 0.6}" transition="lazy-fade-slide">
                <template #default>
                    <v-row class="mt-6" dense>
                        <v-col v-for="motorcycle in filteredTableData" :key="motorcycle._id" cols="12" sm="6" md="3">
                            <v-card class="bg-gray-700 text-white h-full d-flex flex-column">
                                <div v-if="motorcycle.Stock <= 0" class="out-of-stock-label-card">
                                    OUT OF STOCK
                                </div>
                                <v-img :src="motorcycle.Image" height="220" contain class="bg-gray-900"></v-img>

                                <v-card-text class="flex-grow">
                                    <div class="mb-2">
                                        <v-chip size="small" :color="motorcycle.Stock <= 0
                                            ? 'red'
                                            : (motorcycle.Stock <= 10 ? 'orange' : 'green')" text-color="white">
                                            {{ motorcycle.Stock <= 0 ? 'Out of stock' : `${motorcycle.Stock} in stock`
                                            }} </v-chip>
                                    </div>

                                    <h3 class="text-xl font-semibold mb-1">
                                        {{ motorcycle.MotorcycleName }}
                                    </h3>
                                    <p class="text-sm opacity-80 mb-2">{{ motorcycle.Brand }}</p>

                                    <p class="text-2xl font-bold mb-2">
                                        {{ peso(motorcycle.Price) }}
                                    </p>

                                    <p class="text-xs opacity-75">
                                        Released: {{ motorcycle.ReleaseDate }}
                                    </p>
                                </v-card-text>

                                <v-card-actions class="justify-between">
                                    <v-btn variant="text" prepend-icon="mdi-eye" @click="openEyeDialog(motorcycle)">
                                        View
                                    </v-btn>
                                    <v-btn :disabled="motorcycle.Stock <= 0" color="primary" prepend-icon="mdi-cart"
                                        @click="addToCart(motorcycle)">
                                        Add to cart
                                    </v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-col>
                    </v-row>
                </template>
            </v-lazy>

        </v-container>
    </v-card>

    <!-- Floating cart: stays in the bottom-right corner while the page scrolls -->
    <v-btn class="cart-fab" icon size="x-large" color="primary" elevation="8" aria-label="Open cart"
        @click="openCart">
        <v-badge v-if="isLoggedIn && cart.length > 0" :content="cart.length" color="red">
            <v-icon size="30">mdi-cart</v-icon>
        </v-badge>
        <v-icon v-else size="30">mdi-cart</v-icon>
    </v-btn>

    <v-dialog v-model="eyeDialog" max-width="700px" persistent scrollable :fullscreen="$vuetify.display.xs">
        <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">

            <v-card-title class="flex items-center gap-2">
                <v-icon class="text-2xl  border-2 border-green-600 rounded-full p-4  text-black"
                    style="background-color:#43A047">mdi-information-variant</v-icon>
                <h1 class="text-lg sm:text-xl">Motorcycle Details</h1>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" color="red" aria-label="Close" @click="closeEyeDialog()" />
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <v-img :src="checkItem?.Image" max-height="400" contain />
                    </v-col>
                    <v-col cols="12" sm="8" class="pa-4">
                        <p class="pa-2 text-lg font-bold">{{ checkItem?.Brand }} {{ checkItem?.MotorcycleName }}</p>
                        <p class="pa-2"><v-icon
                                class="text-green-300 mr-2">mdi-tag-outline</v-icon><strong>Brand:</strong>
                            {{ checkItem?.Brand }}</p>
                        <p class="pa-2"><v-icon
                                class="text-green-300 mr-2">mdi-currency-php</v-icon><strong>Price:</strong>
                            {{ peso(checkItem?.Price) }}</p>
                        <p class="pa-2"><v-icon
                                class="text-green-300 mr-2">mdi-package-variant</v-icon><strong>Stock:</strong> {{
                                    checkItem?.Stock }}</p>
                        <p class="pa-2"><v-icon
                                class="text-green-300 mr-2">mdi-counter</v-icon><strong>Quantity:</strong>
                            {{ checkItem?.Quantity }}</p>
                        <p class="pa-2"><v-icon class="text-green-300 mr-2">mdi-calendar</v-icon><strong>Release
                                Date:</strong> {{ checkItem?.ReleaseDate }}</p>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn :disabled="checkItem?.Stock <= 0" color="primary" variant="elevated" prepend-icon="mdi-cart"
                    @click="closeEyeDialog(); addToCart(checkItem)">Add to cart</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Cart Dialog -->
    <!-- Cart Dialog -->
    <v-dialog v-model="cartDialog" max-width="600px" scrollable :fullscreen="$vuetify.display.xs">
        <v-card class="bg-gray-800 text-white">
            <v-card-title class="flex items-center mt-2">
                <v-icon class="mr-2">mdi-cart</v-icon>
                <h1>Your Cart</h1>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" color="red" aria-label="Close" @click="cartDialog = false" />
            </v-card-title>
            <v-card-text>
                <div v-for="item in cart" :key="item._id"
                    class="bg-gradient-to-t from-slate-800 via-slate-800 to-black rounded-lg pa-3 mb-3">
                    <div class="flex flex-col sm:flex-row gap-3">
                        <v-img :src="item.Image" class="rounded bg-gray-900 shrink-0 w-full sm:w-40" height="120"
                            contain />
                        <div class="flex-grow">
                            <v-checkbox v-model="item.selected" color="primary" hide-details density="compact"
                                :label="`${item.Brand} ${item.MotorcycleName}`" />
                            <div class="d-flex align-center ga-2 mt-1">
                                <span class="text-gray-300">Qty</span>
                                <v-btn icon="mdi-minus" size="small" variant="tonal" color="orange"
                                    aria-label="Decrease quantity" :disabled="item.quantity <= 1"
                                    @click="decrementQuantity(item)" />
                                <span class="text-lg font-bold px-1">{{ item.quantity }}</span>
                                <v-btn icon="mdi-plus" size="small" variant="tonal" color="success"
                                    aria-label="Increase quantity" :disabled="item.quantity >= item.Stock"
                                    @click="incrementQuantity(item)" />
                            </div>
                            <div class="d-flex flex-wrap align-center ga-2 mt-3">
                                <v-chip color="success">{{ peso(item.Price * item.quantity) }}</v-chip>
                                <v-spacer />
                                <v-btn size="small" color="red" variant="tonal" prepend-icon="mdi-delete"
                                    @click="removeFromCart(item._id)">Remove</v-btn>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="cart.length === 0" class="text-center py-8 text-gray-300">
                    <v-icon size="48" class="mb-2">mdi-cart-outline</v-icon>
                    <p><em>Your cart is empty</em></p>
                </div>
            </v-card-text>
            <v-card-actions v-if="cart.length" class="pa-4 flex-wrap ga-2">
                <span class="text-lg font-bold">Selected: {{ peso(selectedCartTotal) }}</span>
                <v-spacer />
                <v-btn @click="openCheckOut" color="green" variant="elevated" prepend-icon="mdi-cash-register"
                    :disabled="selectedCartTotal === 0">Proceed to Check-out</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="customerInfoDialog" max-width="700" scrollable :fullscreen="$vuetify.display.xs">
        <v-card class="bg-gray-800 text-white">
            <v-card-title class="flex items-center">
                <h1 class="text-lg sm:text-xl text-white">Customer Details</h1>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" color="red" aria-label="Close"
                    @click="customerInfoDialog = false" />
            </v-card-title>
            <v-card-text>
                <p class="mt-n2 mb-4 text-gray-400">for shipment purposes</p>
                <v-row>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="customerInfo.fullName" density="compact" label="Customer Full Name"
                            prepend-inner-icon="mdi-account"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="customerInfo.email" density="compact" label="Email Adress"
                            prepend-inner-icon="mdi-email"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-select v-model="customerInfo.paymentMethod" density="compact" label="Payment Method"
                            prepend-inner-icon="mdi-credit-card-settings-outline"
                            :items="['Cash-on-Delivery', 'Credit Card', 'Debit Card']"></v-select>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="customerInfo.contactNo" density="compact" label="Contact No. #"
                            prepend-inner-icon="mdi-cellphone" inputmode="tel"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field v-model="customerInfo.address" density="compact" label="Address"
                            prepend-inner-icon="mdi-map-marker"></v-text-field>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn @click="submitCustomerInfo" color="primary" variant="elevated">Submit details</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="reviewDialog" max-width="750px" scrollable :fullscreen="$vuetify.display.xs">
        <v-card class="bg-gray-800 text-white">
            <v-card-title><v-icon>mdi-shopping</v-icon> Order Review</v-card-title>
            <v-card-text>
                <h3 class="text-lg mb-2 text-gray-200"><v-icon>mdi-information-variant</v-icon> Customer Information
                </h3>
                <v-row dense class="mt-2">
                    <v-col cols="12" sm="6">
                        <p class="ma-1 text-gray-400"><v-icon class="mr-2 text-white">mdi-account</v-icon><strong
                                class="text-white">Name:</strong> {{
                                    customerInfo.fullName }}</p>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <p class="ma-1 text-gray-400 text-break"><v-icon class="mr-2 text-white">mdi-email</v-icon><strong
                                class="text-white">Email:</strong> {{
                                    customerInfo.email }}</p>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <p class="ma-1 text-gray-400"><v-icon class="mr-2 text-white">mdi-credit-card</v-icon><strong
                                class="text-white">Payment Method:</strong> {{
                                    customerInfo.paymentMethod }}</p>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <p class="ma-1 text-gray-400"><v-icon class="mr-2 text-white">mdi-cellphone</v-icon><strong
                                class="text-white">Contact No:</strong> {{
                                    customerInfo.contactNo }}</p>
                    </v-col>
                    <v-col cols="12">
                        <p class="ma-1 text-gray-400"><v-icon class="mr-2 text-white">mdi-map-marker</v-icon><strong
                                class="text-white">Address:</strong> {{
                                    customerInfo.address }}</p>
                    </v-col>
                </v-row>

                <br>
                <h3><v-icon>mdi-motorbike</v-icon> Products</h3>
                <v-row>
                    <v-col v-for="item in selectedCartItems" :key="item._id" cols="12" sm="6" md="4">
                        <v-card class="bg-gray-800 pa-3 text-white">
                            <v-img :src="item.Image" class="w-100 h-32 mb-2" contain></v-img>
                            <div class="text-h6 font-weight-bold">{{ item.MotorcycleName }}</div>
                            <div class="text-body-2 mb-2">x{{ item.quantity }}</div>
                            <div class="text-subtitle-1 font-weight-bold">
                                {{ peso(item.Price * item.quantity) }}
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
                <br>
                <h3 class="text-lg font-bold">Total: {{ peso(selectedCartTotal) }}</h3>
            </v-card-text>
            <v-card-actions class="pa-4 flex-wrap">
                <v-spacer />
                <v-btn variant="text" @click="reviewDialog = false">Cancel</v-btn>
                <v-btn color="green" variant="elevated" :loading="placingOrder" @click="insertOrderDetails">Confirm
                    Order</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

</template>


<script>
import api, { errorMessage } from '../../services/api';
import { useMainStore } from '../../stores/mainStore';
import { peso } from '../../utils/format';
import BrandMarquee from '../Dashboard/BrandMarquee.vue';

const readCart = () => {
    try {
        return JSON.parse(localStorage.getItem('cart')) || [];
    } catch {
        return [];
    }
};

export default {
    components: { BrandMarquee },
    setup() {
        return { store: useMainStore() };
    },
    data() {
        return {
            placingOrder: false,
            customerInfo: {
                fullName: '',
                email: '',
                paymentMethod: '',
                contactNo: '',
                address: '',
            },
            selectedCartItems: [],
            customerInfoDialog: false,
            reviewDialog: false,
            sortBy: 'nameAsc',
            // The cart belongs to a logged-in user; guests are asked to log in before adding.
            cart: this.store.isLoggedIn ? readCart() : [],
            cartDialog: false,
            customerInfoDialog: false,
            sortOptions: [
                { label: 'Name (A-Z)', value: 'nameAsc' },
                { label: 'Price (Low to High)', value: 'priceAsc' },
                { label: 'Price (High to Low)', value: 'priceDesc' },
                { label: 'Release Date (Newest)', value: 'releaseDesc' },
                { label: 'Stock (Low to High)', value: 'stockDesc' },
            ],
            headers: [
                { title: 'Image', value: 'Image' },
                { title: 'Brand', value: 'Brand' },
                { title: 'Model', value: 'MotorcycleName' },
                { title: 'Release Date', value: 'ReleaseDate' },
                { title: 'Price', value: 'Price' },
                { title: 'Stock', value: 'Stock' },
                { title: 'Actions', value: 'actions' },
            ],
            motorcycleDetails: [],
            motorBrand: '',
            search: '',
            checkItem: {},
            tabs: [
                { label: 'Inventory', icon: 'mdi-warehouse' },
                { label: 'Orders', icon: 'mdi-clipboard-list' }
            ],
            currentSlide: 0,
            currentTab: 'Inventory',
            eyeDialog: false,
        }
    },
    computed: {
        isLoggedIn() {
            return this.store.isLoggedIn;
        },
        carouselHeight() {
            const { xs, sm } = this.$vuetify.display;
            return xs ? 260 : (sm ? 400 : 600);
        },
        selectedCartTotal() {
            return this.cart
                .filter(item => item.selected)
                .reduce((sum, item) => sum + item.Price * item.quantity, 0);
        },
        filteredTableData() {
            const filtered = this.motorcycleDetails.filter(moto => {
                const text = (this.search || '').toUpperCase();
                const matchesSearch = text
                    ? moto.Brand.toUpperCase().includes(text) ||
                    moto.MotorcycleName.toUpperCase().includes(text)
                    : true;

                const matchesBrand = this.motorBrand ? moto.Brand === this.motorBrand : true;
                return matchesSearch && matchesBrand;
            });

            return [...filtered].sort((a, b) => {
                switch (this.sortBy) {
                    case 'nameAsc':
                        return a.MotorcycleName.localeCompare(b.MotorcycleName);
                    case 'priceAsc':
                        return Number(a.Price) - Number(b.Price);
                    case 'priceDesc':
                        return Number(b.Price) - Number(a.Price);
                    case 'releaseDesc':
                        return new Date(b.ReleaseDate) - new Date(a.ReleaseDate);
                    case 'stockDesc':
                        return Number(a.Stock) - Number(b.Stock);
                    default:
                        return 0;
                }
            });
        },
        brandItems() {
            const brand = this.motorcycleDetails.map(moto => moto.Brand);
            return [...new Set(brand)];
        },
        totalModels() {
            return this.motorcycleDetails.length;
        },
        uniqueBrands() {
            return new Set(this.motorcycleDetails.map(m => m.Brand)).size;
        },
        totalStock() {
            return this.motorcycleDetails.reduce((sum, m) => sum + parseInt(m.Stock || 0), 0);
        },
        totalValue() {
            return this.motorcycleDetails.reduce((sum, m) => sum + parseFloat(m.Price || 0), 0).toLocaleString();
        },
    },
    methods: {
        peso,
        async insertOrderDetails() {
            if (this.placingOrder) return;
            this.placingOrder = true;
            try {
                // The server prices the order from its own data; only ids and quantities are sent.
                await api.post('/orders', {
                    items: this.selectedCartItems.map(({ _id, quantity }) => ({ _id, quantity })),
                    customerInfo: this.customerInfo,
                });

                alert('Order placed successfully!');
                this.cart = this.cart.filter(item => !item.selected);
                this.selectedCartItems = [];
                this.customerInfo = {};
                this.getMotorcycles();
                this.reviewDialog = false;
                this.cartDialog = false;
            } catch (error) {
                console.error('Order error:', error);
                alert(errorMessage(error, 'Failed to place order. Please try again.'));
                this.getMotorcycles();
            } finally {
                this.placingOrder = false;
            }
        },

        prepareSelectedCartItems() {
            this.selectedCartItems = this.cart.filter(item => item.selected);
        },
        submitCustomerInfo() {
            if (this.customerInfo.fullName && this.customerInfo.email && this.customerInfo.paymentMethod && this.customerInfo.contactNo) {
                this.prepareSelectedCartItems();
                this.customerInfoDialog = false;
                this.reviewDialog = true;
            } else {
                alert('Please fill in all required customer details.');
            }
        },
        incrementQuantity(item) {
            if (item.quantity < item.Stock) {
                item.quantity++;
            }
        },
        decrementQuantity(item) {
            if (item.quantity > 1) {
                item.quantity--;
            }
        },
        removeFromCart(itemId) {
            this.cart = this.cart.filter(item => item._id !== itemId);
            alert('Item removed from cart.');
        },
        // Guests get the login pop-up first; the bike is added once they are logged in.
        addToCart(motorcycle) {
            this.store.requireLogin(() => {
                if (!this.cart.length) this.cart = readCart();
                const cartItem = this.cart.find(item => item._id === motorcycle._id);
                if (cartItem) {
                    if (cartItem.quantity < motorcycle.Stock) cartItem.quantity++;
                } else {
                    this.cart.push({ ...motorcycle, quantity: 1, selected: true });
                }
                alert(`${motorcycle.MotorcycleName} added to cart!`);
            });
        },
        openCart() {
            this.store.requireLogin(() => {
                this.cartDialog = true;
            });
        },
        selectTab(tab) {
            this.currentTab = tab;
        },
        openCheckOut() {
            this.store.requireLogin(() => this.showCustomerInfo());
        },
        showCustomerInfo() {
            const { user } = this.store;
            this.customerInfo = {
                fullName: user?.name || '',
                email: user?.email || '',
                paymentMethod: '',
                contactNo: '',
                address: '',
            };
            this.customerInfoDialog = true
            this.cartDialog = false
        },
        openEyeDialog(item) {
            this.checkItem = { ...item }
            this.eyeDialog = true
        },
        closeEyeDialog() {
            this.eyeDialog = false
        },
        getMotorcycles() {
            api.get('/motorcycles').then(response => {
                this.motorcycleDetails = response.data;
            })
        },
        clearFilter() {
            this.motorBrand = ''
            this.search = ''
        },
        handleKeydown(event) {
            if (event.key === 'ArrowLeft') {
                this.selectTab(this.tabs[this.tabs.indexOf(this.currentTab) - 1]);
            } else if (event.key === 'ArrowRight') {
                this.selectTab(this.tabs[this.tabs.indexOf(this.currentTab) + 1]);
            }
        }
    },
    watch: {
        cart: {
            handler(newCart) {
                if (!this.isLoggedIn) return;
                try {
                    localStorage.setItem('cart', JSON.stringify(newCart));
                } catch {
                    // storage unavailable; the cart still works for this visit
                }
            },
            deep: true
        },
        isLoggedIn(loggedIn) {
            // Logging out (store.logout clears storage) must also empty the cart on screen.
            if (!loggedIn) {
                this.cart = [];
                this.cartDialog = false;
                this.customerInfoDialog = false;
                this.reviewDialog = false;
            }
        }
    },
    mounted() {
        this.getMotorcycles()
    }

}
</script>

<style scope>
.cart-fab {
    position: fixed !important;
    right: 24px;
    bottom: 24px;
    z-index: 1005;
}

@media (max-width: 599px) {
    .cart-fab {
        right: 16px;
        bottom: 16px;
    }
}

.tabs {
    color: rgb(205, 198, 198);
    font-size: 16px;
}

.tabs button {
    padding: 5px;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 400;
}

.tabs button.active {
    border-bottom: 2px solid rgb(198, 31, 31);
    color: white;
}

.out-of-stock-label {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%) rotate(-5deg);
    width: 100%;
    background-color: rgba(255, 60, 0, 0.9);
    color: white;
    font-weight: 900;
    padding: 15px 25px;
    border-radius: 5px;
    font-size: 3rem;
    z-index: 50;
    /* pointer-events: none; */
    user-select: none;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    text-transform: uppercase;
    letter-spacing: 2px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    border: 2px solid #ff7700;
}

.out-of-stock-label-card {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%) rotate(-5deg);
    width: 100%;
    background-color: rgba(255, 60, 0, 0.9);
    color: white;
    font-weight: 900;
    padding: 15px 25px;
    border-radius: 5px;
    font-size: 2rem;
    z-index: 50;
    /* pointer-events: none; */
    user-select: none;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    text-transform: uppercase;
    letter-spacing: 2px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    border: 2px solid #ff7700;
}

.lazy-fade-slide-enter-active {
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.lazy-fade-slide-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.lazy-fade-slide-enter-from,
.lazy-fade-slide-leave-to {
    opacity: 0;
    transform: translateY(30px) scale(0.96);
}

.lazy-fade-slide-enter-to,
.lazy-fade-slide-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}
</style>