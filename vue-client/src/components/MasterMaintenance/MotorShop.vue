<template>
    <v-card class="w-full h-full ">
        <v-card-title class="flex flex-wrap items-center gap-y-2 border-b bg-black text-white">
            <v-icon class="mr-2">mdi-motorbike</v-icon>
            <h1 class="text-lg sm:text-xl">Motorcycle Shop Admin</h1>
            <v-spacer />

            <nav class="tabs flex flex-wrap gap-x-3" role="tablist" @keydown="handleKeydown">
                <button v-for="tab in tabs" :key="tab.label" role="tab" :aria-selected="currentTab === tab.label"
                    :tabindex="currentTab === tab.label ? 0 : -1" :class="{ active: currentTab === tab.label }"
                    @click="selectTab(tab.label)">
                    <v-icon left small>{{ tab.icon }}</v-icon> {{ tab.label }}
                </button>
            </nav>

        </v-card-title>
        <div v-if="currentTab === 'Inventory'" class="bg-gray-700">
            <br>
            <h1 class="text-sm sm:text-base ml-4 text-white">Manage your motorcycle inventory with ease</h1>
            <v-container class="px-2 px-sm-4">
                <v-card class="bg-gray-600">
                    <div class="flex flex-wrap items-center gap-2 pa-3 pa-sm-5 text-lg sm:text-2xl">
                        <v-chip class="bg-green-200"> <v-icon>mdi-package-variant-closed</v-icon>Total Stock:
                            {{ motorcycleDetails.length }}</v-chip>
                        <v-spacer />
                        <v-btn color="primary" @click="openAddDialog()"><v-icon>mdi-plus</v-icon>Add more
                            motorcycle</v-btn>
                    </div>
                </v-card>
                <br>
                <v-toolbar class="bg-gray-600 text-white text-lg font-seibold"><v-icon
                        class="ml-3 text-yellow-500">mdi-star</v-icon>Featured Motorcycles</v-toolbar>
                <v-carousel v-model="activeSlide" :height="carouselHeight" interval="10000"
                    :show-arrows="$vuetify.display.xs ? false : 'hover'"
                    transition="fade-transition" reverse-transition="fade-transition" hide-delimiters-on-hover
                    class="bg-gradient-to-t from-slate-800 via-slate-900 to-black" cycle>
                    <v-carousel-item v-for="motorcycle in motorcycleDetails" :key="motorcycle._id">
                        <v-img :src="motorcycle.Image" alt="Motorcycle"
                            class="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform"></v-img>
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
                                <v-btn @click="openEyeDialog(motorcycle)" color="primary">View Details</v-btn>
                                <v-btn @click="updateMotorcycleDialog(motorcycle)" color="secondary">Edit</v-btn>
                            </div>
                        </div>
                    </v-carousel-item>
                </v-carousel>


                <br>
                <div class="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                    <v-card class="p-5 sm:p-6 md:p-10 mt-5 bg-gray-600 w-full sm:w-1/2 md:w-1/4 lg:w-1/4  ">
                        <div class="flex gap-2 items-center">
                            <v-icon
                                class="text-2xl sm:text-3xl border-2 border-blue-600 rounded-full p-4 sm:p-6 text-white"
                                style="background-color:#1E88E5">mdi-motorbike</v-icon>
                            <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 ml-2 text-white">{{ totalModels
                                }}</h1>
                        </div>
                        <h1 class="text-sm sm:text-base text-white">Total Models</h1>
                    </v-card>

                    <v-card class="p-4 sm:p-6 md:p-10 mt-5 bg-gray-600 w-full sm:w-1/2 md:w-1/4 lg:w-1/5 ">
                        <div class="flex gap-2 items-center">
                            <v-icon
                                class="text-2xl sm:text-3xl border-2 border-green-600 rounded-full p-4 sm:p-6 text-white"
                                style="background-color:#43A047">mdi-tag</v-icon>
                            <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 ml-2 text-white">{{ uniqueBrands
                                }}</h1>
                        </div>
                        <h1 class="text-sm sm:text-base text-white">Brands</h1>
                    </v-card>

                    <v-card class="p-4 sm:p-6 md:p-10 mt-5 bg-gray-600 w-full sm:w-1/2 md:w-1/4 lg:w-1/4 text-white">
                        <div class="flex gap-2 items-center">
                            <v-icon
                                class="text-2xl sm:text-3xl border-2 border-orange-600 rounded-full p-4 sm:p-6 text-white"
                                style="background-color:#EF6C00">mdi-package-variant-closed</v-icon>
                            <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 ml-2 text-white">{{ totalStock }}
                            </h1>
                        </div>
                        <h1 class="text-sm sm:text-base">Total Stocks</h1>
                    </v-card>

                    <v-card class="p-4 sm:p-6 md:p-10 mt-5 bg-gray-600 w-full sm:w-1/2 md:w-1/4 lg:w-1/4">
                        <div class="flex gap-2 items-center">
                            <v-icon
                                class="text-2xl sm:text-3xl border-2 border-red-600 rounded-full p-4 sm:p-6 text-white"
                                style="background-color:#C62828">mdi-currency-php</v-icon>
                            <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 ml-2 text-white">{{ totalValue }}
                            </h1>
                        </div>
                        <h1 class="text-sm sm:text-base text-white">Total Value</h1>
                    </v-card>
                </div>
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

                <div class="flex flex-wrap items-center gap-2 px-4 py-3" style="background-color: #000000;">
                    <span class="font-semibold text-lg text-gray-200"><v-icon>mdi-warehouse</v-icon>
                        Inventory
                        <v-chip>{{ motorcycleDetails.length }}</v-chip></span>
                    <v-spacer />
                    <nav class="tabs2" role="tablist">
                        <button v-for="tab2 in tabs2" :key="tab2.label" role="tab"
                            :aria-selected="currentTab2 === tab2.label" :tabindex="currentTab2 === tab2.label ? 0 : -1"
                            :class="{ active: currentTab2 === tab2.label }" @click="selectTab2(tab2.label)">
                            <v-icon left small>{{ tab2.icon }}</v-icon> {{ tab2.label }}
                        </button>
                    </nav>
                </div>
                <div v-if="currentTab2 === 'View-Table'">
                    <v-data-table :headers="headers" :items="filteredTableData" :search="search"
                        :mobile="$vuetify.display.xs" class="bg-gray-600 text-white">

                        <template v-slot:item.Image="{ item }">
                            <v-avatar size="70" class="hover:scale-110">
                                <v-img :src="item.Image" alt="Motorcycle"></v-img>
                            </v-avatar>
                        </template>
                        <template v-slot:item.Price="{ item }">
                            <h1 class="text-lg font-semibold">{{ peso(item.Price) }}</h1>
                        </template>
                        <template v-slot:item.Stock="{ item }">
                            <v-chip class="text-sm sm:text-base text-black"
                                :color="item.Stock <= 10 ? 'red' : (item.Stock <= 20 ? 'orange' : 'green')">
                                <v-icon
                                    :color="item.Stock <= 10 ? 'red' : (item.Stock <= 20 ? 'orange' : 'green')">mdi-package-variant</v-icon>
                                {{ item.Stock }}
                            </v-chip>
                        </template>
                        <template v-slot:item.actions="{ item }">
                            <div class="">
                                <v-icon class="text-lg sm:text-xl text-green-600" @click="openEyeDialog(item)">
                                    mdi-eye
                                </v-icon>
                                <v-icon color="error" class="text-lg sm:text-xl" @click="deleteMotorcycle(item)">
                                    mdi-trash-can
                                </v-icon>
                                <v-icon class="text-lg sm:text-xl" color="primary"
                                    @click="updateMotorcycleDialog(item)">
                                    mdi-pencil
                                </v-icon>
                            </div>
                        </template>

                    </v-data-table>
                </div>
                <div v-if="currentTab2 === 'View-Grid'">
                    <v-row class="mt-1" dense>
                        <v-col v-for="motorcycle in filteredTableData" :key="motorcycle._id" cols="12" sm="6" md="4"
                            lg="3">
                            <v-card class="bg-gray-700 text-white h-full d-flex flex-column elevation-4">
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

                                <v-card-actions class="d-flex flex-wrap justify-space-between">
                                    <v-btn variant="text" prepend-icon="mdi-eye" color="success"
                                        @click="openEyeDialog(motorcycle)">
                                        view
                                    </v-btn>
                                    <v-btn :disabled="motorcycle.Stock <= 0" color="primary" prepend-icon="mdi-pencil"
                                        @click="updateMotorcycleDialog(motorcycle)">Edit
                                    </v-btn>
                                    <v-btn prepend-icon="mdi-trash-can-outline" color="error"
                                        @click="deleteMotorcycle(motorcycle)">delete
                                    </v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>

            </v-container>
        </div>





        <!-- Orders -->
        <div v-if="currentTab === 'Orders'" class="bg-gray-700">
            <v-container class="bg px-2 px-sm-4">

                <div class="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                    <v-card class="p-5 sm:p-6 md:p-10 mt-5 bg-gray-600 w-full sm:w-1/2 md:w-1/4 lg:w-1/4  ">
                        <div class="flex gap-2 items-center">
                            <v-icon
                                class="text-2xl sm:text-3xl border-2 border-blue-600 rounded-full p-4 sm:p-6 text-white"
                                style="background-color:#1E88E5">mdi-list-box</v-icon>
                            <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 ml-2 text-white">{{
                                orderedMotorcycles.length
                                }}</h1>
                        </div>
                        <h1 class="text-sm sm:text-base text-white">Total Orders</h1>
                    </v-card>

                    <v-card class="p-4 sm:p-6 md:p-10 mt-5 bg-gray-600 w-full sm:w-1/2 md:w-1/4 lg:w-1/5 ">
                        <div class="flex gap-2 items-center">
                            <v-icon
                                class="text-2xl sm:text-3xl border-2 border-orange-600 rounded-full p-4 sm:p-6 text-white"
                                style="background-color:#EF6C00">mdi-clock</v-icon>
                            <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 ml-2 text-white">{{ pendingCount
                                }}</h1>
                        </div>
                        <h1 class="text-sm sm:text-base text-white">Pending</h1>
                    </v-card>

                    <v-card class="p-4 sm:p-6 md:p-10 mt-5 bg-gray-600 w-full sm:w-1/2 md:w-1/4 lg:w-1/4 text-white">
                        <div class="flex gap-2 items-center">
                            <v-icon
                                class="text-2xl sm:text-3xl border-2 border-green-600 rounded-full p-4 sm:p-6 text-white"
                                style="background-color:#43A047">mdi-truck-check</v-icon>
                            <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 ml-2 text-white">{{ shippedCount }}
                            </h1>
                        </div>
                        <h1 class="text-sm sm:text-base">Shipped</h1>
                    </v-card>

                    <v-card class="p-4 sm:p-6 md:p-10 mt-5 bg-gray-600 w-full sm:w-1/2 md:w-1/4 lg:w-1/4">
                        <div class="flex gap-2 items-center">
                            <v-icon
                                class="text-2xl sm:text-3xl border-2 border-red-600 rounded-full p-4 sm:p-6 text-white"
                                style="background-color:#C62828">mdi-cancel</v-icon>
                            <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 ml-2 text-white">{{ cancelledCount }}
                            </h1>
                        </div>
                        <h1 class="text-sm sm:text-base text-white">Cancelled</h1>
                    </v-card>
                </div>
                <br>

                <v-card class="pa-5 bg-gray-600 text-white">
                    <div class="flex flex-col sm:flex-row gap-2">
                        <v-select class="w-full" density="compact" :items="statusItems" label="Filter by Status"
                            variant="outlined" prepend-inner-icon="mdi-filter-variant" v-model="status" />
                        <v-select class="w-full" density="compact" :items="sortOptions" item-title="label"
                            item-value="value" label="Sort by" variant="outlined" prepend-inner-icon="mdi-sort"
                            v-model="sortBy" />
                        <v-text-field v-model="search" class="w-full" density="compact" label="Search Motorcycle..."
                            prepend-inner-icon="mdi-magnify" variant="outlined" />
                        <v-btn prepend-icon="mdi-filter-remove-outline" color="warning" @click="clearFilterOrder()"
                            class="w-full sm:w-auto">Clear Filter</v-btn>
                    </div>
                </v-card>
                <br>
                <div class="px-4 py-3" style="background-color: #000000;">
                    <span class="font-semibold text-lg text-gray-200"><v-icon>mdi-list-box</v-icon>
                        Orders
                        <v-chip>{{ orderedMotorcycles.length }}</v-chip></span>
                </div>
                <v-data-table :headers="orderedHeaders" :items="filteredOrderedData" :search="search"
                    :mobile="$vuetify.display.xs" class="bg-gray-600 text-white">

                    <template v-slot:item.Image="{ item }">
                        <v-avatar size="70" class="hover:scale-110">
                            <v-img :src="item.Image" alt="Motorcycle"></v-img>
                        </v-avatar>
                    </template>
                    <template v-slot:item.orderDate="{ item }">
                        {{ formatDate(item.orderDate) }}
                    </template>
                    <template v-slot:item.total="{ item }">
                        <h1 class="text-lg font-semibold">{{ peso(item.total) }}</h1>
                    </template>
                    <template v-slot:item.status="{ item }">
                        <v-chip class="text-sm sm:text-base text-white" :color="getStatusColor(item.status)">
                            {{ item.status }}
                        </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <div class="">
                            <v-icon class="text-lg sm:text-xl text-green-600" @click="openReviewDialog(item)">
                                mdi-eye
                            </v-icon>
                        </div>
                    </template>

                </v-data-table>
            </v-container>
        </div>

        <div v-if="currentTab === 'Feedback'" class="bg-gray-700">
            <FeedbackAdmin />
        </div>

        <div v-if="currentTab === 'Shop Info'" class="bg-gray-700">
            <ShopInfoAdmin />
        </div>
    </v-card>

    <!-- Add motorcycle dialog -->
    <v-dialog v-model="addDialog" max-width="700px" persistent scrollable :fullscreen="$vuetify.display.xs">
        <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">
            <v-card-title class="flex items-center gap-2">
                <v-icon class="text-md  border-2 border-blue-800 rounded-full p-4  text-white"
                    style="background-color: blue">mdi-plus</v-icon>
                <h1 class="text-lg sm:text-xl" style="font-family: 'Slunt', sans-serif;">{{ this.title }}</h1>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" color="red" aria-label="Close" @click="closeAddDialog()" />
            </v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-text-field label="Brand" density="compact" variant="outlined"
                            prepend-inner-icon="mdi-tag-plus" v-model="newMotorcycle.Brand"
                            :rules="[rules.required]" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field label="Motorcycle Name" density="compact" variant="outlined"
                            prepend-inner-icon="mdi-motorbike" v-model="newMotorcycle.MotorcycleName"
                            :rules="[rules.required]" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field type="date" label="Release Date" density="compact" variant="outlined"
                            prepend-inner-icon="mdi-calendar" v-model="newMotorcycle.ReleaseDate"
                            :rules="[rules.required]" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field type="number" label="Price (₱)" density="compact" variant="outlined"
                            prepend-inner-icon="mdi-currency-php" v-model="newMotorcycle.Price"
                            :rules="[rules.required, rules.positiveNumber]" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field type="number" label="Stock Quantity" density="compact" variant="outlined"
                            prepend-inner-icon="mdi-package-variant" v-model="newMotorcycle.Stock"
                            :rules="[rules.required, rules.integer]" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field type="number" label="Available Quantity" density="compact" variant="outlined"
                            prepend-inner-icon="mdi-counter" v-model="newMotorcycle.Quantity"
                            :rules="[rules.required, rules.integer]" />
                    </v-col>
                    <v-col cols="12">
                        <v-text-field label="Image Link" density="compact" variant="outlined"
                            prepend-inner-icon="mdi-image" v-model="newMotorcycle.Image" :rules="[rules.required]" />
                        <div v-if="newMotorcycle.Image" class="text-center">
                            <v-img max-height="200" :src="newMotorcycle.Image" alt="Motorcycle"></v-img>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn color="primary" variant="elevated" @click="inserMotorcycle">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="eyeDialog" max-width="700px" persistent scrollable :fullscreen="$vuetify.display.xs">
        <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">
            <v-card-title class="flex items-center gap-2">
                <v-icon class="text-2xl  border-2 border-green-600 rounded-full p-4  text-black"
                    style="background-color:#43A047">mdi-information-variant</v-icon>
                <h1 class="text-lg sm:text-xl">Motorcycle Details</h1>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" color="red" aria-label="Close" @click="closeAddDialog()" />
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <v-img :src="checkItem?.Image" max-height="400" contain />
                    </v-col>
                    <v-col cols="12" sm="8" class="pa-4">
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
        </v-card>
    </v-dialog>

    <v-dialog v-model="reviewDialog" max-width="900px" scrollable :fullscreen="$vuetify.display.xs">
        <v-card class="bg-gray-900 text-white">
            <v-card-title class="text-h6 text-sm-h5 font-weight-bold">
                <v-icon color="blue" class="mr-3">mdi-file-document</v-icon>
                Order Details
            </v-card-title>
            <v-card-text>
                <v-row class="mt-4">
                    <v-col cols="12" md="6">
                        <v-row class="mb-3" align="center">
                            <v-col cols="2" class="text-center">
                                <v-icon large color="blue">mdi-clipboard-text</v-icon>
                            </v-col>
                            <v-col cols="10">
                                <div class="font-weight-bold">Order ID</div>
                                <div class="text-caption">{{ reviewDialogDetails._id }}</div>
                            </v-col>
                        </v-row>

                        <v-row class="mb-3" align="center">
                            <v-col cols="2" class="text-center">
                                <v-icon large color="blue">mdi-calendar</v-icon>
                            </v-col>
                            <v-col cols="10">
                                <div class="font-weight-bold">Order Date</div>
                                <div class="text-caption">{{ formatDate(reviewDialogDetails.orderDate) }}</div>
                            </v-col>
                        </v-row>

                        <v-row align="center">
                            <v-col cols="2" class="text-center">
                                <v-icon large color="blue">mdi-flag</v-icon>
                            </v-col>
                            <v-col cols="10">
                                <div class="font-weight-bold">Status</div>
                                <v-chip :color="getStatusColor(reviewDialogDetails.status)" text-color="white" small>
                                    {{ reviewDialogDetails.status }}
                                </v-chip>
                            </v-col>
                        </v-row>
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-row class="mb-3" align="center">
                            <v-col cols="2" class="text-center">
                                <v-icon large color="blue">mdi-account</v-icon>
                            </v-col>
                            <v-col cols="10">
                                <div class="font-weight-bold">Customer Name</div>
                                <div class="text-caption">{{ reviewDialogDetails.customerInfo.fullName }}</div>
                            </v-col>
                        </v-row>

                        <v-row class="mb-3" align="center">
                            <v-col cols="2" class="text-center">
                                <v-icon large color="blue">mdi-email</v-icon>
                            </v-col>
                            <v-col cols="10">
                                <div class="font-weight-bold">Email</div>
                                <div class="text-caption">{{ reviewDialogDetails.customerInfo.email }}</div>
                            </v-col>
                        </v-row>

                        <v-row class="mb-3" align="center">
                            <v-col cols="2" class="text-center">
                                <v-icon large color="blue">mdi-phone</v-icon>
                            </v-col>
                            <v-col cols="10">
                                <div class="font-weight-bold">Phone</div>
                                <div class="text-caption">{{ reviewDialogDetails.customerInfo.contactNo }}</div>
                            </v-col>
                        </v-row>

                        <v-row align="center">
                            <v-col cols="2" class="text-center">
                                <v-icon large color="blue">mdi-map-marker</v-icon>
                            </v-col>
                            <v-col cols="10">
                                <div class="font-weight-bold">Address</div>
                                <div class="text-caption">{{ reviewDialogDetails.customerInfo.address }}</div>
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>

                <v-divider class="my-6"></v-divider>

                <!-- Order items -->
                <div class="text-h6 font-weight-bold mb-4">Order Items</div>
                <div v-for="item in reviewDialogDetails.items" :key="item._id"
                    class="d-flex align-center ga-3 mb-3">
                    <v-avatar size="50">
                        <v-img :src="item.Image" contain></v-img>
                    </v-avatar>
                    <div>
                        <div class="font-weight-bold">
                            {{ item.quantity }}x {{ item.MotorcycleName }}
                        </div>
                        <div class="text-caption grey--text">
                            {{ item.Brand }}
                        </div>
                    </div>
                    <v-spacer />
                    <div class="font-weight-bold text-no-wrap">
                        {{ peso(Number(item.Price) * item.quantity) }}
                    </div>
                </div>


                <v-divider class="my-6"></v-divider>

                <!-- Total -->
                <div class="d-flex flex-wrap justify-space-between align-center">
                    <div class="text-h6 font-weight-bold">Total:</div>
                    <div class="text-h5 text-sm-h4 font-weight-bold">
                        {{ peso(reviewDialogDetails.total) }}
                    </div>
                </div>
            </v-card-text>

            <v-card-actions class="justify-end flex-wrap ga-2 pa-4">
                <v-btn color="green" dark class="mr-2" @click="approveOrder">
                    APPROVE ORDER
                </v-btn>
                <v-btn color="red" dark class="mr-2" @click="cancelOrder">
                    CANCEL ORDER
                </v-btn>
                <v-btn color="blue" dark @click="reviewDialog = false">
                    CLOSE
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    

</template>


<script>

import api, { errorMessage } from '../../services/api';
import { peso } from '../../utils/format';
import FeedbackAdmin from './FeedbackAdmin.vue';
import ShopInfoAdmin from './ShopInfoAdmin.vue';

export default {
    components: { FeedbackAdmin, ShopInfoAdmin },
    data() {
        return {
            sortBy: 'nameAsc',
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
            orderedHeaders: [
                { title: 'Oder ID', value: '_id' },
                { title: 'Order Date', value: 'orderDate' },
                { title: 'Customer', value: 'customerInfo.fullName' },
                { title: 'Total Amount', value: 'total' },
                { title: 'Status', value: 'status' },
                { title: 'Actions', value: 'actions' },
            ],
            orderedMotorcycles: [],
            motorcycleDetails: [],
            motorBrand: '',
            status: '',
            newMotorcycle: {
                title: '',
                Brand: '',
                MotorcycleName: '',
                ReleaseDate: '',
                Price: 0,
                Stock: 0,
                Quantity: 0,
                Image: '',
            },
            search: '',
            reviewDialogDetails: {},
            checkItem: {},
            tabs: [
                { label: 'Inventory', icon: 'mdi-warehouse' },
                { label: 'Orders', icon: 'mdi-clipboard-list' },
                { label: 'Feedback', icon: 'mdi-message-star' },
                { label: 'Shop Info', icon: 'mdi-store-marker' }
            ],
            tabs2: [
                { label: 'View-Table', icon: 'mdi-table' },
                { label: 'View-Grid', icon: 'mdi-view-grid' }
            ],
            activeSlide: 0,
            currentTab: 'Inventory',
            currentTab2: 'View-Table',
            addDialog: false,
            eyeDialog: false,
            deleteDialog: false,
            isEditing: false,
            reviewDialog: false,
            rules: {
                required: (v) => !!v || "Field is required",
                positiveNumber: (v) => (v > 0) || "Must be a positive number",
                integer: (v) => Number.isInteger(Number(v)) || "Must be an integer",
            },
        }
    },
    computed: {
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
        filteredOrderedData() {
            return this.orderedMotorcycles.filter(ord => {
                const text = (this.search || '').toUpperCase();
                const matchesSearch = text
                    ? (ord.customerInfo?.fullName?.toUpperCase().includes(text) ||
                        ord._id?.toUpperCase().includes(text))
                    : true;

                const matchesStatus = this.status ? ord.status === this.status : true;
                return matchesSearch && matchesStatus;
            }).sort((a, b) => {
                switch (this.sortBy) {
                    case 'nameAsc':
                        return a.customerInfo?.fullName?.localeCompare(b.customerInfo?.fullName || '') || 0;
                    case 'priceAsc':
                        return Number(a.total || 0) - Number(b.total || 0);
                    case 'priceDesc':
                        return Number(b.total || 0) - Number(a.total || 0);
                    default:
                        return 0;
                }
            });
        },
        brandItems() {
            const brand = this.motorcycleDetails.map(moto => moto.Brand);
            return [...new Set(brand)];
        },
        statusItems() {
            const status = this.orderedMotorcycles.map(ord => ord.status);
            return [...new Set(status)];
        },
        totalModels() {
            return this.motorcycleDetails.length;
        },
        uniqueBrands() {
            return new Set(this.motorcycleDetails.map(m => m.Brand)).size;
        },
        pendingCount() {
            return this.orderedMotorcycles.filter(ord => ord.status === 'Pending').length;
        },
        shippedCount() {
            return this.orderedMotorcycles.filter(ord => ord.status === 'Shipped').length;
        },
        cancelledCount() {
            return this.orderedMotorcycles.filter(ord => ord.status === 'Cancelled').length;
        },
        totalStock() {
            return this.motorcycleDetails.reduce((sum, m) => sum + parseInt(m.Stock || 0), 0);
        },
        totalValue() {
            return peso(this.motorcycleDetails.reduce((sum, m) => sum + parseFloat(m.Price || 0), 0));
        },
        carouselHeight() {
            const { xs, sm } = this.$vuetify.display;
            return xs ? 260 : (sm ? 400 : 600);
        },
    },
    methods: {
        peso,
        async setOrderStatus(status) {
            try {
                await api.patch(`/orders/${this.reviewDialogDetails._id}/status`, { status })
                this.reviewDialog = false
                // Cancelling puts the stock back, so refresh both lists.
                this.getOrderedDetails()
                this.getMotorcycles()
            } catch (err) {
                alert(errorMessage(err))
                this.getOrderedDetails()
            }
        },
        approveOrder() {
            return this.setOrderStatus('Shipped')
        },
        cancelOrder() {
            return this.setOrderStatus('Cancelled')
        },
        formatDate(value) {
            return value ? new Date(value).toLocaleString() : ''
        },
        getStatusColor(status) {
            switch (status?.toLowerCase()) {
                case 'pending':
                    return 'orange';
                case 'shipped':
                    return 'green';
                case 'cancelled':
                    return 'red';
                default:
                    return 'grey';
            }
        },
        selectTab(tab) {
            this.currentTab = tab;
        },
        selectTab2(tab2) {
            this.currentTab2 = tab2;
        },
        openAddDialog() {
            this.title = 'Add Motorcycle'
            this.addDialog = true
        },
        updateMotorcycleDialog(item) {
            this.title = 'Update Motorcycle Details'
            this.newMotorcycle = { ...item }
            this.addDialog = true
            this.isEditing = true
        },
        openReviewDialog(item) {
            this.reviewDialogDetails = Object.assign({}, item)
            this.reviewDialog = true
            // console.log(this.reviewDialogDetails, 'check')
        },
        openEyeDialog(item) {
            this.checkItem = { ...item }
            this.eyeDialog = true
        },
        deleteDialog(item) {
            this.title = 'Delete Motorcycle'
            this.newMotorcycle = { ...item }
            this.addDialog = true
        },
        closeAddDialog() {
            this.addDialog = false
            this.eyeDialog = false
            this.isEditing = false
            this.newMotorcycle = {}
        },
        getMotorcycles() {
            api.get('/motorcycles').then(response => {
                this.motorcycleDetails = response.data;
            })
        },
        getOrderedDetails() {
            api.get('/orders').then(response => {
                this.orderedMotorcycles = response.data;
            })
        },
        async inserMotorcycle() {
            const wasEditing = this.isEditing;
            const { _id, ...details } = this.newMotorcycle;
            try {
                if (wasEditing) {
                    await api.put(`/motorcycles/${_id}`, details);
                } else {
                    await api.post('/motorcycles', details);
                }
                this.closeAddDialog();
                this.getMotorcycles();
                alert(wasEditing ? 'Motorcycle updated successfully!' : 'Motorcycle saved successfully!');
            } catch (error) {
                console.error('Failed to save motorcycle:', error);
                alert(errorMessage(error, 'Failed to save motorcycle, please try again.'));
            }
        },
        async deleteMotorcycle(item) {
            if (confirm(`Are you sure you want to delete ${item.MotorcycleName}?`)) {
                try {
                    await api.delete(`/motorcycles/${item._id}`);
                    this.getMotorcycles();
                    this.newMotorcycle = {};
                    alert('Motorcycle deleted successfully!');
                } catch (error) {
                    console.error('Failed to delete motorcycle:', error);
                    alert(errorMessage(error, 'Failed to delete motorcycle, please try again.'));
                }
            }
        },
        clearFilter() {
            this.motorBrand = ''
            this.search = ''
        },
        clearFilterOrder() {
            this.status = ''
            this.search = ''
        },
        handleKeydown(event) {
            const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
            if (!step) return;
            const index = this.tabs.findIndex((tab) => tab.label === this.currentTab);
            const next = this.tabs[(index + step + this.tabs.length) % this.tabs.length];
            this.selectTab(next.label);
        }
    },
    mounted() {
        this.getMotorcycles()
        this.getOrderedDetails()
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

.tabs2 {
    color: rgb(205, 198, 198);
    font-size: 16px;
}

.tabs2 button {
    padding: 5px;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 400;
    margin-right: 10px;
}

.tabs2 button.active {
    border-bottom: 2px solid rgb(198, 31, 31);
    color: white;
}

/* .v-data-table th {
    font-size: 16px;
    background-color: #000000;
    color: white
} */

/* .v-data-table td {
    font-size: 14px;
    background-color:gray;
    color: white
} */
</style>