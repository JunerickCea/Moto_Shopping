<template>

    <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">

        <v-card-title class="flex items-center  border-b bg-black text-white"
            style="position: sticky; top: 0px; z-index: 10;">
            <v-icon>mdi-motorbike</v-icon>
            <h1>Motorcycle Shop User</h1>
            <v-spacer />
            <v-badge :content="cart.length" color="red" overlap v-if="cart.length > 0">
                <v-icon icon @click="cartDialog = true" color="primary">mdi-cart</v-icon>
            </v-badge>
            <v-icon v-else color="primary">mdi-cart</v-icon>
        </v-card-title>
        <v-container>
            <br>
            <v-toolbar class="bg-gray-600 text-white text-lg font-seibold"><v-icon
                    class="ml-3 text-yellow-500">mdi-star</v-icon>Featured Motorcycles</v-toolbar>
            <v-carousel v-model="currentSlide" height="600" interval="5000" :show-arrows-on-hover="true"
                transition="fade-transition" reverse-transition="fade-transition" hide-delimiters-on-hover
                class="bg-gradient-to-t from-slate-800 via-slate-900 to-black" cycle>
                <v-carousel-item v-for="motorcycle in motorcycleDetails" :key="motorcycle._id">
                    <v-img :src="motorcycle.Image" alt="Motorcycle"
                        class="w-full h-full object-cover rounded-lg hover:scale-110 transition-transform"></v-img>
                    <div class="absolute inset-0 flex flex-col justify-between text-white px-10 py-8">
                        <div>
                            <h1 class="px-3 py-1 text-xs font-semibold tracking-wide  uppercase">
                                <v-icon class="mr-2 text-yellow-600">mdi-star</v-icon>
                                Featured
                            </h1>
                            <h2 class="mt-4 text-4xl font-bold">
                                {{ motorcycle.Brand }} {{ motorcycle.MotorcycleName }}
                            </h2>
                            <p class="mt-2 text-lg opacity-80">
                                {{ motorcycle.Brand }}
                            </p>
                            <p class="mt-4 text-3xl font-bold">
                                ${{ new Intl.NumberFormat('en-US').format(motorcycle.Price) }}
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
                                        ${{ new Intl.NumberFormat('en-US').format(motorcycle.Price) }}
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

    <v-dialog v-model="eyeDialog" max-width="700px" persistent>
        <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">

            <v-card-title class="flex gap-2">
                <v-icon class="text-2xl  border-2 border-green-600 rounded-full p-4  text-black"
                    style="background-color:#43A047">mdi-information-variant</v-icon>
                <h1>Motorcycle Details</h1>
                <v-spacer />
                <v-icon @click="closeEyeDialog()" color="red">mdi-close</v-icon>
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <v-img :src="checkItem?.Image" max-height="400" contain />
                    </v-col>
                    <v-col cols="8" class="pa-4">
                        <p class="pa-2"><v-icon
                                class="text-green-300 mr-2">mdi-tag-outline</v-icon><strong>Brand:</strong>
                            {{ checkItem?.Brand }}</p>
                        <p class="pa-2"><v-icon
                                class="text-green-300 mr-2">mdi-currency-usd</v-icon><strong>Price:</strong>
                            ${{ checkItem?.Price }}</p>
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
        </v-card>
    </v-dialog>

    <!-- Cart Dialog -->
    <v-dialog v-model="cartDialog" max-width="600px">
        <v-card class="bg-gray-800">
            <v-card-title class="flex mt-2 text-white ">
                <h1>Your Cart</h1>
                <v-spacer />
                <v-icon color="red" @click="cartDialog = false">mdi-close</v-icon>
            </v-card-title>
            <v-card-text>
                <v-list-item v-for="item in cart" :key="item._id"
                    class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">
                    <v-list-item-content>
                        <v-checkbox v-model="item.selected" :label="item.MotorcycleName" color="primary" />
                        <v-list-item-title><v-img :src="item.Image"></v-img></v-list-item-title>
                        <v-list-item-title class="text-4xl">{{ item.MotorcycleName }}</v-list-item-title>
                        <v-list-item-subtitle class="pa-4">
                            Quantity:
                            <v-icon class="text-4xl" color="orange" @click="decrementQuantity(item)"
                                :disabled="item.quantity <= 1">mdi-minus</v-icon>
                            {{ item.quantity }}
                            <v-icon class="text-4xl" color="success" @click="incrementQuantity(item)"
                                :disabled="item.quantity >= item.Stock">mdi-plus</v-icon>
                        </v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action class="flex gap-2">
                        <v-chip color="success" text-color="white">
                            ${{ new Intl.NumberFormat('en-US').format(item.Price * item.quantity) }}
                        </v-chip>
                        <v-btn @click="removeFromCart(item._id)" class="bg-red-600">Remove Cart</v-btn>

                    </v-list-item-action>
                </v-list-item>
                <v-row>
                    <v-col cols="" />
                    <v-col cols="5">
                        <v-btn @click="openCheckOut" class="bg-green-600">Proceed to Check-out</v-btn>
                    </v-col>
                </v-row>
                <v-divider v-if="cart.length === 0" />
                <v-list-item v-if="cart.length === 0">
                    <v-list-item-content><em>Your cart is empty</em></v-list-item-content>
                </v-list-item>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="customerInfoDialog" max-width="700">
        <v-card class="bg-gray-800 text-white">
            <v-card-title class="flex">
                <h1 class="text-xl text-white">Please Insert Customer Details...</h1>

                <v-spacer />
                <v-icon color="red" @click="customerInfoDialog = false">mdi-close</v-icon>
            </v-card-title>
            <p class="pl-4 mt-n2 text-gray-400">for shipment purposes</p>
            <br>
            <v-row class="pl-4 pr-4">
                <v-col cols="6">
                    <v-text-field v-model="customerInfo.fullName" density="compact" label="Customer Full Name"
                        prepend-inner-icon="mdi-account"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field v-model="customerInfo.email" density="compact" label="Email Adress"
                        prepend-inner-icon="mdi-email"></v-text-field>
                </v-col>
            </v-row>
            <v-row class="pl-4 pr-4">
                <v-col cols="6">
                    <v-select v-model="customerInfo.paymentMethod" density="compact" label="Payment Method"
                        prepend-inner-icon="mdi-credit-card-settings-outline"
                        :items="['Cash-on-Delivery', 'Credit Card', 'Debit Card']"></v-select>
                </v-col>
                <v-col cols="6">
                    <v-text-field v-model="customerInfo.contactNo" density="compact" label="Contact No. #"
                        prepend-inner-icon="mdi-cellphone"></v-text-field>
                </v-col>
            </v-row>
            <v-row class="pl-4 pr-4">
                <v-col cols="12">
                    <v-text-field v-model="customerInfo.address" density="compact" label="Address"
                        prepend-inner-icon="mdi-map-marker"></v-text-field>
                </v-col>
            </v-row>
            <v-card-action class="pa-4">
                <v-row>
                    <v-col cols="" />
                    <v-col cols="3">
                        <v-btn @click="submitCustomerInfo" color="primary">Submit details</v-btn>
                    </v-col>

                </v-row>

            </v-card-action>
        </v-card>
    </v-dialog>

    <v-dialog v-model="reviewDialog" max-width="750px">
        <v-card class="bg-gray-800 text-white">
            <v-card-title><v-icon>mdi-shopping</v-icon> Order Review</v-card-title>
            <v-card-text>
                <h3 class="text-lg mb-2 text-gray-200"><v-icon>mdi-information-variant</v-icon> Customer Information
                </h3>
                <v-row class="mt-2">
                    <v-col cols="6">
                        <p class="ma-2 text-gray-400"><v-icon class="mr-2 text-white">mdi-account</v-icon><strong
                                class="text-white">Name:</strong> {{
                                    customerInfo.fullName }}</p>
                    </v-col>
                    <v-col cols="6">
                        <p class="ma-2 text-gray-400"><v-icon class="mr-2 text-white">mdi-email</v-icon><strong
                                class="text-white">Email:</strong> {{
                                    customerInfo.email }}</p>
                    </v-col>
                    <v-col cols="6" class="mt-n6">
                        <p class="ma-2 text-gray-400"><v-icon class="mr-2 text-white">mdi-credit-card</v-icon><strong
                                class="text-white">Payment Method:</strong> {{
                                    customerInfo.paymentMethod }}</p>
                    </v-col>
                    <v-col cols="6" class="mt-n6">
                        <p class="ma-2 text-gray-400"><v-icon class="mr-2 text-white">mdi-cellphone</v-icon><strong
                                class="text-white">Contact No:</strong> {{
                                    customerInfo.contactNo }}</p>
                    </v-col>
                    <v-col cols="6" class="mt-n6">
                        <p class="ma-2 text-gray-400"><v-icon class="mr-2 text-white">mdi-map-marker</v-icon><strong
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
                                ${{ new Intl.NumberFormat('en-US').format(item.Price * item.quantity) }}
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
                <br>
                <h3>Total: ${{ new Intl.NumberFormat('en-US').format(selectedCartTotal) }}</h3>
            </v-card-text>
            <v-card-actions>
                <v-btn color="green" @click="insertOrderDetails">Confirm Order</v-btn>
                <v-btn text @click="reviewDialog = false">Cancel</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

</template>


<script>
import api, { errorMessage } from '../../services/api';
import { useMainStore } from '../../stores/mainStore';

export default {
    data() {
        return {
            
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
            cart: JSON.parse(localStorage.getItem('cart')) || [],
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
        async insertOrderDetails() {
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
        addToCart(motorcycle) {
            const cartItem = this.cart.find(item => item._id === motorcycle._id);
            if (cartItem) {
                cartItem.quantity++;
            } else {
                this.cart.push({ ...motorcycle, quantity: 1, selected: true });
            }
            alert(`${motorcycle.MotorcycleName} added to cart!`);
        },
        selectTab(tab) {
            this.currentTab = tab;
        },
        openCheckOut() {
            const { user } = useMainStore();
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
                localStorage.setItem('cart', JSON.stringify(newCart));
            },
            deep: true
        }
    },
    mounted() {
        this.getMotorcycles()
    }

}
</script>

<style scope>
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