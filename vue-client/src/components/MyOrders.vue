<template>
    <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">
        <v-card-title class="flex items-center border-b bg-black text-white">
            <v-icon>mdi-clipboard-list</v-icon>
            <h1 class="ml-2">My Orders</h1>
            <v-chip class="ml-3">{{ orders.length }}</v-chip>
        </v-card-title>

        <v-container class="px-2 px-sm-4">
            <v-alert v-if="placedId" type="success" variant="tonal" class="mb-4" closable
                title="Order placed successfully!" @click:close="dismissPlaced">
                Thank you! Order #{{ placedId }} is now <strong>Pending</strong>. We'll update its status here once
                it ships.
            </v-alert>
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />
            <v-progress-linear v-if="loading" indeterminate class="mb-4" />

            <div v-else-if="!orders.length && !error" class="text-center py-10">
                <v-icon size="64" class="mb-2">mdi-cart-off</v-icon>
                <p class="mb-4">You haven't placed any orders yet.</p>
                <v-btn color="primary" to="/">Browse motorcycles</v-btn>
            </div>

            <v-card v-for="order in orders" :key="order._id" class="bg-gray-700 text-white mb-4 pa-3 pa-sm-4"
                :class="{ 'order--new': order._id === placedId }">
                <div class="d-flex flex-wrap align-center ga-2 mb-3">
                    <div>
                        <div class="font-weight-bold">
                            Order #{{ order._id }}
                            <v-chip v-if="order._id === placedId" size="x-small" color="success" class="ml-1">New</v-chip>
                        </div>
                        <div class="text-caption">{{ formatDateTime(order.orderDate) }}</div>
                    </div>
                    <v-spacer />
                    <v-chip :color="statusColor(order.status)" class="text-white">{{ order.status }}</v-chip>
                </div>

                <div v-for="item in order.items" :key="item._id" class="d-flex align-center ga-3 mb-2">
                    <v-avatar size="50" rounded="lg" class="shrink-0">
                        <v-img :src="item.Image" />
                    </v-avatar>
                    <div class="min-w-0">
                        <div class="text-break">{{ item.quantity }}x {{ item.Brand }} {{ item.MotorcycleName }}</div>
                        <div class="text-caption">{{ peso(item.Price) }} each</div>
                    </div>
                    <v-spacer />
                    <div class="font-weight-bold text-no-wrap">{{ peso(item.Price * item.quantity) }}</div>
                </div>

                <v-divider class="my-3" />
                <div class="d-flex flex-wrap align-center ga-2">
                    <div class="text-caption">
                        {{ order.customerInfo.paymentMethod }} · {{ order.customerInfo.address || 'No address given' }}
                    </div>
                    <v-spacer />
                    <div class="text-h6">Total: {{ peso(order.total) }}</div>
                </div>

                <template v-if="order.status === 'Shipped'">
                    <v-divider class="my-3" />
                    <div v-if="order.feedback" class="d-flex flex-wrap align-center ga-2">
                        <span class="text-caption text-gray-300">Your feedback:</span>
                        <v-rating :model-value="order.feedback.rating" readonly density="compact" size="small"
                            color="amber" active-color="amber" />
                        <span v-if="order.feedback.comment" class="comment text-gray-200">“{{ order.feedback.comment
                        }}”</span>
                    </div>
                    <div v-else class="d-flex flex-wrap align-center ga-2">
                        <span class="text-gray-200">How was your purchase?</span>
                        <v-spacer />
                        <v-btn color="amber" variant="elevated" prepend-icon="mdi-star"
                            @click="openFeedback(order)">Leave feedback</v-btn>
                    </div>
                </template>
            </v-card>
        </v-container>
    </v-card>

    <v-dialog v-model="feedbackDialog" max-width="520" scrollable :fullscreen="xs">
        <v-card class="bg-gray-800 text-white">
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2 text-yellow-500">mdi-star</v-icon>
                <span>Rate your purchase</span>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" color="red" aria-label="Close" @click="feedbackDialog = false" />
            </v-card-title>
            <v-card-text>
                <p class="mb-2 text-gray-300">Order #{{ feedbackOrder?._id }} · {{ feedbackOrder?.items.map((i) =>
                    i.MotorcycleName).join(', ') }}</p>
                <v-alert v-if="feedbackError" type="error" variant="tonal" density="compact" class="mb-3"
                    :text="feedbackError" />
                <div class="d-flex justify-center my-2">
                    <v-rating v-model="rating" hover length="5" size="x-large" color="grey" active-color="amber"
                        aria-label="Rating" />
                </div>
                <v-textarea v-model="comment" label="Tell other riders about your experience (optional)"
                    variant="outlined" counter="1000" maxlength="1000" rows="4" auto-grow class="mt-2" />
            </v-card-text>
            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn variant="text" @click="feedbackDialog = false">Cancel</v-btn>
                <v-btn color="amber" variant="elevated" :disabled="!rating" :loading="sending"
                    @click="submitFeedback">Submit feedback</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import api, { errorMessage } from '../services/api';
import { formatDateTime, peso } from '../utils/format';

const { xs } = useDisplay();
const route = useRoute();
const router = useRouter();

// Set when checkout sends the customer here (?placed=<order id>).
const placedId = ref(typeof route.query.placed === 'string' ? route.query.placed : '');

function dismissPlaced() {
    placedId.value = '';
    router.replace({ name: 'MyOrders' });
}

const orders = ref([]);
const loading = ref(true);
const error = ref('');

const feedbackDialog = ref(false);
const feedbackOrder = ref(null);
const rating = ref(0);
const comment = ref('');
const sending = ref(false);
const feedbackError = ref('');

const statusColor = (status) => ({ Pending: 'orange', Shipped: 'green', Cancelled: 'red' }[status] || 'grey');

function openFeedback(order) {
    feedbackOrder.value = order;
    rating.value = 0;
    comment.value = '';
    feedbackError.value = '';
    feedbackDialog.value = true;
}

async function submitFeedback() {
    sending.value = true;
    feedbackError.value = '';
    try {
        const { data } = await api.post('/feedback', {
            orderId: feedbackOrder.value._id,
            rating: rating.value,
            comment: comment.value,
        });
        feedbackOrder.value.feedback = { rating: data.rating, comment: data.comment };
        feedbackDialog.value = false;
    } catch (err) {
        feedbackError.value = errorMessage(err);
    } finally {
        sending.value = false;
    }
}

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

<style scoped>
.comment {
    white-space: pre-line;
    overflow-wrap: anywhere;
}

.min-w-0 {
    min-width: 0;
}

.order--new {
    outline: 2px solid rgb(var(--v-theme-success));
}
</style>
