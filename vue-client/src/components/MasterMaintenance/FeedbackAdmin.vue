<template>
    <v-container class="px-2 px-sm-4">
        <div class="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <v-card class="p-4 sm:p-6 mt-5 bg-gray-600 text-white w-full sm:w-1/3 md:w-1/4">
                <div class="flex gap-2 items-center">
                    <v-icon class="text-2xl border-2 border-yellow-600 rounded-full p-4 text-white"
                        style="background-color:#F9A825">mdi-star</v-icon>
                    <h1 class="text-xl sm:text-2xl font-semibold ml-2">{{ average }}</h1>
                </div>
                <h1 class="text-sm sm:text-base">Average rating</h1>
            </v-card>
            <v-card class="p-4 sm:p-6 mt-5 bg-gray-600 text-white w-full sm:w-1/3 md:w-1/4">
                <div class="flex gap-2 items-center">
                    <v-icon class="text-2xl border-2 border-blue-600 rounded-full p-4 text-white"
                        style="background-color:#1E88E5">mdi-message-text</v-icon>
                    <h1 class="text-xl sm:text-2xl font-semibold ml-2">{{ feedback.length }}</h1>
                </div>
                <h1 class="text-sm sm:text-base">Total feedback</h1>
            </v-card>
            <v-card class="p-4 sm:p-6 mt-5 bg-gray-600 text-white w-full sm:w-1/3 md:w-1/4">
                <div class="flex gap-2 items-center">
                    <v-icon class="text-2xl border-2 border-red-600 rounded-full p-4 text-white"
                        style="background-color:#C62828">mdi-eye-off</v-icon>
                    <h1 class="text-xl sm:text-2xl font-semibold ml-2">{{ hiddenCount }}</h1>
                </div>
                <h1 class="text-sm sm:text-base">Hidden from dashboard</h1>
            </v-card>
        </div>
        <br>

        <v-card class="pa-5 bg-gray-600 text-white">
            <div class="flex flex-col sm:flex-row gap-2">
                <v-select v-model="ratingFilter" class="w-full" density="compact" variant="outlined"
                    label="Filter by rating" prepend-inner-icon="mdi-star" clearable :items="ratingItems" />
                <v-text-field v-model="search" class="w-full" density="compact" variant="outlined"
                    label="Search customer, email or comment..." prepend-inner-icon="mdi-magnify" />
            </div>
        </v-card>
        <br>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error" />

        <div class="px-4 py-3" style="background-color: #000000;">
            <span class="font-semibold text-lg text-gray-200"><v-icon>mdi-message-star</v-icon>
                Customer Feedback
                <v-chip>{{ filtered.length }}</v-chip></span>
        </div>
        <v-data-table :headers="headers" :items="filtered" :search="search" :loading="loading"
            :mobile="$vuetify.display.xs" class="bg-gray-600 text-white" no-data-text="No feedback yet">
            <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
            <template v-slot:item.fullName="{ item }">
                <div class="font-semibold">{{ item.fullName }}</div>
                <div class="text-caption">{{ item.email }}</div>
            </template>
            <template v-slot:item.orderId="{ item }">#{{ item.orderId }}</template>
            <template v-slot:item.rating="{ item }">
                <v-rating :model-value="item.rating" readonly density="compact" size="small" color="amber"
                    active-color="amber" />
            </template>
            <template v-slot:item.comment="{ item }">
                <div class="comment py-2">{{ item.comment || '—' }}</div>
                <div class="text-caption text-gray-300">{{ item.motorcycles.join(', ') }}</div>
            </template>
            <template v-slot:item.visible="{ item }">
                <v-switch :model-value="!item.isHidden" color="success" hide-details density="compact"
                    :aria-label="item.isHidden ? 'Show on dashboard' : 'Hide from dashboard'"
                    @update:model-value="(visible) => setHidden(item, !visible)" />
            </template>
            <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-trash-can" variant="text" color="error" size="small" aria-label="Delete feedback"
                    @click="remove(item)" />
            </template>
        </v-data-table>
    </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import api, { errorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';

const headers = [
    { title: 'Date', key: 'createdAt' },
    { title: 'Customer', key: 'fullName' },
    { title: 'Order', key: 'orderId' },
    { title: 'Rating', key: 'rating' },
    { title: 'Comment', key: 'comment', sortable: false },
    { title: 'Visible', key: 'visible', sortable: false },
    { title: '', key: 'actions', sortable: false },
];
const ratingItems = [5, 4, 3, 2, 1].map((n) => ({ title: `${n} star${n === 1 ? '' : 's'}`, value: n }));

const feedback = ref([]);
const loading = ref(true);
const error = ref('');
const search = ref('');
const ratingFilter = ref(null);

const filtered = computed(() =>
    ratingFilter.value ? feedback.value.filter((f) => f.rating === ratingFilter.value) : feedback.value);
const hiddenCount = computed(() => feedback.value.filter((f) => f.isHidden).length);
const average = computed(() => {
    if (!feedback.value.length) return '0.0';
    return (feedback.value.reduce((sum, f) => sum + f.rating, 0) / feedback.value.length).toFixed(1);
});

async function load() {
    loading.value = true;
    try {
        feedback.value = (await api.get('/feedback/all')).data;
        error.value = '';
    } catch (err) {
        error.value = errorMessage(err);
    } finally {
        loading.value = false;
    }
}

async function setHidden(item, isHidden) {
    try {
        const { data } = await api.patch(`/feedback/${item._id}`, { isHidden });
        Object.assign(item, data);
    } catch (err) {
        alert(errorMessage(err));
    }
}

async function remove(item) {
    if (!confirm(`Delete this ${item.rating}-star feedback from ${item.fullName}? This cannot be undone.`)) return;
    try {
        await api.delete(`/feedback/${item._id}`);
        feedback.value = feedback.value.filter((f) => f._id !== item._id);
    } catch (err) {
        alert(errorMessage(err));
    }
}

onMounted(load);
</script>

<style scoped>
.comment {
    white-space: pre-line;
    overflow-wrap: anywhere;
    max-width: 420px;
}
</style>
