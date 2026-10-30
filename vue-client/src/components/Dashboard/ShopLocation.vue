<template>
    <v-card class="bg-gray-700 text-white">
        <v-toolbar class="bg-gray-600 text-white" density="comfortable">
            <v-icon class="ml-3 mr-2 text-red-400">mdi-map-marker</v-icon>
            <span class="text-lg font-semibold">Visit our shop</span>
        </v-toolbar>
        <v-row no-gutters>
            <v-col cols="12" md="4" class="pa-4 pa-sm-6">
                <h3 class="text-xl font-bold mb-3">{{ shop.name }}</h3>
                <p v-if="shop.address" class="mb-2 d-flex">
                    <v-icon class="mr-2 text-green-300">mdi-map-marker-outline</v-icon><span>{{ shop.address }}</span>
                </p>
                <p v-if="shop.contactNo" class="mb-2 d-flex">
                    <v-icon class="mr-2 text-green-300">mdi-phone</v-icon><span>{{ shop.contactNo }}</span>
                </p>
                <p v-if="shop.openingHours" class="mb-4 d-flex">
                    <v-icon class="mr-2 text-green-300">mdi-clock-outline</v-icon><span>{{ shop.openingHours }}</span>
                </p>
                <v-btn v-if="shop.address" :href="directionsUrl" target="_blank" rel="noopener noreferrer"
                    color="primary" prepend-icon="mdi-directions">Open in Google Maps</v-btn>
                <p v-if="!shop.address" class="text-gray-300">Our shop location will be posted here soon.</p>
            </v-col>
            <v-col cols="12" md="8">
                <iframe v-if="shop.address" :src="embedUrl" title="Map showing the shop location" loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade" allowfullscreen class="map"></iframe>
                <div v-else class="map d-flex align-center justify-center bg-gray-800">
                    <v-icon size="72" class="text-gray-500">mdi-map-search-outline</v-icon>
                </div>
            </v-col>
        </v-row>
    </v-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import api from '../../services/api';

// Pass `info` to preview unsaved details (admin Shop Info tab); otherwise the saved details are loaded.
const props = defineProps({ info: { type: Object, default: null } });

const loaded = ref({ name: 'Premiumbikes', address: '', contactNo: '', openingHours: '' });
const shop = computed(() => props.info || loaded.value);

const query = computed(() => encodeURIComponent(shop.value.address || ''));
// Key-less embed: free, no Google Cloud billing needed.
const embedUrl = computed(() => `https://www.google.com/maps?q=${query.value}&output=embed`);
const directionsUrl = computed(() => `https://www.google.com/maps/search/?api=1&query=${query.value}`);

onMounted(async () => {
    if (props.info) return;
    try {
        loaded.value = (await api.get('/shop')).data;
    } catch {
        // keep the placeholder card
    }
});
</script>

<style scoped>
.map {
    display: block;
    width: 100%;
    height: 260px;
    border: 0;
}

@media (min-width: 600px) {
    .map {
        height: 380px;
    }
}
</style>
