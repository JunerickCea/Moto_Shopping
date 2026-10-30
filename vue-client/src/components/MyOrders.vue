<template>
    <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">
        <v-card-title class="flex items-center border-b bg-black text-white">
            <v-icon>mdi-clipboard-list</v-icon>
            <h1 class="ml-2">My Orders</h1>
            <v-chip class="ml-3">{{ orders.length }}</v-chip>
        </v-card-title>

        <v-container>
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />
            <v-progress-linear v-if="loading" indeterminate class="mb-4" />

            <div v-else-if="!orders.length && !error" class="text-center py-10">
                <v-icon size="64" class="mb-2">mdi-cart-off</v-icon>
                <p class="mb-4">You haven't placed any orders yet.</p>
                <v-btn color="primary" to="/usermotorcycle">Browse motorcycles</v-btn>
            </div>

            <v-card v-for="order in orders" :key="order._id" class="bg-gray-700 text-white mb-4 pa-4">
                <div class="d-flex flex-wrap align-center ga-2 mb-3">
                    <div>
                        <div class="font-weight-bold">Order #{{ order._id }}</div>
                        <div class="text-caption">{{ formatDate(order.orderDate) }}</div>
                    </div>
                    <v-spacer />
                    <v-chip :color="statusColor(order.status)" class="text-white">{{ order.status }}</v-chip>
                </div>

                <div v-for="item in order.items" :key="item._id" class="d-flex align-center mb-2">
                    <v-avatar size="50" class="mr-3" rounded="lg">
                        <v-img :src="item.Image" />
                    </v-avatar>
                    <div>
                        <div>{{ item.quantity }}x {{ item.Brand }} {{ item.MotorcycleName }}</div>
                        <div class="text-caption">${{ money(item.Price) }} each</div>
                    </div>
                    <v-spacer />
                    <div class="font-weight-bold">${{ money(item.Price * item.quantity) }}</div>
                </div>

                <v-divider class="my-3" />
                <div class="d-flex flex-wrap align-center ga-2">
                    <div class="text-caption">
                        {{ order.customerInfo.paymentMethod }} · {{ order.customerInfo.address || 'No address given' }}
                    </div>
                    <v-spacer />
                    <div class="text-h6">Total: ${{ money(order.total) }}</div>
                </div>
            </v-card>
        </v-container>
    </v-card>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api, { errorMessage } from '../services/api';

const orders = ref([]);
const loading = ref(true);
const error = ref('');

const money = (value) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value);
const formatDate = (value) => new Date(value).toLocaleString();
const statusColor = (status) => ({ Pending: 'orange', Shipped: 'green', Cancelled: 'red' }[status] || 'grey');

onMounted(async () => {
    try {
        orders.value = (await api.get('/orders/mine')).data;
    } catch (err) {
        error.value = errorMessage(err);
    } finally {
        loading.value = false;
    }
});
</script>
