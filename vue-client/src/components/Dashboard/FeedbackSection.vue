<template>
    <v-card class="bg-gray-700 text-white">
        <v-toolbar class="bg-gray-600 text-white" density="comfortable">
            <v-icon class="ml-3 mr-2 text-yellow-500">mdi-message-star</v-icon>
            <span class="text-lg font-semibold">What our customers say</span>
        </v-toolbar>

        <div class="pa-4 pa-sm-6">
            <div v-if="summary.count" class="d-flex flex-wrap align-center ga-3 mb-6">
                <span class="text-4xl font-bold">{{ summary.average.toFixed(1) }}</span>
                <v-rating :model-value="summary.average" half-increments readonly density="compact" color="amber"
                    active-color="amber" />
                <span class="text-gray-300">from {{ summary.count }} review{{ summary.count === 1 ? '' : 's' }}</span>
            </div>

            <v-alert v-if="error" type="error" variant="tonal" :text="error" />
            <div v-else-if="!loading && !summary.items.length" class="text-center py-6 text-gray-300">
                <v-icon size="48" class="mb-2">mdi-message-outline</v-icon>
                <p>No reviews yet. Buy a bike and be the first to share your experience!</p>
            </div>

            <v-row>
                <v-col v-for="review in summary.items" :key="review._id" cols="12" sm="6" lg="4">
                    <v-card class="bg-gray-800 text-white h-100 pa-4">
                        <v-rating :model-value="review.rating" readonly density="compact" size="small" color="amber"
                            active-color="amber" />
                        <p v-if="review.comment" class="my-3 comment">“{{ review.comment }}”</p>
                        <p v-else class="my-3 text-gray-400 font-italic">Rated {{ review.rating }} out of 5</p>
                        <div class="d-flex align-center ga-2">
                            <v-avatar color="primary" size="32">{{ review.customer[0] }}</v-avatar>
                            <div>
                                <div class="font-semibold">{{ review.customer }}</div>
                                <div class="text-caption text-gray-400">
                                    {{ review.motorcycles.join(', ') }} · {{ formatDate(review.createdAt) }}
                                </div>
                            </div>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </div>
    </v-card>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api, { errorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';

const summary = ref({ average: 0, count: 0, items: [] });
const loading = ref(true);
const error = ref('');

onMounted(async () => {
    try {
        summary.value = (await api.get('/feedback')).data;
    } catch (err) {
        error.value = errorMessage(err, 'Customer reviews could not be loaded.');
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
</style>
